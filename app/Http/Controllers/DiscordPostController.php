<?php

namespace App\Http\Controllers;

use App\Models\DiscordPost;
use Inertia\Inertia;

class DiscordPostController extends Controller
{
    public function index()
    {
        $posts = DiscordPost::published()
            ->orderByDesc('posted_at')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Discord', [
            'posts' => $posts,
        ]);
    }
}
