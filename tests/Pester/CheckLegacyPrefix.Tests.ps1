Describe 'check_legacy_prefix.ps1' {
    $scriptPath = Join-Path $PSScriptRoot '..\..\scripts\check_legacy_prefix.ps1'

    It 'returns success when no matches exist' {
        $tmp = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ([guid]::NewGuid().ToString()))
        Push-Location $tmp.FullName
        git init -q
    New-Item -ItemType Directory -Path 'app' -Force | Out-Null
    New-Item -ItemType File -Path 'app\ok.php' -Value "<?php echo 'ok'; ?>" | Out-Null
        git add -A; git commit -m 'init' -q

        $out = New-TemporaryFile
        $err = New-TemporaryFile
        $p = Start-Process -FilePath pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',$scriptPath -NoNewWindow -RedirectStandardOutput $out -RedirectStandardError $err -Wait -PassThru

    $p.ExitCode | Should Be 0
    $content = Get-Content $out | Out-String
    $content | Should Match 'No disallowed occurrences found|No matches found'

        Pop-Location
        Remove-Item -Recurse -Force $tmp
    }

    It 'returns failure when disallowed occurrences exist' {
        $tmp = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ([guid]::NewGuid().ToString()))
        Push-Location $tmp.FullName
        git init -q
    New-Item -ItemType Directory -Path 'app' -Force | Out-Null
    New-Item -ItemType File -Path 'app\bad.php' -Value "images/Illustrations" | Out-Null
        git add -A; git commit -m 'init' -q

        $out = New-TemporaryFile
        $err = New-TemporaryFile
        $p = Start-Process -FilePath pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',$scriptPath -NoNewWindow -RedirectStandardOutput $out -RedirectStandardError $err -Wait -PassThru

    $p.ExitCode | Should Be 1
    Get-Content $out | Out-String | Should Match 'Found disallowed occurrences'

        Pop-Location
        Remove-Item -Recurse -Force $tmp
    }

    It 'ignores allowed paths like scripts/' {
        $tmp = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ([guid]::NewGuid().ToString()))
        Push-Location $tmp.FullName
        git init -q
    New-Item -ItemType Directory -Path 'scripts' -Force | Out-Null
    New-Item -ItemType File -Path 'scripts\migrate.php' -Value "images/Illustrations" | Out-Null
        git add -A; git commit -m 'init' -q

        $out = New-TemporaryFile
        $err = New-TemporaryFile
        $p = Start-Process -FilePath pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',$scriptPath -NoNewWindow -RedirectStandardOutput $out -RedirectStandardError $err -Wait -PassThru

    $p.ExitCode | Should Be 0
    Get-Content $out | Out-String | Should Match 'No disallowed occurrences found'

        Pop-Location
        Remove-Item -Recurse -Force $tmp
    }
}
