import { getState, MERE_URL } from "../../state/state.js";
import { renderMessage } from "./components/index.js";

/* -------------------------
   Module state
   -------------------------*/
const pendingMap = new Map();
const renderedIdsMap = new Map(); // chatid → Set

const ChatState = (() => {
  let socket = null;
  let reconnectAttempts = 0;
  let currentChatId = null;
  let lastMsgListEl = null;

  return {
    setSocket: ws => { socket = ws; },
    getSocket: () => socket,
    setReconnectAttempts: n => { reconnectAttempts = n; },
    getReconnectAttempts: () => reconnectAttempts,
    incrementReconnectAttempts: () => { reconnectAttempts += 1; },
    resetReconnectAttempts: () => { reconnectAttempts = 0; },
    setChatId: id => {
      currentChatId = id;
      if (!renderedIdsMap.has(id)) renderedIdsMap.set(id, new Set());
    },
    getChatId: () => currentChatId,
    setLastMsgList: el => { lastMsgListEl = el; },
    getLastMsgList: () => lastMsgListEl
  };
})();

/* -------------------------
   Shared message container
   -------------------------*/
let messageContainer = null;
export function getMessageContainer() { return messageContainer; }
export function setMessageContainer(el) { messageContainer = el; }

/* -------------------------
   Mount message (shared)
   -------------------------*/
export function mountMessage(msg, { pending = false } = {}) {
  const node = renderMessage({ ...msg, pending });
  const container = getMessageContainer() || document.querySelector(".chat-messages");
  if (!container) return null;

  const domId = `msg-${msg.messageid || msg.id}`;
  node.id = domId;
  if (pending) node.style.opacity = "0.5";

  if (!document.getElementById(domId)) {
    container.appendChild(node);
    try { container.scrollTop = container.scrollHeight; } catch { }
  }
  return node;
}

/* -------------------------
   Exports
   -------------------------*/
export { ChatState, pendingMap, renderedIdsMap, renderMessage };

/* -------------------------
   WebSocket utils
   -------------------------*/
function wsUrl() {
  const token = getState("token");
  let url = MERE_URL.replace(/^http/, "ws") + "/ws/merechat";
  if (token) url += `?token=${encodeURIComponent(token)}`;
  return url;
}

export function closeExistingSocket(reason = "") {
  const ws = ChatState.getSocket();
  if (ws) {
    try { ws.close(); } catch { }
    ChatState.setSocket(null);
  }
  ChatState.resetReconnectAttempts();
  if (reason) console.log("Closing WS:", reason);
}

/* -------------------------
   WebSocket connection & handlers
   -------------------------*/
let reconnectTimer = null;

export function connectWebSocket() {
  const existing = ChatState.getSocket();
  if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) return;

  clearTimeout(reconnectTimer);
  const url = wsUrl();
  let socket;
  try {
    socket = new WebSocket(url);
  } catch {
    scheduleReconnect();
    return;
  }

  ChatState.setSocket(socket);

  socket.onopen = () => {
    ChatState.resetReconnectAttempts();
    console.log("✅ WebSocket connected");
    const token = getState("token");
    if (token) socket.send(JSON.stringify({ type: "presence", online: true }));

    const currentChatId = ChatState.getChatId();
    if (currentChatId) {
      socket.send(JSON.stringify({ type: "join", chatid: currentChatId }));
    }
  };

  socket.onmessage = ev => {
    let data;
    try { data = JSON.parse(ev.data); }
    catch (e) { console.error("Invalid WS JSON:", e); return; }
    handleWSMessage(data);
  };

  socket.onerror = err => {
    console.error("WebSocket error:", err);
    socket.close();
  };

  socket.onclose = ev => {
    console.warn("WebSocket closed:", ev?.reason || "no reason");
    ChatState.setSocket(null);
    scheduleReconnect();
  };
}

function scheduleReconnect() {
  const attempts = ChatState.getReconnectAttempts();
  const base = 1000, max = 30000;
  const delay = Math.min(max, base * Math.pow(2, attempts));
  ChatState.incrementReconnectAttempts();
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connectWebSocket, delay);
}

/* -------------------------
   Handle WS messages
   -------------------------*/
function handleWSMessage(data) {
  if (!data || !data.type) return;

  switch (data.type) {
    case "message": {
      const serverId = String(data.messageid);
      const chatid = data.chatid;
      const renderedIds = renderedIdsMap.get(chatid) || new Set();

      if (data.clientId && pendingMap.has(data.clientId)) {
        const p = pendingMap.get(data.clientId);
        if (p?.chatid === data.chatid) {
          const el = p.el;
          if (el) {
            el.id = `msg-${serverId}`;
            el.style.opacity = "1";
            el.removeAttribute("data-pending");
          }
          pendingMap.delete(data.clientId);
          renderedIds.add(serverId);
          renderedIdsMap.set(chatid, renderedIds);
        } else pendingMap.delete(data.clientId);
        return;
      }

      if (renderedIds.has(serverId) || document.getElementById(`msg-${serverId}`)) return;
      if (chatid === ChatState.getChatId()) {
        mountMessage(data, { pending: false });
        renderedIds.add(serverId);
        renderedIdsMap.set(chatid, renderedIds);
      }
      break;
    }

    case "typing":
      console.log(`${data.sender || "someone"} is typing in chat ${data.chatid}`);
      break;

    case "presence":
      console.log(`${data.sender || data.from} is now ${data.online ? "online" : "offline"}`);
      break;

    default:
      console.log("Unknown WS event:", data);
  }
}

