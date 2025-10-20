param(
    [string]$Bucket = 'test-bucket'
)

Write-Host "Starting MinIO (container name: minio-test)"

docker pull quay.io/minio/minio:latest

docker rm -f minio-test -ErrorAction SilentlyContinue | Out-Null

docker run -d --name minio-test -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin quay.io/minio/minio server /data --console-address ":9001"

Write-Host "Waiting for MinIO to become healthy..."
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri http://127.0.0.1:9000/minio/health/live -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "MinIO is healthy"
        break
    } catch {
        Write-Host "  still waiting... ($i)"
        Start-Sleep -Seconds 1
    }
}

Write-Host "Creating bucket '$Bucket' using mc container"
docker run --rm --entrypoint /bin/sh quay.io/minio/mc -c "mc alias set local http://host.docker.internal:9000 minioadmin minioadmin --api S3v4 || mc alias set local http://127.0.0.1:9000 minioadmin minioadmin --api S3v4; mc mb --ignore-existing local/$Bucket"

Write-Host "MinIO started. Set these env vars in your PowerShell session:"
Write-Host "  $env:AWS_BUCKET = '$Bucket'"
Write-Host "  $env:AWS_ENDPOINT = 'http://127.0.0.1:9000'"
Write-Host "  $env:AWS_ACCESS_KEY_ID = 'minioadmin'"
Write-Host "  $env:AWS_SECRET_ACCESS_KEY = 'minioadmin'"
Write-Host "Then run: vendor/bin/phpunit --group integration"
