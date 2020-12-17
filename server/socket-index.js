const express = require("express");
const http =  require("http");

const app = express();
const server = http.createServer(app);

const sio = require("socket.io")(server, {
  cors: {
    origin: "http://127.0.0.1:5500/",
    //methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
  // },
  //   handlePreflightRequest: (req, res) => {
  //       const headers = {
  //           "Access-Control-Allow-Headers": "Content-Type, Authorization",
  //           "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
  //           "Access-Control-Allow-Credentials": true
  //       };
  //       res.writeHead(200, headers);
  //       res.end();
  //   }
});

sio.on("connection", (socket) => {
    console.log("Connected!");
    console.log(socket.id)

    socket.on('SEND_MESSAGE', function(data){
      console.log('whats the data', data)
      //sio.emit('RECEIVE_MESSAGE', data);
      socket.broadcast.emit('RECEIVE_MESSAGE', data);
      //io.to('7oEIfuUB9kRkI4MmAAAh').emit('hey')
  })
});

server.listen(2999, () => {console.log('listening on 2999')});