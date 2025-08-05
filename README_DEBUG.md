Debugging Storage Integration (MinIO)

This repo includes local helpers to run integration tests against a MinIO (S3-compatible) server. MinIO is intentionally local-only and CI will not start MinIO automatically.

Files

- `.github/workflows/integration-storage.yml` — Main integration workflow. It runs on push/PR (when labeled) and now uploads debug/phpunit artifacts only when the job fails.
- `.github/workflows/debug-integration-storage.yml` — Manual `workflow_dispatch` workflow that starts MinIO, runs the integration tests, and uploads MinIO logs and PHPUnit artifacts as a single downloadable artifact. Use this when you need detailed logs.

How to use locally (Linux VM)

1) Install MinIO (if not installed):

```bash
# Download and install MinIO server
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/
```

2) Start MinIO manually:

```bash
# Create data directory
mkdir -p ~/minio-data

# Start MinIO server
export MINIO_ROOT_USER=minioadmin
export MINIO_ROOT_PASSWORD=minioadmin
minio server ~/minio-data --console-address ":9001" &
```

3) Create the test bucket:

```bash
# Wait for MinIO to start, then create bucket
sleep 5

# Install MinIO client if not available
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure and create bucket
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/test-bucket
```

4) Run the integration tests:

```bash
export AWS_BUCKET=test-bucket
export AWS_ACCESS_KEY_ID=minioadmin
export AWS_SECRET_ACCESS_KEY=minioadmin
export AWS_ENDPOINT=http://localhost:9000
export AWS_REGION=us-east-1

./vendor/bin/phpunit --testsuite=Integration

```powershell
vendor\bin\phpunit --group integration
```

How to use the manual debug workflow (GitHub Actions)

1) Open the Actions tab in the repository in GitHub.
2) Select `Debug - Integration Storage (MinIO)`.
3) Click `Run workflow` and optionally provide inputs.
4) IMPORTANT: This workflow no longer starts MinIO in CI. To exercise MinIO-backed scenarios you must run the workflow locally (via act) or start MinIO yourself in the runner before invoking tests. Alternatively run the `scripts/start-minio-and-run-tests.ps1` helper locally to start MinIO and run the integration tests on your machine.
4) When the run completes the artifact `debug-integration-<run id>` will be available for download and will contain:
   - `artifacts/phpunit/phpunit-console.log`
   - `artifacts/phpunit/phpunit-results.xml`
   - `minio-debug/minio-logs.txt`
   - `minio-debug/ps-aux.txt`
   - `minio-debug/mc-ls.txt` (object listing)

Notes

- The main integration workflow only uploads artifacts on failure to reduce noise. Use the manual debug workflow for full artifacts on demand.
- The helper script and workflows use the default MinIO credentials `minioadmin:minioadmin`. Do not use these credentials in production.
- If you want me to add a migration script to normalize object prefixes or add a fallback prefix lookup in `IllustrationService`, tell me which option you prefer.

Migration helper (CLI)

This repo includes an Artisan command to normalize S3 object prefixes called `s3:normalize-prefix`.

Usage examples:

   # Dry run: show what would be copied
   php artisan s3:normalize-prefix --source=old-prefix --target=images/illustrations --dry

   # Live run: copy objects and delete originals
   php artisan s3:normalize-prefix --source=old-prefix --target=images/illustrations --bucket=your-bucket --delete-original

Options:
- `--dry` (show actions only)
- `--source` (required) source prefix
- `--target` (required) target prefix
- `--bucket` override bucket from config
- `--delete-original` remove the original object after copying
- `--overwrite` overwrite existing target keys
- `--limit` stop after processing N objects (safety)

Before running a live migration:
- Run with `--dry` first to confirm actions.
- Prefer running in a staging environment with a copy of production data.
- Ensure credentials and permissions allow copy/delete operations.
