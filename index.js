import http from "http";
import express from "express";
import { Server } from "socket.io";
import formatMessage from "./utils/message.js";

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server);

app.use(express.static("views"));

/* routes */
app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/chat", (req, res) => {
  res.render("chat.ejs");
});

const username = "test user";
// Runs when the client connects
io.on("connection", (socket) => {
  console.log("New Connection");

  // Emit to new user
  socket.emit("console_msg", "Welcome to chat");

  // Broadcasts to all other users
  socket.broadcast.emit("console_msg", "New user connected");

  socket.on("disconnect", () => {
    socket.broadcast.emit("console_msg", "user disconnected");
  });
  // io.emit("console+msg", "Total Number of user:");

  socket.on("chat message", (msg) => {
    console.log(msg);
    // Broadcasts to all users
    io.emit("chat_msg", formatMessage(username, msg));
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
