#!/usr/bin/env bash
set -euo pipefail

echo "Starting MinIO for local integration tests (container name: minio-test)"

# Pull a recent MinIO image
docker pull quay.io/minio/minio:latest

# Remove any existing container
docker rm -f minio-test >/dev/null 2>&1 || true

docker run -d \
  --name minio-test \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"

echo "Waiting for MinIO health endpoint..."
for i in $(seq 1 30); do
  if curl -sS http://127.0.0.1:9000/minio/health/live >/dev/null 2>&1; then
    echo "MinIO is healthy"
    break
  fi
  echo "  still waiting... ($i)"
  sleep 1
done

echo "Creating bucket 'test-bucket' (idempotent, using mc)"
# Create the bucket using the minio mc client in a container so we don't require mc installed
docker run --rm --entrypoint /bin/sh quay.io/minio/mc -c "\
  mc alias set local http://host.docker.internal:9000 minioadmin minioadmin --api S3v4 2>/dev/null || true; \
  mc alias set local http://127.0.0.1:9000 minioadmin minioadmin --api S3v4 2>/dev/null || true; \
  mc mb --ignore-existing local/test-bucket || true"

cat <<EOF
MinIO is running.
Export these env vars before running integration tests (bash):

export AWS_BUCKET=test-bucket
export AWS_ENDPOINT=http://127.0.0.1:9000
export AWS_ACCESS_KEY_ID=minioadmin
export AWS_SECRET_ACCESS_KEY=minioadmin

Then run:

vendor/bin/phpunit --group integration

To stop MinIO:

docker rm -f minio-test || true
EOF
