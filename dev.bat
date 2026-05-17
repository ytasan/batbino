@echo off
setlocal
set "ROOT=%~dp0"

cd /d "%ROOT%"
echo Starting PostgreSQL (Docker)...
docker compose up -d
if errorlevel 1 (
  echo.
  echo [ERROR] Docker Compose failed. Open Docker Desktop and wait until it is running, then run this script again.
  echo If you use your own PostgreSQL, set DATABASE_URL in backend\.env ^(e.g. localhost:5433 per docker-compose^).
  pause
  exit /b 1
)

echo Waiting for the database to accept connections...
timeout /t 4 /nobreak >nul

REM Use START /B so npm runs in THIS terminal (integrated terminal stays in Cursor instead of opening new cmd windows).
start "" /b /d "%ROOT%backend" npm run dev

REM Give the API a moment before Vite tries to proxy / call it
timeout /t 2 /nobreak >nul

start "" /b /d "%ROOT%frontend" npm run dev

echo.
echo Backend and frontend are attached to this terminal. Close this terminal tab when you are finished.

endlocal
