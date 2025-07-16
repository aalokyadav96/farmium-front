// socket.js
import { renderMessage } from "./chomponents/index.js";
import { getChatState } from "./chatState.js";

let reconnectAttempts = 0;
let msgListGlobal = null;

export function setupWebSocket(msgList) {
  if (msgListGlobal) msgListGlobal = msgList;
  else msgListGlobal = msgList;

  const { currentChatId } = getChatState();

  const protocol = window.location.protocol.replace("http", "ws");
  const url = `${protocol}//${window.location.host}/ws/merechat/${currentChatId}`;
  const ws = new WebSocket(url);

  ws.onopen = () => {
    reconnectAttempts = 0;
    console.info("WS open");
  };

  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    if (data.type === "message") {
      // dedupe
      if (!msgListGlobal.querySelector(`[data-id="${data.id}"]`)) {
        msgListGlobal.appendChild(renderMessage(data));
        msgListGlobal.scrollTop = msgListGlobal.scrollHeight;
      }
    }
    if (data.type === "typing") {
      showTypingIndicator(data.sender);
    }
  };

  ws.onclose = () => {
    const delay = Math.min(10000, 1000 * 2 ** reconnectAttempts++);
    console.warn(`WS closed, reconnecting in ${delay}ms`);
    setTimeout(() => setupWebSocket(msgListGlobal), delay);
  };

  window.socket = ws;
}

function showTypingIndicator(user) {
  let el = document.querySelector(".typing-indicator");
  if (!el) {
    el = document.createElement("div");
    el.className = "typing-indicator";
    el.textContent = `${user} is typing…`;
    msgListGlobal.parentElement.appendChild(el);
  }
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => el.remove(), 2000);
}

// // socket.js
// import { renderMessage } from "./chomponents/index.js";
// import { getChatState } from "./chatState.js";

// export function setupWebSocket(msgList) {
//     const { currentChatId } = getChatState();

//     if (window.socket) window.socket.close();

//     // window.socket = new WebSocket(`ws://yourserver.com/ws/${currentChatId}`);
//     window.socket = new WebSocket(`${window.location.protocol.replace("http", "ws")}//127.0.0.1:4000/ws/merechat`);

//     window.socket.onmessage = (event) => {
//         const data = JSON.parse(event.data);
//         if (data.type === "message") {
//             msgList.appendChild(renderMessage(data));
//         }
//     };

//     window.socket.onclose = () => {
//         console.warn("Socket closed.");
//     };
// }
