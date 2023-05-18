import http from "http";
import express from "express";
import WebSocket from "ws";

const app = express();

app.set("view engine", "pug"); // 템플릿 확장자 지정
app.set("views", __dirname + "/views"); // 템플릿 폴더 경로 지정
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

// 같은 서버에서 Http, Ws 둘 다 작동시키기
const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); // http 서버위에 webSocket 서버 추가
server.listen(3000, () => console.log(`Listening on http://localhost:3000`));

// socket 정보 담아두기 위한 배열 (socket : 연결된 각 브라우저)
const socketList = [];

wss.on("connection", (socket) => {
  socketList.push(socket);
  socket.nickname = "Anonymous"; // socket은 객체라 property 추가 가능

  console.log("Connected to Browser");

  // 브라우저로부터 메세지 받기
  socket.on("message", (_msg) => {
    const msg = JSON.parse(_msg);
    console.log("message from brwoser", msg);

    switch (msg.type) {
      case "new_msg":
        socketList.forEach((s) => s.send(`${socket.nickname}: ${msg.text}`));
        break;
      case "nickname":
        socket["nickname"] = msg.text;
        break;
    }
  });

  // 브라우저로부터 연결 끊겼을 때
  socket.on("close", () => {
    console.log("Disconnected from the Browser 😅");
  });
});
