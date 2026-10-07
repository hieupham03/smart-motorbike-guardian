@echo off
echo ========================================================
echo   KHOI DONG SPRING BOOT BACKEND (PORT 8088)
echo ========================================================
echo [INFO] Dang khoi chay Backend ket noi PostgreSQL va MQTT Broker (broker.emqx.io)...
docker rm -f guardian-backend >nul 2>&1
docker run --rm -p 8088:8080 --name guardian-backend --network database_guardian-db-net -e SPRING_DATASOURCE_URL=jdbc:postgresql://guardian-postgres-db:5432/guardian_db -e MQTT_BROKER_URL=tcp://broker.emqx.io:1883 -e MQTT_USERNAME= -e MQTT_PASSWORD= guardian-backend
pause
