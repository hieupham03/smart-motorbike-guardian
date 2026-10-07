@echo off
echo ========================================================
echo   KHOI DONG REACTJS FRONTEND WEB (PORT 5173)
echo ========================================================
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo [INFO] Dang cai dat thu vien npm cho lan dau chay...
    call npm install
)
echo.
echo [OK] Dang khoi dong Web Dashboard tai: http://localhost:5173
npm run dev
pause
