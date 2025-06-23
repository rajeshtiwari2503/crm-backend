const express = require('express');
const http = require('http');
const { Server } = require('socket.io');


const app =express();
const server=http.createServer(app);

const originUrl="https://crm.servsy.in" 

// const originUrl="http://localhost:3000"

const io =new Server(server,{
     pingTimeout:60000,
      cors:{
        origin:originUrl,
         methods: ['GET','PATCH', 'POST'],
      },
});

app.set('socketio', io);
const users = {};

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  const userId=socket.handshake.query.userId;
  if(userId){
    users[userId]=socket.id;
    console.log("ram",users);
    
  }

io.emit("getOnline",Object.keys(users))

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    delete users[userId]
    io.emit("getOnline",Object.keys(users))
  });
});


module.exports={app,io,server}
