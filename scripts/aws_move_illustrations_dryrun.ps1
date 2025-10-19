$bucket='graveyardjokes-cdn'
$region='us-east-2'
$src='images/Illustrations/'
$dstPrefix='images/illustrations/'
Write-Host "Listing objects under $src ..."
$keysJson = aws s3api list-objects-v2 --bucket $bucket --prefix $src --region $region --output json --query "Contents[].Key"
$keys = @()
if ($keysJson) { $keys = $keysJson | ConvertFrom-Json }
Write-Host ("Found {0} keys under {1}" -f $keys.Count, $src)
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
Write-Host ("Dry-run complete. Planned: {0}, Skipped: {1}. Report: {2}" -f $report.planned, $report.skipped, $reportPath)
if ($report.planned -gt 0) {
  Write-Host "Sample planned copies (up to 200):"
  $report.samples | ForEach-Object { Write-Host ("Would copy s3://$bucket/" + $_.source + " -> s3://$bucket/" + $_.target) }
} else {
  Write-Host "No objects planned for copy."
}
