#!/usr/bin/env pwsh
# Pre-commit hook template (PowerShell) to prevent committing legacy images/Illustrations in application code
$repoRoot = git rev-parse --show-toplevel

# Run legacy prefix check
& "$repoRoot\scripts\check_legacy_prefix.ps1"
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
    Write-Error 'Commit blocked: legacy images/Illustrations occurrences found in application code. See output above.'
    exit $exitCode
}

# Run PHPUnit docblock metadata checker on staged files
& "$repoRoot\scripts\check_phpunit_docblock_metadata.ps1" --staged
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
    Write-Error 'Commit blocked: deprecated PHPUnit docblock metadata found in staged files. See output above.'
    exit $exitCode
}

exit 0
