<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class VideoLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array|
     */
    public function toArray($request)
    {
        // $this->resource is an instance of App\Models\VideoLog
        return [
            'id' => $this->id,
            'title' => $this->title,
            'date' => $this->date,
            'thumbnail' => $this->thumbnail,
            'url' => $this->url,
            'description' => $this->description,
        ];
    }
}
