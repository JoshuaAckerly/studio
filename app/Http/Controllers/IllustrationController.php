<?php

namespace App\Http\Controllers;

use App\Http\Resources\IllustrationResource;
use App\Services\IllustrationService;
use Illuminate\Http\Request;

class IllustrationController extends Controller
{
    public function api(Request $request)
    {
        $service = new IllustrationService;
        $items = $service->list();

        return IllustrationResource::collection($items);
    }
}
