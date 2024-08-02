import http from "http";
import express from "express";
import { Server } from "socket.io";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import {
  userJoin,
  userLeave,
  getRoomUsers,
  checkUserNameExists,
} from "./utils/users.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app); // Create HTTP server
const io = new Server(server); // Create Socket.IO server

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use("/css", express.static(path.join(__dirname, "dist")));
app.use("/js", express.static(path.join(__dirname, "public/js")));

/* routes */
app.get("/", (req, res) => res.render("index.ejs"));
app.get("/chat", (req, res) => res.render("chat.ejs"));
app.get("*", (req, res) => {
  res.redirect("/");
});

const typingUsers = new Map();
const messages = [];
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
  socket.on("checkUsername", ({ username }) => {
    socket.emit("usernameCheckResult", checkUserNameExists(username));
  });

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
      console.log("emit chat message");
      const message = {
        id: uuidv4(),
        username: user.username,
        room: user.room,
        text: msg,
        time: moment().format("h:mm a"),
        likes: [],
      };
      messages.push(message);
      console.log({ messages });
      io.to(user.room).emit("chat_msg", message);
      //io.to(user.room).emit("chat_msg", formatMessage(user.username, msg));
    });

    // Handle typing events
    socket.on("typing", ({ username, room }) => {
      if (!typingUsers.has(room)) {
        typingUsers.set(room, new Set());
      }
      typingUsers.get(room).add(username);
      io.to(room).emit("typing", Array.from(typingUsers.get(room)));
    });

    socket.on("stop_typing", ({ username, room }) => {
      if (typingUsers.has(room)) {
        typingUsers.get(room).delete(username);
        io.to(room).emit("stop_typing", Array.from(typingUsers.get(room)));
      }
    });

    socket.on("like_message", ({ messageId, username }) => {
      const message = messages.find((m) => m.id === messageId);
      console.log({ messageId, username });
      if (message) {
        if (!message.likes.includes(username)) {
          message.likes.push(username);
        } else {
          message.likes = message.likes.filter((user) => user !== username);
        }

        io.to(user.room).emit("update_likes", {
          messageId,
          likes: message.likes,
        });
      }
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
