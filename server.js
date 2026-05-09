const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const mysql = require("mysql2");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "kevin10King11", // put your MySQL password here
  database: "iot_test_db",
});

// Check database connection
db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }

  console.log("Connected to MySQL database");
});

// Arduino serial connection
const port = new SerialPort({
  path: "COM18", // change this to your Arduino port
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

parser.on("data", (data) => {
  console.log("Arduino:", data);

  const value = data.split("=")[1];

  if (!value) {
    console.log("Invalid data:", data);
    return;
  }

  const sensorValue = parseFloat(value);

  // Send live data to frontend
  io.emit("sensorData", {
    raw: data,
    value: sensorValue,
    time: new Date().toLocaleTimeString(),
  });

  // Save data to MySQL
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
});

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

app.post("/api/led", (req, res) => {
  const { state } = req.body;

  if (state === "red_on") {
    port.write("RED_OFF\n");
    return res.json({ message: "RED turned ON" });
  }

  if (state === "red_off") {
    port.write("RED_ON\n");
    return res.json({ message: "RED turned OFF" });
  }

  if (state === "green_on") {
    port.write("GREEN_OFF\n");
    return res.json({ message: "GREEN turned ON" });
  }

  if (state === "green_off") {
    port.write("GREEN_ON\n");
    return res.json({ message: "GREEN turned OFF" });
  }

  res.status(400).json({ error: "Invalid LED state" });
});

server.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});