@echo off
echo Starting Studio Development Servers...
echo.
echo Backend: http://127.0.0.1:8004
echo Frontend: http://127.0.0.1:5177
echo.

start "Studio Backend" cmd /k "php artisan serve --port=8004"
timeout /t 2 /nobreak >nul
start "Studio Frontend" cmd /k "npm run dev"

echo Development servers started!
echo Press any key to exit...
pause >nul