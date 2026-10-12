#include <cassert>
#include <cstring>
#include <iostream>
#include "uart_protocol.h"
uint32_t fake_ms=0;
static bool feed(const std::vector<uint8_t> &bytes,UartPacket &packet) {
    bool parsed=false;for(uint8_t b:bytes){++fake_ms;parsed=parse_byte(b,packet)||parsed;}return parsed;
}
int main() {
    HardwareSerial serial;UartPacket packet={};TelemetryData t={};
    t.speed=3.6f;t.ax=1;t.az=9.81f;t.latitude=21.0285f;t.longitude=105.8544f;
    t.gps_valid=1;t.imu_valid=1;t.speed_valid=1;t.gps_age_ms=800;t.wheel_idle_ms=20;
    assert(send_msg(serial,MSG_TELEMETRY,t)==43);
    assert(feed(serial.bytes,packet));assert(packet.len==39);
    assert(std::memcmp(packet.data,&t,sizeof(t))==0);
    auto corrupt=serial.bytes;corrupt[9]^=1;
    assert(!feed(corrupt,packet));assert(feed(serial.bytes,packet));
    // Truncated packet times out; the next valid frame is recovered.
    std::vector<uint8_t> partial(serial.bytes.begin(),serial.bytes.begin()+8);
    assert(!feed(partial,packet));fake_ms+=FRAME_TIMEOUT_MS+1;
    assert(feed(serial.bytes,packet));
    assert(!feed({0xAA,MSG_TELEMETRY,129},packet));assert(feed(serial.bytes,packet));
    uint8_t maxPayload[128]={};HardwareSerial maxSerial;
    assert(send_frame(maxSerial,MSG_TELEMETRY,maxPayload,128)==132);
    assert(feed(maxSerial.bytes,packet));assert(packet.len==128);
    HardwareSerial nullSerial;assert(send_frame(nullSerial,MSG_TELEMETRY,nullptr,1)==0);
    assert(nullSerial.bytes.empty());
    HardwareSerial emptySerial;assert(send_frame(emptySerial,MSG_NACK,nullptr,0)==4);
    assert(feed(emptySerial.bytes,packet));assert(packet.len==0);
    std::cout<<"PASS: UART v2 roundtrip, corruption, timeout, length bounds, null and empty payload\n";
}
