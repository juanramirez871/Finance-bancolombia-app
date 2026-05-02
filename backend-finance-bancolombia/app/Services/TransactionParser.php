<?php

namespace App\Services;

use Illuminate\Support\Carbon;

class TransactionParser
{
    private const PATTERNS = [
        'compra' => '/^¡Listo! Todo salió bien con tus movimientos Bancolombia: Compraste COP([\d.,]+) en ([A-Za-z\s]+) con tu (T\.Cred|T\.Deb) \*(\d+),? el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/',
        'compra_bancolombia' => '/Bancolombia:\s*Compraste\s+(?:COP|\$)\s*([\d.,]+)\s+en\s+(.+?)\s+con\s+tu\s+(T\.Cred|T\.Deb)\s+\*(\d+),?\s*el\s+(\d{2}\/\d{2}\/\d{4})\s+a las\s+(\d{2}:\d{2})/i',
        'recibir_transferencia_llave' => '/Bancolombia:.*?recibiste una transferencia de\s+(.+?)\s+por\s+(?:COP|\$)\s*([\d.,]+).*?cuenta\s+\*(\d+).*?\bel\s+(\d{2}\/\d{2}\/\d{2,4})\s+a las\s+(\d{2}:\d{2})/iu',
        'recibir_transferencia_llave_snippet' => '/Bancolombia:.*?recibiste una transferencia de\s+(.+?)\s+por\s+(?:COP|\$)\s*([\d.,]+).*?cuenta\s+\*(\d+)/iu',
        'transferencia' => '/^¡Listo! Todo salió bien con tus movimientos Bancolombia: Transferiste \\\$([\d.,]+) desde tu cuenta (\d+) a la cuenta \*(\d+) el (\d{2}\/\d{2}\/\d{4}) a las (\d{2}:\d{2})/',
        'retiro' => '/^¡Listo! Todo salió bien con tus movimientos Bancolombia: Retiraste \$?([\d.,]+)\s+en\s+(.+?)\s+de tu\s+T\.Deb\s+\*\*?(\d+)\s+el\s+(\d{2}\/\d{2}\/\d{4})\s+a las\s+(\d{2}:\d{2})/',
        'recibir_qr' => '/^¡Listo! Todo salió bien con tus movimientos Bancolombia: Recibiste \$?([\d.,]+)\s+por QR\s+de\s+(.+?)\s+en tu cuenta \*(.+?)\s+el\s+(\d{4}\/\d{2}\/\d{2})\s+a las\s+(\d{2}:\d{2})/',
        'avance' => '/^¡Listo! Todo salió bien con tus movimientos Bancolombia: Hiciste un avance de \$?([\d.,]+)\s+en\s+(.+?)\s+el\s+(\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})\s+desde tu\s+T\.Credito\s+\*(\d+)\s+a la cuenta \*(.+?)\s+\./',
        'pago_no_exitoso_tarjeta' => '/Bancolombia:\s*tu\s+compra\s+con\s+T\.cred\s+\*(\d+)\s+por\s+\$\s*([\d.,]+)\s+no\s+fue\s+exitosa,?\s+los\s+datos\s+de\s+tu\s+t\.cred\s+estan\s+incorrectos\.?\s*(\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/i',
        'pago_no_exitoso' => '/(?:Notificación\s+Transaccional\s+)?Bancolombia:\s*tu\s+\w+\s+en\s+(.+?)\s+por\s+COP\s*([\d.,]+)\s+no\s+fue\s+exitosa,?\s+el\s+cupo\s+de\s+tu\s+T\.Credito\s+\*(\d+)\s+no\s+se\s+afecto\.?\s*(\d{2}:\d{2})\.(\d{2}\/\d{2}\/\d{4})/i',
        'paypal_recibido' => '/transferir.*?\$ ?([\d,\.]+).*?COP de PayPal.*?Bancolombia\s+(\d+).*?trans/i',
        'paypal_recibido_snippet' => '/transferir\s*\$ ?([\d,.]+)\s*COP de PayPal/',
        'recibir_transferencia' => '/Bancolombia:.*?recibiste una transferencia por\s+\$?\s*([\d.,]+)\s+de\s+(.+?)\s+en tu cuenta\s+\*{1,2}(\d+),?\s+el\s+(\d{2}\/\d{2}\/\d{2,4})\s+a las\s+(\d{2}:\d{2})/iu',
        'recibir_transferencia_snippet' => '/Bancolombia:.*?recibiste una transferencia por\s+\$?\s*([\d.,]+)\s+de\s+(.+?)\s+en tu cuenta\s+\*{1,2}(\d+)/iu',
        'recibir_pago' => '/Bancolombia:.*?recibiste un pago\s+\S+\s+de\s+(.+?)\s+por\s+\$?\s*([\d.,]+)\s+en tu cuenta.*?el\s+(\d{2}\/\d{2}\/\d{2,4})\s+a las\s+(\d{2}:\d{2})/iu',
        'recibir_pago_snippet' => '/Bancolombia:.*?recibiste un pago\s+\S+\s+de\s+(.+?)\s+por\s+\$?\s*([\d.,]+)\s+en tu cuenta/iu',
    ];

