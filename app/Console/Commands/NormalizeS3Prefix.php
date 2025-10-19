<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Aws\S3\S3Client;

class NormalizeS3Prefix extends Command
{
    protected $signature = 's3:normalize-prefix'
        . ' {--dry : Do not perform changes (dry run)}'
        . ' {--source= : Source prefix (required) }'
        . ' {--target= : Target prefix (required) }'
        . ' {--bucket= : Bucket to operate on (overrides config)}'
        . ' {--delete-original : Delete original objects after copy} '
        . ' {--overwrite : Overwrite target if exists} '
        . ' {--limit= : Max objects to process (for safety)}';

    protected $description = 'Normalize S3 object prefixes by copying objects from a source prefix to a target prefix.';

    public function handle(): int
    {
        $source = rtrim($this->option('source') ?? '', '/');
        $target = rtrim($this->option('target') ?? '', '/');

        if ($source === '' || $target === '') {
            $this->error('Both --source and --target are required.');
            return 1;
        }

        $dry = $this->option('dry');
        $delete = $this->option('delete-original');
        $overwrite = $this->option('overwrite');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;

        $bucket = $this->option('bucket') ?? config('filesystems.disks.s3.bucket');
        if (!$bucket) {
            $this->error('Bucket must be specified via --bucket or filesystems.disks.s3.bucket config');
            return 1;
        }

        $this->info("Using bucket: $bucket");
        $this->info("Source prefix: $source");
        $this->info("Target prefix: $target");
        $this->info($dry ? 'DRY RUN (no changes will be made)' : 'LIVE RUN');

        $disk = Storage::disk('s3');

        // Use AWS SDK client for efficient copy operations via CopyObject
        $client = new S3Client([
            'version' => 'latest',
            'region' => config('filesystems.disks.s3.region', 'us-east-1'),
            'endpoint' => config('filesystems.disks.s3.endpoint') ?? null,
            'use_path_style_endpoint' => config('filesystems.disks.s3.use_path_style_endpoint', true),
            'credentials' => [
                'key' => config('filesystems.disks.s3.key'),
                'secret' => config('filesystems.disks.s3.secret'),
            ],
        ]);

        $params = [
            'Bucket' => $bucket,
            'Prefix' => $source . '/',
        ];

        $processed = 0;
        $paginator = $client->getPaginator('ListObjectsV2', $params);

        foreach ($paginator as $result) {
            if (empty($result['Contents'])) {
                continue;
            }

            foreach ($result['Contents'] as $obj) {
                $key = $obj['Key'];
                // Ignore keys that don't start with the prefix (defensive)
                if (strpos($key, $source . '/') !== 0) {
                    continue;
                }

                $relative = substr($key, strlen($source) + 1);
                $targetKey = $target . '/' . $relative;

                $this->line("Found: $key -> $targetKey");

                // Check target exists
                $targetExists = false;
                try {
                    $client->headObject(['Bucket' => $bucket, 'Key' => $targetKey]);
                    $targetExists = true;
                } catch (\Aws\S3\Exception\S3Exception $e) {
                    $targetExists = false;
                }

                if ($targetExists && !$overwrite) {
                    $this->line("Skipping existing target: $targetKey");
                    continue;
                }

                if ($dry) {
                    $this->info("DRY: Would copy $key to $targetKey");
                } else {
                    $this->info("Copying $key to $targetKey");
                    $client->copyObject([
                        'Bucket' => $bucket,
                        'Key' => $targetKey,
                        'CopySource' => rawurlencode("{$bucket}/{$key}"),
                    ]);

                    if ($delete) {
                        $this->info("Deleting original $key");
                        $client->deleteObject(['Bucket' => $bucket, 'Key' => $key]);
                    }
                }

                $processed++;
                if ($limit && $processed >= $limit) {
                    $this->info("Limit reached ($limit). Stopping.");
                    break 2;
                }
            }
        }

        $this->info("Completed. Processed: $processed objects.");

        return 0;
    }
}
