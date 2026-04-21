<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/gmail/callback', function () {
    return response()->json(['status' => 'ok']);
});
