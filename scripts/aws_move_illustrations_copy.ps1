# Copy-only: copy objects from images/Illustrations/ -> images/illustrations/ (do not delete originals)
param(
  [string]$Bucket = 'graveyardjokes-cdn',
  [string]$Region = $env:AWS_DEFAULT_REGION,
  [string]$Source = 'images/Illustrations/',
  [string]$TargetPrefix = 'images/illustrations/',
  [switch]$Help
)

if ($Help) {
  Write-Output "Usage: .\scripts\aws_move_illustrations_copy.ps1 [-Bucket <name>] [-Region <region>] [-Source <prefix>] [-TargetPrefix <prefix>] [--Help]"
  exit 0
}

$bucket = $Bucket
$region = $Region
if (-not $region) { $region = 'us-east-2' }
$src = $Source
$dstPrefix = $TargetPrefix
Write-Output "Starting copy-only run: $src -> $dstPrefix"
function Test-S3BucketValidity($name) {
  if (-not $name) { return $false }
  if ($name.Length -lt 3 -or $name.Length -gt 63) { return $false }
  if ($name -match '[A-Z]') { return $false }
  if ($name -match '\.\.') { return $false }
  if ($name -match '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$') { return $false }
  return $true
}

function Convert-NormalizePrefix($p) {
  $p = $p.Trim()
  $p = $p.TrimStart('/')
  if ($p -eq '') { return '' }
  if (-not $p.EndsWith('/')) { $p = $p + '/' }
  return $p
}

$dstPrefix = Convert-NormalizePrefix($dstPrefix)
if ($dstPrefix -eq '') { Write-Error "ERROR: target prefix must not be empty"; exit 1 }
if (-not (Test-S3BucketValidity $bucket)) { Write-Error "ERROR: bucket name '$bucket' appears invalid"; exit 2 }
$keysJson = aws s3api list-objects-v2 --bucket $bucket --prefix $src --region $region --output json --query "Contents[].Key"
$keys = @()
if ($keysJson) { $keys = $keysJson | ConvertFrom-Json }
Write-Output ("Found {0} keys under {1}" -f $keys.Count, $src)
$copied = @()
$skipped = @()
$failures = @()
foreach ($k in $keys) {
  $relative = $k.Substring($src.Length)
  $target = $dstPrefix + $relative

  # skip if target exists
  aws s3api head-object --bucket $bucket --key $target --region $region 2>$null
  if ($LASTEXITCODE -eq 0) {
  Write-Output ("Skipping (target exists): {0}" -f $target)
    $skipped += @{ source = $k; target = $target; reason = "target_exists" }
    continue
  }

  Write-Output ("Copying {0} -> {1}" -f $k, $target)
  $cpOut = aws s3 cp "s3://$bucket/$k" "s3://$bucket/$target" --region $region 2>&1
  if ($LASTEXITCODE -ne 0) {
  Write-Output ("FAILED to copy {0}: {1}" -f $k, $cpOut)
    $failures += @{ source = $k; target = $target; error = $cpOut }
  } else {
  Write-Output ("Copied: {0}" -f $k)
    $copied += @{ source = $k; target = $target }
  }
}
$report = @{ timestamp = (Get-Date).ToString('o'); bucket = $bucket; region = $region; source = $src; targetPrefix = $dstPrefix; totalFound = $keys.Count; copied = $copied; skipped = $skipped; failures = $failures }
$reportPath = Join-Path -Path (Get-Location) -ChildPath ("aws-move-illustrations-copy-$(Get-Date -Format yyyyMMddHHmmss).json")
$report | ConvertTo-Json -Depth 8 | Out-File -FilePath $reportPath -Encoding utf8
Write-Output ("Copy run complete. Copied: {0}, Skipped: {1}, Failures: {2}. Report: {3}" -f $copied.Count, $skipped.Count, $failures.Count, $reportPath)
