<?php

use App\Http\Controllers\Admin\SubscriberController as AdminSubscriberController;
use App\Http\Controllers\BlogPostController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\VideoLogController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('welcome');

Route::get('/video-log', [VideoLogController::class, 'index'])->name('video-log');

Route::get('/blog', [BlogPostController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [BlogPostController::class, 'show'])->name('blog.show');

Route::get('/illustrations', function () {
    return Inertia::render('Illustrations');
})->name('illustrations');

// Newsletter
Route::post('/newsletter/subscribe', [NewsletterController::class, 'store'])->name('newsletter.subscribe');
Route::get('/newsletter/unsubscribe/{token}', [NewsletterController::class, 'unsubscribe'])->name('newsletter.unsubscribe');

// Admin
Route::middleware(['auth'])->prefix('admin')->group(function () {
    Route::get('/subscribers', [AdminSubscriberController::class, 'index'])->name('admin.subscribers');
});
Route::redirect('/verify-email', '/', 301);
Route::redirect('/confirm-password', '/', 301);

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
