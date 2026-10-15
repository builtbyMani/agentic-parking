/*
 * ESP32 Parking Lot Gateway Firmware - Lot A
 * 
 * Hardware Twin for Agentic Parking Gate System:
 * - SG90 Micro Servo on GPIO 18 (Gate Barrier: 0 deg = Closed, 90 deg = Open)
 * - TCRT5000 / Optical IR Obstacle Sensor on GPIO 19 (Slot A-01: LOW = Occupied, HIGH = Vacant)
 * - Onboard Status LED on GPIO 2 (Blinks/Illuminates when gate is open)
 * - Serial Protocol at 115200 baud
 * 
 * Deterministic Safety Rule:
 * - When GATE:OPEN command received, servo opens to 90 degrees.
 * - Hardware timer automatically closes gate back to 0 degrees after exactly 5000ms.
 */

#include <Arduino.h>
#include <ESP32Servo.h>

// Pin Definitions
static const int SERVO_PIN      = 18;
static const int IR_SENSOR_PIN  = 19;
static const int STATUS_LED_PIN = 2;

// Angles
static const int GATE_CLOSED_ANGLE = 0;
static const int GATE_OPEN_ANGLE   = 90;

// Timing constants
static const unsigned long GATE_OPEN_DURATION_MS = 5000;
static const unsigned long IR_DEBOUNCE_MS        = 50;

Servo gateServo;
bool isGateOpen = false;
unsigned long gateOpenTimestamp = 0;

int lastIrReading = HIGH;
int stableIrState = HIGH;
unsigned long lastDebounceTimestamp = 0;

void openGate() {
    gateServo.write(GATE_OPEN_ANGLE);
    digitalWrite(STATUS_LED_PIN, HIGH);
    isGateOpen = true;
    gateOpenTimestamp = millis();
    Serial.println("GATE:OPENED");
}

void closeGate() {
    gateServo.write(GATE_CLOSED_ANGLE);
    digitalWrite(STATUS_LED_PIN, LOW);
    isGateOpen = false;
    Serial.println("GATE:CLOSED");
}

void setup() {
    Serial.begin(115200);
    while (!Serial && millis() < 2000) {
        // Wait for USB CDC if necessary
    }

    pinMode(STATUS_LED_PIN, OUTPUT);
    digitalWrite(STATUS_LED_PIN, LOW);

    // Active-LOW IR sensor with internal pullup
    pinMode(IR_SENSOR_PIN, INPUT_PULLUP);

    // Allocate PWM timer and attach servo
    ESP32PWM::allocateTimer(0);
    gateServo.setPeriodHertz(50); // Standard 50Hz servo
    gateServo.attach(SERVO_PIN, 500, 2400);

    // Start with gate closed
    gateServo.write(GATE_CLOSED_ANGLE);

    Serial.println("SYSTEM:READY:LOT_A");
}

void loop() {
    unsigned long currentMillis = millis();

    // 1. Process Serial Commands from FastAPI Server
    if (Serial.available() > 0) {
        String cmd = Serial.readStringUntil('\n');
        cmd.trim();

        if (cmd == "GATE:OPEN" || cmd == "OPEN_GATE") {
            openGate();
        } else if (cmd == "GATE:CLOSE" || cmd == "CLOSE_GATE") {
            closeGate();
        } else if (cmd == "STATUS:PING") {
            Serial.print("STATUS:GATE=");
            Serial.print(isGateOpen ? "OPEN" : "CLOSED");
            Serial.print(":SLOT_A01=");
            Serial.println(stableIrState == LOW ? "OCCUPIED" : "VACANT");
        }
    }

    // 2. Deterministic Auto-Close Safety Window
    if (isGateOpen && (currentMillis - gateOpenTimestamp >= GATE_OPEN_DURATION_MS)) {
        closeGate();
    }

    // 3. Debounced IR Slot Occupancy Monitoring
    int currentIrReading = digitalRead(IR_SENSOR_PIN);
    if (currentIrReading != lastIrReading) {
        lastDebounceTimestamp = currentMillis;
    }

    if ((currentMillis - lastDebounceTimestamp) > IR_DEBOUNCE_MS) {
        if (currentIrReading != stableIrState) {
            stableIrState = currentIrReading;
            if (stableIrState == LOW) {
                // Obstacle detected (Vehicle parked)
                Serial.println("SLOT:A-01:OCCUPIED");
            } else {
                // Beam clear (Slot vacant)
                Serial.println("SLOT:A-01:VACANT");
            }
        }
    }
    lastIrReading = currentIrReading;

    delay(10);
}
