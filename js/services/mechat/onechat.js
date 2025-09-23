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
