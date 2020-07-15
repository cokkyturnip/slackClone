let nsSocket = null;
let displayName = "";
while (displayName === "") {
  displayName = prompt("What is your name?");
}
const socket = io("http://localhost:9000", {
  query: { displayName },
}); // default : window.location

//GET ALL NAMESPACE FROM SERVER
socket.on("namespaceList", (data) => {
  const divNs = document.querySelector(".namespaces");
  divNs.innerHTML = "";

  data.forEach((objNs) => {
    divNs.innerHTML += `<div class="namespace" ns="${objNs.endpoint}"><img src="${objNs.img}"></div>`;
  });

  //ADD EVENTLISTENER FOR EACH NS
  const arr = divNs.children;
  Array.from(arr).forEach((objNS) => {
    objNS.addEventListener("click", (e) => {
      const nsEndpoint = objNS.getAttribute("ns");

      //  SWITCH TO SELECTED NS
      joinNs(nsEndpoint);
    });
  });

  joinNs(data[0].endpoint);
});

const joinNs = (endpoint = "/") => {
  //CLOSE NAMESPACE CONNECTION IF IT'S CONNECTED
  if (nsSocket) {
    nsSocket.close();
    // document
    //   .querySelector("#user-input")
    //   .removeEventListener("submit", sendMessage);
  }
  nsSocket = io(`http://localhost:9000${endpoint}`);

  //GET ALL ROOM FROM NAMESPACE
  nsSocket.on("roomList", (data) => {
    const divRoomList = document.querySelector(".room-list");
    divRoomList.innerHTML = "";

    data.forEach((objRoom) => {
      let iconRoom = "";

      if (objRoom.privateRoom) iconRoom = "lock";
      else iconRoom = "globe";

      // WRITE ALL THE ROOMS FROM NAMESPACE
      divRoomList.innerHTML += `
        <li class="room" onclick='joinRoom("${objRoom.roomTitle}")'>
          <span class="glyphicon glyphicon-${iconRoom}"></span>${objRoom.roomTitle}
        </li>`;
    });
    joinRoom(document.querySelector(".room").textContent.trim());
  });

  nsSocket.on("updateMember", (data) => {
    const domCurrentRoom = document.querySelector(".curr-room-text");
    const domMemberCounter = document.querySelector(".curr-room-num-users");

    domCurrentRoom.textContent = data.room;
    domMemberCounter.innerHTML = `${data.count} <span class="glyphicon glyphicon-user"></span>`;
  });

  nsSocket.on("newMessageFromServer", (data) => {
    const domMessages = document.querySelector("#messages");
    domMessages.innerHTML += buildChatHistory(data);
    domMessages.scrollTo(0, domMessages.scrollHeight);
  });

  nsSocket.on("historyMessage", (data) => {
    const domMessages = document.querySelector("#messages");

    domMessages.innerHTML = "";
    data.forEach((message) => {
      domMessages.innerHTML += buildChatHistory(message);
    });
    domMessages.scrollTo(0, domMessages.scrollHeight);
  });

  document.querySelector("#user-input").addEventListener("submit", sendMessage);
};

// TELL SERVER TO JOIN ROOM
const joinRoom = (roomToJoin) => {
  nsSocket.emit("joinRoom", roomToJoin, (membersCount) => {});
};

//  EVENTHANDLER SEND MESSAGE
const sendMessage = (event) => {
  event.preventDefault();
  const newMessage = document.querySelector("#user-message").value;
  if (newMessage !== "")
    nsSocket.emit("newMessageToServer", { text: newMessage });

  document.querySelector("#user-message").value = "";
};

const buildChatHistory = (data) => {
  return `
    <li class="chatMessage">
    <div class="user-image">
        <img src="${data.avatar}" />
    </div>
    <div class="user-message">
        <div class="user-name-time">${data.displayName} <span>${data.datetime}</span></div>
        <div class="message-text">${data.text}</div>
    </div>
    </li>
    `;
};

document.querySelector("#search-box").addEventListener("input", (e) => {
  // console.log(e.target.value);
  const messages = Array.from(document.getElementsByClassName("chatMessage"));
  //   console.log(messages);
  messages.forEach((msg) => {
    console.log(msg.getElementsByClassName("message-text"));
    const domMsg = msg.querySelector(".message-text");
    if (domMsg.textContent.toLowerCase().indexOf(e.target.value.toLowerCase())>-1)
      msg.style.display = "flex";
    else msg.style.display = "none";
  });
});
