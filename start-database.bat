@echo off
echo ========================================================
echo   KHOI DONG POSTGRESQL & PGADMIN VOI DOCKER COMPOSE
echo ========================================================
cd /d "%~dp0database"
docker compose up -d

echo.
echo [OK] PostgreSQL dang chay tai port: 5433
echo      - Host: localhost:5433
echo      - Database: guardian_db
echo      - Username: guardian_user
echo      - Password: GuardianPassword@2026
echo.
echo [OK] pgAdmin 4 Web GUI: http://localhost:5050
echo      - Email: admin@guardian.iot
echo      - Password: AdminPassword@2026
echo ========================================================
pause

