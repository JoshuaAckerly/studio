Running integration tests (MinIO)
================================

The integration tests in this repository expect an S3-compatible endpoint (MinIO) running locally.

Start MinIO:

```bash
# Install MinIO if not already installed
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Create data directory
mkdir -p ~/minio-data

# Start MinIO server
export MINIO_ROOT_USER=minioadmin
export MINIO_ROOT_PASSWORD=minioadmin
minio server ~/minio-data --console-address ":9001" &
```

After MinIO is running export the env vars:

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
