<?php

use App\Http\Controllers\Admin\SubscriberController as AdminSubscriberController;
use App\Http\Controllers\BlogPostController;
use App\Http\Controllers\DiscordPostController;
use App\Http\Controllers\FacebookPostController;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\VideoLogController;
use App\Models\BlogPost;
use App\Models\DiscordPost;
use App\Models\FacebookGalleryPost;
use App\Models\TikTokVideo;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use League\CommonMark\CommonMarkConverter;

Route::get('/', function () {
    $recentPosts = BlogPost::published()
        ->orderByDesc('published_at')
        ->select(['id', 'title', 'slug', 'excerpt', 'featured_image', 'author', 'published_at'])
        ->limit(3)
        ->get();

    $recentVideos = TikTokVideo::active()
        ->orderBy('sort_order')
        ->orderByDesc('posted_at')
        ->orderByDesc('created_at')
        ->limit(3)
        ->get()
        ->map(fn ($v) => [
            'id' => $v->id,
            'title' => $v->title,
            'date' => $v->posted_at ? $v->posted_at->format('Y-m-d') : $v->created_at->format('Y-m-d'),
            'thumbnail' => $v->thumbnail_url ?? '',
            'url' => $v->video_url,
            'embed_url' => $v->embed_url,
            'description' => $v->description,
        ]);

    $recentDiscord = DiscordPost::published()
        ->orderByDesc('posted_at')
        ->orderByDesc('created_at')
        ->limit(3)
        ->get();

    $recentFacebook = FacebookGalleryPost::active()
        ->whereNotNull('thumbnail_url')
        ->orderByDesc('posted_at')
        ->orderByDesc('created_at')
        ->limit(3)
        ->get()
        ->map(fn ($p) => [
            'id' => $p->id,
            'title' => $p->title,
            'description' => $p->description,
            'thumbnail_url' => $p->thumbnail_url,
            'post_url' => $p->post_url,
            'posted_at' => $p->posted_at?->format('Y-m-d'),
        ]);

    return Inertia::render('welcome', [
        'recentPosts' => $recentPosts,
        'recentVideos' => $recentVideos,
        'recentDiscord' => $recentDiscord,
        'recentFacebook' => $recentFacebook,
    ]);
})->name('welcome');

Route::get('/video-log', [VideoLogController::class, 'index'])->name('video-log');

Route::get('/blog', [BlogPostController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [BlogPostController::class, 'show'])->name('blog.show');

Route::get('/discord', [DiscordPostController::class, 'index'])->name('discord');

Route::get('/facebook', [FacebookPostController::class, 'index'])->name('facebook');

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
