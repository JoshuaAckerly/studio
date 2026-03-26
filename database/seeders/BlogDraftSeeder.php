<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BlogDraftSeeder extends Seeder
{
    public function run(): void
    {
        $title   = "What I've Been Building Lately — March 2026";
        $content = file_get_contents(base_path('../BLOG_DRAFT_2026-03-25.md'));

        $excerpt = 'March has been a productive month. '
            . 'I run a small creative agency called Graveyard Jokes Studios and I\'m independently '
            . 'building a portfolio of seven web projects — each targeting a different niche in the '
            . 'music/culture space.';

        BlogPost::create([
            'title'        => $title,
            'slug'         => Str::slug($title),
            'content'      => $content,
            'excerpt'      => $excerpt,
            'author'       => 'Joshua',
            'published_at' => now(),
        ]);
    }
}
