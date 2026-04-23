<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Services\GmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmailController extends Controller
{
    public function __construct(
        private readonly GmailService $gmail,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate(['year' => 'integer|min:2000|max:2100']);
        $year = $request->input('year', (int) date('Y'));

        try {
            $user = $request->attributes->get('auth_user');
            if (! $user?->gmail_access_token) {
                return response()->json(['error' => 'Gmail not connected'], 400);
            }

            $emails = $this->gmail->listEmails($user, $year);

            return response()->json(['emails' => $emails]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate(['year' => 'integer|min:2000|max:2100']);
        $year = $request->input('year', (int) date('Y'));

        try {
            $user = $request->attributes->get('auth_user');
            if (! $user?->gmail_access_token) {
                return response()->json(['error' => 'Gmail not connected'], 400);
            }

            $result = $this->importForUser($user->id, $user, $year);

            return response()->json([
                'saved' => $result['saved'],
                'skipped' => $result['skipped'],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function importStream(Request $request): StreamedResponse|JsonResponse
    {
        $request->validate(['year' => 'integer|min:2000|max:2100']);
        $year = $request->input('year', (int) date('Y'));

        $user = $request->attributes->get('auth_user');
        if (! $user?->gmail_access_token) {
            return response()->json(['error' => 'Gmail not connected'], 400);
        }

        return response()->stream(function () use ($user, $year) {
            try {
                $this->sendSseEvent('start', ['message' => 'Import started']);

                $result = $this->importForUser(
                    $user->id,
                    $user,
                    $year,
                    function (array $progress): void {
                        $this->sendSseEvent('progress', $progress);
                    },
                );

                $this->sendSseEvent('done', [
                    'saved' => $result['saved'],
                    'skipped' => $result['skipped'],
                    'total' => $result['total'],
                    'processed' => $result['processed'],
                    'percent' => 100,
                ]);
            } catch (\Throwable $e) {
                $this->sendSseEvent('error', ['message' => $e->getMessage()]);
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function importForUser(int $userId, mixed $user, int $year, ?callable $onProgress = null): array
    {
        $existingEmailIds = Transaction::query()
            ->where('user_id', $userId)
            ->whereNotNull('email_id')
            ->pluck('email_id')
            ->all();

        $skippedByExistingEmailId = 0;
        $emails = $this->gmail->listEmails($user, $year, $existingEmailIds, $skippedByExistingEmailId);

        $saved = 0;
        $skipped = $skippedByExistingEmailId;
        $processed = $skippedByExistingEmailId;
        $total = count($emails) + $skippedByExistingEmailId;

        if ($onProgress) {
            $onProgress([
                'saved' => $saved,
                'skipped' => $skipped,
                'processed' => $processed,
                'total' => $total,
                'percent' => $total > 0 ? (int) floor(($processed / $total) * 100) : 100,
            ]);
        }

        foreach ($emails as $email) {
            $transaction = $email['transaction'] ?? null;
            if (! $transaction) {
                continue;
            }

            $emailId = $email['id'] ?? null;

            $normalizedDebitCredit = in_array($transaction['type'], [
                Transaction::TYPE_RECIBIDO_QR,
                Transaction::TYPE_PAYPAL_RECIBIDO,
            ], true)
                ? 'debito'
                : (in_array(($transaction['debit_credit'] ?? null), ['debito', 'credito'], true)
                    ? $transaction['debit_credit']
                    : 'debito');

            $payload = [
                'user_id' => $userId,
                'email_id' => $emailId,
                'type' => $transaction['type'],
                'amount' => $transaction['amount'],
                'account' => $transaction['account'],
                'account_to' => $transaction['account_to'],
                'merchant' => $transaction['merchant'],
                'person' => $transaction['person'],
                'date' => $transaction['date'],
                'time' => $transaction['time'],
                'debit_credit' => $normalizedDebitCredit,
            ];

            if ($emailId) {
                $record = Transaction::firstOrCreate(
                    ['user_id' => $userId, 'email_id' => $emailId],
                    $payload,
                );

                if ($record->wasRecentlyCreated) {
                    $saved++;
                } else {
                    $skipped++;
                }
            } else {
                $exists = Transaction::where('user_id', $userId)
                    ->where('amount', $transaction['amount'])
                    ->where('date', $transaction['date'])
                    ->where('merchant', 'like', '%'.$transaction['merchant'].'%')
                    ->exists();

                if ($exists) {
                    $skipped++;
                } else {
                    Transaction::create($payload);
                    $saved++;
                }
            }

            $processed++;

            if ($onProgress) {
                $onProgress([
                    'saved' => $saved,
                    'skipped' => $skipped,
                    'processed' => $processed,
                    'total' => $total,
                    'percent' => $total > 0 ? (int) floor(($processed / $total) * 100) : 100,
                ]);
            }
        }

        return [
            'saved' => $saved,
            'skipped' => $skipped,
            'total' => $total,
            'processed' => $processed,
        ];
    }

    private function sendSseEvent(string $event, array $payload): void
    {
        echo 'event: '.$event."\n";
        echo 'data: '.json_encode($payload)."\n\n";

        if (ob_get_level() > 0) {
            ob_flush();
        }
        flush();
    }
}
