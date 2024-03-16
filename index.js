const express = require("express");
const { createServer } = require("node:http");
const { Server } = require("socket.io");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
const server = createServer(app);
const { join } = require("node:path");
const io = new Server(server);

async function main() {
  const db = await open({
    filename: "chat.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id  INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
    )
  `);

  app.get("/", (req, res) => {
    res.sendFile(join(__dirname + "/index.html"));
  });

  io.on("connection", async (socket) => {
    console.log("A user connected...");
    socket.on("disconnect", () => {
      console.log("A user disconnected...");
    });
    socket.on("chat message", async (msg) => {
      try {
        const result = await db.run(
          "INSERT INTO messages (content) VALUES (?)",
          msg
        );
        io.emit("chat message", msg, result.lastID);
      } catch (e) {
        console.error("Error inserting message into the database:", e);
      }
    });

    if (!socket.recovered) {
      try {
        await db.each(
          "SELECT id, content FROM messages WHERE id > ?",
          [socket.handshake.auth.serverOffset || 0],
          (_err, row) => {
            socket.emit("chat message", row.content, row.id);
          }
        );
      } catch (e) {
        return;
      }
    }
  });

  server.listen(3000, () => {
    console.log("Server is running at port 3000...");
  });
}

main();
