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
    protected StorageUrlGenerator $urlGenerator;

    /**
     * Backwards-compatible constructor: first param may be the disk or the url generator.
     * Prefer injecting a StorageUrlGenerator for URL resolution.
     *
     * @param mixed|null $s3OrGenerator
     * @param StorageUrlGenerator|null $maybeGenerator
     */
    public function __construct($s3OrGenerator = null, ?\App\Contracts\StorageUrlGeneratorInterface $maybeGenerator = null)
    {
        if ($s3OrGenerator instanceof StorageUrlGenerator) {
            $this->urlGenerator = $s3OrGenerator;
            $this->s3 = Storage::disk('s3');
        } else {
            $this->s3 = $s3OrGenerator ?? Storage::disk('s3');
            $this->urlGenerator = $maybeGenerator ?? new StorageUrlGenerator($this->s3, env('CLOUDFRONT_DOMAIN') ?: null);
        }

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
        return $this->urlGenerator->url($path);
    }
}
