Describe 'run_pss_analyzer.ps1' {
    $scriptPath = Join-Path $PSScriptRoot '..\..\scripts\run_pss_analyzer.ps1'

    Context 'when PSScriptAnalyzer is present' {
        It 'runs analyzer and returns 0 when no warnings' -Skip:$false {
            if (-not (Get-Command Invoke-ScriptAnalyzer -ErrorAction SilentlyContinue)) {
                Skip 'PSScriptAnalyzer not installed in this environment'
            }

            # Create a small temp script to analyze
            $tmpDir = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ([guid]::NewGuid().ToString()))
            Push-Location $tmpDir.FullName
            New-Item -ItemType File -Path 'test.ps1' -Value "Write-Output 'ok'" -Force | Out-Null

            # Copy the analyzer script next to a fake script list
            Copy-Item -Path $scriptPath -Destination (Join-Path $tmpDir.FullName 'run_pss_analyzer.ps1')

            $p = Start-Process -FilePath pwsh -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','run_pss_analyzer.ps1' -NoNewWindow -Wait -PassThru
            $p.ExitCode | Should Be 0

            Pop-Location
            Remove-Item -Recurse -Force $tmpDir
        }
    }
}
