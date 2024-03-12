const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const { join } = require("node:path");
const io = new Server(server);

app.get("/", (req, res) => {
  res.sendFile(join(__dirname + "/index.html"));
});

io.on("connection", (socket) => {
  console.log("A user connected...");
  socket.on("disconnect", () => {
    console.log("A user disconnected...");
  });
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });
});

server.listen(3000, () => {
  console.log("Server is running at port 3000...");
});
