//Import DHT library for sensor
#include "DHT.h"

//Defining DHT variables
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Output devices definition
int buzzer = 5;
int led = 17;

String command = "";


void setup(){
  Serial.begin(9600);
  Serial.println(F("SENSOR TEST"));
  pinMode(buzzer, OUTPUT);
  pinMode(led, OUTPUT);
  
  dht.begin();
  
}

void loop(){
  // Wait a few moments between measurements 
  delay(2000);

  float t = dht.readTemperature();

  if (isnan(t)){
    Serial.println(F("Failed to read from DHT sensor!"));
    return;
  }
  
  Serial.print(F("Temperature: "));
  Serial.println(t);

  // Receiving commands from Node js 
  if(Serial.available()){
    command = Serial.readStringUntil('\n');
    command.trim();

    if(command == "Buzz"){
      Serial.println(command);
      digitalWrite(buzzer, HIGH);
    }
    else if(command == "Shhh"){
      Serial.println(command);
      digitalWrite(buzzer, LOW);
    }
    else {
      Serial.println(command);
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
