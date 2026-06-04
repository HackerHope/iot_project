// ESP32 version of your Arduino Mega code
// Adds Wi-Fi + simple web server so you can access it from your phone/laptop

#include <WiFi.h>
#include <WebServer.h>
#include "DHT.h"

// ===================== Wi-Fi Details =====================
// Change these to your Wi-Fi name and password
const char* ssid = "Aweh sure";
const char* password = "I d0n't kn0w";

WebServer server(80);

// ===================== DHT Sensor =====================
// ESP32 safe GPIO pins
#define DHTPIN 27
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ===================== Output Devices =====================
int buzzer = 25;
int led = 26;

String command = "";
float temperature = 0.0;
unsigned long lastReadTime = 0;

// ===================== Web Page =====================
void handleHome() {
  String html = "";
  html += "<!DOCTYPE html><html><head><title>ESP32 IoT Dashboard</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>";
  html += "body{font-family:Arial;text-align:center;background:#f4f6f8;padding:30px;}";
  html += ".card{background:white;max-width:450px;margin:auto;padding:25px;border-radius:12px;box-shadow:0 4px 12px #ccc;}";
  html += "button{padding:12px 20px;margin:8px;border:none;border-radius:8px;background:#007bff;color:white;font-size:16px;}";
  html += ".off{background:#dc3545;}";
  html += ".value{font-size:40px;font-weight:bold;color:#222;}";
  html += "</style></head><body>";
  html += "<div class='card'>";
  html += "<h1>ESP32 IoT Dashboard</h1>";
  html += "<p>Temperature:</p>";
  html += "<div class='value'>" + String(temperature) + " &deg;C</div>";
  html += "<h3>Buzzer Control</h3>";
  html += "<a href='/buzz/on'><button>Buzz ON</button></a>";
  html += "<a href='/buzz/off'><button class='off'>Buzz OFF</button></a>";
  html += "<h3>LED Control</h3>";
  html += "<a href='/led/on'><button>LED ON</button></a>";
  html += "<a href='/led/off'><button class='off'>LED OFF</button></a>";
  html += "<p><a href='/temperature'>View JSON Temperature</a></p>";
  html += "</div></body></html>";

  server.send(200, "text/html", html);
}

void handleTemperature() {
  String json = "{";
  json += "\"temperature\":" + String(temperature);
  json += "}";
  server.send(200, "application/json", json);
}

void handleBuzzOn() {
  digitalWrite(buzzer, HIGH);
  server.sendHeader("Location", "/");
  server.send(303);
}

void handleBuzzOff() {
  digitalWrite(buzzer, LOW);
  server.sendHeader("Location", "/");
  server.send(303);
}

void handleLedOn() {
  digitalWrite(led, HIGH);
  server.sendHeader("Location", "/");
  server.send(303);
}

void handleLedOff() {
  digitalWrite(led, LOW);
  server.sendHeader("Location", "/");
  server.send(303);
}

// ===================== Setup =====================
void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 SENSOR TEST");

  pinMode(buzzer, OUTPUT);
  pinMode(led, OUTPUT);

  digitalWrite(buzzer, LOW);
  digitalWrite(led, LOW);

  dht.begin();

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi connected!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  // Web routes
  server.on("/", handleHome);
  server.on("/temperature", handleTemperature);
  server.on("/buzz/on", handleBuzzOn);
  server.on("/buzz/off", handleBuzzOff);
  server.on("/led/on", handleLedOn);
  server.on("/led/off", handleLedOff);

  server.begin();
  Serial.println("Web server started");
}

// ===================== Loop =====================
void loop() {
  // Keep the web server running
  server.handleClient();

  // Read temperature every 2 seconds without blocking the server
  if (millis() - lastReadTime >= 2000) {
    lastReadTime = millis();

    float t = dht.readTemperature();

    if (isnan(t)) {
      Serial.println("Failed to read from DHT sensor!");
    } else {
      temperature = t;
      Serial.print("Temperature: ");
      Serial.println(temperature);
    }
  }

  // Still allow commands from Node.js through USB Serial
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
      delay(500);
      digitalWrite(buzzer, HIGH);
      delay(1000);
      digitalWrite(buzzer, LOW);
    }
  }
}