    private const TYPE_MAP = [
        'compra' => 'compra',
        'compra_bancolombia' => 'compra',
        'transferencia' => 'transferencia',
        'retiro' => 'retiro',
        'recibir_qr' => 'recibido_qr',
        'recibir_transferencia_llave' => 'recibido_qr',
        'recibir_transferencia_llave_snippet' => 'recibido_qr',
        'recibir_transferencia' => 'recibido_qr',
        'recibir_transferencia_snippet' => 'recibido_qr',
        'recibir_pago' => 'recibido_qr',
        'recibir_pago_snippet' => 'recibido_qr',
        'avance' => 'avance',
        'pago_no_exitoso' => 'pago_no_exitoso',
        'pago_no_exitoso_tarjeta' => 'pago_no_exitoso',
        'paypal_recibido' => 'paypal_recibido',
        'paypal_recibido_snippet' => 'paypal_recibido',
    ];

    public function parse(string $text, string $snippet = '', ?string $emailDate = null): ?array
    {
        $textToParse = $this->normalize($text ?: $snippet);
        $normalizedSnippet = $this->normalize($snippet);

        if (! $textToParse) {
            return null;
        }

        foreach (self::PATTERNS as $type => $pattern) {
            if (preg_match($pattern, $textToParse, $matches)) {
                return $this->build($type, $matches, $emailDate, $snippet);
            }
        }

        if ($normalizedSnippet && $textToParse !== $normalizedSnippet) {
            foreach (self::PATTERNS as $type => $pattern) {
                if (preg_match($pattern, $normalizedSnippet, $matches)) {
                    return $this->build($type, $matches, $emailDate, $normalizedSnippet);
                }
            }
        }

        return null;
    }

    public function normalize(string $rawText): string
    {
        if ($rawText === '') {
            return '';
        }

        $text = str_replace(["=\r\n", "=\n", '=3D'], ['', '', '='], $rawText);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text);

        return trim($text ?? '');
    }

    private function build(string $type, array $matches, ?string $emailDate = null, string $snippet = ''): array
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
            case 'compra_bancolombia':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $matches[5];
                $time = $matches[6];
                $account = $matches[4];
                $merchant = trim($matches[2]);
                $debitCredit = $matches[3] === 'T.Cred' ? 'credito' : 'debito';
                break;

            case 'transferencia':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $matches[4];
                $time = $matches[5];
                $account = $matches[2];
                $accountTo = $matches[3];
                break;

            case 'retiro':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $matches[4];
                $time = $matches[5];
                $account = $matches[3];
                $merchant = trim($matches[2]);
                break;

            case 'recibir_qr':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $matches[4];
                $time = $matches[5];
                $account = $matches[3];
                $person = trim($matches[2]);
                $debitCredit = 'credito';
                break;

            case 'recibir_transferencia_llave':
                $amount = $this->parseCurrencyAmount($matches[2]);
                $date = $this->normalizeDateFormat($matches[4]);
                $time = $matches[5];
                $account = $matches[3];
                $person = trim($matches[1]);
                $debitCredit = 'credito';
                break;

            case 'recibir_transferencia_llave_snippet':
                $amount = $this->parseCurrencyAmount($matches[2]);
                $date = $parsedEmailDate['date'];
                $time = $parsedEmailDate['time'];
                $account = $matches[3];
                $person = trim($matches[1]);
                $debitCredit = 'credito';
                break;

            case 'avance':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $matches[4];
                $time = $matches[3];
                $account = $matches[5];
                $merchant = trim($matches[2]);
                $debitCredit = 'credito';
                break;

            case 'pago_no_exitoso':
                $amount = $this->parseCurrencyAmount($matches[2]);
                $date = $matches[5];
                $time = $matches[4];
                $account = $matches[3];
                $merchant = trim($matches[1]);
                $debitCredit = 'credito';
                break;

            case 'pago_no_exitoso_tarjeta':
                $amount = $this->parseCurrencyAmount($matches[2]);
                $date = $matches[4];
                $time = $matches[3];
                $account = $matches[1];
                $debitCredit = 'credito';
                break;

            case 'recibir_pago':
                $amount = $this->parseCurrencyAmount($matches[2]);
                $date = $this->normalizeDateFormat($matches[3]);
                $time = $matches[4];
                $person = trim($matches[1]);
                $debitCredit = 'credito';
                break;

            case 'recibir_pago_snippet':
                $amount = $this->parseCurrencyAmount($matches[2]);
                $date = $parsedEmailDate['date'];
                $time = $parsedEmailDate['time'];
                $person = trim($matches[1]);
                $debitCredit = 'credito';
                break;

            case 'recibir_transferencia':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $this->normalizeDateFormat($matches[4]);
                $time = $matches[5];
                $account = $matches[3];
                $person = trim($matches[2]);
                $debitCredit = 'credito';
                break;

            case 'recibir_transferencia_snippet':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $parsedEmailDate['date'];
                $time = $parsedEmailDate['time'];
                $account = $matches[3];
                $person = trim($matches[2]);
                $debitCredit = 'credito';
                break;

            case 'paypal_recibido':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $parsedEmailDate['date'];
                $time = $parsedEmailDate['time'];
                $merchant = 'PayPal';
                $accountTo = $matches[2];
                $debitCredit = 'credito';
                break;

            case 'paypal_recibido_snippet':
                $amount = $this->parseCurrencyAmount($matches[1]);
                $date = $parsedEmailDate['date'];
                $time = $parsedEmailDate['time'];
                $merchant = 'PayPal';
                $debitCredit = 'credito';
                break;
        }

        $mappedType = self::TYPE_MAP[$type] ?? $type;
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

    private function normalizeDateFormat(?string $rawDate): ?string
    {
        if (! $rawDate) {
            return null;
        }

        if (preg_match('/^(\d{2})\/(\d{2})\/(\d{2})$/', $rawDate, $matches)) {
            return sprintf('%s/%s/20%s', $matches[1], $matches[2], $matches[3]);
        }

        return $rawDate;
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
