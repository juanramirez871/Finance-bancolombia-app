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
        'notificacionesbancolombia.com',
        'bancolombia.com.co',
        'service@intl.paypal.com',
    ];

    public function __construct(
        private readonly string $clientId,
        private readonly string $clientSecret,
        private readonly string $redirectUri,
        private readonly TransactionParser $parser,
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

        $params = [
            'client_id' => $this->clientId,
            'grant_type' => 'refresh_token',
            'refresh_token' => $user->gmail_refresh_token,
        ];

        if ($this->clientSecret) {
            $params['client_secret'] = $this->clientSecret;
        }

        $response = Http::asForm()->post(self::TOKEN_URL, $params);

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
        return $this->listEmailsByDateRange(
            $user,
            "{$year}/01/01",
            "{$year}/12/31",
            $excludedMessageIds,
            $skippedExcludedMessageIds,
        );
    }

    public function listEmailsByDateRange(
        User $user,
        string $startDate,
        string $endDate,
        array $excludedMessageIds = [],
        ?int &$skippedExcludedMessageIds = null,
    ): array {
        $token = $this->getValidAccessToken($user);
        $excludedMessageIdsMap = array_fill_keys($excludedMessageIds, true);
        $excludedCounter = 0;

        try {
            $afterDate = Carbon::parse($startDate)->subDay()->format('Y/m/d');
            $beforeDate = Carbon::parse($endDate)->addDay()->format('Y/m/d');
        } catch (\Throwable $e) {
            $afterDate = $startDate;
            $beforeDate = $endDate;
        }

        $fromQueries = collect(self::FROM_ADDRESSES)->map(
            fn ($addr) => "from:{$addr}"
        )->implode(' OR ');

        $query = http_build_query([
            'q' => "({$fromQueries}) after:{$afterDate} before:{$beforeDate}",
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
        $subject = optional($headers->get('Subject'))['value'] ?? '';
        $snippet = $data['snippet'] ?? '';
        $emailDate = optional($headers->get('Date'))['value'] ?? null;
        $body = $this->getEmailBody($token, $messageId, $from);
        $textToParse = $body ?: '';
        $paypalAccountTo = $this->extractPaypalAccountFromRawBody($textToParse);
        $transaction = $this->parser->parse($textToParse, $snippet, $emailDate);

        if ($transaction === null && $subject) {
            $transaction = $this->parser->parse($subject, $snippet, $emailDate);
        }

        if ($transaction === null && str_contains(strtolower($from), 'bancolombia')) {
            Log::debug('GmailService unmatched bancolombia email', [
                'message_id' => $messageId,
                'from' => $from,
                'subject' => $subject,
                'snippet' => $this->parser->normalize($snippet),
                'body_excerpt' => mb_substr($this->parser->normalize($textToParse), 0, 400),
            ]);
        }

        if ($transaction && $paypalAccountTo && ($transaction['account_to'] ?? null) === null) {
            $transaction['account_to'] = $paypalAccountTo;
        }

        return [
            'id' => $data['id'],
            'threadId' => $data['threadId'] ?? null,
            'subject' => $subject ?: null,
            'from' => $from,
            'date' => optional($headers->get('Date'))['value'] ?? null,
            'snippet' => $snippet,
            'transaction' => $transaction,
        ];
    }

    private function getEmailBody(string $token, string $messageId, string $from): ?string
    {
        if (! $from || ! str_contains(strtolower($from), 'paypal.com')) {
            return null;
        }

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

            return html_entity_decode($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        }

        foreach ($payload['parts'] ?? [] as $part) {
            $mimeType = $part['mimeType'] ?? '';
            $partData = $part['body']['data'] ?? null;

            if (! $partData) {
                continue;
            }

            if ($mimeType === 'text/plain') {
                return quoted_printable_decode($this->base64UrlDecode($partData));
            }

            if ($mimeType === 'text/html') {
                $html = quoted_printable_decode($this->base64UrlDecode($partData));
                $text = strip_tags(preg_replace('/<br\s*\/?>/i', "\n", $html));
                $text = preg_replace('/\s+/', ' ', $text);

                return html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
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

    private function extractPaypalAccountFromRawBody(string $rawBody): ?string
    {
        if (! $rawBody) {
            return null;
        }

        $text = strip_tags(preg_replace('/<br\s*\/?>/i', "\n", $rawBody));

        if (preg_match('/Bancolombia\s*(\d{4})/i', $text, $matches)) {
            return $matches[1];
        }

        return null;
    }
}
