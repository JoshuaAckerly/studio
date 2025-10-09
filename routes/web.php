<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('welcome');

// Games Routes - Main working route
Route::get('/noteleks', function () {
    return view('games.noteleks');
})->name('games.noteleks');

// Redirect old route to new working route
Route::redirect('/games/noteleks', '/noteleks', 301);

Route::get('/noteleks-debug', function () {
    return view('games.noteleks-debug');
})->name('games.noteleks-debug');

Route::redirect('/login', '/', 301);
Route::redirect('/register', '/', 301);
Route::redirect('/reset-password', '/', 301);
Route::redirect('/forgot-password', '/', 301);
Route::redirect('/reset-password/{token}', '/', 301);
Route::redirect('/verify-email', '/', 301);
Route::redirect('/confirm-password', '/', 301);

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
