param(
  [string]$Bucket = 'graveyardjokes-cdn',
  [string]$Region = $env:AWS_DEFAULT_REGION,
  [string]$Source = 'images/Illustrations/',
  [string]$TargetPrefix = 'images/illustrations/',
  [switch]$Help
)

if ($Help) {
  Write-Output "Usage: .\scripts\aws_move_illustrations_dryrun.ps1 [-Bucket <name>] [-Region <region>] [-Source <prefix>] [-TargetPrefix <prefix>] [--Help]"
  Write-Output "  -Bucket: S3 bucket name (default: graveyardjokes-cdn)"
  Write-Output "  -Region: AWS region (default: env AWS_DEFAULT_REGION or us-east-2)"
  Write-Output "  -Source: source prefix to scan (default: images/Illustrations/)"
  Write-Output "  -TargetPrefix: target prefix to map to (default: images/illustrations/)"
  exit 0
}

$bucket = $Bucket
$region = $Region
if (-not $region) { $region = 'us-east-2' }
$src = $Source
$dstPrefix = $TargetPrefix
Write-Output "Listing objects under $src ..."

# Validation helpers
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
$toCopy = @()
$skipped = @()
foreach ($k in $keys) {
  $relative = $k.Substring($src.Length)
  $target = $dstPrefix + $relative
  aws s3api head-object --bucket $bucket --key $target --region $region 2>$null
  if ($LASTEXITCODE -eq 0) {
    $skipped += $k
  } else {
    $toCopy += @{ source = $k; target = $target }
  }
}
$report = @{ timestamp = (Get-Date).ToString('o'); bucket = $bucket; region = $region; source = $src; targetPrefix = $dstPrefix; totalFound = $keys.Count; planned = $toCopy.Count; skipped = $skipped.Count; samples = $toCopy | Select-Object -First 200 }
$reportPath = Join-Path -Path (Get-Location) -ChildPath ("aws-move-illustrations-dryrun-$(Get-Date -Format yyyyMMddHHmmss).json")
$report | ConvertTo-Json -Depth 6 | Out-File -FilePath $reportPath -Encoding utf8
Write-Output ("Dry-run complete. Planned: {0}, Skipped: {1}. Report: {2}" -f $report.planned, $report.skipped, $reportPath)
if ($report.planned -gt 0) {
  Write-Output "Sample planned copies (up to 200):"
  $report.samples | ForEach-Object { Write-Output ("Would copy s3://$bucket/" + $_.source + " -> s3://$bucket/" + $_.target) }
} else {
  Write-Output "No objects planned for copy."
}
