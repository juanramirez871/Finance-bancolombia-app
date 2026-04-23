<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GmailService
{
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const FROM_ADDRESSES = [
        'alertasynotificaciones@an.notificacionesbancolombia.com',
        'alertasynotificaciones@bancolombia.com.co',
        'service@intl.paypal.com',
    ];

    private const PATTERNS = [
        'compra' => '/^¡Listo! Todo salió bien con tus movimientos Bancolombia: Compraste COP([\d.,]+) en ([A-Za-z\s]+) con tu (T\.Cred|T\.Deb) \*(\d+),? el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/',
        'transferencia' => '/^¡Listo! Todo salió bien con tus movimientos Bancolombia: Transferiste \\\$([\d.,]+) desde tu cuenta (\d+) a la cuenta \*(\d+) el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/',
        'retiro' => '/^¡Listo! Todo salió bien con tus movimientos Bancolombia: Retiraste \$?([\d.,]+)\s+en\s+(.+?)\s+de tu\s+T\.Deb\s+\*\*?(\d+)\s+el\s+(\d{2}\/\d{2}\/\d{4})\s+a las\s+(\d{2}:\d{2})/',
        'recibir_qr' => '/^¡Listo! Todo salió bien con tus movimientos Bancolombia: Recibiste \$?([\d.,]+)\s+por QR\s+de\s+(.+?)\s+en tu cuenta \*(.+?)\s+el\s+(\d{4}\/\d{2}\/\d{2})\s+a las\s+(\d{2}:\d{2})/',
        'avance' => '/^¡Listo! Todo salió bien con tus movimientos Bancolombia: Hiciste un avance de \$?([\d.,]+)\s+en\s+(.+?)\s+el\s+(\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})\s+desde tu\s+T\.Credito\s+\*(\d+)\s+a la cuenta \*(.+?)\s+\./',
        'pago_no_exitoso' => '/Notificación Transaccional Bancolombia: tu \w+ en ([^,]+) por COP([\d.,]+) no fue exitosa? el cupo de tu T\.Credito \*(\d+) no se afecto\.?\s*(\d{2}:\d{2})\.(\d{2}\/\d{2}\/\d{4})/',
        'paypal_recibido' => '/transferir.*?\$ ?([\d,\.]+).*?COP de PayPal.*?Bancolombia\s+(\d+).*?trans/i',
        'paypal_recibido_snippet' => '/transferir\s*\$ ?([\d,.]+)\s*COP de PayPal/',
    ];

    public function __construct(
        private readonly string $clientId,
        private readonly string $clientSecret,
        private readonly string $redirectUri,
    ) {}

    public function exchangeCodeForTokens(string $code): array
    {
        $response = Http::asForm()->post(self::TOKEN_URL, [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'redirect_uri' => $this->redirectUri,
            'grant_type' => 'authorization_code',
            'code' => $code,
        ]);

        if (! $response->successful()) {
            Log::error('Gmail token exchange failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Failed to exchange code for tokens');
        }

        return $response->json();
    }

    public function refreshAccessToken(User $user): array
    {
        if (! $user->gmail_refresh_token) {
            throw new \RuntimeException('No refresh token available');
        }

        $response = Http::asForm()->post(self::TOKEN_URL, [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'grant_type' => 'refresh_token',
            'refresh_token' => $user->gmail_refresh_token,
        ]);

        if (! $response->successful()) {
            Log::error('Gmail token refresh failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Failed to refresh access token');
        }

        $data = $response->json();
        $expiresIn = (int) ($data['expires_in'] ?? 3600);
        $user->gmail_access_token = $data['access_token'];
        $user->gmail_token_type = $data['token_type'] ?? 'Bearer';
        $user->gmail_expires_at = Carbon::instance(now()->addSeconds($expiresIn));
        $user->save();

        return $data;
    }

    public function getValidAccessToken(User $user): string
    {
        if ($user->gmail_expires_at && $user->gmail_expires_at->isFuture()) {
            return $user->gmail_access_token;
        }

        $this->refreshAccessToken($user);

        return $user->gmail_access_token;
    }

    public function listEmails(
        User $user,
        int $year,
        array $excludedMessageIds = [],
        ?int &$skippedExcludedMessageIds = null,
    ): array {
        $token = $this->getValidAccessToken($user);
        $startDate = "{$year}/01/01";
        $endDate = "{$year}/12/31";
        $excludedMessageIdsMap = array_fill_keys($excludedMessageIds, true);
        $excludedCounter = 0;

        $fromQueries = collect(self::FROM_ADDRESSES)->map(
            fn ($addr) => "from:{$addr}"
        )->implode(' OR ');

        $query = http_build_query([
            'q' => "({$fromQueries}) after:{$startDate} before:{$endDate}",
            'maxResults' => 100,
            'sort' => 'newer',
        ]);

        $response = Http::withToken($token)
            ->get("https://gmail.googleapis.com/gmail/v1/users/me/messages?{$query}");

        if (! $response->successful()) {
            Log::error('Gmail list emails failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('Failed to list emails');
        }

        $messages = $response->json();
        if (empty($messages['messages'])) {
            return [];
        }

        $emails = [];
        foreach ($messages['messages'] as $msg) {
            $messageId = $msg['id'] ?? null;
            if ($messageId && isset($excludedMessageIdsMap[$messageId])) {
                $excludedCounter++;

                continue;
            }

            $email = $this->getEmailDetails($token, $msg['id'], $msg['threadId'] ?? null);
            if ($email['transaction'] !== null) {
                $emails[] = $email;
            }
        }

        Log::debug('GmailService listEmails result', [
            'emails_count' => count($emails),
            'excluded_count' => $excludedCounter,
            'transactions' => collect($emails)->pluck('transaction.type')->toArray(),
        ]);

        if ($skippedExcludedMessageIds !== null) {
            $skippedExcludedMessageIds = $excludedCounter;
        }

        return $emails;
    }

    private function getEmailDetails(string $token, string $messageId, ?string $threadId = null): array
    {
        $response = Http::withToken($token)
            ->get("https://gmail.googleapis.com/gmail/v1/users/me/messages/{$messageId}", [
                'format' => 'metadata',
                'metadataHeaders' => ['Subject', 'From', 'Date', 'To'],
            ]);

        if (! $response->successful()) {
            return [
                'id' => $messageId,
                'threadId' => null,
                'subject' => null,
                'from' => null,
                'date' => null,
                'snippet' => null,
                'transaction' => null,
            ];
        }

        $data = $response->json();
        $payload = $data['payload'] ?? [];
        $headers = collect($payload['headers'] ?? [])->keyBy('name');

        $from = optional($headers->get('From'))['value'] ?? '';
        $snippet = $data['snippet'] ?? '';
        $emailDate = optional($headers->get('Date'))['value'] ?? null;
        $body = $this->getEmailBody($token, $messageId, $from);
        $textToParse = $body ?: '';
        $paypalAccountTo = $this->extractPaypalAccountFromRawBody($textToParse);
        $transaction = $this->parseTransaction($textToParse, $snippet, $emailDate);

        if ($transaction && $paypalAccountTo && ($transaction['account_to'] ?? null) === null) {
            $transaction['account_to'] = $paypalAccountTo;
        }

        return [
            'id' => $data['id'],
            'threadId' => $data['threadId'] ?? null,
            'subject' => optional($headers->get('Subject'))['value'] ?? null,
            'from' => $from,
            'date' => optional($headers->get('Date'))['value'] ?? null,
            'snippet' => $snippet,
            'transaction' => $transaction,
        ];
    }

    private function getEmailBody(string $token, string $messageId, string $from): ?string
    {
        if ($from && str_contains(strtolower($from), 'paypal.com')) {
            $response = Http::withToken($token)
                ->get("https://gmail.googleapis.com/gmail/v1/users/me/messages/{$messageId}", [
                    'format' => 'full',
                ]);

            if (! $response->successful()) {
                Log::debug('GmailService getEmailBody failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $data = $response->json();
            $payload = $data['payload'] ?? [];
            $body = $payload['body'] ?? [];
            $dataValue = $body['data'] ?? null;

            if ($dataValue) {
                $decoded = quoted_printable_decode($this->base64UrlDecode($dataValue));
                $clean = strip_tags(preg_replace('/<br\s*\/?>/i', "\n", $decoded));
                $clean = html_entity_decode($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');

                return $clean;
            }

            $parts = $payload['parts'] ?? [];
            foreach ($parts as $part) {
                $mimeType = $part['mimeType'] ?? '';
                if ($mimeType === 'text/plain') {
                    $partBody = $part['body'] ?? [];
                    $partData = $partBody['data'] ?? null;
                    if ($partData) {
                        return quoted_printable_decode($this->base64UrlDecode($partData));
                    }
                }

                if ($mimeType === 'text/html') {
                    $partBody = $part['body'] ?? [];
                    $partData = $partBody['data'] ?? null;
                    if ($partData) {
                        $html = quoted_printable_decode($this->base64UrlDecode($partData));
                        $text = strip_tags(preg_replace('/<br\s*\/?>/i', "\n", $html));
                        $text = preg_replace('/\s+/', ' ', $text);
                        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

                        return $text;
                    }
                }
            }
        }

        return null;
    }

    private function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }

        return base64_decode(strtr($data, '-_', '+/'));
    }

    private function parseTransaction(string $text, string $snippet = '', ?string $emailDate = null): ?array
    {
        $textToParse = $text ?: $snippet;
        if (! $textToParse) {
            return null;
        }

        foreach (self::PATTERNS as $type => $pattern) {
            if (preg_match($pattern, $textToParse, $matches)) {
                return $this->buildTransaction($type, $matches, $emailDate, $snippet);
            }
        }

        if ($snippet && $text !== $snippet) {
            foreach (self::PATTERNS as $type => $pattern) {
                if (preg_match($pattern, $snippet, $matches)) {
                    return $this->buildTransaction($type, $matches, $emailDate, $snippet);
                }
            }
        }

        return null;
    }

    private function buildTransaction(string $type, array $matches, ?string $emailDate = null, string $snippet = ''): array
    {
        $parsedEmailDate = $emailDate ? $this->parseEmailDate($emailDate) : null;
        $debitCredit = 'debito';
        $account = null;
        $accountTo = null;
        $merchant = null;
        $person = null;
        $date = null;
        $time = null;
        $amount = 0.0;

        switch ($type) {
            case 'compra':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $matches[5];
                $time = $matches[6];
                $account = $matches[4];
                $merchant = trim($matches[2]);
                $person = null;
                $accountTo = null;
                $debitCredit = $matches[3] === 'T.Cred' ? 'credito' : 'debito';
                break;

            case 'transferencia':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $matches[4];
                $time = $matches[5];
                $account = $matches[2];
                $merchant = null;
                $person = null;
                $accountTo = $matches[3];
                $debitCredit = 'debito';
                break;

            case 'retiro':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $matches[4];
                $time = $matches[5];
                $account = $matches[3];
                $merchant = trim($matches[2]);
                $person = null;
                $accountTo = null;
                $debitCredit = 'debito';
                break;

            case 'recibir_qr':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $matches[4];
                $time = $matches[5];
                $account = $matches[3];
                $merchant = null;
                $person = trim($matches[2]);
                $accountTo = null;
                $debitCredit = 'credito';
                break;

            case 'avance':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $matches[4];
                $time = $matches[3];
                $account = $matches[5];
                $merchant = trim($matches[2]);
                $person = null;
                $accountTo = null;
                $debitCredit = 'credito';
                break;

            case 'pago_no_exitoso':
                $amount = $this->parseCurrencyAmount($matches[2]);
                $date = $matches[5];
                $time = $matches[4];
                $account = $matches[3];
                $merchant = trim($matches[1]);
                $person = null;
                $accountTo = null;
                $debitCredit = 'credito';
                break;

            case 'paypal_recibido':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $parsedEmailDate['date'];
                $time = $parsedEmailDate['time'];
                $account = null;
                $merchant = 'PayPal';
                $person = null;
                $accountTo = $matches[2];
                $debitCredit = 'credito';
                break;

            case 'paypal_recibido_snippet':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $parsedEmailDate['date'];
                $time = $parsedEmailDate['time'];
                $account = null;
                $merchant = 'PayPal';
                $person = null;
                $accountTo = null;
                $debitCredit = 'credito';
                break;

            default:
                $amount = 0.0;
                $date = null;
                $time = null;
                $account = null;
                $merchant = null;
                $person = null;
                $accountTo = null;
                $debitCredit = 'debito';
        }

        $typeMap = [
            'compra' => 'compra',
            'transferencia' => 'transferencia',
            'retiro' => 'retiro',
            'recibir_qr' => 'recibido_qr',
            'avance' => 'avance',
            'pago_no_exitoso' => 'pago_no_exitoso',
            'paypal_recibido' => 'paypal_recibido',
            'paypal_recibido_snippet' => 'paypal_recibido',
        ];

        $mappedType = $typeMap[$type] ?? $type;
        $normalizedDebitCredit = in_array($debitCredit, ['debito', 'credito'], true)
            ? $debitCredit
            : 'debito';

        if (in_array($mappedType, ['recibido_qr', 'paypal_recibido'], true)) {
            $normalizedDebitCredit = 'debito';
        }

        return [
            'type' => $mappedType,
            'amount' => $amount,
            'account' => $account,
            'account_to' => $accountTo,
            'merchant' => $merchant,
            'person' => $person,
            'date' => $date,
            'time' => $time,
            'debit_credit' => $normalizedDebitCredit,
        ];
    }

    private function parseCurrencyAmount(string $rawAmount): float
    {
        $cleanAmount = preg_replace('/[^\d.,]/', '', trim($rawAmount));
        if (! $cleanAmount) {
            return 0.0;
        }

        $lastComma = strrpos($cleanAmount, ',');
        $lastDot = strrpos($cleanAmount, '.');
        $lastSeparator = max($lastComma === false ? -1 : $lastComma, $lastDot === false ? -1 : $lastDot);

        if ($lastSeparator >= 0) {
            $decimals = substr($cleanAmount, $lastSeparator + 1);
            $isDecimalSeparator = preg_match('/^\d{1,2}$/', $decimals) === 1;

            if ($isDecimalSeparator) {
                $wholePart = preg_replace('/[.,]/', '', substr($cleanAmount, 0, $lastSeparator));
                if ($wholePart === '') {
                    $wholePart = '0';
                }

                return (float) ($wholePart.'.'.$decimals);
            }
        }

        $wholeAmount = preg_replace('/[.,]/', '', $cleanAmount);

        return (float) ($wholeAmount ?: '0');
    }

    private function extractPaypalAccountFromRawBody(string $rawBody): ?string
    {
        if (! $rawBody) {
            return null;
        }

        $text = preg_replace('/<br\s*\/?>/i', "\n", $rawBody);
        $text = strip_tags($text);

        if (preg_match('/Bancolombia\s*(\d{4})/i', $text, $matches)) {
            return $matches[1];
        }

        return null;
    }

    private function parseEmailDate(string $emailDate): array
    {
        try {
            $date = Carbon::parse($emailDate);

            return [
                'date' => $date->format('d/m/Y'),
                'time' => $date->format('H:i'),
            ];
        } catch (\Throwable $e) {
            return ['date' => null, 'time' => null];
        }
    }
}
