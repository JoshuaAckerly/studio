<?php

namespace App\Console\Commands;

use App\Models\BlogPost;
use Illuminate\Console\Command;

class GenerateSitemap extends Command
{
    protected $signature = 'app:generate-sitemap';

    protected $description = 'Generate sitemap.xml including all published blog posts';

    public function handle(): int
    {
        $this->info('Generating sitemap.xml…');

        $base = rtrim((string) config('app.url', ''), '/');

        $staticEntries = [
            [$base.'/', '1.0', 'weekly'],
            [$base.'/blog', '0.9', 'weekly'],
            [$base.'/video-log', '0.8', 'weekly'],
            [$base.'/illustrations', '0.7', 'monthly'],
        ];

        $posts = BlogPost::published()
            ->orderByDesc('published_at')
            ->select(['slug', 'published_at'])
            ->get();

        $lines = [];
        $lines[] = '<?xml version="1.0" encoding="UTF-8"?>';
        $lines[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($staticEntries as [$loc, $priority, $changefreq]) {
            $lines[] = '  <url>';
            $lines[] = '    <loc>'.htmlspecialchars($loc, ENT_XML1).'</loc>';
            $lines[] = '    <changefreq>'.$changefreq.'</changefreq>';
            $lines[] = '    <priority>'.$priority.'</priority>';
            $lines[] = '  </url>';
        }

        foreach ($posts as $post) {
            $loc = $base.'/blog/'.htmlspecialchars($post->slug, ENT_XML1);
            $lastmod = $post->published_at instanceof \DateTimeInterface
                ? $post->published_at->format('Y-m-d')
                : substr((string) $post->published_at, 0, 10);

            $lines[] = '  <url>';
            $lines[] = '    <loc>'.$loc.'</loc>';
            $lines[] = '    <lastmod>'.$lastmod.'</lastmod>';
            $lines[] = '    <changefreq>weekly</changefreq>';
            $lines[] = '    <priority>0.8</priority>';
            $lines[] = '  </url>';
        }

        $lines[] = '</urlset>';

        $xml = implode("\n", $lines)."\n";
        $path = public_path('sitemap.xml');

        file_put_contents($path, $xml);

        $this->info('✅ sitemap.xml written to '.$path.' ('.$posts->count().' blog posts included)');

        return 0;
    }
}
