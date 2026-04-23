<?php

use App\Http\Middleware\AuthenticateToken;
use App\Http\Middleware\HandleErrors;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'token' => AuthenticateToken::class,
            'handle-errors' => HandleErrors::class,
        ]);
        $middleware->api(prepend: [
            HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'error' => 'Validation failed',
                        'messages' => $e->errors(),
                    ], 422);
                }

                if ($e instanceof HttpExceptionInterface) {
                    $status = $e->getStatusCode();

                    return response()->json([
                        'error' => $e->getMessage() ?: 'Request failed',
                    ], $status);
                }

                Log::error('API Error', [
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                    'input' => $request->except(['password', 'token']),
                    'user_id' => $request->user()?->id,
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);

                $payload = ['error' => 'Internal server error'];

                if (config('app.debug')) {
                    $payload['message'] = $e->getMessage();
                    $payload['file'] = $e->getFile();
                    $payload['line'] = $e->getLine();
                }

                return response()->json($payload, 500);
            }

            return null;
        });
    })->create();
