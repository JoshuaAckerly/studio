<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\IllustrationService;
use App\Http\Resources\IllustrationResource;

class IllustrationController extends Controller
{
    public function api(Request $request)
    {
        $service = new IllustrationService();
        $items = $service->list();

        return IllustrationResource::collection($items);
    }
}
