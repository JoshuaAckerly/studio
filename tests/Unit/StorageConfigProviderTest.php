<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\StorageConfigProvider;

class StorageConfigProviderTest extends TestCase
{
    private string $tmpDir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tmpDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'studio_storage_provider_' . uniqid();
        @mkdir($this->tmpDir, 0777, true);
    }

    protected function tearDown(): void
    {
        // cleanup tmp dir
        if (is_dir($this->tmpDir)) {
            $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($this->tmpDir, \FilesystemIterator::SKIP_DOTS), \RecursiveIteratorIterator::CHILD_FIRST);
            foreach ($files as $fileinfo) {
                if ($fileinfo->isDir()) {
                    @rmdir($fileinfo->getRealPath());
                } else {
                    @unlink($fileinfo->getRealPath());
                }
            }
            @rmdir($this->tmpDir);
        }

        parent::tearDown();
    }

    private function writeDotEnv(array $lines): void
    {
        $content = implode("\n", $lines) . "\n";
        file_put_contents($this->tmpDir . DIRECTORY_SEPARATOR . '.env', $content);
    }

    public function test_lookup_prefers_env_and_trims_quotes_and_whitespace()
    {
        // Write a .env with quoted value and trailing whitespace
        $this->writeDotEnv([
            'AWS_DEFAULT_REGION="us-east-2 "',
            "AWS_USE_PATH_STYLE_ENDPOINT=' true '",
        ]);

        $provider = new StorageConfigProvider($this->tmpDir);

        $region = $provider->lookup('AWS_DEFAULT_REGION');
        $this->assertSame('us-east-2', $region, 'Region should be trimmed and unquoted');

        $pathStyle = $provider->lookup('AWS_USE_PATH_STYLE_ENDPOINT');
        $this->assertSame('true', $pathStyle, 'Boolean-like value should be trimmed and normalized');
    }

    public function test_sdkConfig_prefers_admin_credentials_and_parses_endpoint_and_path_style()
    {
        $this->writeDotEnv([
            'AWS_DEFAULT_REGION=us-east-2',
            'AWS_ACCESS_KEY_ID_ADMIN=ADMINKEY',
            'AWS_SECRET_ACCESS_KEY_ADMIN=ADMINSECRET',
            'AWS_ENDPOINT=http://127.0.0.1:9000',
            'AWS_USE_PATH_STYLE_ENDPOINT=1',
        ]);

        $provider = new StorageConfigProvider($this->tmpDir);

        $cfg = $provider->sdkConfig(true);

        $this->assertArrayHasKey('region', $cfg);
        $this->assertSame('us-east-2', $cfg['region']);

        $this->assertArrayHasKey('credentials', $cfg);
        $this->assertSame('ADMINKEY', $cfg['credentials']['key']);
        $this->assertSame('ADMINSECRET', $cfg['credentials']['secret']);

        $this->assertSame('http://127.0.0.1:9000', $cfg['endpoint']);
        $this->assertArrayHasKey('use_path_style_endpoint', $cfg);
        $this->assertTrue($cfg['use_path_style_endpoint']);
    }

    public function test_laravelDiskConfig_returns_expected_structure()
    {
        $this->writeDotEnv([
            'AWS_ACCESS_KEY_ID=AKIA_TEST',
            'AWS_SECRET_ACCESS_KEY=SECRET_TEST',
            'AWS_DEFAULT_REGION=us-east-1',
            'AWS_BUCKET=my-bucket',
            'AWS_ENDPOINT=http://127.0.0.1:9000',
            'AWS_USE_PATH_STYLE_ENDPOINT=true',
        ]);

        $provider = new StorageConfigProvider($this->tmpDir);
        $disk = $provider->laravelDiskConfig();

        $this->assertIsArray($disk);
        $this->assertSame('s3', $disk['driver']);
        $this->assertSame('AKIA_TEST', $disk['key']);
        $this->assertSame('SECRET_TEST', $disk['secret']);
        $this->assertSame('us-east-1', $disk['region']);
        $this->assertSame('my-bucket', $disk['bucket']);
        $this->assertSame('http://127.0.0.1:9000', $disk['endpoint']);
        $this->assertTrue($disk['use_path_style_endpoint']);
    }
}
