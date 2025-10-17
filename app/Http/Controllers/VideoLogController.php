<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class VideoLogController
{
    /**
     * Render the Inertia VideoLog page.
     */
    public function index()
    {
        return Inertia::render('VideoLog');
    }

    /**
     * Return JSON list of video log entries. Supports S3 (prefix: video-logs/) or falls back to static items.
     */
    public function api(Request $request)
    {
        $items = [];

        try {
            $disk = config('filesystems.default');

            if ($disk === 's3' || config('filesystems.disks.s3.bucket')) {
                /** @var \Illuminate\Filesystem\FilesystemAdapter $s3 */
                $s3 = Storage::disk('s3');

                // support multiple prefixes for videos (auto-detect)
                $videoPrefixes = ['video-logs', 'videos'];
                $allFiles = [];
                foreach ($videoPrefixes as $prefix) {
                    try {
                        $files = $s3->files($prefix);
                        $allFiles = array_merge($allFiles, $files);
                    } catch (\Exception $e) {
                        // ignore missing prefix
                    }
                }

                $videoFiles = array_values(array_unique(array_filter($allFiles, function ($f) {
                    return preg_match('/\.(mp4|webm|mov|m4v)$/i', $f);
                })));

                usort($videoFiles, function ($a, $b) use ($s3) {
                    try {
                        $ta = $s3->lastModified($a) ?? 0;
                        $tb = $s3->lastModified($b) ?? 0;
                        return $tb <=> $ta;
                    } catch (\Throwable $e) {
                        return 0;
                    }
                });

                $id = 1;
                foreach ($videoFiles as $file) {
                    $basename = pathinfo($file, PATHINFO_FILENAME);

                    // search for thumbnails across common thumbnail prefixes
                    $thumbPrefixes = ['images/vlogs', 'images', 'thumbnails'];
                    $thumbExts = ['jpg', 'png', 'webp'];
                    $thumbCandidates = [];
                    foreach ($thumbPrefixes as $tp) {
                        foreach ($thumbExts as $ext) {
                            $thumbCandidates[] = "{$tp}/{$basename}.{$ext}";
                        }
                    }
                    $thumbnail = null;
                    foreach ($thumbCandidates as $t) {
                        if ($s3->exists($t)) {
                            if (method_exists($s3, 'temporaryUrl')) {
                                try {
                                    $thumbnail = $s3->temporaryUrl($t, now()->addHour());
                                } catch (\Exception $e) {
                                    $thumbnail = $s3->url($t);
                                }
                            } else {
                                $thumbnail = $s3->url($t);
                            }
                            break;
                        }
                    }

                    // If no exact thumbnail matched, try to pick any image from images/vlogs as a fallback
                    if (!$thumbnail) {
                        try {
                            $availableThumbs = $s3->files('images/vlogs');
                            if (!empty($availableThumbs)) {
                                $firstThumb = $availableThumbs[0];
                                if (method_exists($s3, 'temporaryUrl')) {
                                    try {
                                        $thumbnail = $s3->temporaryUrl($firstThumb, now()->addHour());
                                    } catch (\Exception $e) {
                                        $thumbnail = $s3->url($firstThumb);
                                    }
                                } else {
                                    $thumbnail = $s3->url($firstThumb);
                                }
                            }
                        } catch (\Exception $e) {
                            // ignore and leave thumbnail null so fallback below applies
                        }
                    }

                    if (method_exists($s3, 'temporaryUrl')) {
                        try {
                            $url = $s3->temporaryUrl($file, now()->addHour());
                        } catch (\Exception $e) {
                            $url = $s3->url($file);
                        }
                    } else {
                        $url = $s3->url($file);
                    }

                    $items[] = [
                        'id' => $id++,
                        'title' => str_replace(['-', '_'], ' ', ucfirst($basename)),
                        'date' => date('Y-m-d'),
                        'thumbnail' => $thumbnail ?? (
                            ($s3->exists('images/vlogs/default.jpg') ? $s3->url('images/vlogs/default.jpg') : (
                                $s3->exists('images/vlogs/default.png') ? $s3->url('images/vlogs/default.png') : (
                                    $s3->exists('images/vlogs/default.svg') ? $s3->url('images/vlogs/default.svg') : '/images/vlogs/default.svg'
                                )
                            ))
                        ),
                        'url' => $url,
                        'description' => null,
                    ];
                }

                return response()->json(['data' => $items]);
            }
        } catch (\Exception $e) {
            Log::error('S3 listing failed for video-logs: ' . $e->getMessage());
        }

        // Fallback static items
        $items = [
            [
                'id' => 1,
                'title' => 'Studio Update — Composing Session',
                'date' => '2025-10-10',
                'thumbnail' => '/images/vlogs/session-thumbnail.jpg',
                'url' => '/videos/session.mp4',
                'description' => 'A look into the music composing session with new synth textures.'
            ],
            [
                'id' => 2,
                'title' => '3D Character Concept Walkthrough',
                'date' => '2025-09-28',
                'thumbnail' => '/images/vlogs/3d-thumbnail.jpg',
                'url' => '/videos/3d-concept.mp4',
                'description' => 'Discussing the 2D to 3D pipeline and collaborations.'
            ],
        ];

        return response()->json(['data' => $items]);
    }
}
