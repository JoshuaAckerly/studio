<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Http\Requests\ServeFileRequest;

class ServeFileRequestTest extends TestCase
{
    public function test_authorize_returns_true_in_testing()
    {
        config(['app.env' => 'testing']);

        $req = new ServeFileRequest();

        $this->assertTrue($req->authorize());
    }

    public function test_authorize_returns_false_in_production()
    {
        config(['app.env' => 'production']);

        $req = new ServeFileRequest();

        $this->assertFalse($req->authorize());
    }

    public function test_rules_contains_path_required_string()
    {
        $req = new ServeFileRequest();

        $rules = $req->rules();

        $this->assertArrayHasKey('path', $rules);
        $this->assertIsArray($rules['path']);
        $this->assertContains('required', $rules['path']);
        $this->assertContains('string', $rules['path']);
    }

    public function test_messages_contains_path_required()
    {
        $req = new ServeFileRequest();

        $messages = $req->messages();

        $this->assertArrayHasKey('path.required', $messages);
        $this->assertStringContainsString('Missing path', $messages['path.required']);
    }
}
