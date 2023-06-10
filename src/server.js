import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug"); // 템플릿 확장자 지정
app.set("views", __dirname + "/views"); // 템플릿 폴더 경로 지정
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

// 같은 서버에서 Http, Ws 둘 다 작동시키기
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

// instrument(io, {
//   auth: false,
//   mode: "development",
// });

server.listen(3000, () => console.log(`Listening on http://localhost:3000`));

io.on("connection", (socket) => {
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit('welcome');
  });

  socket.on("offer", (offer, roomName) => {
    socket.to(roomName).emit('offer', offer);
  });

  socket.on("answer", (answer, roomName) => {
    socket.to(roomName).emit('answer', answer);
  });

  socket.on("ice", (ice, roomName) => {
    socket.to(roomName).emit('ice', ice);
  })
})
