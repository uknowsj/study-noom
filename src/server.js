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

instrument(io, {
  auth: false,
  mode: "development",
});

server.listen(3000, () => console.log(`Listening on http://localhost:3000`));

const countPublicRooms = () => {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = io;
  const publicRooms = [];

  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });

  return publicRooms;
};

const countRoom = (roomName) => {
  return io.sockets.adapter.rooms.get(roomName)?.size; // rooms는 set 자료구조
};

io.on("connection", (socket) => {
  socket["nickname"] = "anonymous";
  console.log("connected");

  socket.onAny((e) => {
    console.log("socket server middleware");
  });

  // room 입장 이벤트
  socket.on("room", (roomName, cb) => {
    socket.join(roomName); // 룸 생성(참여)
    cb();
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName)); // 해당 룸에 welcome 이벤트 emit. 나는 제외
    io.sockets.emit("room_change", countPublicRooms()); // 모든 소켓에 메세지 보내기\
  });

  // 퇴장에 이벤트
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1); // 아직 방을 떠나지 않아 -1
    });
  });

  socket.on("disconnect", () => {
    io.sockets.emit("room_change", countPublicRooms()); // 모든 소켓에 메세지 보내기
  });

  socket.on("send_message", (roomName, msg) => {
    socket.to(roomName).emit("send_message", `${socket.nickname}: ${msg}`);
  });

  // nickname
  socket.on("nickname", (nickname) => {
    socket["nickname"] = nickname;
  });
});
