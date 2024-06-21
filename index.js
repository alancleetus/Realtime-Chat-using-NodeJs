import http from "http";
import express from "express";
import { Server } from "socket.io";
import formatMessage from "./utils/message.js";
import { userJoin, userLeave, getRoomUsers } from "./utils/users.js";

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app); // Create HTTP server
const io = new Server(server); // Create Socket.IO server

app.use(express.static("views"));

/* routes */
app.get("/", (req, res) => res.render("index.ejs"));
app.get("/chat", (req, res) => res.render("chat.ejs"));

/*  SOCKET.IO
  Emit to current user:
    socket.emit("msg", "Welcome user");
  Broadcasts to all users except current user
    socket.broadcast.emit("msg", `${username} has joined the chat`);
  Broadcasts to all users except current user in a specific room
     socket.broadcast.to(user.room).emit("system_msg", `${username} joined ${room}`); - Emit to current user
  Emit to everyone including current user
    io.emit...
  Emit to everyone in a room including current user
    io.to(user.room).emit....
*/
io.on("connection", (socket) => {
  socket.on("join_room", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room); //create a new room and join
    console.log("Server: New Connection");
    console.log(user);

    // another user joins
    socket.broadcast
      .to(user.room)
      .emit("system_msg", `${username} joined the chat`);

    // send room info to all users
    io.to(user.room).emit("room_users", {
      room: user.room,
      users: getRoomUsers(room),
    });
    console.log("Users:");
    console.log(getRoomUsers(room));

    // user sends a message
    socket.on("chat_message", (msg) => {
      io.to(user.room).emit("chat_msg", formatMessage(user.username, msg));
    });

    /* disconnect */
    socket.on("disconnect", () => {
      const user = userLeave(socket.id); // remove user from users list

      if (user)
        io.to(user.room).emit("system_msg", `${username} left the chat`);
    });
  });
});

server.listen(port, () => console.log(`Server running on port ${port}`));