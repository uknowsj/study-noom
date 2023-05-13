import express from 'express';

const app = express();

app.set("view engine", "pug"); // 템플릿 확장자 지정
app.set("views", __dirname + "/views"); // 템플릿 폴더 경로 지정
app.use("/public", express.static(__dirname + '/public'))

app.get("/", (req, res) => res.render("home"));
// app.get('/*', (req, res) => res.render())
console.log("hello")

app.listen(3000);