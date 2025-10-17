<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Services\VideoLogService;
use App\Http\Resources\VideoLogResource;

class VideoLogController extends Controller
{
    public function index()
    {
        return Inertia::render('VideoLog');
    }

    public function api(Request $request)
    {
        $service = new VideoLogService();
        $items = $service->list();

        return VideoLogResource::collection($items);
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