// Redirect /login and related auth routes to auth-system login page
Route::get('/login', function () {
    return redirect()->away('http://localhost:8007/login');
});
Route::get('/register', function () {
    return redirect()->away('http://localhost:8007/register');
});
Route::get('/forgot-password', function () {
    return redirect()->away('http://localhost:8007/forgot-password');
});
<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\VisitNotification;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('welcome');

use App\Http\Controllers\VideoLogController;

Route::get('/video-log', [VideoLogController::class, 'index'])->name('video-log');

Route::get('/illustrations', function () {
    return Inertia::render('Illustrations');
})->name('illustrations');

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

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
