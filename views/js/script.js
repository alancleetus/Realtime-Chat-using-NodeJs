var socket = io();
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
console.log("tst");
console.log({ username, room });
document.getElementById("roomHeading").innerText = room;

socket.emit("join_room", { username, room });

// debug message from the server
socket.on("console_msg", (msg) => {
  console.log(msg); // app
});

socket.on("system_msg", (msg) => {
  console.log(msg);
  appendSystemMessage(msg); // app
});

// messages to be added to chat window
socket.on("chat_msg", (msg) => {
  console.log(msg); // append to front end
  appendMessage(msg);
});

// handle new message submission
const newMsgForm = document.getElementById("newMessageForm");
newMsgForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = e.target.elements[0].value;
  console.log(msg);

  // emit to server
  socket.emit("chat_message", msg);
  document.getElementById("messageInput").value = "";
});

// add received message to window
function appendMessage(msg) {
  var messages = document.getElementById("messages");
  var messagesDiv = document.getElementById("messages-container");
  const bubble = `<div class="message-bubble">
          <div class="message-header">
            <span class="message-username">${msg.username}</span>
            <span class="message-time">${msg.time}</span>
          </div>
          <div class="message-content">${msg.text}</div>
        </div>`;

  messages.insertAdjacentHTML("beforeend", bubble);
  const autoScrollEnabled =
    document.getElementById("autoScrollCheckbox").checked;

  if (autoScrollEnabled) messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function appendSystemMessage(msg) {
  var messages = document.getElementById("messages");
  var messagesDiv = document.getElementById("messages-container");
  const systemMsg = `<p class='systemMsg'>${msg}</p>`;

  messages.insertAdjacentHTML("beforeend", systemMsg);
  const autoScrollEnabled =
    document.getElementById("autoScrollCheckbox").checked;

  if (autoScrollEnabled) messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* USER LIST MODAL */

socket.on("room_users", ({ room, users }) => {
  console.log(room);
  console.log(users);
  updateUserCountAndList(users);
});

// Function to update the user count and user list
function updateUserCountAndList(users) {
  const userCount = users.length;
  console.log("userCount:" + userCount);
  document.getElementById("userCount").textContent = userCount;

  const userList = document.getElementById("userList");
  userList.innerHTML = ""; // Clear existing list
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user.username;
    userList.appendChild(li);
  });
}

// Modal functionality
const modal = document.getElementById("userModal");
const userCountLink = document.getElementById("userCountLink");
const span = document.getElementsByClassName("close")[0];

userCountLink.onclick = function () {
  modal.style.display = "block";
};

span.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
