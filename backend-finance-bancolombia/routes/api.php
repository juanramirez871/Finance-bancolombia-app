<?php

use App\Http\Controllers\EmailController;
use App\Http\Controllers\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/google', [GoogleAuthController::class, 'authenticate']);

Route::middleware('token')->group(function () {
    Route::get('/email', [EmailController::class, 'index']);
});