// // chatSocket.js
// import { getState, MERE_URL } from "../../state/state.js";
// import { renderMessage } from "./components/index.js"; // fixed path

// /* -------------------------
//    Module state
//    -------------------------*/
// const pendingMap = new Map();
// const renderedIds = new Set();

// const ChatState = (() => {
//   let socket = null;
//   let reconnectAttempts = 0;
//   let currentChatId = null;
//   let lastMsgListEl = null;

//   return {
//     setSocket: ws => { socket = ws; },
//     getSocket: () => socket,
//     setReconnectAttempts: n => { reconnectAttempts = n; },
//     getReconnectAttempts: () => reconnectAttempts,
//     incrementReconnectAttempts: () => { reconnectAttempts += 1; },
//     resetReconnectAttempts: () => { reconnectAttempts = 0; },
//     setChatId: id => { currentChatId = id; },
//     getChatId: () => currentChatId,
//     setLastMsgList: el => { lastMsgListEl = el; },
//     getLastMsgList: () => lastMsgListEl
//   };
// })();

// /* -------------------------
//    Shared message container
//    -------------------------*/
// let messageContainer = null;
// export function getMessageContainer() { return messageContainer; }
// export function setMessageContainer(el) { messageContainer = el; }

// /* -------------------------
//    Internal helper
//    -------------------------*/
// function mountMessage(msg, { pending = false } = {}) {
//   const node = renderMessage({ ...msg, pending });
//   const container = getMessageContainer() || document.querySelector(".chat-messages");
//   if (!container) return;
//   const domId = `msg-${msg.messageid}`;
//   node.id = domId;
//   if (pending) node.style.opacity = "0.5";
//   if (!document.getElementById(domId)) container.appendChild(node);
// }

// /* -------------------------
//    Exports
//    -------------------------*/
// export { ChatState, pendingMap, renderedIds, renderMessage };

// /* -------------------------
//    WebSocket utils
//    -------------------------*/
// function wsUrl() {
//   const token = getState("token");
//   let url = MERE_URL.replace(/^http/, "ws") + "/ws/merechat";
//   if (token) url += `?token=${encodeURIComponent(token)}`;
//   return url;
// }

// export function closeExistingSocket(reason = "") {
//   const ws = ChatState.getSocket();
//   if (ws) {
//     try { ws.close(); } catch { }
//     ChatState.setSocket(null);
//   }
//   ChatState.resetReconnectAttempts();
//   if (reason) console.log("Closing WS:", reason);
// }

// /* -------------------------
//    WebSocket connection & handlers
//    -------------------------*/
// let reconnectTimer = null;

// export function connectWebSocket() {
//   const existing = ChatState.getSocket();
//   if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) return;

//   clearTimeout(reconnectTimer);
//   const url = wsUrl();
//   let socket;
//   try {
//     socket = new WebSocket(url);
//   } catch {
//     scheduleReconnect();
//     return;
//   }

//   ChatState.setSocket(socket);

//   socket.onopen = () => {
//     ChatState.resetReconnectAttempts();
//     console.log("✅ WebSocket connected");
//     const token = getState("token");
//     if (token) socket.send(JSON.stringify({ type: "presence", online: true }));
//   };

//   socket.onmessage = ev => {
//     let data;
//     try { data = JSON.parse(ev.data); } 
//     catch (e) { console.error("Invalid WS JSON:", e); return; }
//     handleWSMessage(data);
//   };

//   socket.onerror = err => {
//     console.error("WebSocket error:", err);
//     socket.close();
//   };

//   socket.onclose = ev => {
//     console.warn("WebSocket closed:", ev?.reason || "no reason");
//     ChatState.setSocket(null);
//     scheduleReconnect();
//   };
// }

// function scheduleReconnect() {
//   const attempts = ChatState.getReconnectAttempts();
//   const base = 1000, max = 30000;
//   const delay = Math.min(max, base * Math.pow(2, attempts));
//   ChatState.incrementReconnectAttempts();
//   clearTimeout(reconnectTimer);
//   reconnectTimer = setTimeout(connectWebSocket, delay);
// }

// /* -------------------------
//    Handle WS messages
//    -------------------------*/
// function handleWSMessage(data) {
//   if (!data || !data.type) return;

//   switch (data.type) {
//     case "message": {
//       const serverId = String(data.messageid);
//       if (data.clientId && pendingMap.has(data.clientId)) {
//         const p = pendingMap.get(data.clientId);
//         if (p?.chatid === data.chatid) {
//           const el = p.el;
//           if (el) {
//             el.id = `msg-${serverId}`;
//             el.style.opacity = "1";
//             el.removeAttribute("data-pending");
//           }
//           pendingMap.delete(data.clientId);
//           renderedIds.add(serverId);
//         } else pendingMap.delete(data.clientId);
//         return;
//       }

//       if (renderedIds.has(serverId) || document.getElementById(`msg-${serverId}`)) return;
//       if (data.chatid === ChatState.getChatId()) {
//         mountMessage(data, { pending: false });
//         renderedIds.add(serverId);
//       }
//       break;
//     }

//     case "typing":
//       console.log(`${data.sender || "someone"} is typing in chat ${data.chatid}`);
//       break;

//     case "presence":
//       console.log(`${data.sender || data.from} is now ${data.online ? "online" : "offline"}`);
//       break;

//     default:
//       console.log("Unknown WS event:", data);
//   }
// }
