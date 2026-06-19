const io = require("socket.io-client");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const SERVER_URL = "https://arduino-control-project.onrender.com";

const port = new SerialPort({
  path: "COM18",
  baudRate: 9600
});

const parser = port.pipe(
  new ReadlineParser({
    delimiter: "\r\n"
  })
);

const socket = io(SERVER_URL, {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("Connected to server");

  socket.emit("hardware-register");
});

socket.on("arduinoCommand", (command) => {
  console.log("Received command:", command);

  port.write(command + "\n");
});

parser.on("data", (data) => {

  const raw = data.toString().trim();

  console.log("Arduino:", raw);

  const lower = raw.toLowerCase();

  // Figure out which sensor this line actually came from
  let sensorName = "Sensor";
  if (lower.includes("humid")) {
    sensorName = "Humidity Sensor";
  } else if (lower.includes("temp")) {
    sensorName = "Temperature Sensor";
  }

  if (
    lower.includes("error") ||
    lower.includes("failed")
  ) {

    socket.emit("sensorError", {
      sensor: sensorName,
      error: raw,
      time: new Date().toLocaleTimeString()
    });

    return;
  }

  let sensorValue;

  const parts = raw.split("=");

  if (parts.length === 2) {
    sensorValue = parseFloat(parts[1]);
  } else {
    const match = raw.match(/-?\d+(\.\d+)?/);
    sensorValue = match ? parseFloat(match[0]) : NaN;
  }

  if (!Number.isNaN(sensorValue)) {

    socket.emit("sensorData", {
      sensor: sensorName,
      value: sensorValue,
      raw,
      time: new Date().toLocaleTimeString()
    });
  }
});