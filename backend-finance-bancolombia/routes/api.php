<?php

use App\Http\Controllers\EmailController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/google', [GoogleAuthController::class, 'authenticate']);

Route::middleware('token')->group(function () {
    Route::get('/email', [EmailController::class, 'index']);
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
    Route::put('/transactions/{transaction}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);
});
