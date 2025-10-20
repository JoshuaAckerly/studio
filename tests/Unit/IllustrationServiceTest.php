<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\IllustrationService;
use App\Services\StorageUrlGenerator;

class IllustrationServiceTest extends TestCase
{
    public function test_list_filters_and_generates_urls()
    {
        // Create a fake disk object with a files() method returning mixed keys
        $fakeDisk = new class {
            public function files($prefix) {
                // include a variety of keys; prefixes should already be normalized
                return [
                    $prefix . 'hero.jpg',
                    $prefix . 'thumb.PNG',
                    $prefix . 'document.pdf',
                    $prefix . 'nested/icon.webp'
                ];
            }
        };

        // Create a fake URL generator which returns a predictable URL
        $fakeGenerator = new class implements \App\Contracts\StorageUrlGeneratorInterface {
            public function url(string $path, ?int $expiresMinutes = null): string {
                return 'https://cdn.test/' . ltrim($path, '/');
            }
        };

        // Construct service with fake disk and fake generator
        $svc = new IllustrationService($fakeDisk, $fakeGenerator);

        $list = $svc->list();

        // Should only include image-like extensions (jpg, png, webp)
        $this->assertIsArray($list);
        $this->assertCount(3, $list);
        $this->assertStringContainsString('hero.jpg', $list[0]);
        $this->assertStringContainsString('thumb.PNG', $list[1]);
        $this->assertStringContainsString('icon.webp', $list[2]);
    }
}
