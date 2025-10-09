<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('welcome');

// Games Routes
Route::get('/games/noteleks', function () {
    return view('games.noteleks');
})->name('games.noteleks');

Route::get('/games/noteleks-debug', function () {
    return view('games.noteleks-debug');
})->name('games.noteleks-debug');

// Test route for debugging
Route::get('/test', function () {
    return response()->json([
        'status' => 'working',
        'laravel' => app()->version(),
        'time' => now()
    ]);
});

// Simple blade test
Route::get('/simple-test', function () {
    return view('games.simple-test');
});

// Debug the noteleks route
Route::get('/debug-noteleks', function () {
    try {
        $viewExists = view()->exists('games.noteleks');
        $viewPath = resource_path('views/games/noteleks.blade.php');
        $fileExists = file_exists($viewPath);
        
        return response()->json([
            'view_exists' => $viewExists,
            'file_exists' => $fileExists,
            'view_path' => $viewPath,
            'app_debug' => config('app.debug'),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    }
});

Route::redirect('/login', '/', 301);
Route::redirect('/register', '/', 301);
Route::redirect('/reset-password', '/', 301);
Route::redirect('/forgot-password', '/', 301);
Route::redirect('/reset-password/{token}', '/', 301);
Route::redirect('/verify-email', '/', 301);
Route::redirect('/confirm-password', '/', 301);

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
