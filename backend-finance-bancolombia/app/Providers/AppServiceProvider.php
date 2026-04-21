<?php

namespace App\Providers;

use App\Services\GmailService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(GmailService::class, function ($app) {
            return new GmailService(
                clientId: env('GOOGLE_CLIENT_ID'),
                clientSecret: env('GOOGLE_CLIENT_SECRET'),
                redirectUri: env('APP_URL').'/api/email/callback',
            );
        });
    }

    public function boot(): void
    {
        //
    }
}
