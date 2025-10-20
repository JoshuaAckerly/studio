# Runs PSScriptAnalyzer on the migration scripts and exits with 0 if no Warning/Error, 1 otherwise
$files = @('.\aws_move_illustrations_dryrun.ps1', '.\aws_move_illustrations_copy.ps1') | ForEach-Object { Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Path) -ChildPath $_ }
$all = @()
foreach ($f in $files) {
    if (-not (Test-Path $f)) { Write-Host "Skipping missing file: $f"; continue }
    Write-Host "Analyzing: $f"
    $all += Invoke-ScriptAnalyzer -Path $f
}
$warn = $all | Where-Object { $_.Severity -in @('Warning','Error') }
if ($warn.Count -gt 0) {
    Write-Host "Found warnings/errors:" -ForegroundColor Yellow
    $warn | Select-Object Severity, RuleName, Line, Message, ScriptName | Format-Table -AutoSize
    exit 1
} else {
    Write-Host "No PSScriptAnalyzer warnings/errors found" -ForegroundColor Green
    exit 0
}