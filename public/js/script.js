var socket = io();
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
if (!username || !room) {
  console.log("Redirect user to the home page if the parameters are missing");
  window.location.href = "/"; // Redirect to the homepage if credentials are missing
} else {
  /*************** Check for Duplicate username ***********************/
  socket.emit("checkUsername", { username });
  socket.on("usernameCheckResult", (isTaken) => {
    if (isTaken) {
      console.log("Redirecting to homepage. Username already taken.");
      window.location.href = "/"; // Redirect to the homepage if username is already taken
    }
  });

  console.log("Access granted. Username and room are present.");
  /*************** Type Detection Start***********************/
  // Typing event handlers
  const input = document.getElementById("messageInput");
  let typing = false;
  let timeout;

  input.addEventListener("input", () => {
    if (!typing) {
      typing = true;
      socket.emit("typing", { username, room });
    }
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      typing = false;
      socket.emit("stop_typing", { username, room });
    }, 3000);
  });

  socket.on("typing", (usersTyping) => {
    const typingElement = document.getElementById("typing");
    typingElement.innerText =
      usersTyping.length > 0 ? `${usersTyping.join(", ")} is typing...` : "";
  });

  socket.on("stop_typing", (usersTyping) => {
    const typingElement = document.getElementById("typing");
    typingElement.innerText =
      usersTyping.length > 0 ? `${usersTyping.join(", ")} is typing...` : "";
  });
  /*************** Type Detection End***********************/
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

    // emit to server
    socket.emit("chat_message", msg);
    document.getElementById("messageInput").value = "";
    document.getElementById("messageInput").focus();
  });

  // add received message to window
  function appendMessage(msg) {
    console.log("append msg");
    console.log({ msg });

    var messages = document.getElementById("messages");
    var messagesDiv = document.getElementById("messages-container");
    let bubble = `<div class="message-bubble bg-gray-300 dark:bg-gray-700 dark:text-gray-100 rounded-lg shadow p-3 my-2 mx-4">
        <div class="message-header flex justify-between items-center mb-2">
          <span class="message-username italic text-gray-800 dark:text-gray-300">${msg.username}</span>
          <span class="message-time text-sm text-gray-500 dark:text-gray-400">${msg.time}</span>
        </div>
        <div class="message-content text-lg text-gray-600 dark:text-gray-100">${msg.text}</div>
        `;

    if (msg.likes.includes(username))
      bubble += `
        <div id="likeIcon-${msg.id}" data-id="${msg.id}" class="like-icon message-likes">
          <img src="/res/like-filled.svg"   alt="liked"/> 
          <span id="likeCount-${msg.id}" class="like-count">${msg.likes.length}</span> 
        </div>
        </div>`;
    else
      bubble += `
      <div id="likeIcon-${msg.id}" data-id="${msg.id}" class="like-icon message-likes">
        <img src="/res/like-outline.svg"  alt="not liked"/> 
        <span id="likeCount-${msg.id}" class="like-count">${msg.likes.length}</span> 
      </div>
      </div>`;

    messages.insertAdjacentHTML("beforeend", bubble);
    const autoScrollEnabled =
      document.getElementById("autoScrollCheckbox").checked;

    if (autoScrollEnabled) messagesDiv.scrollTop = messagesDiv.scrollHeight;
    document.querySelectorAll(".like-icon").forEach((button) => {
      button.addEventListener("click", () => {
        const messageId = button.getAttribute("data-id");
        socket.emit("like_message", { messageId, username });
      });
    });
  }

  function appendSystemMessage(msg) {
    var messages = document.getElementById("messages");
    var messagesDiv = document.getElementById("messages-container");
    const systemMsg = `<p class='systemMsg dark:text-zinc-400 text-grey-100 italic text-center my-2 mx-4 text-sm'>${msg}</p>`;

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

  socket.on("update_likes", ({ messageId, likes }) => {
    const likeIcon = document.getElementById(`likeIcon-${messageId}`);

    if (likeIcon) {
      likeIcon.innerHTML = likes.includes(username)
        ? `<img src="/res/like-filled.svg"  alt="liked"/> 
    <span id="likeCount-${messageId}" class="like-count">${likes.length}</span> `
        : `<img src="/res/like-outline.svg" alt="not liked"/> 
    <span id="likeCount-${messageId}" class="like-count">${likes.length}</span> `;
    }
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

      if (user.username == username) {
        li.className = "text-orange-600 dark:text-orange-500";
        userList.prepend(li);
      } else {
        userList.appendChild(li);
      }
    });
  }
}
