const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const mysql = require("mysql2");
const mqtt = require("mqtt");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.static("public"));
app.use(express.json());

// Arduino state
let port = null;
let parser = null;
let arduinoConnected = false;

const ARDUINO_PORT = "COM18"; // change this if Arduino uses a different COM port
const BAUD_RATE = 9600;

// MQTT connection
const mqttClient = mqtt.connect("mqtt://localhost:1883");

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
  mqttClient.subscribe("iot/led/control");
});

mqttClient.on("error", (err) => {
  console.log("MQTT error:", err.message);
});

mqttClient.on("message", (topic, message) => {
  const command = message.toString();

  console.log("MQTT message received:", topic, command);

  if (topic === "iot/led/control") {
    if (!arduinoConnected || !port) {
      console.log("Arduino not connected. Command not sent:", command);

      io.emit("arduinoStatus", {
        connected: false,
        message: "Arduino not connected",
      });

      return;
    }

    port.write(command + "\n", (err) => {
      if (err) {
        console.log("Failed to send command to Arduino:", err.message);
      } else {
        console.log("Command sent to Arduino:", command);
      }
    });
  }
});

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // put your MySQL password here
  database: "iot_test_db",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }

  console.log("Connected to MySQL database");
});

// Arduino connection function
function connectToArduino() {
  if (arduinoConnected) return;

  console.log("Checking for Arduino...");

  port = new SerialPort({
    path: ARDUINO_PORT,
    baudRate: BAUD_RATE,
    autoOpen: false,
  });

  port.open((err) => {
    if (err) {
      arduinoConnected = false;
      console.log(`Arduino not connected on ${ARDUINO_PORT}. Waiting...`);

      io.emit("arduinoStatus", {
        connected: false,
        message: "Waiting for Arduino...",
      });

      return;
    }

    arduinoConnected = true;
    console.log(`Arduino connected on ${ARDUINO_PORT}`);

    io.emit("arduinoStatus", {
      connected: true,
      message: "Arduino connected",
    });

    parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
    parser.on("data", handleArduinoData);
  });

  port.on("error", (err) => {
    arduinoConnected = false;
    console.log("Arduino error:", err.message);

    io.emit("arduinoStatus", {
      connected: false,
      message: "Arduino error",
    });
  });

  port.on("close", () => {
    arduinoConnected = false;
    console.log("Arduino disconnected. Waiting for reconnect...");

    io.emit("arduinoStatus", {
      connected: false,
      message: "Arduino disconnected. Waiting...",
    });
  });
}

// Handle data from Arduino
function handleArduinoData(data) {
  console.log("Arduino:", data);

  const value = data.split("=")[1];

  if (!value) {
    console.log("Invalid data:", data);
    return;
  }

  const sensorValue = parseFloat(value);

  mqttClient.publish(
    "iot/sensor/ir",
    JSON.stringify({
      sensor: "ir Sensor",
      value: sensorValue,
      raw: data,
      time: new Date().toLocaleTimeString(),
    })
  );

  io.emit("sensorData", {
    raw: data,
    value: sensorValue,
    time: new Date().toLocaleTimeString(),
  });

  const sql = `
    INSERT INTO sensor_readings 
    (sensor_name, sensor_value, raw_data) 
    VALUES (?, ?, ?)
  `;

  db.query(sql, ["ir Sensor", sensorValue, data], (err, result) => {
    if (err) {
      console.error("Database insert failed:", err.message);
      return;
    }

    console.log("Saved to database, ID:", result.insertId);
  });
}

// Start trying to connect to Arduino
connectToArduino();

setInterval(() => {
  if (!arduinoConnected) {
    connectToArduino();
  }
}, 3000);

// API route to view latest readings
app.get("/api/readings", (req, res) => {
  const sql = `
    SELECT * FROM sensor_readings 
    ORDER BY created_at DESC 
    LIMIT 20
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: err.message,
      });
    }

    res.json(results);
  });
});

// API route to check Arduino status
app.get("/api/arduino/status", (req, res) => {
  res.json({
    connected: arduinoConnected,
    port: ARDUINO_PORT,
    message: arduinoConnected
      ? "Arduino connected"
      : "Waiting for Arduino...",
  });
});

// LED control route
app.post("/api/led", (req, res) => {
  const { state } = req.body;

  let command = "";

  if (state === "red_on") {
    command = "RED_ON";
  } else if (state === "red_off") {
    command = "RED_OFF";
  } else if (state === "green_on") {
    command = "GREEN_ON";
  } else if (state === "green_off") {
    command = "GREEN_OFF";
  } else {
    return res.status(400).json({ error: "Invalid LED state" });
  }

  if (!arduinoConnected || !port) {
    return res.status(503).json({
      error: "Arduino is not connected yet",
      command,
    });
  }

  mqttClient.publish("iot/led/control", command);

  res.json({ message: `Command sent: ${command}` });
});

server.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});