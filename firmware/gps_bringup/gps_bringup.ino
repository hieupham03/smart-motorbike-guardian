#include <HardwareSerial.h>
#include <TinyGPS++.h>
HardwareSerial GpsSerial(2);
TinyGPSPlus gps;
void setup() {
    Serial.begin(115200);
    GpsSerial.begin(9600,SERIAL_8N1,6,7); // GPS TX -> GPIO6; GPS RX left disconnected
}
void loop() {
    while(GpsSerial.available()) {
        char c=GpsSerial.read(); Serial.write(c); gps.encode(c);
    }
    static uint32_t lastLog=0;
    if(millis()-lastLog>=2000) {
        lastLog=millis();
        if(gps.location.isValid()&&gps.location.age()<=5000)
            Serial.printf("\n[FIX] lat=%.6f lon=%.6f age=%lu\n",gps.location.lat(),gps.location.lng(),(unsigned long)gps.location.age());
        else Serial.printf("\n[NO_FIX/STALE] chars=%lu checksum_errors=%lu\n",(unsigned long)gps.charsProcessed(),(unsigned long)gps.failedChecksum());
    }
    delay(1);
}
