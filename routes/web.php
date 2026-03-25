<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('welcome');

use App\Http\Controllers\BlogPostController;
use App\Http\Controllers\VideoLogController;

Route::get('/video-log', [VideoLogController::class, 'index'])->name('video-log');

Route::get('/blog', [BlogPostController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [BlogPostController::class, 'show'])->name('blog.show');

Route::get('/illustrations', function () {
    return Inertia::render('Illustrations');
})->name('illustrations');

Route::redirect('/contact', '/', 301);
Route::redirect('/privacy', '/', 301);
Route::redirect('/terms', '/', 301);

Route::redirect('/login', '/', 301);
Route::redirect('/register', '/', 301);
Route::redirect('/reset-password', '/', 301);
Route::redirect('/forgot-password', '/', 301);
Route::redirect('/reset-password/{token}', '/', 301);
Route::redirect('/verify-email', '/', 301);
Route::redirect('/confirm-password', '/', 301);

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
