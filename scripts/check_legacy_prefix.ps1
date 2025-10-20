# Check for images/Illustrations occurrences outside allowed paths
 $grepMatches = git grep -n --no-color 'images/Illustrations' 2>$null
if (-not $grepMatches) { Write-Host 'No matches found'; exit 0 }
$disallowed = @()
$grepMatches -split "\r?\n" | ForEach-Object {
    if ($_ -ne '') {
        $file = ($_ -split ':',2)[0]
        if (-not (
            $file -match '^scripts/' -or
            $file -match '^README_MIGRATION.md$' -or
            $file -match '^README_DEBUG.md$' -or
            $file -match '^aws-move-illustrations-.*\.json$' -or
            $file -match '^public/build/' -or
            $file -match '^vendor/' -or
            $file -match '^storage/' -or
            $file -match '^node_modules/' -or
            $file -match '^\.githooks/' -or
            $file -match '^\.githooks-template/'
        )) {
            $disallowed += $_
        }
    }
}
if ($disallowed.Count -gt 0) {
    Write-Host 'Found disallowed occurrences:'
    $disallowed | ForEach-Object { Write-Host $_ }
    exit 1
} else {
    Write-Host 'No disallowed occurrences found'
    exit 0
}