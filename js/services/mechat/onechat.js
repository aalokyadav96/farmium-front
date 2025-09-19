// onechat-part2.js
import { createElement } from "../../components/createElement";
import Button from "../../components/base/Button.js";
import {
  ChatState,
  pendingMap,
  renderedIds,
  renderMessage,
  apiFetch,
  connectWebSocket,
  closeExistingSocket,
  getMessageContainer,
  setMessageContainer
} from "./chatSocket.js";
// } from "./onechat-part1.js";

/* -------------------------
   Message sending (WS preferred, REST fallback)
   -------------------------*/
export function sendMessage(chatId, content) {
  if (!content || String(content).trim() === "") return null;

  const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const msgData = {
    id: clientId,
    sender: "me",
    content,
    createdAt: new Date().toISOString(),
    pending: true
  };

  const el = mountMessage(msgData, { pending: true });
  pendingMap.set(clientId, { el, chatId });

  const payload = { type: "message", chatId, content, clientId };

  const ws = ChatState.getSocket();
  if (ws && ws.readyState === WebSocket.OPEN) {
    try { ws.send(JSON.stringify(payload)); }
    catch { sendMessageRESTFallback(chatId, content, clientId); }
  } else {
    sendMessageRESTFallback(chatId, content, clientId);
  }

  return clientId;
}

async function sendMessageRESTFallback(chatId, content, clientId) {
  const url = `/merechats/chat/${encodeURIComponent(chatId)}/message`;
  try {
    const serverMsg = await apiFetch(url, "POST", { content, clientId });
    const realId = String(serverMsg.id);
    if (pendingMap.has(clientId)) {
      const p = pendingMap.get(clientId);
      const el = p.el;
      if (el) {
        el.id = `msg-${realId}`;
        el.style.opacity = "1";
        el.removeAttribute("data-pending");
      }
      pendingMap.delete(clientId);
      renderedIds.add(realId);
    } else {
      if (!renderedIds.has(realId) && !document.getElementById(`msg-${realId}`)) {
        mountMessage(serverMsg, { pending: false });
        renderedIds.add(realId);
      }
    }
  } catch (err) {
    console.error("REST send failed:", err);
  }
}

/* -------------------------
   Rendering utilities (wrapper)
   -------------------------*/
function mountMessage(msg, { pending = false } = {}) {
  const node = renderMessage({ ...msg, pending });
  let container = getMessageContainer();
  if (!container) {
    container = document.querySelector(".chat-messages") || document.body;
    setMessageContainer(container);
  }
  const domId = `msg-${msg.id}`;
  node.id = domId;
  if (pending) node.style.opacity = "0.5";

  if (!document.getElementById(domId)) {
    container.appendChild(node);
    try { container.scrollTop = container.scrollHeight; } catch { }
  }
  return node;
}


/* -------------------------
   Load history
   -------------------------*/
async function loadHistory(chatId) {
  let container = getMessageContainer() || document.querySelector(".chat-messages");
  if (!container) return;

  while (container.firstChild) container.removeChild(container.firstChild);

  const url = `/merechats/chat/${encodeURIComponent(chatId)}/messages`;
  try {
    const msgs = await safeApiFetch(url, "GET") || [];
    msgs.forEach(m => {
      const mid = String(m.id);
      if (!renderedIds.has(mid) && !document.getElementById(`msg-${mid}`)) {
        mountMessage(m, { pending: false });
        renderedIds.add(mid);
      }
    });
  } catch (e) {
    console.error("Failed to load history", e);
  }
}


/* -------------------------
   UI: displayOneChat + search
   -------------------------*/
export async function displayOneChat(container, chatId, isLoggedIn) {
  while (container.firstChild) container.removeChild(container.firstChild);

  const header = createElement("div", { class: "chat-header" }, [`Chat ${chatId}`]);
  const messagesDiv = createElement("div", { class: "chat-messages", role: "log", "aria-live": "polite" });
  const input = createElement("input", { type: "text", placeholder: "Type a message..." });

  input.addEventListener("input", () => {
    const ws = ChatState.getSocket();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "typing", chatId }));
    }
  });

  const sendBtn = Button("Send", "send-btn", {
    click: () => {
      const txt = (input.value || "").trim();
      if (txt) {
        sendMessage(chatId, txt);
        input.value = "";
      }
    }
  }, "send-btn-class");

  const footer = createElement("div", { class: "chat-footer" }, [input, sendBtn]);

  container.appendChild(header);
  container.appendChild(messagesDiv);
  container.appendChild(footer);

  ChatState.setChatId(chatId);
  setMessageContainer(messagesDiv);

  await loadHistory(chatId);
  connectWebSocket();
}


/* -------------------------
   Expose programmatic close for tests
   -------------------------*/
export function closeSocket() {
  closeExistingSocket("manual");
}

