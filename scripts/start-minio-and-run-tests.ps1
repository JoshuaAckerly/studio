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

$ErrorActionPreference = 'Stop'

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

# Check for Docker CLI
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Err "Docker CLI not found. Install Docker Desktop and ensure 'docker' is on PATH.";
    exit 2
}

# Check Docker daemon
try {
    docker version | Out-Null
} catch {
    Write-Err "Docker does not appear to be running. Start Docker Desktop and re-run this script.";
    exit 3
}

# If a container named 'minio' exists, remove it if stopped; reuse if running
$exists = (docker ps -a --filter "name=^/minio$" --format "{{.Names}}") -eq 'minio'
$running = (docker ps --filter "name=^/minio$" --format "{{.Names}}") -eq 'minio'
if ($exists -and -not $running) {
    Write-Info "Removing existing stopped 'minio' container..."
    docker rm minio | Out-Null
}

# Detect if local port 9001 is in use; if so, fall back to 9002 for the MinIO console mapping
$consolePort = 9001
try {
    $listener = Get-NetTCPConnection -LocalPort 9001 -ErrorAction SilentlyContinue
    if ($listener) {
        Write-Info "Local port 9001 is in use; falling back to console port 9002 to avoid conflict."
        $consolePort = 9002
    }
} catch {
    # if Get-NetTCPConnection isn't available, default to 9001
}

if (-not $running) {
    Write-Info "Starting MinIO container 'minio' (ports 9000/$consolePort -> container console 9001)..."
    docker run -d --name minio -p 9000:9000 -p ${consolePort}:9001 `
        -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin `
        minio/minio server /data --console-address ':9001' | Out-Null
    Write-Info "MinIO console will be reachable at http://127.0.0.1:${consolePort} (if allowed by firewall)."
} else {
    Write-Info "'minio' container already running; reusing."
}

# Wait for MinIO readiness
$healthUrl = 'http://127.0.0.1:9000/minio/health/ready'
Write-Info "Waiting for MinIO to be ready at $healthUrl ..."
$max = 60
$ok = $false
for ($i=0; $i -lt $max; $i++) {
    try {
        $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { Write-Info "MinIO ready"; $ok = $true; break }
    } catch {}
    Start-Sleep -Seconds 1
}
if (-not $ok) { Write-Err "Timed out waiting for MinIO readiness"; exit 4 }

# Create bucket using the Amazon AWS CLI container (fallbacks to ensure container can reach host)
Write-Info "Creating bucket 'graveyardjokes-cdn' (if missing) using amazon/aws-cli..."
# primary attempt: use host.docker.internal
$envArgs = @("-e","AWS_ACCESS_KEY_ID=minioadmin","-e","AWS_SECRET_ACCESS_KEY=minioadmin")
$createArgs = @('--endpoint-url','http://host.docker.internal:9000','s3api','create-bucket','--bucket','graveyardjokes-cdn')
Write-Info "Attempting to create bucket via amazon/aws-cli at host.docker.internal:9000"
function Run-DockerCapture($args) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'docker'
    $psi.Arguments = $args -join ' '
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $psi
    $p.Start() | Out-Null
    $stdout = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()
    return @{ ExitCode = $p.ExitCode; Stdout = $stdout; Stderr = $stderr }
}

Write-Info "Running aws-cli create-bucket (primary)..."
$argsList = @('--rm') + $envArgs + @('amazon/aws-cli') + $createArgs
$joinArgs = $argsList | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }
$res = Run-DockerCapture($joinArgs)
if ($res.ExitCode -ne 0) {
    if ($res.Stdout -match 'BucketAlreadyOwnedByYou' -or $res.Stderr -match 'BucketAlreadyOwnedByYou') {
        Write-Info "Bucket already owned by you; continuing."
    } else {
        Write-Info "Primary attempt failed; retrying with host-gateway add-host mapping (some Docker setups require this)..."
        $argsList2 = @('--rm','--add-host=host.docker.internal:host-gateway') + $envArgs + @('amazon/aws-cli') + $createArgs
        $joinArgs2 = $argsList2 | ForEach-Object { if ($_ -match '\s') { '"' + $_ + '"' } else { $_ } }
        $res2 = Run-DockerCapture($joinArgs2)
        if ($res2.ExitCode -ne 0) {
            if ($res2.Stdout -match 'BucketAlreadyOwnedByYou' -or $res2.Stderr -match 'BucketAlreadyOwnedByYou') {
                Write-Info "Bucket already owned by you; continuing."
            } else {
                Write-Err "Failed to create bucket using amazon/aws-cli (both attempts).";
                Write-Err $res2.Stdout
                Write-Err $res2.Stderr
                exit 6
            }
        }
    }
} else {
    Write-Info "Bucket created successfully.";
}

# Run PHPUnit integration tests
Write-Info "Running PHPUnit integration tests..."
$phpunitCmd = 'php vendor\\bin\\phpunit --configuration=phpunit.xml --group integration'
Write-Host "Executing: $phpunitCmd"
Invoke-Expression $phpunitCmd
exit $LASTEXITCODE
