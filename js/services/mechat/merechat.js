// merechat.js
import { apiFetch } from "../../api/api";
import { createElement } from "../../components/createElement";
import Button from "../../components/base/Button.js";
import { t } from "./i18n.js";
import { getState, SRC_URL } from "../../state/state";
import { renderMessage } from "./chomponents/index.js";

// ───────────────────────────────────────────────────────────────────────────────
// chatState.js (refactored)
// ───────────────────────────────────────────────────────────────────────────────
const ChatState = (() => {
  let currentChatId = null;
  let messageSkip = 0;
  let chatListSkip = 0;

  /** WebSocket + reconnection state */
  let socket = null;
  let reconnectAttempts = 0;
  let lastMsgListEl = null;

  function setChatId(id) {
    currentChatId = id;
    messageSkip = 0;
  }

  function getChatState() {
    return { currentChatId, messageSkip };
  }

  function resetMsgSkip() {
    messageSkip = 0;
  }
  function incrementMsgSkip(n) {
    messageSkip += n;
  }

  function resetChatListSkip() {
    chatListSkip = 0;
  }
  function incrementChatListSkip(n) {
    chatListSkip += n;
  }
  function getChatListSkip() {
    return chatListSkip;
  }

  function setSocket(ws) {
    socket = ws;
  }
  function getSocket() {
    return socket;
  }
  function setReconnectAttempts(n) {
    reconnectAttempts = n;
  }
  function getReconnectAttempts() {
    return reconnectAttempts;
  }
  function setLastMsgList(el) {
    lastMsgListEl = el;
  }
  function getLastMsgList() {
    return lastMsgListEl;
  }

  return {
    setChatId, getChatState, resetMsgSkip, incrementMsgSkip,
    resetChatListSkip, incrementChatListSkip, getChatListSkip,
    setSocket, getSocket, setReconnectAttempts, getReconnectAttempts,
    setLastMsgList, getLastMsgList
  };
})();

// ───────────────────────────────────────────────────────────────────────────────
// socket.js (refactored & hardened)
// ───────────────────────────────────────────────────────────────────────────────

function closeExistingSocket(reason = "switch") {
  const ws = ChatState.getSocket();
  if (!ws) return;
  try {
    // mark manual close so reconnect logic ignores it
    ws._manualClose = true;

    // remove any named listeners we attached
    try {
      if (ws._onopen) ws.removeEventListener("open", ws._onopen);
      if (ws._onmessage) ws.removeEventListener("message", ws._onmessage);
      if (ws._onclose) ws.removeEventListener("close", ws._onclose);
      if (ws._onerror) ws.removeEventListener("error", ws._onerror);
    } catch (err) { /* ignore */ }

    if (ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
      try { ws.close(1000, reason); } catch (e) { /* ignore */ }
    }
  } catch (err) { /* ignore */ }
  ChatState.setSocket(null);
}

