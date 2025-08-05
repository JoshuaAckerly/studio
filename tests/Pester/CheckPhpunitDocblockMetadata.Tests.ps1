Describe 'check_phpunit_docblock_metadata.ps1' {
    $scriptPath = Join-Path $PSScriptRoot '..\..\scripts\check_phpunit_docblock_metadata.ps1'

    It 'returns success when no php files contain deprecated metadata' {
        $tmp = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ([guid]::NewGuid().ToString()))
        Push-Location $tmp.FullName
        git init -q
    New-Item -ItemType Directory -Path 'tests' -Force | Out-Null
    New-Item -ItemType File -Path 'tests\ExampleTest.php' -Value "<?php`n<?php`nclass Foo {}" | Out-Null
        git add -A; git commit -m 'init' -q

        $p = Start-Process -FilePath pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',$scriptPath -NoNewWindow -Wait -PassThru
    $p.ExitCode | Should Be 0

        Pop-Location
        Remove-Item -Recurse -Force $tmp
    }

    It 'detects deprecated @test docblocks in php files' {
        $tmp = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ([guid]::NewGuid().ToString()))
        Push-Location $tmp.FullName
        git init -q
    New-Item -ItemType Directory -Path 'tests' -Force | Out-Null
    New-Item -ItemType File -Path 'tests\FooTest.php' -Value "<?php`n/** @test */`nfunction it_checks(){}" | Out-Null
        git add -A; git commit -m 'init' -q

        $out = New-TemporaryFile
        $p = Start-Process -FilePath pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',$scriptPath -NoNewWindow -RedirectStandardOutput $out -Wait -PassThru
    $p.ExitCode | Should Be 2
    Get-Content $out | Out-String | Should Match '@test ->'

        Pop-Location
        Remove-Item -Recurse -Force $tmp
    }
}
