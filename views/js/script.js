var socket = io();
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

console.log({ username, room });

// debug message from the server
socket.on("consolemsg", (msg) => {
  console.log(msg); // app
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
  socket.emit("chat message", msg);
  document.getElementById("messageInput").value = "";
});

// add received message to window
function appendMessage(msg) {
  var messages = document.getElementById("messages");
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

  if (autoScrollEnabled) messages.scrollTop = messages.scrollHeight;
}
