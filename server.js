const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(express.static("frontend"));
app.use(express.json());

let hardwareSocket = null;
let arduinoConnected = false;

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("hardware-register", () => {
    hardwareSocket = socket;
    arduinoConnected = true;

    console.log("Hardware client connected");

    io.emit("arduinoStatus", {
      connected: true,
      message: "Arduino Mega connected"
    });
  });

  socket.on("sensorData", (data) => {
    io.emit("sensorData", data);
  });

  socket.on("sensorError", (data) => {
    io.emit("sensorError", data);
  });

  socket.on("disconnect", () => {
    if (socket === hardwareSocket) {
      hardwareSocket = null;
      arduinoConnected = false;

      io.emit("arduinoStatus", {
        connected: false,
        message: "Arduino disconnected"
      });
    }
  });
});

app.get("/api/arduino/status", (req, res) => {
  res.json({
    connected: arduinoConnected,
    message: arduinoConnected
      ? "Arduino connected"
      : "Arduino offline"
  });
});

app.post("/api/led", (req, res) => {
  const { state } = req.body;

  let command = "";

  switch (state) {
    case "red_on":
      command = "RED_ON";
      break;

    case "red_off":
      command = "RED_OFF";
      break;

    case "green_on":
      command = "GREEN_ON";
      break;

    case "green_off":
      command = "GREEN_OFF";
      break;

    default:
      return res.status(400).json({
        error: "Invalid command"
      });
  }

  if (!hardwareSocket) {
    return res.status(503).json({
      error: "Arduino offline"
    });
  }

  hardwareSocket.emit("arduinoCommand", command);

  res.json({
    success: true,
    command
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});