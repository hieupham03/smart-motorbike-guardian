# Firmware verification

Checked 2026-10-08. The UART test uses a tiny Arduino/HardwareSerial host stub; it tests real uart_protocol.h, not an independent reimplementation. It does not test GPIO, RTOS scheduling, MQTT delivery or GPS RF reception.

Additional regression (2026-10-18): first Hall pulse and first pulse after stop have unknown speed; both speed and IMU validity expire with the original sample. Re-test the breadboard after uploading.

```powershell
g++ -std=c++11 -Ifirmware/node_b_sensor tests/firmware/wheel_speed_test.cpp -o build/wheel_speed_test.exe
& ./build/wheel_speed_test.exe
```

From repository root in PowerShell:

```powershell
New-Item -ItemType Directory -Path build -Force | Out-Null
g++ -std=c++11 -Itests/firmware/stubs -Ifirmware/node_a_gateway tests/firmware/uart_protocol_test.cpp -o build/uart_protocol_test.exe
& ./build/uart_protocol_test.exe
```

Install ESP32 core 2.0.17, TinyGPSPlus 1.0.3, PubSubClient and ArduinoJson (verified with 7.4.3). Ensure Node A has local network_config.h copied from network_config.example.h. Add --libraries with your Arduino sketchbook library directory if CLI does not find installed libraries.

```powershell
arduino-cli compile --fqbn esp32:esp32:esp32 --build-path build/node_a firmware/node_a_gateway
arduino-cli compile --fqbn 'esp32:esp32:esp32s3:FlashSize=16M,PSRAM=opi,CDCOnBoot=cdc' --build-path build/node_b firmware/node_b_sensor
arduino-cli compile --fqbn 'esp32:esp32:esp32s3:FlashSize=16M,PSRAM=opi,CDCOnBoot=cdc' --build-path build/gps_bringup firmware/gps_bringup
```

All three builds and UART tests passed. See docs/HUONG-DAN-HARDWARE-FIRMWARE-V2-GPS.md for exact binary/static RAM sizes and manual hardware tests. Firmware mirror hashes match. No hardware upload performed.
