Debugging Storage Integration (MinIO)

This repo includes a small local helper and CI workflows to run integration tests against a MinIO (S3-compatible) server.

Files

- `scripts/start-minio-and-run-tests.ps1` — PowerShell helper to start a MinIO container locally, create the required bucket, and run PHPUnit integration tests. Useful on Windows.
- `.github/workflows/integration-storage.yml` — Main integration workflow. It runs on push/PR (when labeled) and now uploads debug/phpunit artifacts only when the job fails.
- `.github/workflows/debug-integration-storage.yml` — Manual `workflow_dispatch` workflow that starts MinIO, runs the integration tests, and uploads MinIO logs and PHPUnit artifacts as a single downloadable artifact. Use this when you need detailed logs.

How to use locally (Windows)

1) Install Docker Desktop (if not installed).

2) Run the helper script from the repo root in PowerShell:

```powershell
# start MinIO and run integration tests (default bucket: graveyardjokes-cdn)
.
\scripts\start-minio-and-run-tests.ps1
```

The script will start (or reuse) a `minio` container, create the bucket, wait for S3 readiness, and run:

```powershell
vendor\bin\phpunit --group integration
```

How to use the manual debug workflow (GitHub Actions)

1) Open the Actions tab in the repository in GitHub.
2) Select `Debug - Integration Storage (MinIO)`.
3) Click `Run workflow` and optionally provide inputs.
4) When the run completes the artifact `debug-integration-<run id>` will be available for download and will contain:
   - `artifacts/phpunit/phpunit-console.log`
   - `artifacts/phpunit/phpunit-results.xml`
   - `minio-debug/minio-logs.txt`
   - `minio-debug/docker-ps.txt`
   - `minio-debug/mc-ls.txt` (object listing)

Notes

- The main integration workflow only uploads artifacts on failure to reduce noise. Use the manual debug workflow for full artifacts on demand.
- The helper script and workflows use the default MinIO credentials `minioadmin:minioadmin`. Do not use these credentials in production.
- If you want me to add a migration script to normalize object prefixes or add a fallback prefix lookup in `IllustrationService`, tell me which option you prefer.
