<?php

namespace App\Http\Controllers;

use App\Models\FacebookGalleryPost;
use App\Services\StorageUrlGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class IllustrationController extends Controller
{
    public function api(Request $request)
    {
        $fbPosts = FacebookGalleryPost::active()
            ->orderBy('sort_order')
            ->orderByDesc('posted_at')
            ->orderByDesc('created_at')
            ->get();

        if ($fbPosts->isNotEmpty()) {
            $items = $fbPosts->map(fn ($post) => [
                'id' => $post->id,
                'title' => $post->title ?? '',
                'description' => $post->description ?? null,
                'tags' => $post->tags ?? [],
                'filename' => $post->title ?? 'Facebook Post',
                'url' => $post->post_url,
                'embed_url' => $post->embed_url,
                'thumbnail_url' => $post->thumbnail_url ?? null,
                'date' => $post->posted_at
                    ? $post->posted_at->format('Y-m-d')
                    : $post->created_at->format('Y-m-d'),
            ]);

            return response()->json(['data' => $items]);
        }

        return response()->json(['data' => $this->s3Illustrations()]);
    }

    /**
     * Fallback: list image files from S3 when the facebook_gallery_posts table is empty.
     *
     * @return array<int, array<string, mixed>>
     */
    private function s3Illustrations(): array
    {
        $s3Bucket = (string) config('filesystems.disks.s3.bucket');
        if (! $s3Bucket || app()->environment('testing')) {
            return [];
        }

        $s3 = Storage::disk('s3');
        $urlGenerator = new StorageUrlGenerator($s3, config('media.cloudfront_domain'));

        $configuredPrefix = trim((string) config('media.illustrations_prefix', 'images/illustrations'), '/');
        $candidates = array_values(array_unique(array_filter([
            $configuredPrefix,
            'studio/images/illustrations',
            'images/illustrations',
            str_starts_with($configuredPrefix, 'studio/') ? $configuredPrefix : 'studio/'.$configuredPrefix,
        ])));

        $imageExtensions = ['gif', 'png', 'jpg', 'jpeg', 'webp'];
        $files = [];

        foreach ($candidates as $prefix) {
            try {
                $all = $s3->files($prefix);
                $images = array_values(array_filter($all, function ($f) use ($imageExtensions) {
                    return in_array(strtolower(pathinfo($f, PATHINFO_EXTENSION)), $imageExtensions);
                }));

                if (! empty($images)) {
                    $files = $images;
                    break;
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        return array_map(function ($file, $idx) use ($urlGenerator) {
            $filename = pathinfo($file, PATHINFO_BASENAME);
            $url = $urlGenerator->url($file);

            return [
                'id' => $idx + 1,
                'url' => $url,
                'filename' => $filename,
                'thumbnail_url' => null,
                'embed_url' => null,
                'title' => pathinfo($filename, PATHINFO_FILENAME),
                'description' => null,
                'tags' => [],
                'date' => null,
            ];
        }, $files, array_keys($files));
    }
}
