<?php

namespace App\Services;

use App\Models\VideoLog;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class VideoLogService
{
    /**
     * Underlying S3 disk. Kept untyped to allow injection of test doubles in unit tests.
     * @var mixed
     */
    protected $s3;
    protected string $videoPrefix;
    protected string $imagePrefix;
    protected ?string $cloudfrontDomain;

    public function __construct($s3 = null)
    {
        $this->s3 = $s3 ?? Storage::disk('s3');
        $this->videoPrefix = env('VIDEO_LOGS_PREFIX', 'video-logs');
        $this->imagePrefix = rtrim('images/vlogs', '/');
        $this->cloudfrontDomain = env('CLOUDFRONT_DOMAIN') ?: null;
    }

    /**
     * Return an array of VideoLog objects.
     *
     * @return VideoLog[]
     */
    public function list(): array
    {
        // Decide whether to use S3: use S3 when the default disk is 's3', or when an AWS_BUCKET is configured
        // and we're not in testing. This mirrors the previous controller logic.
        $defaultDisk = config('filesystems.default');
        $useS3 = ($defaultDisk === 's3') || (!app()->environment('testing') && (bool) env('AWS_BUCKET'));

        if (! $useS3) {
            // Static fallback (same items the controller returned previously)
            return [
                new VideoLog([
                    'id' => 1,
                    'title' => 'Studio Update — Composing Session',
                    'date' => '2025-10-10',
                    'thumbnail' => '/images/vlogs/session-thumbnail.jpg',
                    'url' => '/videos/session.mp4',
                    'description' => 'A look into the music composing session with new synth textures.'
                ]),
                new VideoLog([
                    'id' => 2,
                    'title' => '3D Character Concept Walkthrough',
                    'date' => '2025-09-28',
                    'thumbnail' => '/images/vlogs/3d-thumbnail.jpg',
                    'url' => '/videos/3d-concept.mp4',
                    'description' => 'Discussing the 2D to 3D pipeline and collaborations.'
                ]),
            ];
        }

        $files = [];

        try {
            $files = $this->s3->files($this->videoPrefix);
        } catch (\Throwable $e) {
            // If listing fails, return empty list
            return [];
        }

        // Filter video extensions
        $videos = array_filter($files, function ($f) {
            $ext = Str::lower(pathinfo($f, PATHINFO_EXTENSION));
            return in_array($ext, ['mp4', 'webm', 'mov', 'm4v']);
        });

        // Optionally sort by last modified if available
        usort($videos, function ($a, $b) {
            try {
                $ma = $this->s3->lastModified($a) ?: 0;
                $mb = $this->s3->lastModified($b) ?: 0;
                return $mb <=> $ma;
            } catch (\Throwable $e) {
                return 0;
            }
        });

        $imageFiles = [];
        try {
            $imageFiles = $this->s3->files($this->imagePrefix);
        } catch (\Throwable $e) {
            // ignore
        }

        $items = [];

        foreach ($videos as $i => $file) {
            $basename = pathinfo($file, PATHINFO_FILENAME);

            // Find a per-video thumbnail
            $thumbnailKey = null;
            foreach (['jpg', 'jpeg', 'png', 'webp', 'gif'] as $ext) {
                $candidate = $this->imagePrefix . '/' . $basename . '.' . $ext;
                try {
                    if ($this->s3->exists($candidate)) {
                        $thumbnailKey = $candidate;
                        break;
                    }
                } catch (\Throwable $e) {
                    // ignore
                }
            }

            // fallback to first available image in images/vlogs
            if (!$thumbnailKey && count($imageFiles) > 0) {
                $thumbnailKey = $imageFiles[0];
            }

            $videoUrl = $this->makeS3Url($file);
            $thumbUrl = $thumbnailKey ? $this->makeS3Url($thumbnailKey) : url('/images/vlogs/default.svg');

            $items[] = new VideoLog([
                'id' => $i + 1,
                'title' => str_replace(['-', '_'], ' ', ucfirst($basename)),
                'date' => date('Y-m-d'),
                'thumbnail' => $thumbUrl,
                'url' => $videoUrl,
                'description' => null,
            ]);
        }

        return $items;
    }

    protected function makeS3Url(string $path): string
    {
        // If testing, return the local proxy so Storage::fake files can be requested by tests
        if (app()->environment('testing')) {
            return url('/api/video-logs/serve?path=' . rawurlencode($path));
        }
        // Prefer temporaryUrl if available (private objects)
        try {
            if (method_exists($this->s3, 'temporaryUrl')) {
                $expires = now()->addMinutes((int) env('VIDEO_URL_EXPIRES', 60));
                $url = $this->s3->temporaryUrl($path, $expires);
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

        // rewrite host to CloudFront if configured
        if ($this->cloudfrontDomain && $url) {
            $parsed = parse_url($url);
            if ($parsed && isset($parsed['scheme'])) {
                $scheme = $parsed['scheme'];
                $url = $scheme . '://' . rtrim($this->cloudfrontDomain, '/') . (isset($parsed['path']) ? $parsed['path'] : '');
            }
        }

        return $url ?: '';
    }
}
