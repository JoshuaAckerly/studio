#!/usr/bin/env bash
echo "Waiting for MinIO health endpoint (up to 60s)..."
done
#!/usr/bin/env bash
# Convenience bash script
# Starts MinIO if not running, waits for health, ensures test bucket (if mc is available), then runs integration tests
set -euo pipefail

BUCKET='test-bucket'
NO_DOWNLOAD_MC=0
SKIP_TESTS=0

usage() {
  cat <<EOF
Usage: $0 [--bucket NAME] [--no-download-mc] [--skip-tests] [--help]
  --bucket NAME        Name of the test bucket to create (default: test-bucket)
  --no-download-mc     Do not download the mc client
  --skip-tests         Run setup only, do not execute phpunit
  --help               Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bucket)
      BUCKET="$2"; shift 2;;
    --no-download-mc)
      NO_DOWNLOAD_MC=1; shift;;
    --skip-tests)
      SKIP_TESTS=1; shift;;
    --help)
      usage; exit 0;;
    *)
      echo "Unknown arg: $1"; usage; exit 2;;
  esac
done

echo "Using bucket: $BUCKET"

echo "Checking for MinIO container..."
if ! docker ps --filter name=minio --format '{{.Names}}' | grep -q minio; then
  echo "Starting MinIO container..."
  docker run -d --name minio -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
    minio/minio:RELEASE.2025-02-01T00-00-00Z server /data --console-address ":9001"
else
  echo "MinIO already running"
fi

# Wait for health
echo "Waiting for MinIO health endpoint (up to 60s)..."
for i in {1..60}; do
  if curl -sS http://127.0.0.1:9000/minio/health/live >/dev/null 2>&1; then
    echo "MinIO healthy"
    break
  fi
  sleep 1


if [ "$NO_DOWNLOAD_MC" -eq 0 ]; then
  if [ ! -f mc ]; then
    echo "Downloading mc client..."
    curl -sSfL https://dl.min.io/client/mc/release/linux-amd64/mc -o mc
    chmod +x mc || true
  fi
else
  echo "Skipping mc download as requested (--no-download-mc)"
fi

if [ -f ./mc ]; then
  echo "Configuring mc and creating test bucket (local/$BUCKET)..."
  ./mc alias set local http://127.0.0.1:9000 minioadmin minioadmin --api S3v4 || true
  ./mc mb -p local/$BUCKET || true
fi

if [ "$SKIP_TESTS" -eq 1 ]; then
  echo "Setup complete (skip-tests requested)."
  exit 0
fi

# Run integration tests
vendor/bin/phpunit --group integration