export async function safeApiFetch(url, method = "GET", body = null, options = {}) {
  try {
    return await apiFetch(url, method, body, options);
  } catch {
    return null;
  }
}


// // onechat.js
// import { apiFetch } from "../../api/api";
// import { createElement } from "../../components/createElement";
// import Button from "../../components/base/Button.js";
// import { getState, CHAT_URL } from "../../state/state";
// import { renderMessage } from "./chomponents/index.js"; // ✅ use shared renderer

// /* -------------------------
//    Module state
//    -------------------------*/
// const pendingMap = new Map(); // clientId -> { el, chatId }
// const renderedIds = new Set(); // server message ids we already rendered

// const ChatState = (() => {
//   let socket = null;
//   let reconnectAttempts = 0;
//   let currentChatId = null;
//   let lastMsgListEl = null;

//   return {
//     setSocket: (ws) => { socket = ws; },
//     getSocket: () => socket,
//     setReconnectAttempts: (n) => { reconnectAttempts = n; },
//     getReconnectAttempts: () => reconnectAttempts,
//     incrementReconnectAttempts: () => { reconnectAttempts += 1; },
//     resetReconnectAttempts: () => { reconnectAttempts = 0; },
//     setChatId: (id) => { currentChatId = id; },
//     getChatId: () => currentChatId,
//     setLastMsgList: (el) => { lastMsgListEl = el; },
//     getLastMsgList: () => lastMsgListEl
//   };
// })();

// /* -------------------------
//    Exports
//    -------------------------*/
// let messageContainer = null;

// export function initMereChat(chatId, container) {
//   ChatState.setChatId(chatId);
//   messageContainer = container;
//   loadHistory(chatId);
//   connectWebSocket();
// }

// /* -------------------------
//    Utilities
//    -------------------------*/
// export async function safeApiFetch(url, method = "GET", body = null, options = {}) {
//   try {
//     return await apiFetch(url, method, body, options);
//   } catch {
//     return null;
//   }
// }

// function wsUrl() {
//   const token = getState("token");
//   let url = CHAT_URL.replace(/^http/, "ws") + "/ws/merechat";
//   if (token) url += `?token=${encodeURIComponent(token)}`;
//   return url;
// }

// function closeExistingSocket(reason = "") {
//   const ws = ChatState.getSocket();
//   if (ws) {
//     try { ws.close(); } catch {}
//     ChatState.setSocket(null);
//   }
//   ChatState.resetReconnectAttempts();
//   if (reason) console.log("Closing WS:", reason);
// }

// /* -------------------------
//    WebSocket connection & handlers
//    -------------------------*/
// function connectWebSocket() {
//   const existing = ChatState.getSocket();
//   if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) return;

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

//   socket.onmessage = (ev) => {
//     let data;
//     try { data = JSON.parse(ev.data); } catch (e) { console.error("Invalid WS JSON:", e); return; }
//     handleWSMessage(data);
//   };

//   socket.onclose = (ev) => {
//     console.warn("WebSocket closed:", ev && ev.reason);
//     ChatState.setSocket(null);
//     scheduleReconnect();
//   };

//   socket.onerror = (err) => console.error("WebSocket error:", err);
// }

// function scheduleReconnect() {
//   const attempts = ChatState.getReconnectAttempts();
//   const base = 1000, max = 30000;
//   const delay = Math.min(max, base * Math.pow(2, attempts));
//   ChatState.incrementReconnectAttempts();
//   setTimeout(connectWebSocket, delay);
// }

// function handleWSMessage(data) {
//   if (!data || !data.type) return;

//   switch (data.type) {
//     case "message": {
//       const serverId = String(data.id);
//       if (data.clientId && pendingMap.has(data.clientId)) {
//         const p = pendingMap.get(data.clientId);
//         if (p && p.chatId === data.chatId) {
//           // upgrade the pending DOM node to real id
//           const el = p.el;
//           if (el) {
//             el.id = `msg-${serverId}`;
//             el.style.opacity = "1";
//             el.removeAttribute("data-pending");
//           }
//           pendingMap.delete(data.clientId);
//           renderedIds.add(serverId);
//         } else {
//           pendingMap.delete(data.clientId);
//         }
//         return;
//       }

//       if (renderedIds.has(serverId) || document.getElementById(`msg-${serverId}`)) {
//         renderedIds.add(serverId);
//         return;
//       }
//       if (data.chatId === ChatState.getChatId()) {
//         mountMessage(data, { pending: false });
//         renderedIds.add(serverId);
//       }
//       break;
//     }

//     case "typing":
//       console.log(`${data.sender || "someone"} is typing in chat ${data.chatId}`);
//       break;

//     case "presence":
//       console.log(`${data.sender || data.from} is now ${data.online ? "online" : "offline"}`);
//       break;

//     default:
//       console.log("Unknown WS event:", data);
//   }
// }

