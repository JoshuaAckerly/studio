<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class IllustrationService
{
    protected $s3;
    protected string $prefix;
    protected ?string $cloudfrontDomain;

    public function __construct($s3 = null)
    {
        $this->s3 = $s3 ?? Storage::disk('s3');
        $this->prefix = rtrim(env('ILLUSTRATIONS_PREFIX', 'images/Illustrations'), " /\\");
        $this->cloudfrontDomain = env('CLOUDFRONT_DOMAIN') ?: null;
    }

    /**
     * Return a list of illustration URLs (strings).
     *
     * @return array
     */
    public function list(): array
    {
        try {
            $files = $this->s3->files($this->prefix) ?: [];
        } catch (\Throwable $e) {
            return [];
        }

        $images = array_values(array_filter($files, function ($f) {
            return preg_match('/\.(jpg|jpeg|png|webp|gif)$/i', $f);
        }));

        $items = [];
        foreach ($images as $file) {
            $items[] = $this->makeUrl($file);
        }

        return $items;
    }

    protected function makeUrl(string $path): string
    {
        // In testing, prefer the local serve proxy if app is testing
        if (app()->environment('testing')) {
            return url('/api/video-logs/serve?path=' . rawurlencode($path));
        }

        try {
            if (method_exists($this->s3, 'temporaryUrl')) {
                $url = $this->s3->temporaryUrl($path, now()->addHour());
            } else {
                $url = $this->s3->url($path);
            }
        } catch (\Throwable $e) {
            try {
                $url = $this->s3->url($path);
            } catch (\Throwable $e) {
                $url = '';
            }
        }

        if ($this->cloudfrontDomain && $url) {
            $parts = parse_url($url);
            $scheme = $parts['scheme'] ?? 'https';
            $p = $parts['path'] ?? ('/' . ltrim($path, '/'));
            $q = isset($parts['query']) ? ('?' . $parts['query']) : '';
            return $scheme . '://' . rtrim($this->cloudfrontDomain, '/') . $p . $q;
        }

        return $url ?: '';
    }
}
