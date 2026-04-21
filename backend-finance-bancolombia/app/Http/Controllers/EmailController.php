<?php

namespace App\Http\Controllers;

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
        }
        catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
