// 브라우저에서 실행할 js
const socket = io();

// document elements
const welcome = document.querySelector("#welcome");
const form = welcome.querySelector("form");
const room = document.querySelector("#room");

room.hidden = true;
let roomName = "";
let nickname = "anonymous";

// 방 입장 시 실행
const showRoom = (e) => {
  welcome.hidden = true;
  room.hidden = false;

  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;

  const nicknameForm = room.querySelector("#nickname");
  const messageForm = room.querySelector("#message");

  nicknameForm.addEventListener("submit", handleNicknameSubmit);
  messageForm.addEventListener("submit", handleMsgSubmit);
};

const addMessage = (msg) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = msg;
  ul.appendChild(li);
};

// event handler
const handleRoomSubmit = (e) => {
  e.preventDefault();
  const input = form.querySelector("input");

  roomName = input.value;
  socket.emit("room", input.value, showRoom);
  input.value = "";
};

const handleNicknameSubmit = (e) => {
  e.preventDefault();
  const input = room.querySelector("#nickname input");
  socket.emit("nickname", input.value);
};

const handleMsgSubmit = (e) => {
  e.preventDefault();
  const input = room.querySelector("#message input");
  const value = input.value;
  socket.emit("send_message", roomName, value);

  input.value = "";
};

// add event
form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} is joined`);
});

socket.on("bye", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} is left ㅠㅠ`);
});

socket.on("send_message", addMessage);

socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }
  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  });
});
