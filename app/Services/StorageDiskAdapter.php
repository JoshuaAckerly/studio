<?php

namespace App\Services;

use App\Contracts\StorageAdapterInterface;
use Illuminate\Contracts\Filesystem\Filesystem;

class StorageDiskAdapter implements StorageAdapterInterface
{
    /** @var mixed */
    protected $disk;

    public function __construct($disk)
    {
        $this->disk = $disk;
    }

    public function files(string $prefix): array
    {
        try {
            return $this->disk->files($prefix) ?: [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    public function exists(string $key): bool
    {
        try {
            return (bool) $this->disk->exists($key);
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function lastModified(string $key): ?int
    {
        try {
            return $this->disk->lastModified($key) ?: null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function url(string $path): string
    {
        try {
            return $this->disk->url($path);
        } catch (\Throwable $e) {
            return '';
        }
    }

    public function temporaryUrl(string $path, \DateTimeInterface $expires): string
    {
        try {
            if (method_exists($this->disk, 'temporaryUrl')) {
                return $this->disk->temporaryUrl($path, $expires);
            }
            return $this->disk->url($path);
        } catch (\Throwable $e) {
            return '';
        }
    }
}
