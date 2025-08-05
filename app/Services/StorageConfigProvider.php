<?php

namespace App\Services;

use Dotenv\Dotenv;

/**
 * Centralized provider for storage-related configuration used by the app and scripts.
 *
 * Responsibilities:
 * - Normalize environment variable reads (prefer .env values when present)
 * - Trim and validate region and endpoint values to avoid subtle whitespace bugs
 * - Provide SDK-style client config arrays for AWS S3 and MinIO
 */
class StorageConfigProvider
{
    protected string $basePath;

    public function __construct(?string $basePath = null)
    {
        $resolved = $basePath ?: realpath(__DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..');
        $this->basePath = $resolved ?: '';
        if ($this->basePath && file_exists($this->basePath . DIRECTORY_SEPARATOR . '.env')) {
            try {
                Dotenv::createImmutable($this->basePath)->safeLoad();
            } catch (\Exception $e) {
                // ignore
            }
        }
    }

    /**
     * Lookup env from .env first, then $_ENV and getenv.
     */
    public function lookup(string $name): ?string
    {
        $envPath = $this->basePath . DIRECTORY_SEPARATOR . '.env';
        if ($this->basePath && file_exists($envPath)) {
            $lines = @file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#') continue;
                if (strpos($line, '=') === false) continue;
                list($k, $v) = array_map('trim', explode('=', $line, 2));
                if ($k !== $name) continue;
                if ((strlen($v) >= 2) && (($v[0] === '"' && $v[strlen($v)-1] === '"') || ($v[0] === "'" && $v[strlen($v)-1] === "'"))) {
                    $v = substr($v, 1, -1);
                }
                return $this->normalize($v);
            }
        }

        if (isset($_ENV[$name]) && $_ENV[$name] !== '') {
            return $this->normalize($_ENV[$name]);
        }

        $g = getenv($name);
        if ($g !== false && $g !== '') {
            return $this->normalize($g);
        }

        return null;
    }

    /**
     * Trim and normalize values (e.g., remove surrounding whitespace).
     */
    protected function normalize(string $v): string
    {
        return trim($v);
    }

    /**
     * Return an AWS SDK config array built from envs. Optionally prefer ADMIN creds.
     */
    public function sdkConfig(bool $preferAdmin = true): array
    {
        $region = $this->lookup('AWS_DEFAULT_REGION') ?: 'us-east-1';

        $accessKey = null;
        $secretKey = null;
        if ($preferAdmin) {
            $accessKey = $this->lookup('AWS_ACCESS_KEY_ID_ADMIN') ?: $this->lookup('AWS_ACCESS_KEY_ID');
            $secretKey = $this->lookup('AWS_SECRET_ACCESS_KEY_ADMIN') ?: $this->lookup('AWS_SECRET_ACCESS_KEY');
        } else {
            $accessKey = $this->lookup('AWS_ACCESS_KEY_ID');
            $secretKey = $this->lookup('AWS_SECRET_ACCESS_KEY');
        }

        $config = [
            'version' => 'latest',
            'region' => $region,
        ];

        if ($accessKey && $secretKey) {
            $config['credentials'] = [
                'key' => $accessKey,
                'secret' => $secretKey,
            ];
        }

        // Allow overriding endpoint for custom S3-compatible servers
        $endpoint = $this->lookup('AWS_ENDPOINT');
        if ($endpoint) {
            $config['endpoint'] = $endpoint;
        }

        // Path style
        $pathStyle = $this->lookup('AWS_USE_PATH_STYLE_ENDPOINT');
        if ($pathStyle !== null) {
            $config['use_path_style_endpoint'] = in_array(strtolower($pathStyle), ['1', 'true', 'yes'], true);
        }

        return $config;
    }

    /**
     * Laravel filesystems disk config for S3 using envs
     */
    public function laravelDiskConfig(): array
    {
        return [
            'driver' => 's3',
            'key' => $this->lookup('AWS_ACCESS_KEY_ID'),
            'secret' => $this->lookup('AWS_SECRET_ACCESS_KEY'),
            'region' => $this->lookup('AWS_DEFAULT_REGION') ?: 'us-east-1',
            'bucket' => $this->lookup('AWS_BUCKET') ?: '',
            'endpoint' => $this->lookup('AWS_ENDPOINT') ?: null,
            'use_path_style_endpoint' => in_array(strtolower($this->lookup('AWS_USE_PATH_STYLE_ENDPOINT') ?? 'false'), ['1','true','yes'], true),
        ];
    }
}
