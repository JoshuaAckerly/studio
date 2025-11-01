<#
PowerShell helper: deploy_spine_assets.ps1
Copies the new Spine frame assets from the local repo `public/games/noteleks` to a remote forge host.
Features:
- Prompts for remote user/host/path and optional private key
- Attempts rsync via WSL if available; otherwise falls back to scp
- Creates remote directories, copies `spine/characters` and `sprites`
- Verifies remote files and optionally sets permissions

Usage: run from the repo root or just run the script; it resolves the repo root relative to this script.
#>

param(
    [string]$RemoteUser,
    [string]$RemoteHost,
    [string]$RemotePath,
    [string]$KeyPath = "$env:USERPROFILE\.ssh\id_rsa",
    [switch]$UseRsyncIfAvailable
)

function PromptIfEmpty([string]$var, [string]$prompt) {
    if ([string]::IsNullOrWhiteSpace($var)) {
        return Read-Host $prompt
    }
    return $var
}

# Resolve script and repo paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$localBase = Join-Path $repoRoot "public\games\noteleks"
$localChars = Join-Path $localBase "spine\characters"
$localSprites = Join-Path $localBase "sprites"

$RemoteUser = PromptIfEmpty $RemoteUser "Remote user (e.g. forge):"
$RemoteHost = PromptIfEmpty $RemoteHost "Remote host (e.g. forge.graveyardjokes.com):"
$RemotePath = PromptIfEmpty $RemotePath "Remote absolute path to public/games/noteleks (e.g. /var/www/site/public/games/noteleks):"

Write-Host "Local base: $localBase"
Write-Host "Characters dir: $localChars"
Write-Host "Sprites dir: $localSprites"

if (-not (Test-Path $localChars)) {
    Write-Error "Local characters path not found: $localChars"
    exit 1
}
if (-not (Test-Path $localSprites)) {
    Write-Error "Local sprites path not found: $localSprites"
    exit 1
}

# Ask about ssh key and start ssh-agent
$KeyPath = PromptIfEmpty $KeyPath "Private key path (press Enter to use $env:USERPROFILE\\.ssh\\id_rsa):"
if (-not (Test-Path $KeyPath)) {
    Write-Warning "Key not found at $KeyPath. You can still use password auth if allowed by the server."
} else {
    try {
        # Start ssh-agent service (no-op if already running)
        if ((Get-Service -Name ssh-agent -ErrorAction SilentlyContinue) -eq $null) {
            Write-Verbose "ssh-agent service not installed or not available"
        } else {
            Start-Service ssh-agent -ErrorAction SilentlyContinue
            # Add key (will prompt for passphrase once)
            & ssh-add.exe $KeyPath
        }
    } catch {
        Write-Warning "Failed to add key to ssh-agent: $_"
    }
}

# Test SSH connectivity
$sshCmd = "ssh"
$identityArg = ""
if (Test-Path $KeyPath) { $identityArg = "-i `"$KeyPath`"" }
$testConn = & $sshCmd $identityArg -o BatchMode=yes $RemoteUser@$RemoteHost echo 'SSH_OK' 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warning "SSH test failed. Output:\n$testConn"
    Write-Host "You may need to use password auth or add your public key to the server. Run 'ssh -v $RemoteUser@$RemoteHost' to debug." -ForegroundColor Yellow
    $proceed = Read-Host "Proceed with copy anyway and enter password interactively? (y/N)"
    if ($proceed -ne 'y') { Write-Host "Aborting."; exit 1 }
}

# Create remote directories
$remoteCharsDir = Join-Path $RemotePath "spine/characters" -Replace '\\','/'
$remoteSpritesDir = Join-Path $RemotePath "sprites" -Replace '\\','/'
Write-Host "Creating remote directories: $remoteCharsDir and $remoteSpritesDir"
& ssh $identityArg $RemoteUser@$RemoteHost "mkdir -p '$remoteCharsDir' '$remoteSpritesDir'"

# Copy using rsync via WSL if requested and available
$useRsync = $false
if ($UseRsyncIfAvailable) { $useRsync = $true }
# Detect WSL + rsync
$wslExists = $false
try { $wslExists = (Get-Command wsl.exe -ErrorAction SilentlyContinue) -ne $null } catch { $wslExists = $false }
$wslRsync = $false
if ($wslExists) {
    try {
        $check = wsl.exe which rsync 2>$null
        if ($check) { $wslRsync = $true }
    } catch { $wslRsync = $false }
}

if ($useRsync -and $wslExists -and $wslRsync) {
    Write-Host "Using rsync inside WSL (recommended). Converting Windows paths to WSL paths..."
    $wslLocalChars = (& wsl.exe wslpath -a "$(Resolve-Path $localChars)") -replace "`n",""
    $wslLocalSprites = (& wsl.exe wslpath -a "$(Resolve-Path $localSprites)") -replace "`n",""
    $wslRemote = "$RemoteUser@$RemoteHost:`"$RemotePath`""

    Write-Host "Rsync characters from $wslLocalChars -> $wslRemote/spine/characters"
    & wsl.exe rsync -avz --delete --progress "$wslLocalChars/" "$RemoteUser@$RemoteHost:$remoteCharsDir/"

    Write-Host "Rsync sprites from $wslLocalSprites -> $wslRemote/sprites"
    & wsl.exe rsync -avz --delete --progress "$wslLocalSprites/" "$RemoteUser@$RemoteHost:$remoteSpritesDir/"
} else {
    Write-Host "Using scp fallback. This will prompt for password if key auth fails or key not provided."
    $scp = "scp"
    $identityArgScp = ""
    if (Test-Path $KeyPath) { $identityArgScp = "-i `"$KeyPath`"" }

    # Copy characters
    Write-Host "Copying characters..."
    & $scp $identityArgScp -r "$localChars" "$RemoteUser@$RemoteHost:$remoteCharsDir"
    if ($LASTEXITCODE -ne 0) { Write-Warning "scp characters failed (exit $LASTEXITCODE)" }

    # Copy sprites
    Write-Host "Copying sprites..."
    & $scp $identityArgScp -r "$localSprites" "$RemoteUser@$RemoteHost:$remoteSpritesDir"
    if ($LASTEXITCODE -ne 0) { Write-Warning "scp sprites failed (exit $LASTEXITCODE)" }
}

# Verify remote files
Write-Host "Remote characters listing:"
& ssh $identityArg $RemoteUser@$RemoteHost "ls -l '$remoteCharsDir' | tail -n 40"
Write-Host "Remote sprites listing:"
& ssh $identityArg $RemoteUser@$RemoteHost "ls -l '$remoteSpritesDir' | tail -n 40"

$setPerm = Read-Host "Set web-readable permissions (chown/chmod) on remote files? (y/N)"
if ($setPerm -eq 'y') {
    $webUser = Read-Host "Enter webserver user (default: www-data)"
    if ([string]::IsNullOrWhiteSpace($webUser)) { $webUser = 'www-data' }
    Write-Host "Setting ownership to $webUser and chmod 755"
    & ssh $identityArg $RemoteUser@$RemoteHost "chown -R $webUser:$webUser '$RemotePath' && chmod -R 755 '$RemotePath'"
}

Write-Host "Done."