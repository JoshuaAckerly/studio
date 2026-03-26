<?php

namespace App\Http\Controllers;

use App\Http\Resources\VideoLogResource;
use App\Models\TikTokVideo;
use App\Services\VideoLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class VideoLogController extends Controller
{
    protected VideoLogService $videoLogService;

    public function __construct(VideoLogService $videoLogService)
    {
        $this->videoLogService = $videoLogService;
    }

    public function index()
    {
        return Inertia::render('VideoLog');
    }

    public function api(Request $request)
    {
        $tikTokVideos = TikTokVideo::active()
            ->orderBy('sort_order')
            ->orderByDesc('posted_at')
            ->orderByDesc('created_at')
            ->get();

        if ($tikTokVideos->isNotEmpty()) {
            $items = $tikTokVideos->map(fn ($video) => [
                'id' => $video->id,
                'title' => $video->title,
                'date' => $video->posted_at
                    ? $video->posted_at->format('Y-m-d')
                    : $video->created_at->format('Y-m-d'),
                'thumbnail' => $video->thumbnail_url ?? '',
                'url' => $video->video_url,
                'embed_url' => $video->embed_url,
                'description' => $video->description,
            ]);

            return response()->json(['data' => $items]);
        }

        $items = $this->videoLogService->list();

        return VideoLogResource::collection($items);
    }

    /**
     * Serve a file from the configured s3 disk. Used for testing/dev when the adapter
     * doesn't provide public URLs (for example Storage::fake()).
     *
     * Query param: path (required)
     */
    public function serve(\App\Http\Requests\ServeFileRequest $request)
    {
        // The FormRequest handles authorize() (environment) and presence of 'path'
        $path = $request->query('path');

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
            Log::error('Error serving video file: '.$e->getMessage());

            return response('Error', 500);
        }
    }
}
