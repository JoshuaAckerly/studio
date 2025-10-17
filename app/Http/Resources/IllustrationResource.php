<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class IllustrationResource extends JsonResource
{
    public function toArray($request)
    {
        $url = is_string($this->resource) ? $this->resource : ($this->resource['url'] ?? '');
        $filename = basename(parse_url($url, PHP_URL_PATH) ?: '');

        return [
            'url' => $url,
            'filename' => $filename,
        ];
    }
}
