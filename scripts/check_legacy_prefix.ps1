#!/usr/bin/env pwsh

# Check for legacy prefix 'images/Illustrations' in application code
# Excludes allowed paths: scripts/, README files, etc.

$matches = git grep -n --no-color "images/Illustrations" 2>$null

if (-not $matches) {
    Write-Host "No disallowed occurrences found."
    exit 0
}

$disallowed = @()
foreach ($line in $matches) {
    $file = ($line -split ':')[0]
    $file = $file -replace '^./', ''

    # Allowed/ignored paths
    if ($file -match '^scripts/' -or
        $file -match '^README_MIGRATION\.md$' -or
        $file -match '^README_DEBUG\.md$' -or
        $file -match '^aws-move-illustrations-.*\.json$' -or
        $file -match '^public/build/' -or
        $file -match '^vendor/' -or
        $file -match '^storage/' -or
        $file -match '^node_modules/' -or
        $file -match '^\.githooks(/|$)' -or
        $file -match '^\.githooks-template(/|$)' -or
        $file -match '^\.github/workflows/' -or
        $file -match '^tests/') {
        continue
    }

    $disallowed += $line
}

if ($disallowed.Count -gt 0) {
    Write-Host "Found disallowed occurrences of 'images/Illustrations':"
    $disallowed | ForEach-Object { Write-Host $_ }
    exit 1
} else {
    Write-Host "No disallowed occurrences found."
    exit 0
}