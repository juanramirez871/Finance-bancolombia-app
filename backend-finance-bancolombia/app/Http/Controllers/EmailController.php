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

            $emails = $this->gmail->listEmails($user, $year);
            $saved = 0;
            $skipped = 0;

            foreach ($emails as $email) {
                $transaction = $email['transaction'] ?? null;
                if (! $transaction) {
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

                Transaction::create([
                    'user_id' => $user->id,
                    'type' => $transaction['type'],
                    'amount' => $transaction['amount'],
                    'account' => $transaction['account'],
                    'account_to' => $transaction['account_to'],
                    'merchant' => $transaction['merchant'],
                    'person' => $transaction['person'],
                    'date' => $transaction['date'],
                    'time' => $transaction['time'],
                ]);
                $saved++;
            }

            return response()->json([
                'saved' => $saved,
                'skipped' => $skipped,
            ]);
        }
        catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
