// 브라우저에서 실행할 js
const socket = new WebSocket(`ws://${window.location.host}`); // 서버로의 연결

// document elements
const messageList = document.querySelector("ul");
const nicknameForm = document.querySelector("#nickname");
const messageForm = document.getElementById("message");

// util
const makeMsg = (type, text) => {
  return JSON.stringify({ type, text });
};

socket.addEventListener("open", () => {
  console.log("Connected to Server 🥕");
});

socket.addEventListener("message", (msg) => {
  const li = document.createElement("li");
  li.innerText = msg.data;
  messageList.append(li);
});

socket.addEventListener("close", () => {
  console.log("Disconnected from Server 🥲");
});

// 닉네임 전송
nicknameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = nicknameForm.querySelector("input");
  socket.send(makeMsg("nickname", input.value));
  input.value = "";
});

// 메세지 전송
messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  socket.send(makeMsg("new_msg", input.value));
  input.value = "";
});