export function setupWebSocket(msgList) {
  // Remember the message list for reconnect handlers
  ChatState.setLastMsgList(msgList);

  // Close previous socket (if any)
  closeExistingSocket("reopen");

  const { currentChatId } = ChatState.getChatState();
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${proto}//${window.location.host}/ws/merechat/${currentChatId}`;
  const ws = new WebSocket(url);

  // store socket on state
  ChatState.setSocket(ws);

  // Named handlers so we can remove them on closeExistingSocket
  ws._onopen = () => {
    ChatState.setReconnectAttempts(0);
    ensureStatusBar(msgList, "connected");
  };

  ws._onmessage = (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (err) {
      // ignore malformed messages
      console.warn("Malformed WS message:", err);
      return;
    }

    if (data.type === "message") {
      // If server echoed clientId, reconcile pending message
      if (data.clientId) {
        const pending = msgList.querySelector(`[data-client-id="${data.clientId}"]`);
        if (pending) {
          pending.replaceWith(renderMessage(data));
          // keep scroll pinned to bottom when appropriate
          msgList.scrollTop = msgList.scrollHeight;
          return;
        }
      }

      // dedupe by server id
      if (!msgList.querySelector(`[data-id="${data.id}"]`)) {
        msgList.appendChild(renderMessage(data));
        // auto-scroll only when near bottom
        const atBottom = (msgList.scrollHeight - msgList.scrollTop - msgList.clientHeight) < 100;
        if (atBottom) msgList.scrollTop = msgList.scrollHeight;
      }
    } else if (data.type === "typing") {
      showTypingIndicator(msgList, data.sender);
    }
  };

  ws._onclose = () => {
    if (ws._manualClose) return;
    const attempts = ChatState.getReconnectAttempts();
    const delay = Math.min(10000, 1000 * 2 ** attempts);
    ChatState.setReconnectAttempts(attempts + 1);
    ensureStatusBar(msgList, "reconnecting");
    // Reconnect
    setTimeout(() => {
      const lastList = ChatState.getLastMsgList();
      if (lastList) setupWebSocket(lastList);
    }, delay);
  };

  ws._onerror = () => {
    ensureStatusBar(msgList, "error");
  };

  ws.addEventListener("open", ws._onopen);
  ws.addEventListener("message", ws._onmessage);
  ws.addEventListener("close", ws._onclose);
  ws.addEventListener("error", ws._onerror);
}

function ensureStatusBar(msgList, state) {
  let bar = msgList.parentElement.querySelector('[data-role="ws-status"]');
  if (!bar) {
    bar = createElement("div", {
      "data-role": "ws-status",
      role: "status",
      "aria-live": "polite",
      class: "ws-status"
    }, []);
    msgList.parentElement.appendChild(bar);
  }
  const text = state === "connected"
    ? (t("chat.ws_connected") || "Connected")
    : state === "reconnecting"
    ? (t("chat.ws_reconnecting") || "Reconnecting…")
    : (t("chat.ws_error") || "Connection issue");
  // replaceChildren with a text node
  bar.replaceChildren(text);
}

function showTypingIndicator(msgList, user) {
  let wrap = msgList.parentElement.querySelector('[data-role="typing-indicator"]');
  if (!wrap) {
    wrap = createElement("div", {
      "data-role": "typing-indicator",
      role: "status",
      "aria-live": "polite",
      class: "typing-indicator"
    }, []);
    msgList.parentElement.appendChild(wrap);
  }
  wrap.replaceChildren(`${user} ${t("chat.is_typing") || "is typing…"} `);

  clearTimeout(wrap._timeout);
  wrap._timeout = setTimeout(() => {
    if (wrap && wrap.parentElement) wrap.parentElement.removeChild(wrap);
  }, 2000);
}

// ───────────────────────────────────────────────────────────────────────────────
// chatComponents.js (refactored)
// ───────────────────────────────────────────────────────────────────────────────

function showNewChatForm(container, listContainer, chatContainer) {
  // remove existing form in this container only
  const existing = container.querySelector(".new-chat-form");
  if (existing) existing.remove();

  const input = createElement("input", {
    type: "text",
    placeholder: t("chat.placeholder_ids"),
    "aria-label": t("chat.placeholder_ids")
  });

  const startBtn = createElement("button", {
    "aria-pressed": "false"
  }, [ t("chat.start") ]);

  const form = createElement("div", { class: "new-chat-form" }, [ input, startBtn ]);

  startBtn.addEventListener("click", async () => {
    const participants = String(input.value || "")
      .split(",").map(s=>s.trim()).filter(Boolean);
    if (participants.length < 2) {
      alert("Need at least 2 IDs");
      return;
    }
    if (!participants.includes(getState("user"))) {
      participants.push(getState("user"));
    }
    try {
      const chat = await apiFetch("/merechats/start", "POST", { participants });
      form.remove();
      await loadChatList(listContainer, chatContainer, true);
      openChat(chat.id, chatContainer);
    } catch (e) {
      alert("Failed to start chat");
    }
  });

  container.appendChild(form);
}

