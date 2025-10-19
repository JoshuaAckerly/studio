<#
Starts MinIO in Docker (if required), creates the `graveyardjokes-cdn` bucket, waits for MinIO readiness,
then runs the PHPUnit integration tests (integration group).

Usage:
  - Ensure Docker Desktop is installed and running.
  - From project root (where vendor/bin/phpunit exists) run:
      powershell -ExecutionPolicy Bypass -File .\scripts\start-minio-and-run-tests.ps1

Notes:
  - This script uses the `minio` container name. If a container named `minio` exists and is stopped, it will be removed and recreated.
  - It creates the bucket using the official `minio/mc` client in a short-lived container.
#>

param(
    [string]$BucketName = 'graveyardjokes-cdn',
    [string]$ContainerName = 'minio',
    [int]$ApiPort = 9000,
    [int]$ConsolePort = 9001,
    [string]$MinioRootUser = 'minioadmin',
    [string]$MinioRootPass = 'minioadmin'
)

$ErrorActionPreference = 'Stop'

function Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

Info "Checking for Docker..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Err "Docker CLI not found. Install Docker Desktop and ensure 'docker' is on PATH."; exit 2
}

try { docker version | Out-Null } catch { Err "Docker daemon not running. Start Docker Desktop."; exit 3 }

Info "Preparing MinIO container '$ContainerName'..."
$exists = (docker ps -a --filter "name=^/$ContainerName$" --format "{{.Names}}") -eq $ContainerName
$running = (docker ps --filter "name=^/$ContainerName$" --format "{{.Names}}") -eq $ContainerName
if ($exists -and -not $running) {
    Info "Removing existing stopped container '$ContainerName'..."; docker rm $ContainerName | Out-Null
}

# If desired console port is in use, pick the next free port
function Find-FreePort([int]$preferred) {
    try {
        for ($p = $preferred; $p -lt ($preferred + 10); $p++) {
            $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
            if (-not $conn) { return $p }
        }
    } catch { }
    return $preferred
}

$ConsolePort = Find-FreePort -preferred $ConsolePort

if (-not $running) {
    Info "Starting MinIO container '$ContainerName' mapping API port $ApiPort and console port $ConsolePort..."
    docker run -d --name $ContainerName -p $ApiPort:9000 -p $ConsolePort:9001 -e MINIO_ROOT_USER=$MinioRootUser -e MINIO_ROOT_PASSWORD=$MinioRootPass minio/minio server /data --console-address ":9001" | Out-Null
    Info "Started container; MinIO console at http://127.0.0.1:$ConsolePort"
} else { Info "Container '$ContainerName' already running; re-using." }

Info "Waiting for MinIO to become healthy on http://127.0.0.1:$ApiPort/minio/health/ready..."
$healthUrl = "http://127.0.0.1:$ApiPort/minio/health/ready"
$max = 60; $ok = $false
for ($i=0; $i -lt $max; $i++) {
    try { $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; if ($r.StatusCode -eq 200) { $ok = $true; break } } catch {}
    Start-Sleep -Seconds 1
}
if (-not $ok) { Err "Timed out waiting for MinIO readiness at $healthUrl"; exit 4 }

Info "Ensuring bucket '$BucketName' exists (idempotent)..."
# Try host.docker.internal first, then host-gateway mapping if needed
$endpointHost = 'host.docker.internal'
$createCmd = @("run","--rm","-e","AWS_ACCESS_KEY_ID=$MinioRootUser","-e","AWS_SECRET_ACCESS_KEY=$MinioRootPass","amazon/aws-cli","--endpoint-url","http://$endpointHost:$($ApiPort)","s3api","create-bucket","--bucket",$BucketName)

try {
    docker @createCmd 2>&1 | Out-String | ForEach-Object { $_ } | Out-Null; if ($LASTEXITCODE -eq 0) { Info "Bucket '$BucketName' created or confirmed." }
} catch {
    Info "Primary create attempt failed; retrying with host-gateway mapping..."
    docker run --rm --add-host=host.docker.internal:host-gateway -e "AWS_ACCESS_KEY_ID=$MinioRootUser" -e "AWS_SECRET_ACCESS_KEY=$MinioRootPass" amazon/aws-cli --endpoint-url "http://host.docker.internal:$ApiPort" s3api create-bucket --bucket $BucketName 2>&1 | Out-String | ForEach-Object { $_ } | Out-Null
    if ($LASTEXITCODE -ne 0) { Err "Failed to create bucket '$BucketName'"; exit 5 }
}

Info "Running PHPUnit integration tests..."
$phpunitCmd = 'php vendor\bin\phpunit --configuration=phpunit.xml --group integration'
Write-Host "Executing: $phpunitCmd"
Invoke-Expression $phpunitCmd
exit $LASTEXITCODE
