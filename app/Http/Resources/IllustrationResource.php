<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class IllustrationResource extends JsonResource
{
    public function toArray($request)
    {
        $url = is_string($this->resource) ? $this->resource : ($this->resource['url'] ?? '');
        $filename = basename(parse_url($url, PHP_URL_PATH) ?: '');

        $result = [
            'url' => $url,
            'filename' => $filename,
        ];

        // For GIFs, check if thumbnail exists and provide thumbnail URL
        if (preg_match('/\.gif$/i', $filename)) {
            $thumbnailFilename = preg_replace('/\.gif$/i', '_thumb.jpg', $filename);
            $thumbnailPath = str_replace($filename, $thumbnailFilename, $this->getS3Path($url));

            // Only include thumbnail_url if the file actually exists
            if (\Illuminate\Support\Facades\Storage::disk('s3')->exists($thumbnailPath)) {
                $thumbnailUrl = str_replace($filename, $thumbnailFilename, $url);
                $result['thumbnail_url'] = $thumbnailUrl;
            }
        }

        return $result;
    }

    private function getS3Path(string $url): string
    {
        // Extract the path from CloudFront/S3 URL
        $parsed = parse_url($url);
        $path = $parsed['path'] ?? '';

        // Remove leading slash if present
        return ltrim($path, '/');
    }
}
