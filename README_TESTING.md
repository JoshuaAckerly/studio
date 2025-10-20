Running integration tests (MinIO)
================================

The integration tests in this repository expect an S3-compatible endpoint (MinIO) running locally.
Two helper scripts are provided to start MinIO in Docker and create a test bucket:

- `scripts/start_minio.sh` — POSIX shell script for macOS/Linux
- `scripts/Start-Minio.ps1` — PowerShell script for Windows

Start MinIO (example, bash):

```bash
./scripts/start_minio.sh
```

Or in PowerShell:

```powershell
.\scripts\Start-Minio.ps1
```

After MinIO is running export the env vars (bash):

```bash
export AWS_BUCKET=test-bucket
export AWS_ENDPOINT=http://127.0.0.1:9000
export AWS_ACCESS_KEY_ID=minioadmin
export AWS_SECRET_ACCESS_KEY=minioadmin
```

Then run PHPUnit (integration group only):

```bash
vendor/bin/phpunit --group integration
```

If you prefer CI to run real integration tests, we can add an opt-in workflow that starts MinIO in CI (gated by a label or workflow input).
