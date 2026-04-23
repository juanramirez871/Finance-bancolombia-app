<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    private const GOOGLE_TOKEN_VERIFICATION_URL = 'https://www.googleapis.com/oauth2/v3/tokeninfo';

    public function authenticate(Request $request): JsonResponse
    {
        $request->validate([
            'id_token' => 'required|string',
            'access_token' => 'nullable|string',
            'refresh_token' => 'nullable|string',
            'expires_in' => 'nullable|integer',
        ]);

        $idToken = $request->input('id_token');
        $googleResponse = Http::get(self::GOOGLE_TOKEN_VERIFICATION_URL, [
            'id_token' => $idToken,
        ]);

        if (! $googleResponse->successful()) {
            Log::error('Google token verification failed', [
                'status' => $googleResponse->status(),
                'body' => $googleResponse->body(),
            ]);

            return response()->json([
                'message' => 'Invalid Google token',
            ], 401);
        }

        $googleData = $googleResponse->json();

        if (empty($googleData['email'])) {
            return response()->json([
                'message' => 'Invalid Google token: no email found',
            ], 401);
        }

        $email = $googleData['email'];
        $googleId = $googleData['sub'];
        $name = $googleData['name'] ?? $email;
        $picture = $googleData['picture'] ?? null;
        $user = User::where('googleId', $googleId)->first();

        if (! $user) {
            $user = User::where('email', $email)->first();

            if ($user) {
                $user->googleId = $googleId;
                if (! $user->token) {
                    $user->token = Str::random(60);
                }
                $user->save();
            } else {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => '',
                    'googleId' => $googleId,
                    'token' => Str::random(60),
                ]);
            }
        }

        $user->gmail_access_token = $request->input('access_token');
        $user->gmail_refresh_token = $request->input('refresh_token');
        $user->gmail_token_type = 'Bearer';
        $expiresIn = (int) $request->input('expires_in', 3600);
        $user->gmail_expires_at = Carbon::instance(now()->addSeconds($expiresIn));
        $user->save();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'picture' => $picture,
            ],
            'token' => $user->token,
        ]);
    }
}
