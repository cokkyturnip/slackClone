const express = require("express");
const socketio = require("socket.io");
const namespaces = require("./data/dummy");

const app = express();

app.use(express.static(`${__dirname}/public`));

const server = app.listen(9000);
const io = socketio(server);

io.on("connection", (socket) => {
  socket.emit("greetingFromServer", { msg: "Welcome to the server!" });

  //SEND ALL NAMESPACE
  const namespaceList = namespaces.map((objNs) => {
    return {
      img: objNs.img,
      endpoint: objNs.endpoint,
    };
  });
  socket.emit("namespaceList", namespaceList);
});

//LISTEN TO EACH OF NAMESPACE
namespaces.forEach((objNs) => {
  io.of(objNs.endpoint).on("connection", (nsSocket) => {
    // console.log(nsSocket.handshake);

    //  SEND NAMESPACE'S ROOMS
    nsSocket.emit("roomList", objNs.rooms);

    //  EVENT JOIN ROOM
    nsSocket.on("joinRoom", (roomToJoin, updateMemberCallback) => {
    //   console.log(roomToJoin);
      //  WHEN JOIN LEAVE THE LAST ONE BEFORE
      let roomToLeave = Object.keys(nsSocket.rooms)[1];
      if (roomToLeave) {
        nsSocket.leave(roomToLeave);
        updateMembers(objNs.endpoint, roomToLeave);
      }

      // JOIN TO SELECTED ROOM
      nsSocket.join(roomToJoin);
      updateMembers(objNs.endpoint, roomToJoin);

      //    RETRIEVE HISTORY CHAT
      const selectedRoom = objNs.rooms.find((room) => {
        return room.roomTitle === roomToJoin;
      });
      nsSocket.emit("historyMessage", selectedRoom.history);
    });

    nsSocket.on("newMessageToServer", (data) => {
        // console.log(nsSocket.handshake.query.displayName);
      //    SEND NEW MESSAGE TO ALL MEMBER THAT JOIN TO THE ROOM
      //    GET CURRENT ROOM
      const currentRoom = Object.keys(nsSocket.rooms)[1];

      //    ADD NEW MESSAGE TO ROOM MESSAGE HISTORY
      const objRoom = objNs.rooms.find((room) => {
        return room.roomTitle === currentRoom;
      });
      data = {
        ...data,
        datetime: new Date().toDateString(),
        displayName: nsSocket.handshake.query.displayName,
        avatar: "https://via.placeholder.com/30",
      };
      objRoom.addMessage(data);
      io.of(objNs.endpoint).in(currentRoom).emit("newMessageFromServer", data);
    });
  });
});

const updateMembers = (namespace, room) => {
  //GET COUNT OF MEMBER or USER
  io.of(namespace)
    .in(room)
    .clients((error, clients) => {
    //   console.log(clients.length);
      // updateMemberCallback(clients.length);

      //  SEND NEW UPDATE COUNT MEMBER TO ALL MEMBER OF ROOM
      const data = { room: room, count: clients.length };
      io.of(namespace).in(room).emit("updateMember", data);
    });
};
