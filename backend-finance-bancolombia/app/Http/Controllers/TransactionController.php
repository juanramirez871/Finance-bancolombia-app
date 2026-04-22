<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $transactions = Transaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['transactions' => $transactions]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'amount' => 'required|numeric',
            'account' => 'nullable|string',
            'account_to' => 'nullable|string',
            'merchant' => 'nullable|string',
            'person' => 'nullable|string',
            'date' => 'nullable|string',
            'time' => 'nullable|string',
        ]);

        $transaction = $request->user()->transactions()->create($validated);

        return response()->json(['transaction' => $transaction], 201);
    }

    public function show(Request $request, Transaction $transaction): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if ($transaction->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json(['transaction' => $transaction]);
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if ($transaction->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'type' => 'sometimes|string',
            'amount' => 'sometimes|numeric',
            'account' => 'nullable|string',
            'account_to' => 'nullable|string',
            'merchant' => 'nullable|string',
            'person' => 'nullable|string',
            'date' => 'nullable|string',
            'time' => 'nullable|string',
        ]);

        $transaction->update($validated);
        return response()->json(['transaction' => $transaction]);
    }

    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        if ($transaction->user_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $transaction->delete();
        return response()->json(null, 204);
    }
}
