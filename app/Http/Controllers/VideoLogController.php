<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class VideoLogController extends Controller
{
    public function index()
    {
        return Inertia::render('VideoLog');
    }

    public function api(Request $request)
    {
        // Prefer S3 when an AWS bucket is configured (but allow tests to override by setting the default disk)
        $defaultDisk = config('filesystems.default');
        if (! app()->environment('testing') && $defaultDisk !== 's3' && env('AWS_BUCKET')) {
            $disk = 's3';
        } else {
            $disk = $defaultDisk;
        }

        if ($disk === 's3') {
            try {
                /** @var \Illuminate\Filesystem\FilesystemAdapter $s3 */
                $s3 = Storage::disk('s3');
                $prefix = trim((string) env('VIDEO_LOGS_PREFIX', 'video-logs'), " /\\");

                $files = $s3->files($prefix) ?: [];
                $videoFiles = array_values(array_filter($files, function ($f) {
                    return preg_match('/\.(mp4|webm|mov|m4v)$/i', $f);
                }));

                usort($videoFiles, function ($a, $b) use ($s3) {
                    try {
                        return ($s3->lastModified($b) ?? 0) <=> ($s3->lastModified($a) ?? 0);
                    } catch (\Throwable $e) {
                        return 0;
                    }
                });

                $items = [];
                $id = 1;
                foreach ($videoFiles as $file) {
                    $basename = pathinfo($file, PATHINFO_FILENAME);

                    $thumb = null;
                    foreach (['jpg', 'png', 'webp'] as $ext) {
                        $candidate = 'images/vlogs/' . $basename . '.' . $ext;
                        try {
                            if ($s3->exists($candidate)) {
                                if (app()->environment('testing')) {
                                    $thumb = url('/api/video-logs/serve?path=' . rawurlencode($candidate));
                                } elseif (method_exists($s3, 'temporaryUrl')) {
                                    $thumb = $s3->temporaryUrl($candidate, now()->addHour());
                                } elseif (method_exists($s3, 'url')) {
                                    $thumb = $s3->url($candidate);
                                } else {
                                    // Fallback: proxy through our controller
                                    $thumb = url('/api/video-logs/serve?path=' . rawurlencode($candidate));
                                }
                                break;
                            }
                        } catch (\Throwable $e) {
                            // ignore
                        }
                    }

                    // If no per-basename thumbnail was found, try the first available image in images/vlogs/
                    if (! $thumb) {
                        try {
                            $available = $s3->files('images/vlogs') ?: [];
                            foreach ($available as $fb) {
                                if (preg_match('/\.(jpg|png|webp|jpeg)$/i', $fb)) {
                                    if (app()->environment('testing')) {
                                        $thumb = url('/api/video-logs/serve?path=' . rawurlencode($fb));
                                    } elseif (method_exists($s3, 'temporaryUrl')) {
                                        $thumb = $s3->temporaryUrl($fb, now()->addHour());
                                    } elseif (method_exists($s3, 'url')) {
                                        $thumb = $s3->url($fb);
                                    }
                                    break;
                                }
                            }
                        } catch (\Throwable $e) {
                            // ignore
                        }
                    }

                    if (app()->environment('testing')) {
                        $url = url('/api/video-logs/serve?path=' . rawurlencode($file));
                    } elseif (method_exists($s3, 'temporaryUrl')) {
                        $url = $s3->temporaryUrl($file, now()->addHour());
                    } elseif (method_exists($s3, 'url')) {
                        $url = $s3->url($file);
                    } else {
                        // Proxy URL for adapters without URL helpers
                        $url = url('/api/video-logs/serve?path=' . rawurlencode($file));
                    }

                    $items[] = [
                        'id' => $id++,
                        'title' => str_replace(['-', '_'], ' ', ucfirst($basename)),
                        'date' => date('Y-m-d'),
                        'thumbnail' => $thumb ?? '/images/vlogs/default.svg',
                        'url' => $url,
                        'description' => null,
                    ];
                }

                return response()->json(['data' => $items]);
            } catch (\Throwable $e) {
                Log::error('S3 listing failed for video-logs: ' . $e->getMessage());
                return response()->json(['data' => []]);
            }
        }

        // static fallback
        $items = [];

        // Helper to try S3 first for a given path
        $tryS3 = function (?string $s3Path, string $localFallback) {
            try {
                if (config('filesystems.default') === 's3') {
                    /** @var \Illuminate\Filesystem\FilesystemAdapter $s3 */
                    $s3 = Storage::disk('s3');
                    // if adapter supports checking existence, prefer S3 path when present
                    try {
                        if ($s3Path && $s3->exists($s3Path)) {
                            if (app()->environment('testing')) {
                                return url('/api/video-logs/serve?path=' . rawurlencode($s3Path));
                            }
                            if (method_exists($s3, 'temporaryUrl')) {
                                return $s3->temporaryUrl($s3Path, now()->addHour());
                            }
                            if (method_exists($s3, 'url')) {
                                return $s3->url($s3Path);
                            }
                        }

                        // If the specific S3 path isn't available, attempt to find any image in images/vlogs/
                        $fallbacks = $s3->files('images/vlogs') ?: [];
                        foreach ($fallbacks as $fb) {
                            if (preg_match('/\.(jpg|png|webp|jpeg)$/i', $fb)) {
                                if (app()->environment('testing')) {
                                    return url('/api/video-logs/serve?path=' . rawurlencode($fb));
                                }
                                if (method_exists($s3, 'temporaryUrl')) {
                                    return $s3->temporaryUrl($fb, now()->addHour());
                                }
                                if (method_exists($s3, 'url')) {
                                    return $s3->url($fb);
                                }
                                break;
                            }
                        }
                    } catch (\Throwable $e) {
                        // ignore and fall back to local
                    }
                }
            } catch (\Throwable $e) {
                // ignore
            }

            return $localFallback;
        };

        $items[] = [
            'id' => 1,
            'title' => 'Studio Update — Composing Session',
            'date' => '2025-10-10',
            'thumbnail' => $tryS3('images/vlogs/session-thumbnail.jpg', '/images/vlogs/session-thumbnail.jpg'),
            'url' => $tryS3('video-logs/session.mp4', '/videos/session.mp4'),
            'description' => 'A look into the music composing session with new synth textures.'
        ];

        $items[] = [
            'id' => 2,
            'title' => '3D Character Concept Walkthrough',
            'date' => '2025-09-28',
            'thumbnail' => $tryS3('images/vlogs/3d-thumbnail.jpg', '/images/vlogs/3d-thumbnail.jpg'),
            'url' => $tryS3('video-logs/3d-concept.mp4', '/videos/3d-concept.mp4'),
            'description' => 'Discussing the 2D to 3D pipeline and collaborations.'
        ];

        return response()->json(['data' => $items]);
    }

    /**
     * Serve a file from the configured s3 disk. Used for testing/dev when the adapter
     * doesn't provide public URLs (for example Storage::fake()).
     *
     * Query param: path (required)
     */
    public function serve(Request $request)
    {
        // Safety: only allow serving via this endpoint in local/testing
        if (! app()->environment(['local', 'testing'])) {
            return response('Not found', 404);
        }

        $path = $request->query('path');
        if (! $path) {
            return response('Missing path', 400);
        }

        try {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('s3');
            if (! $disk->exists($path)) {
                return response('Not found', 404);
            }

            $contents = $disk->get($path);

            $mime = 'application/octet-stream';
            try {
                if (method_exists($disk, 'mimeType')) {
                    $mime = $disk->mimeType($path) ?: $mime;
                } else {
                    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                    $map = [
                        'mp4' => 'video/mp4',
                        'webm' => 'video/webm',
                        'mov' => 'video/quicktime',
                        'm4v' => 'video/x-m4v',
                        'jpg' => 'image/jpeg',
                        'jpeg' => 'image/jpeg',
                        'png' => 'image/png',
                        'webp' => 'image/webp',
                    ];
                    if (isset($map[$ext])) {
                        $mime = $map[$ext];
                    }
                }
            } catch (\Throwable $e) {
                // ignore and fall back to default
            }

            return response($contents, 200)->header('Content-Type', $mime);
        } catch (\Throwable $e) {
            Log::error('Error serving video file: ' . $e->getMessage());
            return response('Error', 500);
        }
    }
}