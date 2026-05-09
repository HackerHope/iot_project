const int redLed = 2;
const int greenLed = 4;
const int irPin = A1;

void setup() {
  Serial.begin(9600);

  pinMode(redLed, OUTPUT);
  pinMode(greenLed, OUTPUT);

  digitalWrite(redLed, LOW);
  digitalWrite(greenLed, LOW);
}

void loop() {
  int sensorValue = analogRead(irPin);

  Serial.print("sensor=");
  Serial.println(sensorValue);

  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "RED_ON") {
      digitalWrite(redLed, HIGH);
      Serial.println("red=on");
    } 
    else if (command == "RED_OFF") {
      digitalWrite(redLed, LOW);
      Serial.println("red=off");
    } 
    else if (command == "GREEN_ON") {
      digitalWrite(greenLed, HIGH);
      Serial.println("green=on");
    } 
    else if (command == "GREEN_OFF") {
      digitalWrite(greenLed, LOW);
      Serial.println("green=off");
    }
  }

  delay(1000);
}
