#pragma once
#include <stdint.h>
#include <stddef.h>
#include <vector>
extern uint32_t fake_ms;
inline uint32_t millis() {return fake_ms;}
class HardwareSerial {
public:
    std::vector<uint8_t> bytes;
    size_t write(const uint8_t *p,size_t n) {bytes.insert(bytes.end(),p,p+n);return n;}
};
