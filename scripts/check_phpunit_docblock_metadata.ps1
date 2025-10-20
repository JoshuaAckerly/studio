#!/usr/bin/env pwsh
<#
Checks for deprecated PHPUnit docblock metadata (e.g. @test, @group, @covers, @small, @medium, @large, @depends) in PHP files.
This is intended to be run from git hooks or CI. It exits with non-zero when occurrences are found.

Usage:
  .\scripts\check_phpunit_docblock_metadata.ps1 [--staged]

--staged : only scan staged files (recommended for pre-commit)
#>

param(
    [switch]$Staged
)

Set-StrictMode -Version Latest

$repoRoot = (git rev-parse --show-toplevel) 2>$null
if (-not $repoRoot) {
    $repoRoot = Get-Location
}

# Patterns to search for (docblock annotations that PHPUnit will stop supporting in doc-comments)
$patterns = @(
    '@test',
    '@group',
    '@covers',
    '@small',
    '@medium',
    '@large',
    '@depends'
)

function Get-PhpFilesToScan {
    param([switch]$Staged)

    if ($Staged) {
        # Use git diff --cached to list staged files
        $staged = git diff --cached --name-only --diff-filter=ACM
        return ($staged -split "\r?\n" | Where-Object { $_ -match '\.php$' }) -join "`n"
    }

    # Only scan the repository's source directories to avoid vendor files
    $scanDirs = @('tests','app','config','scripts','routes','resources','bootstrap','database')
    $files = @()
    foreach ($d in $scanDirs) {
        $path = Join-Path $repoRoot $d
        if (Test-Path $path) {
            $found = Get-ChildItem -Path $path -Recurse -File -Include *.php -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName }
            if ($found) { $files += $found }
        }
    }
    return ($files | Sort-Object -Unique) -join "`n"
}

$filesToScan = Get-PhpFilesToScan -Staged:$Staged
if (-not $filesToScan) {
    Write-Output "No PHP files to scan."
    exit 0
}

$offenders = @()

foreach ($file in ($filesToScan -split "`n")) {
    if (-not (Test-Path $file)) { continue }
    $content = Get-Content -Raw -LiteralPath $file -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    foreach ($p in $patterns) {
        if ($content -match [regex]::Escape($p)) {
            $offenders += [PSCustomObject]@{ File = $file; Pattern = $p }
            break
        }
    }
}

if ($offenders.Count -gt 0) {
    Write-Output "Deprecated PHPUnit docblock metadata occurrences found:\n"
    $offenders | ForEach-Object { Write-Output "$($_.Pattern) -> $($_.File)" }
    Write-Output "\nPlease convert these docblock annotations to PHPUnit attributes (e.g. #[\PHPUnit\Framework\Attributes\Test] or #[\PHPUnit\Framework\Attributes\Group('name')]) or rename test methods to test* methods."
    exit 2
}

Write-Output "No deprecated PHPUnit docblock metadata found."
exit 0