export function createNewChatButton(listContainer, chatContainer) {
  const btnEl = Button(t("chat.new_chat") || "New Chat");
  const btn = btnEl && btnEl.nodeType === 1
    ? btnEl
    : createElement("button", { class: "new-chat-btn" }, [t("chat.new_chat") || "New Chat"]);

  btn.addEventListener("click", () =>
    showNewChatForm(btn.parentElement, listContainer, chatContainer)
  );
  return btn;
}

function debounce(fn, ms = 200) {
  let tId;
  return (...args) => {
    clearTimeout(tId);
    tId = setTimeout(() => fn(...args), ms);
  };
}

export function createSearchBar(chatView) {
  const input = createElement("input", {
    class: "chat-search",
    type: "search",
    placeholder: t("chat.search"),
    "aria-label": t("chat.search")
  });

  const handler = debounce(() => {
    const term = String(input.value || "").toLowerCase();
    chatView.querySelectorAll(".message").forEach(el => {
      const content = el.querySelector(".msg-content")?.textContent.toLowerCase() || "";
      el.style.display = content.includes(term) ? "" : "none";
    });
  }, 200);

  input.addEventListener("input", handler);

  return createElement("div", { class: "search-bar" }, [ input ]);
}

function createUploadHandler(chatId, msgList) {
  return async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadedMsg = await apiFetch(`/merechats/chat/${chatId}/upload`, "POST", formData, {
        isFormData: true,
      });

      if (!uploadedMsg || !uploadedMsg.id) {
        throw new Error("Invalid response from server");
      }

      const rendered = renderMessage(uploadedMsg);
      msgList.appendChild(rendered);
      msgList.scrollTop = msgList.scrollHeight;
    } catch (err) {
      const sys = renderMessage({
        id: `sys-${Date.now()}`,
        sender: "system",
        createdAt: new Date().toISOString(),
        content: t("chat.upload_failed") || "Upload failed"
      });
      msgList.appendChild(sys);
    }
  };
}

export function createMessageInputArea(msgList, chatId, onMessageSent) {
  const uploadFile = createUploadHandler(chatId, msgList);

  const textInput = createElement("input", {
    type: "text",
    placeholder: t("chat.type_message"),
    "aria-label": t("chat.type_message"),
    "aria-keyshortcuts": "Enter",
  });

  const sendBtn = createElement("button", { "aria-label": t("chat.send") }, [t("chat.send")]);
  const fileBtn = createElement("button", { class: "file-upload-btn", "aria-label": t("chat.upload") }, [t("chat.upload")]);
  const fileInput = createElement("input", { type: "file", hidden: true, "aria-hidden": "true" });

  // Drag & Drop
  msgList.addEventListener("dragover", (e) => e.preventDefault());
  msgList.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!e.dataTransfer.files.length) return;
    uploadFile(e.dataTransfer.files[0]);
  });

  // Send button
  sendBtn.addEventListener("click", () => onMessageSent(textInput, msgList));

  // Typing throttling
  function throttle(fn, wait) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last > wait) {
        last = now;
        fn(...args);
      }
    };
  }

  const sendTyping = throttle(() => {
    const sock = ChatState.getSocket();
    if (sock?.readyState === WebSocket.OPEN) {
      try {
        sock.send(JSON.stringify({ type: "typing", chatId }));
      } catch (err) { /* ignore */ }
    }
  }, 1500);

  // Enter key + typing event
  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      onMessageSent(textInput, msgList);
    } else {
      sendTyping();
    }
  });

  // File upload via file picker
  fileBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    if (!fileInput.files.length) return;
    uploadFile(fileInput.files[0]);
    fileInput.value = ""; // reset input
  });

  return createElement("div", { class: "message-input" }, [
    textInput, sendBtn, fileBtn, fileInput
  ]);
}

// ───────────────────────────────────────────────────────────────────────────────
// chatHandlers.js (refactored & hardened)
// ───────────────────────────────────────────────────────────────────────────────

async function safeApiFetch(url, method = "GET", body = null, options = {}) {
  try {
    return await apiFetch(url, method, body, options);
  } catch (e) {
    return null;
  }
}

