<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\VisitNotification;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('welcome');

// Noteleks Game
Route::get('/noteleks', function () {
    return view('games.noteleks');
})->name('games.noteleks');

// Serve Spine assets
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

Route::redirect('/login', '/', 301);
Route::redirect('/register', '/', 301);
Route::redirect('/reset-password', '/', 301);
Route::redirect('/forgot-password', '/', 301);
Route::redirect('/reset-password/{token}', '/', 301);
Route::redirect('/verify-email', '/', 301);
Route::redirect('/confirm-password', '/', 301);

// Tracking endpoint
Route::post('/track-visit', function () {
    $data = request()->all();
    
    $visitData = [
        'referrer' => $data['referrer'] ?? null,
        'subdomain' => $data['subdomain'] ?? null,
        'page_title' => $data['page_title'] ?? null,
        'user_agent' => $data['user_agent'] ?? null,
        'timestamp' => $data['timestamp'] ?? now(),
        'ip' => request()->ip(),
    ];
    
    // Log the visit data
    Log::info('Subdomain visit tracked', $visitData);
    
    // Send email notification
    try {
        Mail::to(config('mail.admin_email'))
            ->send(new VisitNotification($visitData));
    } catch (\Exception $e) {
        Log::error('Failed to send visit notification email: ' . $e->getMessage());
    }
    
    return response()->json(['status' => 'success']);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
