# Copy-only: copy objects from images/Illustrations/ -> images/illustrations/ (do not delete originals)
$bucket='graveyardjokes-cdn'
$region='us-east-2'
$src='images/Illustrations/'
$dstPrefix='images/illustrations/'
Write-Host "Starting copy-only run: $src -> $dstPrefix"
$keysJson = aws s3api list-objects-v2 --bucket $bucket --prefix $src --region $region --output json --query "Contents[].Key"
$keys = @()
if ($keysJson) { $keys = $keysJson | ConvertFrom-Json }
Write-Host ("Found {0} keys under {1}" -f $keys.Count, $src)
$copied = @()
$skipped = @()
$failures = @()
foreach ($k in $keys) {
  $relative = $k.Substring($src.Length)
  $target = $dstPrefix + $relative

  # skip if target exists
  aws s3api head-object --bucket $bucket --key $target --region $region 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host ("Skipping (target exists): {0}" -f $target)
    $skipped += @{ source = $k; target = $target; reason = "target_exists" }
    continue
  }

  Write-Host ("Copying {0} -> {1}" -f $k, $target)
  $cpOut = aws s3 cp "s3://$bucket/$k" "s3://$bucket/$target" --region $region 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host ("FAILED to copy {0}: {1}" -f $k, $cpOut)
    $failures += @{ source = $k; target = $target; error = $cpOut }
  } else {
    Write-Host ("Copied: {0}" -f $k)
    $copied += @{ source = $k; target = $target }
  }
}
$report = @{ timestamp = (Get-Date).ToString('o'); bucket = $bucket; region = $region; source = $src; targetPrefix = $dstPrefix; totalFound = $keys.Count; copied = $copied; skipped = $skipped; failures = $failures }
$reportPath = Join-Path -Path (Get-Location) -ChildPath ("aws-move-illustrations-copy-$(Get-Date -Format yyyyMMddHHmmss).json")
$report | ConvertTo-Json -Depth 8 | Out-File -FilePath $reportPath -Encoding utf8
Write-Host ("Copy run complete. Copied: {0}, Skipped: {1}, Failures: {2}. Report: {3}" -f $copied.Count, $skipped.Count, $failures.Count, $reportPath)