export async function loadChatList(listContainer, chatModal, reset = false) {
  if (reset) {
    ChatState.resetChatListSkip();
    while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild);
  }

  const skip = ChatState.getChatListSkip();
  listContainer.setAttribute("aria-busy", "true");
  const chats = await safeApiFetch(`/merechats/all?skip=${skip}&limit=20`, "GET") || [];

  chats.forEach(chat => {
    const label = (chat.participants || [])
      .filter(p => p !== getState("user")).join(", ") || "(no one)";

    const btn = createElement("button", {
      class: "chat-item-button",
      dataset: { id: chat.id },
      role: "button",
      "aria-label": `Chat with ${label}`
    }, [label]);

    btn.addEventListener("click", async () => {
      // Open in modal area
      chatModal.classList.add("active");
      chatModal.replaceChildren(
        createElement("button", {
          class: "chat-back-button",
          "aria-label": "Back to chat list"
        }, ["← Back"])
      );

      chatModal.querySelector(".chat-back-button")
        .addEventListener("click", () => {
          chatModal.classList.remove("active");
          chatModal.replaceChildren();
          // Close socket on back
          closeExistingSocket("back");
        });

      await openChat(chat.id, chatModal);
    });

    listContainer.appendChild(btn);
  });

  ChatState.incrementChatListSkip(chats.length);
  listContainer.setAttribute("aria-busy", "false");

  // Infinite scroll on list container's parent
  if (!listContainer.parentElement.hasAttribute("data-scroll-registered")) {
    listContainer.parentElement.setAttribute("data-scroll-registered", "true");

    listContainer.parentElement.addEventListener("scroll", async () => {
      const { scrollTop, scrollHeight, clientHeight } = listContainer.parentElement;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        await loadChatList(listContainer, chatModal);
      }
    });
  }
}

export async function openChat(chatId, container) {
  const openedId = container.getAttribute("data-open-chat-id");
  if (openedId === String(chatId)) return;

  // Disconnect existing observer on previous message list if present
  const prevMsgList = container.querySelector(".chat-message-list");
  if (prevMsgList && prevMsgList._io) {
    try { prevMsgList._io.disconnect(); } catch (e) { /* ignore */ }
    delete prevMsgList._io;
  }

  container.setAttribute("data-open-chat-id", chatId);
  ChatState.setChatId(chatId);
  ChatState.resetMsgSkip();

  // Clear container safely
  container.replaceChildren();

  const msgList = createElement("div", {
    class: "chat-message-list",
    role: "log",
    "aria-relevant": "additions text",
    "aria-busy": "true"
  });

  const inputArea = createMessageInputArea(msgList, chatId, sendText);
  container.append(msgList, inputArea);

  await loadMessages(msgList, false);
  setupWebSocket(msgList);
  setupScrollLoading(msgList);

  container.classList.add("active");
}

export async function loadMessages(msgList, prepend) {
  const { currentChatId, messageSkip } = ChatState.getChatState();
  msgList.setAttribute("aria-busy", "true");

  const messages = await safeApiFetch(
    `/merechats/chat/${currentChatId}/messages?skip=${messageSkip}&limit=50`, "GET"
  ) || [];

  ChatState.incrementMsgSkip(messages.length);

  if (prepend) {
    // Keep scroll position stable
    const firstVisible = msgList.firstElementChild;
    const prevTop = firstVisible ? firstVisible.getBoundingClientRect().top : 0;
    messages.reverse().forEach(msg => msgList.prepend(renderMessage(msg)));
    const newTop = firstVisible ? firstVisible.getBoundingClientRect().top : 0;
    msgList.scrollTop += (newTop - prevTop);
  } else {
    const atBottom = (msgList.scrollHeight - msgList.scrollTop - msgList.clientHeight) < 100;
    messages.forEach(msg => msgList.appendChild(renderMessage(msg)));
    if (atBottom) msgList.scrollTop = msgList.scrollHeight;
  }

  msgList.setAttribute("aria-busy", "false");
}

