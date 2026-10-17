#include <HardwareSerial.h>
#include <TinyGPS++.h>
#include <stdlib.h>
HardwareSerial GpsSerial(2);
TinyGPSPlus gps;
// Standalone test only; restore full Node B firmware after testing.
TinyGPSCustom gsvPages(gps,"GPGSV",1), gsvPage(gps,"GPGSV",2), gsvCount(gps,"GPGSV",3);
TinyGPSCustom snr1(gps,"GPGSV",7), snr2(gps,"GPGSV",11), snr3(gps,"GPGSV",15), snr4(gps,"GPGSV",19);
TinyGPSCustom quality(gps,"GPGGA",6), rmcStatus(gps,"GPRMC",2);
bool rawNmea=false, receivedByte=false, gsvSeen=false;
uint32_t lastByteAt=0, gsvAt=0;
unsigned expectedPage=0, cyclePages=0, cycleSignals=0, cycleStrongest=0;
unsigned reported=0, signals=0, strongest=0;

void updateGsv() {
    if(!gsvPage.isUpdated()) return;
    unsigned page=atoi(gsvPage.value()), pages=atoi(gsvPages.value());
    if(page==1) {expectedPage=1;cyclePages=pages;cycleSignals=cycleStrongest=0;}
    if(!pages || page!=expectedPage || pages!=cyclePages) {expectedPage=0;return;}
    TinyGPSCustom *fields[]={&snr1,&snr2,&snr3,&snr4};
    for(auto field:fields) {
        // Do not reuse an absent satellite slot from a previous page.
        if(!field->isUpdated()) continue;
        const char *value=field->value();
        unsigned snr=value[0]?atoi(value):0;
        if(snr>0 && snr<=99) {++cycleSignals;if(snr>cycleStrongest) cycleStrongest=snr;}
    }
    ++expectedPage;
    if(page==pages) {
        reported=atoi(gsvCount.value());signals=cycleSignals;strongest=cycleStrongest;
        gsvSeen=true;gsvAt=millis();expectedPage=0;
    }
}

void printSummary() {
    uint32_t now=millis();
    bool uartLive=receivedByte && now-lastByteAt<=3000;
    bool noFix=(quality.isValid() && quality.age()<=5000 && atoi(quality.value())==0) ||
        (rmcStatus.isValid() && rmcStatus.age()<=5000 && rmcStatus.value()[0]!='A');
    bool fix=uartLive && gps.location.isValid() && gps.location.age()<=5000 && !noFix;
    const char *state=!uartLive?"NO_UART":fix?"FIX":noFix?"NO_FIX":gps.location.isValid()?"STALE":"NO_FIX";
    Serial.printf("\n========== GPS %s | uptime %lu s ==========\n",state,(unsigned long)(now/1000));
    Serial.printf("UART RX6 / 9600: %s | bytes=%lu | checksum OK=%lu ERROR=%lu\n",
        uartLive?"DANG NHAN":"KHONG CO BYTE MOI",(unsigned long)gps.charsProcessed(),
        (unsigned long)gps.passedChecksum(),(unsigned long)gps.failedChecksum());
    if(gsvSeen && now-gsvAt<=10000) {
        Serial.printf("GSV: reported=%u | co tin hieu=%u | C/N0 manh nhat=%u dB-Hz\n",reported,signals,strongest);
        Serial.println(signals?"RF: da thay tin hieu ve tinh; chua dong nghia co vi tri."
            :"RF: chua thay C/N0 > 0; reported KHONG phai so ve tinh da bat.");
    } else Serial.println("GSV: chua co chu ky GPGSV day du/moi; chua ket luan RF.");
    if(gps.satellites.isValid() && gps.satellites.age()<=5000)
        Serial.printf("GGA: ve tinh DUNG DINH VI=%lu\n",(unsigned long)gps.satellites.value());
    else Serial.println("GGA: chua co so ve tinh dinh vi moi.");
    if(fix) {
        Serial.printf("VI TRI: lat=%.6f lon=%.6f | age=%lu ms\n",gps.location.lat(),gps.location.lng(),(unsigned long)gps.location.age());
        if(gps.hdop.isValid() && gps.hdop.age()<=5000)
            Serial.printf("HDOP=%.2f (khong phai sai so theo met)\n",gps.hdop.hdop());
    } else {
        Serial.println("VI TRI: chua co fix hien tai hop le; khong dung 0,0 lam vi tri.");
        if(!uartLive) Serial.println("KIEM TRA: GPS TX -> GPIO6, GND, nguon va baud 9600.");
        else if(!gps.passedChecksum()) Serial.println("Co byte nhung chua co NMEA dung checksum; go r de xem raw.");
        else Serial.println("THU: mat gom antenna huong troi, noi thoang, giu nguon lien tuc.");
    }
    Serial.printf("Raw NMEA: %s | go r de bat/tat\n",rawNmea?"ON":"OFF");
}

void setup() {
    Serial.begin(115200);
    delay(1500);
    GpsSerial.begin(9600,SERIAL_8N1,6,7); // GPS TX -> GPIO6; GPS RX left disconnected
    Serial.println("GPS standalone: Serial Monitor 115200. Go r de bat/tat NMEA.");
}
void loop() {
    while(Serial.available()) {char c=Serial.read();if(c=='r'||c=='R') rawNmea=!rawNmea;}
    unsigned budget=512;
    while(budget-- && GpsSerial.available()) {
        char c=GpsSerial.read();receivedByte=true;lastByteAt=millis();
        if(rawNmea) Serial.write(c);
        if(gps.encode(c)) updateGsv(); // Custom values commit after valid checksum.
    }
    static uint32_t lastLog=0;
    if(millis()-lastLog>=2000) {
        lastLog=millis();
        printSummary();
    }
    delay(1);
}
