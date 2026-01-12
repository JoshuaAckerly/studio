#!/usr/bin/env pwsh

# Check for deprecated @test docblocks in PHP files

$matches = git grep -n --no-color "/\*\* @test" -- "*.php" 2>$null

if (-not $matches) {
    Write-Host "No deprecated @test docblocks found."
    exit 0
}

Write-Host "Found deprecated @test docblocks:"
foreach ($line in $matches) {
    $parts = $line -split ':', 3
    $file = $parts[0]
    $lineNum = $parts[1]
    Write-Host "$file -> $lineNum"
}
exit 2