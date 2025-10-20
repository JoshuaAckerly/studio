# MinIO: Local-only policy

This repository uses MinIO (an S3-compatible server) only for local development and debugging. CI workflows in this repository do not start or depend on MinIO. The goal is to keep CI simple and predictable; integration tests that require MinIO should be run locally or on self-hosted runners that provide MinIO.

Why local-only?

- MinIO can be flaky in ephemeral CI environments and can introduce nondeterminism into test runs.
- Starting MinIO in CI increases runner complexity and lengthens runs.
- Local runs are faster for debugging and allow developers to iterate on storage integration behavior.

Quickstart — run MinIO locally (Docker)

PowerShell (Windows):

```powershell
# Start MinIO (background)
docker run -d --name minio -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio:RELEASE.2025-02-01T00-00-00Z server /data --console-address ":9001"
```

Convenience one-liners (PowerShell + bash)

PowerShell (start if missing, wait for health, then run tests):

```powershell
# Start MinIO if it's not running
if (-not (docker ps --filter name=minio --format "{{.Names}}" | Select-String -Quiet 'minio')) {
  docker run -d --name minio -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin minio/minio:RELEASE.2025-02-01T00-00-00Z server /data --console-address ":9001"
}

# Wait for MinIO health endpoint (up to 60s)
$max = 60
for ($i = 0; $i -lt $max; $i++) {
  try {
    $r = Invoke-RestMethod -Uri http://127.0.0.1:9000/minio/health/live -TimeoutSec 2 -ErrorAction Stop
    if ($r) { Write-Host 'MinIO healthy'; break }
  } catch { }
  Start-Sleep -Seconds 1
}

# Run integration tests
vendor\bin\phpunit --group integration
```

Bash (start if missing, wait for health, then run tests):

```bash
# Start MinIO if it's not running
docker ps --filter name=minio --format '{{.Names}}' | grep -q minio || \
  docker run -d --name minio -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
    minio/minio:RELEASE.2025-02-01T00-00-00Z server /data --console-address ":9001"

# Wait for health (up to 60s)
for i in {1..60}; do
  curl -sS http://127.0.0.1:9000/minio/health/live >/dev/null 2>&1 && break
  sleep 1
done

vendor/bin/phpunit --group integration
```

Linux / macOS (bash):

```bash
docker run -d --name minio -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio:RELEASE.2025-02-01T00-00-00Z server /data --console-address ":9001"
```

Create the test bucket (mc)

```bash
curl -sSfL https://dl.min.io/client/mc/release/linux-amd64/mc -o mc && chmod +x mc
./mc alias set local http://localhost:9000 minioadmin minioadmin --api S3v4
./mc mb -p local/test-bucket || true
```

Run integration tests

```bash
vendor/bin/phpunit --group integration
```

Notes for CI / maintainers

- CI workflows were updated to stop starting MinIO and now contain informational steps indicating MinIO is local-only.
- If you need CI to run MinIO-backed integration tests, use one of these options:
  - Run tests on a self-hosted runner that already provides MinIO.
  - Add an explicit workflow input (e.g., `start-minio: true`) and only start MinIO when requested.
  - Run the debug workflow locally using a runner emulator like `act`.

Troubleshooting tips

- If tests fail complaining about credentials, ensure the `AWS_*` env vars are set to the MinIO defaults for local runs:
  - `AWS_ACCESS_KEY_ID=minioadmin`
  - `AWS_SECRET_ACCESS_KEY=minioadmin`
  - `AWS_ENDPOINT=http://127.0.0.1:9000`
  - `AWS_USE_PATH_STYLE_ENDPOINT=true`

- If MinIO health checks fail, confirm the container is running:

```powershell
# Windows
docker ps --filter name=minio

# check health
curl http://127.0.0.1:9000/minio/health/live
```

- To remove the MinIO container:

```powershell
docker rm -f minio || true
```

Contact

If you'd like me to change the policy (for example, gate MinIO behind a workflow input), say so and I will update the workflows and docs accordingly.
