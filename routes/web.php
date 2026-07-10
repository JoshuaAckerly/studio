<?php

use App\Http\Controllers\Admin\SubscriberController as AdminSubscriberController;
use App\Http\Controllers\BlogPostController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\VideoLogController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use League\CommonMark\CommonMarkConverter;

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

// Legal pages
Route::get('/privacy', function () {
    $converter = new CommonMarkConverter(['html_input' => 'escape', 'allow_unsafe_links' => false]);
    $markdown = file_get_contents(base_path('legal/PRIVACY_POLICY.md')) ?: '';
    $html = $converter->convert($markdown)->getContent();

    return Inertia::render('legal/Privacy', ['content' => $html]);
})->name('privacy');

Route::get('/terms', function () {
    $converter = new CommonMarkConverter(['html_input' => 'escape', 'allow_unsafe_links' => false]);
    $markdown = file_get_contents(base_path('legal/TERMS_OF_SERVICE.md')) ?: '';
    $html = $converter->convert($markdown)->getContent();

    return Inertia::render('legal/Terms', ['content' => $html]);
})->name('terms');

Route::get('/cookies', function () {
    $converter = new CommonMarkConverter(['html_input' => 'escape', 'allow_unsafe_links' => false]);
    $markdown = file_get_contents(base_path('legal/COOKIE_POLICY.md')) ?: '';
    $html = $converter->convert($markdown)->getContent();

    return Inertia::render('legal/Cookies', ['content' => $html]);
})->name('cookies');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
