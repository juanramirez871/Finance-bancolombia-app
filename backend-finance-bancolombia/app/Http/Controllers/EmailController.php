<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Services\GmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

            $existingEmailIds = Transaction::query()
                ->where('user_id', $user->id)
                ->whereNotNull('email_id')
                ->pluck('email_id')
                ->all();

            $skippedByExistingEmailId = 0;
            $emails = $this->gmail->listEmails($user, $year, $existingEmailIds, $skippedByExistingEmailId);
            $saved = 0;
            $skipped = $skippedByExistingEmailId;

            foreach ($emails as $email) {
                $transaction = $email['transaction'] ?? null;
                if (! $transaction) {
                    continue;
                }

                $emailId = $email['id'] ?? null;

                $normalizedDebitCredit = $transaction['type'] === Transaction::TYPE_RECIBIDO_QR
                    ? 'credito'
                    : (in_array(($transaction['debit_credit'] ?? null), ['debito', 'credito'], true)
                        ? $transaction['debit_credit']
                        : 'debito');

                $payload = [
                    'user_id' => $user->id,
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
                        ['user_id' => $user->id, 'email_id' => $emailId],
                        $payload,
                    );

                    if ($record->wasRecentlyCreated) {
                        $saved++;
                    } else {
                        $skipped++;
                    }

                    continue;
                }

                $exists = Transaction::where('user_id', $user->id)
                    ->where('amount', $transaction['amount'])
                    ->where('date', $transaction['date'])
                    ->where('merchant', 'like', '%'.$transaction['merchant'].'%')
                    ->exists();

                if ($exists) {
                    $skipped++;

                    continue;
                }

                Transaction::create($payload);
                $saved++;
            }

            return response()->json([
                'saved' => $saved,
                'skipped' => $skipped,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
