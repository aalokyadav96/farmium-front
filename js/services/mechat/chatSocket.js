// onechat-part1.js
import { apiFetch } from "../../api/api";
import { getState, CHAT_URL } from "../../state/state";
import { renderMessage } from "./chomponents/index.js";

/* -------------------------
   Module state
   -------------------------*/
const pendingMap = new Map(); // clientId -> { el, chatId }
const renderedIds = new Set(); // server message ids we already rendered

const ChatState = (() => {
  let socket = null;
  let reconnectAttempts = 0;
  let currentChatId = null;
  let lastMsgListEl = null;

  return {
    setSocket: (ws) => { socket = ws; },
    getSocket: () => socket,
    setReconnectAttempts: (n) => { reconnectAttempts = n; },
    getReconnectAttempts: () => reconnectAttempts,
    incrementReconnectAttempts: () => { reconnectAttempts += 1; },
    resetReconnectAttempts: () => { reconnectAttempts = 0; },
    setChatId: (id) => { currentChatId = id; },
    getChatId: () => currentChatId,
    setLastMsgList: (el) => { lastMsgListEl = el; },
    getLastMsgList: () => lastMsgListEl
  };
})();

/* -------------------------
   Exports (shared state)
   -------------------------*/
let messageContainer = null;

export function getMessageContainer() {
  return messageContainer;
}

export function setMessageContainer(el) {
  messageContainer = el;
}


export { ChatState, pendingMap, renderedIds, renderMessage };
export { apiFetch }; // needed in part2
export { messageContainer };

function wsUrl() {
  const token = getState("token");
  let url = CHAT_URL.replace(/^http/, "ws") + "/ws/merechat";
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
export function connectWebSocket() {
  const existing = ChatState.getSocket();
  if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) return;

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
  };

  socket.onmessage = (ev) => {
    let data;
    try { data = JSON.parse(ev.data); } catch (e) { console.error("Invalid WS JSON:", e); return; }
    handleWSMessage(data);
  };

  socket.onclose = (ev) => {
    console.warn("WebSocket closed:", ev && ev.reason);
    ChatState.setSocket(null);
    scheduleReconnect();
  };

  socket.onerror = (err) => console.error("WebSocket error:", err);
}

function scheduleReconnect() {
  const attempts = ChatState.getReconnectAttempts();
  const base = 1000, max = 30000;
  const delay = Math.min(max, base * Math.pow(2, attempts));
  ChatState.incrementReconnectAttempts();
  setTimeout(connectWebSocket, delay);
}

function handleWSMessage(data) {
  if (!data || !data.type) return;

  switch (data.type) {
    case "message": {
      const serverId = String(data.id);
      if (data.clientId && pendingMap.has(data.clientId)) {
        const p = pendingMap.get(data.clientId);
        if (p && p.chatId === data.chatId) {
          const el = p.el;
          if (el) {
            el.id = `msg-${serverId}`;
            el.style.opacity = "1";
            el.removeAttribute("data-pending");
          }
          pendingMap.delete(data.clientId);
          renderedIds.add(serverId);
        } else {
          pendingMap.delete(data.clientId);
        }
        return;
      }

      if (renderedIds.has(serverId) || document.getElementById(`msg-${serverId}`)) {
        renderedIds.add(serverId);
        return;
      }
      if (data.chatId === ChatState.getChatId()) {
        mountMessage(data, { pending: false });
        renderedIds.add(serverId);
      }
      break;
    }

    case "typing":
      console.log(`${data.sender || "someone"} is typing in chat ${data.chatId}`);
      break;

    case "presence":
      console.log(`${data.sender || data.from} is now ${data.online ? "online" : "offline"}`);
      break;

    default:
      console.log("Unknown WS event:", data);
  }
}
