<?php

namespace App\Contracts;

interface StorageUrlGeneratorInterface
{
    /**
     * Return a public URL for a storage path.
     *
     * @param string $path
     * @param int|null $expiresMinutes
     * @return string
     */
    public function url(string $path, ?int $expiresMinutes = null): string;
}
