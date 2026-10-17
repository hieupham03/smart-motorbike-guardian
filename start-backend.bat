@echo off
cd /d "%~dp0deployment"
if not exist ".env" (
  echo Copy deployment\.env.example to deployment\.env and configure secrets first.
  exit /b 1
)
docker compose up --build -d backend
if errorlevel 1 exit /b 1
echo Backend: http://localhost:8080/api/health
