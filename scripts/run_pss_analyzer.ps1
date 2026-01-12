#!/usr/bin/env pwsh

# Run PSScriptAnalyzer on PowerShell files

if (-not (Get-Module -Name PSScriptAnalyzer -ListAvailable)) {
    Write-Host "PSScriptAnalyzer not installed."
    exit 1
}

$results = Invoke-ScriptAnalyzer -Path . -Recurse -IncludeRule PS* -Severity Warning,Error

if ($results) {
    Write-Host "PSScriptAnalyzer found issues:"
    $results | ForEach-Object { Write-Host "$($_.ScriptPath):$($_.Line) $($_.RuleName) - $($_.Message)" }
    exit 1
} else {
    Write-Host "No PSScriptAnalyzer warnings found."
    exit 0
}