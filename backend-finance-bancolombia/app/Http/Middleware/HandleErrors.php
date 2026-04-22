<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class HandleErrors
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $next($request);
        }
        catch (\Throwable $e) {
            $this->logError($request, $e);

            return response()->json([
                'error' => 'Internal server error',
            ], 500);
        }
    }

    private function logError(Request $request, \Throwable $e): void
    {
        Log::error('API Error', [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'input' => $request->except(['password', 'token']),
            'user_id' => $request->user()?->id,
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);
    }
}
