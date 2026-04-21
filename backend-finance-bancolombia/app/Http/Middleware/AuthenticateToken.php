<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if (! $token) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = User::where('token', $token)->first();
        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $request->attributes->set('auth_user', $user);
        return $next($request);
    }
}
