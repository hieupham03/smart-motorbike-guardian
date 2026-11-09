@echo off
cd /d "%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-mobile-demo.ps1" -Classroom -Web %*
if errorlevel 1 pause