function setupScrollLoading(msgList) {
  let sentinel = msgList.querySelector('[data-role="top-sentinel"]');
  if (!sentinel) {
    sentinel = createElement("div", { "data-role": "top-sentinel", class: "top-sentinel" }, []);
    msgList.prepend(sentinel);
  }

  // Avoid creating multiple observers
  if (msgList._io) return;

  const io = new IntersectionObserver(async (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        await loadMessages(msgList, true);
      }
    }
  }, { root: msgList, threshold: 0.01 });

  io.observe(sentinel);
  msgList._io = io;
}

async function sendText(input, msgList) {
  const content = String(input.value || "").trim();
  if (!content) return;

  const clientId = `c-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;

  const pending = {
    id: clientId,
    sender: getState("user"),
    createdAt: new Date().toISOString(),
    content,
    pending: true
  };

  const el = renderMessage(pending);
  // mark DOM node with data-client-id so we can match later
  el.dataset.clientId = clientId;
  msgList.appendChild(el);
  msgList.scrollTop = msgList.scrollHeight;

  // Clear input without using textContent/innerHTML
  input.value = "";

  const { currentChatId } = ChatState.getChatState();
  const sock = ChatState.getSocket();

  try {
    if (sock?.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({
        type: "message",
        chatId: currentChatId,
        content,
        clientId
      }));
    } else {
      const msg = await apiFetch(`/merechats/chat/${currentChatId}/message`, "POST", { content, clientId });
      if (msg?.clientId) {
        const pendingEl = msgList.querySelector(`[data-client-id="${msg.clientId}"]`);
        if (pendingEl) pendingEl.replaceWith(renderMessage(msg));
        else if (!msgList.querySelector(`[data-id="${msg.id}"]`)) {
          msgList.appendChild(renderMessage(msg));
        }
      } else if (!msgList.querySelector(`[data-id="${msg.id}"]`)) {
        msgList.appendChild(renderMessage(msg));
      }
    }
  } catch (e) {
    const sys = renderMessage({
      id: `sys-${Date.now()}`,
      sender: "system",
      createdAt: new Date().toISOString(),
      content: t("chat.send_failed") || "Failed to send"
    });
    msgList.appendChild(sys);
  } finally {
    msgList.scrollTop = msgList.scrollHeight;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// chatUI.js + onechat.js (refactored)
// ───────────────────────────────────────────────────────────────────────────────

export async function displayChat(contentContainer, isLoggedIn) {
  // Clear container safely
  contentContainer.replaceChildren();

  if (!isLoggedIn) {
    contentContainer.appendChild(createElement("p", {}, [t("chat.login_prompt")]));
    return;
  }

  const wrapper = createElement("div", {
    class: "merechatcon",
    role: "application",
    "aria-live": "polite"
  });

  const sidebar = createElement("aside", { class: "chat-sidebar", role: "complementary" });
  const main = createElement("div", { class: "chat-main", role: "main" });

  const chatList = createElement("nav", { class: "chat-list", role: "navigation" });
  const chatView = createElement("section", { class: "chat-view", role: "region" });

  sidebar.append(
    // Optional: createNewChatButton(sidebar, chatView),
    chatList
  );

  main.append(
    createSearchBar(chatView),
    chatView
  );

  wrapper.append(sidebar, main);
  contentContainer.appendChild(wrapper);

  await loadChatList(chatList, chatView, true);
}

export function displayOneChat(contentContainer, chatId, isLoggedIn) {
  // Clear safely
  contentContainer.replaceChildren();
  const container = createElement("div", { class: "onechatcon" }, []);
  contentContainer.appendChild(container);
  if (isLoggedIn) {
    openChat(chatId, container);
  } else {
    container.appendChild(createElement("p", {}, ["🔒 Please log in to view this chat."]));
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Public helpers to intentionally close socket (e.g., on page unload)
// ───────────────────────────────────────────────────────────────────────────────
export function teardownChatSocket() {
  closeExistingSocket("teardown");
}
