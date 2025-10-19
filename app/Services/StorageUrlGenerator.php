<?php

namespace App\Services;

use App\Contracts\StorageUrlGeneratorInterface;

class StorageUrlGenerator implements StorageUrlGeneratorInterface
{
    /** @var mixed Underlying filesystem adapter (may be a FilesystemAdapter) */
    protected $disk;
    protected ?string $cloudfrontDomain;
    protected ?int $defaultExpires;

    /**
     * @param mixed $disk
     */
    public function __construct($disk, ?string $cloudfrontDomain = null, ?int $defaultExpires = null)
    {
        $this->disk = $disk;
        $this->cloudfrontDomain = $cloudfrontDomain;
        $this->defaultExpires = $defaultExpires ?? (int) env('VIDEO_URL_EXPIRES', 60);
    }

    /**
     * Return a public URL for a storage path, honoring testing proxy, temporaryUrl if available,
     * and optional CloudFront hostname rewrite.
     *
     * @param string $path
     * @param int|null $expiresMinutes
     * @return string
     */
    public function url(string $path, ?int $expiresMinutes = null): string
    {
        // In testing, prefer local proxy so Storage::fake files can be requested
        if (app()->environment('testing')) {
            return url('/api/video-logs/serve?path=' . rawurlencode($path));
        }

        $expires = $expiresMinutes ?? $this->defaultExpires;

        try {
            if (method_exists($this->disk, 'temporaryUrl')) {
                $url = $this->disk->temporaryUrl($path, now()->addMinutes((int) $expires));
            } else {
                $url = $this->disk->url($path);
            }
        } catch (\Throwable $e) {
            try {
                $url = $this->disk->url($path);
            } catch (\Throwable $e) {
                $url = '';
            }
        }

        if ($this->cloudfrontDomain && $url) {
            $parsed = parse_url($url);
            if ($parsed && isset($parsed['scheme'])) {
                $scheme = $parsed['scheme'];
                $url = $scheme . '://' . rtrim($this->cloudfrontDomain, '/') . (isset($parsed['path']) ? $parsed['path'] : '');
                if (isset($parsed['query'])) {
                    $url .= '?' . $parsed['query'];
                }
            }
        }

        return $url ?: '';
    }
}
