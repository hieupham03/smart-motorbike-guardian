@echo off
cd /d "%~dp0deployment"
if not exist ".env" (
  echo Copy deployment\.env.example to deployment\.env and configure secrets first.
  exit /b 1
)
docker compose up --build -d frontend
if errorlevel 1 exit /b 1
echo Web: http://localhost:3000
