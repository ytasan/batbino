@echo off
setlocal
set "ROOT=%~dp0"

start "Calendar Backend" cmd /k pushd "%ROOT%backend" ^&^& npm run dev

REM Give the API a moment before Vite tries to proxy / call it
timeout /t 2 /nobreak >nul

start "Calendar Frontend" cmd /k pushd "%ROOT%frontend" ^&^& npm run dev

endlocal
