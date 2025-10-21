# scripts/run_integration_local.ps1
$Env:RUN_INTEGRATION = '1'
Write-Host "RUN_INTEGRATION=$Env:RUN_INTEGRATION"
php "vendor/phpunit/phpunit/phpunit" --group integration --colors=always
