param(
    [string]$Bucket = 'test-bucket',
    [switch]$NoDownloadMc,
    [switch]$SkipTests,
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\scripts\run-integration-with-minio.ps1 [-Bucket <name>] [--NoDownloadMc] [--SkipTests] [--Help]"
    Write-Host "	-Bucket: name of the test bucket to create (default: test-bucket)"
    Write-Host "	--NoDownloadMc: do not attempt to download the mc client"
    Write-Host "	--SkipTests: run setup only, do not execute phpunit"
    exit 0
}

Write-Host "Using bucket: $Bucket"

# Start MinIO if missing
Write-Host "Checking for existing MinIO container..."
$hasMinio = docker ps --filter name=minio --format "{{.Names}}" 2>$null
if (-not ($hasMinio -match 'minio')) {
    Write-Host "Starting MinIO container..."
    docker run -d --name minio -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
      minio/minio:RELEASE.2025-02-01T00-00-00Z server /data --console-address ":9001" | Out-Null
} else {
    Write-Host "MinIO container already running: $hasMinio"
}

# Wait for health
Write-Host "Waiting for MinIO health endpoint (up to 60s)..."
$healthy = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri http://127.0.0.1:9000/minio/health/live -TimeoutSec 2 -ErrorAction Stop
        if ($resp) { Write-Host 'MinIO healthy'; $healthy = $true; break }
    } catch {
        Start-Sleep -Seconds 1
    }
}
if (-not $healthy) {
    Write-Error "MinIO did not become healthy after 60s. Check 'docker ps' and logs."
    exit 1
}

# Ensure mc is present and create the test bucket if possible
$mcFile = './mc'
if ($IsWindows) { $mcUrl = 'https://dl.min.io/client/mc/release/windows-amd64/mc.exe'; $mcFile = '.\\mc.exe' } else { $mcUrl = 'https://dl.min.io/client/mc/release/linux-amd64/mc'; $mcFile = './mc' }

if (-not $NoDownloadMc) {
    if (-not (Test-Path -Path $mcFile)) {
        Write-Host "Downloading mc client from $mcUrl"
        try {
            Invoke-WebRequest -Uri $mcUrl -OutFile ($mcFile -replace '\\','/') -UseBasicParsing -ErrorAction Stop
            if (-not $IsWindows) { chmod +x $mcFile }
        } catch {
            Write-Warning "Failed to download mc; skipping automatic bucket creation. You can create the bucket manually."
            $mcFile = $null
        }
    }
} else {
    Write-Host "Skipping mc download as requested (--NoDownloadMc)"
}

if ($mcFile) {
    try {
        Write-Host "Configuring mc and creating test bucket (local/$Bucket)..."
        & $mcFile alias set local http://127.0.0.1:9000 minioadmin minioadmin --api S3v4 | Out-Null
        & $mcFile mb -p local/$Bucket | Out-Null
        Write-Host "Bucket create attempted (exists or created)."
    } catch {
        Write-Warning "mc commands failed; ensure mc is present or create the bucket manually."
    }
}

if ($SkipTests) {
    Write-Host "Setup complete (SkipTests requested)."
    exit 0
}

# Run integration tests
Write-Host "Running integration tests..."
& vendor\bin\phpunit --group integration

# exit with the previous command's exit code
exit $LASTEXITCODE
