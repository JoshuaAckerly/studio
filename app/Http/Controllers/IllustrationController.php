<?php

namespace App\Http\Controllers;

use App\Models\FacebookGalleryPost;
use Illuminate\Http\Request;

class IllustrationController extends Controller
{
    public function api(Request $request)
    {
        $fbPosts = FacebookGalleryPost::active()
            ->orderBy('sort_order')
            ->orderByDesc('posted_at')
            ->orderByDesc('created_at')
            ->get();

        $items = $fbPosts->map(fn ($post) => [
            'id' => $post->id,
            'title' => $post->title ?? '',
            'description' => $post->description ?? null,
            'tags' => $post->tags ?? [],
            'filename' => $post->title ?? 'Facebook Post',
            'url' => $post->post_url,
            'embed_url' => $post->embed_url,
            'thumbnail_url' => $post->thumbnail_url ?? null,
            'date' => $post->posted_at
                ? $post->posted_at->format('Y-m-d')
                : $post->created_at->format('Y-m-d'),
        ]);

        return response()->json(['data' => $items]);
    }
}
