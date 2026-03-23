<?php

namespace App\Contracts;

interface StorageAdapterInterface
{
    /**
     * List files under a prefix
     */
    public function files(string $prefix): array;

    /**
     * Check existence of a key
     */
    public function exists(string $key): bool;

    /**
     * Last modified timestamp for a key
     */
    public function lastModified(string $key): ?int;

    /**
     * Get a public URL
     */
    public function url(string $path): string;

    /**
     * Get a temporary signed URL if supported
     */
    public function temporaryUrl(string $path, \DateTimeInterface $expires): string;
}