// /* -------------------------
//    Message sending (WS preferred, REST fallback)
//    -------------------------*/
// export function sendMessage(chatId, content) {
//   if (!content || String(content).trim() === "") return null;

//   const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
//   const msgData = {
//     id: clientId,
//     sender: "me",
//     content,
//     createdAt: new Date().toISOString(),
//     pending: true
//   };

//   const el = mountMessage(msgData, { pending: true });
//   pendingMap.set(clientId, { el, chatId });

//   const payload = { type: "message", chatId, content, clientId };

//   const ws = ChatState.getSocket();
//   if (ws && ws.readyState === WebSocket.OPEN) {
//     try { ws.send(JSON.stringify(payload)); }
//     catch { sendMessageRESTFallback(chatId, content, clientId); }
//   } else {
//     sendMessageRESTFallback(chatId, content, clientId);
//   }

//   return clientId;
// }

// async function sendMessageRESTFallback(chatId, content, clientId) {
//   const url = `/merechats/chat/${encodeURIComponent(chatId)}/message`;
//   try {
//     const serverMsg = await apiFetch(url, "POST", { content, clientId });
//     const realId = String(serverMsg.id);
//     if (pendingMap.has(clientId)) {
//       const p = pendingMap.get(clientId);
//       const el = p.el;
//       if (el) {
//         el.id = `msg-${realId}`;
//         el.style.opacity = "1";
//         el.removeAttribute("data-pending");
//       }
//       pendingMap.delete(clientId);
//       renderedIds.add(realId);
//     } else {
//       if (!renderedIds.has(realId) && !document.getElementById(`msg-${realId}`)) {
//         mountMessage(serverMsg, { pending: false });
//         renderedIds.add(realId);
//       }
//     }
//   } catch (err) {
//     console.error("REST send failed:", err);
//   }
// }

// /* -------------------------
//    Rendering utilities (wrapper)
//    -------------------------*/
// function mountMessage(msg, { pending = false } = {}) {
//   const node = renderMessage({ ...msg, pending });
//   // Ensure container
//   if (!messageContainer) {
//     const main = document.querySelector(".chat-messages") || document.body;
//     messageContainer = main;
//   }
//   // Assign a stable DOM id for dedupe/scrolling
//   const domId = `msg-${msg.id}`;
//   node.id = domId;
//   if (pending) node.style.opacity = "0.5";

//   if (!document.getElementById(domId)) {
//     messageContainer.appendChild(node);
//     try { messageContainer.scrollTop = messageContainer.scrollHeight; } catch {}
//   }
//   return node;
// }

// /* -------------------------
//    Load history
//    -------------------------*/
// async function loadHistory(chatId) {
//   messageContainer = messageContainer || document.querySelector(".chat-messages");
//   if (!messageContainer) return;

//   while (messageContainer.firstChild) messageContainer.removeChild(messageContainer.firstChild);

//   const url = `/merechats/chat/${encodeURIComponent(chatId)}/messages`;
//   try {
//     const msgs = await safeApiFetch(url, "GET") || [];
//     msgs.forEach(m => {
//       const mid = String(m.id);
//       if (!renderedIds.has(mid) && !document.getElementById(`msg-${mid}`)) {
//         mountMessage(m, { pending: false });
//         renderedIds.add(mid);
//       }
//     });
//   } catch (e) {
//     console.error("Failed to load history", e);
//   }
// }

// /* -------------------------
//    UI: displayOneChat + search
//    -------------------------*/
// export async function displayOneChat(container, chatId, isLoggedIn) {
//   while (container.firstChild) container.removeChild(container.firstChild);

//   const header = createElement("div", { class: "chat-header" }, [ `Chat ${chatId}` ]);
//   const messagesDiv = createElement("div", { class: "chat-messages", role: "log", "aria-live": "polite" });
//   const input = createElement("input", { type: "text", placeholder: "Type a message..." });

//   input.addEventListener("input", () => {
//     const ws = ChatState.getSocket();
//     if (ws && ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify({ type: "typing", chatId }));
//     }
//   });

//   const sendBtn = Button("Send", "send-btn", {
//     click: () => {
//       const txt = (input.value || "").trim();
//       if (txt) {
//         sendMessage(chatId, txt);
//         input.value = "";
//       }
//     }
//   }, "send-btn-class");

//   const footer = createElement("div", { class: "chat-footer" }, [ input, sendBtn ]);

//   container.appendChild(header);
//   container.appendChild(messagesDiv);
//   container.appendChild(footer);

//   ChatState.setChatId(chatId);
//   messageContainer = messagesDiv;

//   await loadHistory(chatId);
//   connectWebSocket();
// }

// /* -------------------------
//    Expose programmatic close for tests
//    -------------------------*/
// export function closeSocket() {
//   closeExistingSocket("manual");
// }
