#include "DHT.h"

// ESP32 pins
#define DHTPIN 4
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

int buzzer = 5;
int led = 17;

String command = "";

void setup() {
  Serial.begin(9600);
  Serial.println("ESP32 SENSOR TEST");

  pinMode(buzzer, OUTPUT);
  pinMode(led, OUTPUT);

  digitalWrite(buzzer, LOW);
  digitalWrite(led, LOW);

  dht.begin();
}

void loop() {
  // Read commands from Node.js
  if (Serial.available()) {
    command = Serial.readStringUntil('\n');
    command.trim();

    Serial.print("Command received: ");
    Serial.println(command);

    if (command == "Buzz") {
      digitalWrite(buzzer, HIGH);
    }
    else if (command == "Shhh") {
      digitalWrite(buzzer, LOW);
    }
    else if (command == "LedOn") {
      digitalWrite(led, HIGH);
    }
    else if (command == "LedOff") {
      digitalWrite(led, LOW);
    }
    else {
      digitalWrite(buzzer, HIGH);
      delay(500);
      digitalWrite(buzzer, LOW);
    }
  }

  // Read temperature every 2 seconds
  static unsigned long lastRead = 0;

  if (millis() - lastRead >= 2000) {
    lastRead = millis();

    float t = dht.readTemperature();

    if (isnan(t)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    Serial.print("Temperature: ");
    Serial.println(t);
  }
}
