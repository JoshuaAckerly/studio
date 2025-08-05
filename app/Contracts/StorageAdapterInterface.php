<?php

namespace App\Contracts;

interface StorageAdapterInterface
{
    /**
     * List files under a prefix
     *
     * @param string $prefix
     * @return array
     */
    public function files(string $prefix): array;

    /**
     * Check existence of a key
     *
     * @param string $key
     * @return bool
     */
    public function exists(string $key): bool;

    /**
     * Last modified timestamp for a key
     *
     * @param string $key
     * @return int|null
     */
    public function lastModified(string $key): ?int;

    /**
     * Get a public URL
     *
     * @param string $path
     * @return string
     */
    public function url(string $path): string;

    /**
     * Get a temporary signed URL if supported
     *
     * @param string $path
     * @param \DateTimeInterface $expires
     * @return string
     */
    public function temporaryUrl(string $path, \DateTimeInterface $expires): string;
}
