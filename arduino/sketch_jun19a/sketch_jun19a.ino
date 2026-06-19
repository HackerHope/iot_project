#include "DHT.h"
#include "LiquidCrystal.h"

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);
#define DHTPIN 10
#define DHTTYPE DHT11

String command = "";
int led = 7;
int light = 5;
int buzzer = 6;

DHT dht(DHTPIN, DHTTYPE);


void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  lcd.begin(16, 2);
  dht.begin();

  pinMode(led, OUTPUT);
  pinMode(light, OUTPUT);
  pinMode(buzzer, OUTPUT);

  digitalWrite(led, LOW);
  digitalWrite(light, LOW);
  digitalWrite(buzzer, LOW);
  
  
}

void loop() {
  // This is where the code for reading and displaying the temperature and humidity goes

  float t = dht.readTemperature();
  float h = dht.readHumidity();

  if (isnan(t)){
    Serial.println(F("Failed to read from DHT sensor!"));
    return;
  }
  
  Serial.print(F("Temperature: "));
  Serial.println(t);
  Serial.print(F("Humidity: "));
  Serial.println(h);
  lcd.setCursor(0,0);
  lcd.print("Temp: ");
  lcd.print(t);
  lcd.setCursor(0,0);
  lcd.print("Hum: ");
  lcd.print(h);

  // This is what reads and executes commands 
  if (Serial.available()) {

    command = Serial.readStringUntil('\n');

    command.trim();

    Serial.println(command);

    if (command == "LED_ON") {

      digitalWrite(led, HIGH);

    }

    else if (command == "LED_OFF") {

      digitalWrite(led, LOW);

    }
    else if (command == "LIGHT_ON") {

      digitalWrite(light, HIGH);

    }
    else if (command == "LIGHT_OFF") {

      digitalWrite(light, LOW);

    }
    else if (command == "buzz") {

      digitalWrite(buzzer, HIGH);

    }
    else if (command == "quiet") {

      digitalWrite(buzzer, LOW);

    }
  }

}
