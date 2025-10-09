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

// Serve Spine assets explicitly
Route::get('/games/noteleks/spine/characters/{file}', function ($file) {
    $path = public_path("games/noteleks/spine/characters/{$file}");
    
    if (!file_exists($path)) {
        abort(404);
    }
    
    $extension = pathinfo($file, PATHINFO_EXTENSION);
    $mimeTypes = [
        'atlas' => 'text/plain',
        'json' => 'application/json',
        'png' => 'image/png'
    ];
    
    $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';
    
    return response()->file($path, [
        'Content-Type' => $mimeType,
        'Cache-Control' => 'public, max-age=3600'
    ]);
})->where('file', '.*');

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
