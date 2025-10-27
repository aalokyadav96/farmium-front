import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import {
  ChatState,
  pendingMap,
  renderedIdsMap,
  renderMessage,
  connectWebSocket,
  closeExistingSocket,
  getMessageContainer,
  setMessageContainer,
  mountMessage
} from "./chatSocket.js";
import { mereFetch } from "../../api/api.js";
import { debounce } from "../../utils/deutils.js";
import { MERE_URL, getState } from "../../state/state.js";
import { uploadFile } from "../media/api/mediaApi.js";
import { uid } from "../media/ui/mediaUploadForm.js";

/* -------------------------
   Safe fetch wrapper
   -------------------------*/
export async function safemereFetch(url, method = "GET", body = null, options = {}) {
  try {
    return await mereFetch(url, method, body, options);
  } catch {
    return null;
  }
}

/* -------------------------
   Message sending (WS preferred, REST fallback)
   -------------------------*/
export function sendMessage(chatid, content) {
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
  pendingMap.set(clientId, { el, chatid });

  const payload = { type: "message", chatid, content, clientId };

  const ws = ChatState.getSocket();
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      pendingMap.set(clientId, { ...pendingMap.get(clientId), sent: true });
      ws.send(JSON.stringify(payload));
    } catch {
      sendMessageRESTFallback(chatid, content, clientId);
    }
  } else {
    sendMessageRESTFallback(chatid, content, clientId);
  }

  return clientId;
}

async function sendMessageRESTFallback(chatid, content, clientId) {
  const info = pendingMap.get(clientId);
  if (info?.sent) return;

  const url = `/merechats/chat/${encodeURIComponent(chatid)}/message`;
  try {
    const serverMsg = await mereFetch(url, "POST", { content, clientId });
    const realId = String(serverMsg.messageid);
    const renderedIds = renderedIdsMap.get(chatid) || new Set();

    if (pendingMap.has(clientId)) {
      const p = pendingMap.get(clientId);
      const el = p.el;
      if (el) {
        const existing = document.getElementById(`msg-${realId}`);
        if (existing && existing !== el) existing.remove();
        el.id = `msg-${realId}`;
        el.style.opacity = "1";
        el.removeAttribute("data-pending");
      }
      pendingMap.delete(clientId);
      renderedIds.add(realId);
      renderedIdsMap.set(chatid, renderedIds);
    } else {
      if (!renderedIds.has(realId) && !document.getElementById(`msg-${realId}`)) {
        mountMessage(serverMsg, { pending: false });
        renderedIds.add(realId);
        renderedIdsMap.set(chatid, renderedIds);
      }
    }
  } catch (err) {
    console.error("REST send failed:", err);
  }
}

/* -------------------------
   Load history
   -------------------------*/
async function loadHistory(chatid) {
  let container = getMessageContainer() || document.querySelector(".chat-messages");
  if (!container) return;

  while (container.firstChild) container.removeChild(container.firstChild);

  const url = `/merechats/chat/${encodeURIComponent(chatid)}/messages`;
  try {
    const msgs = (await safemereFetch(url, "GET")) || [];
    const renderedIds = new Set();
    msgs.forEach(m => {
      const mid = String(m.messageid);
      if (!renderedIds.has(mid) && !document.getElementById(`msg-${mid}`)) {
        mountMessage(m, { pending: false });
        renderedIds.add(mid);
      }
    });
    renderedIdsMap.set(chatid, renderedIds);
  } catch (e) {
    console.error("Failed to load history", e);
  }
}

// /* -------------------------
//    UI: displayOneChat + search
//    -------------------------*/
// export async function displayOneChat(containerx, chatid, isLoggedIn) {
//   let container = createElement("div",{class:"onechatcon"},[]);
//   containerx.appendChild(container);
//   while (container.firstChild) container.removeChild(container.firstChild);

//   const chatLabel = `Chat ${chatid}`;
//   const header = createElement("div", { class: "chat-header" }, [chatLabel]);
//   const messagesDiv = createElement("div", { class: "chat-messages", role: "log", "aria-live": "polite" });
//   const input = createElement("input", { type: "text", placeholder: "Type a message..." });

//   const sendTyping = debounce(() => {
//     const ws = ChatState.getSocket();
//     if (ws && ws.readyState === WebSocket.OPEN && input.value.trim() !== "") {
//       ws.send(JSON.stringify({ type: "typing", chatid }));
//     }
//   }, 800);
//   input.addEventListener("input", sendTyping);

//   const sendBtn = Button("Send", "send-btn", {
//     click: () => {
//       const txt = (input.value || "").trim();
//       if (txt) {
//         sendMessage(chatid, txt);
//         input.value = "";
//       }
//     }
//   }, "send-btn-class");

//   const footer = createElement("div", { class: "chat-footer" }, [input, sendBtn]);

//   container.appendChild(header);
//   container.appendChild(messagesDiv);
//   container.appendChild(footer);

//   ChatState.setChatId(chatid);
//   setMessageContainer(messagesDiv);

//   await loadHistory(chatid);
//   connectWebSocket(); // ensure WS ready
// }

// /* -------------------------
//    Upload Attachment
//    -------------------------*/
//    async function uploadAttachment(chatid, fileInput) {
//     if (!fileInput.files || fileInput.files.length === 0) return;

//     const file = fileInput.files[0];
//     const formData = new FormData();
//     formData.append("file", file);

//     const url = `${MERE_URL}/merechats/chat/${encodeURIComponent(chatid)}/upload`;

//     try {
//       const res = await fetch(url, {
//         method: "POST",
//         body: formData,
//         headers: {
//           Authorization: `Bearer ${getState("token") || ""}`
//         }
//       });

//       if (!res.ok) {
//         console.error("Upload failed", await res.text());
//         return;
//       }

//       const msg = await res.json();
//       if (msg && msg.messageid) {
//         mountMessage(msg, { pending: false });
//         const renderedIds = renderedIdsMap.get(chatid) || new Set();
//         renderedIds.add(String(msg.messageid));
//         renderedIdsMap.set(chatid, renderedIds);
//       }
//     } catch (err) {
//       console.error("Upload error:", err);
//     } finally {
//       fileInput.value = ""; // reset file input
//     }
//   }

function getConType(extn) {
  switch (extn) {
    case '.jpg', '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.mp4':
      return 'video/mp4';
    case '.mov':
      return 'video/quicktime';
    case '.webm':
      return 'video/webm';
    default:
      return 'application/octet-stream';
  }
}


/* -------------------------
   Upload Attachment (2-step)
   -------------------------*/
async function uploadAttachment(chatid, fileInput) {
  if (!fileInput.files || fileInput.files.length === 0) return;

  const file = fileInput.files[0];
  const u = {
    file: file,
    mediaEntity: "chat",
    id: uid(),
    fileType: "photo" // or infer from file.type if you prefer
  };

  try {
    // Step 1: Upload to FILEDROP service
    const fileResp = await uploadFile(u);
    if (!fileResp || !fileResp.filename || !fileResp.extn) {
      console.error("Invalid file upload response:", fileResp);
      return;
    }

    // Step 2: Notify backend (persist message)
    const formData = new FormData();
    formData.append("contenttype", getConType(fileResp.extn));
    formData.append("savedname", fileResp.filename);

    const url = `${MERE_URL}/merechats/chat/${encodeURIComponent(chatid)}/upload`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${getState("token") || ""}`
      }
    });

    if (!res.ok) {
      console.error("Chat upload failed:", await res.text());
      return;
    }

    const msg = await res.json();
    if (msg && msg.messageid) {
      mountMessage(msg, { pending: false });
      const renderedIds = renderedIdsMap.get(chatid) || new Set();
      renderedIds.add(String(msg.messageid));
      renderedIdsMap.set(chatid, renderedIds);
    }
  } catch (err) {
    console.error("Upload error:", err);
  } finally {
    fileInput.value = "";
  }
}



/* -------------------------
   UI: displayOneChat + search
   -------------------------*/
export async function displayOneChat(containerx, chatid, isLoggedIn) {
  let container = createElement("div", { class: "onechatcon" }, []);
  containerx.appendChild(container);
  while (container.firstChild) container.removeChild(container.firstChild);

  const chatLabel = `Chat ${chatid}`;
  const header = createElement("div", { class: "chat-header" }, [chatLabel]);
  const messagesDiv = createElement("div", {
    class: "chat-messages",
    role: "log",
    "aria-live": "polite"
  });

  const input = createElement("input", {
    type: "text",
    placeholder: "Type a message..."
  });

  const fileInput = createElement("input", {
    type: "file",
    id: "chat-upload",
    style: "display:none"
  });

  // Upload button (triggers file picker)
  const uploadBtn = Button("📎", "upload-btn", {
    click: () => fileInput.click()
  }, "upload-btn-class");

  // When a file is selected, upload it
  fileInput.addEventListener("change", async () => {
    await uploadAttachment(chatid, fileInput);
  });

  const sendTyping = debounce(() => {
    const ws = ChatState.getSocket();
    if (ws && ws.readyState === WebSocket.OPEN && input.value.trim() !== "") {
      ws.send(JSON.stringify({ type: "typing", chatid }));
    }
  }, 800);
  input.addEventListener("input", sendTyping);

  const sendBtn = Button("Send", "send-btn", {
    click: () => {
      const txt = (input.value || "").trim();
      if (txt) {
        sendMessage(chatid, txt);
        input.value = "";
      }
    }
  }, "send-btn-class");

  const footer = createElement("div", { class: "chat-footer" }, [
    uploadBtn,
    fileInput,
    input,
    sendBtn
  ]);

  container.appendChild(header);
  container.appendChild(messagesDiv);
  container.appendChild(footer);

  ChatState.setChatId(chatid);
  setMessageContainer(messagesDiv);

  await loadHistory(chatid);
  connectWebSocket(); // ensure WS ready
}


/* -------------------------
   Expose programmatic close
   -------------------------*/
export function closeSocket() {
  closeExistingSocket("manual");
}

// // onechat.js
// import { createElement } from "../../components/createElement.js";
// import Button from "../../components/base/Button.js";
// import {
//   ChatState,
//   pendingMap,
//   renderedIds,
//   renderMessage,
//   connectWebSocket,
//   closeExistingSocket,
//   getMessageContainer,
//   setMessageContainer
// } from "./chatSocket.js";
// import { mereFetch } from "../../api/api.js";
// import { debounce } from "../../utils/deutils.js";
// import { getState } from "../../state/state.js";

// /* -------------------------
//    Safe fetch wrapper
//    -------------------------*/
// export async function safemereFetch(url, method = "GET", body = null, options = {}) {
//   try {
//     return await mereFetch(url, method, body, options);
//   } catch {
//     return null;
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
//     try {
//       pendingMap.set(clientId, { ...pendingMap.get(clientId), sent: true });
//       ws.send(JSON.stringify(payload));
//     } catch {
//       sendMessageRESTFallback(chatId, content, clientId);
//     }
//   } else {
//     sendMessageRESTFallback(chatId, content, clientId);
//   }

//   return clientId;
// }

// async function sendMessageRESTFallback(chatId, content, clientId) {
//   const info = pendingMap.get(clientId);
//   if (info?.sent) return;

//   const url = `/merechats/chat/${encodeURIComponent(chatId)}/message`;
//   try {
//     const serverMsg = await mereFetch(url, "POST", { content, clientId });
//     const realId = String(serverMsg.messageid);
//     if (pendingMap.has(clientId)) {
//       const p = pendingMap.get(clientId);
//       const el = p.el;
//       if (el) {
//         const existing = document.getElementById(`msg-${realId}`);
//         if (existing && existing !== el) existing.remove();
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
//    Rendering utilities
//    -------------------------*/
// function mountMessage(msg, { pending = false } = {}) {
//   const node = renderMessage({ ...msg, pending });
//   let container = getMessageContainer();
//   if (!container) {
//     container = document.querySelector(".chat-messages") || document.body;
//     setMessageContainer(container);
//   }

//   const domId = `msg-${msg.messageid}`;
//   node.id = domId;
//   if (pending) node.style.opacity = "0.5";

//   if (!document.getElementById(domId)) {
//     container.appendChild(node);
//     try { container.scrollTop = container.scrollHeight; } catch { }
//   }
//   return node;
// }

// /* -------------------------
//    Load history
//    -------------------------*/
// async function loadHistory(chatId) {
//   console.log("-------------------------------------",chatId);
//   let container = getMessageContainer() || document.querySelector(".chat-messages");
//   if (!container) return;

//   while (container.firstChild) container.removeChild(container.firstChild);

//   const url = `/merechats/chat/${encodeURIComponent(chatId)}/messages`;
//   try {
//     const msgs = await safemereFetch(url, "GET") || [];
//     msgs.forEach(m => {
//       const mid = String(m.messageid);
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

//   const user = getState("user") || "";
//   const chatLabel = `Chat ${chatId}`;

//   const header = createElement("div", { class: "chat-header" }, [chatLabel]);
//   const messagesDiv = createElement("div", { class: "chat-messages", role: "log", "aria-live": "polite" });
//   const input = createElement("input", { type: "text", placeholder: "Type a message..." });

//   const sendTyping = debounce(() => {
//     const ws = ChatState.getSocket();
//     if (ws && ws.readyState === WebSocket.OPEN) {
//       ws.send(JSON.stringify({ type: "typing", chatId }));
//     }
//   }, 800);
//   input.addEventListener("input", sendTyping);

//   const sendBtn = Button("Send", "send-btn", {
//     click: () => {
//       const txt = (input.value || "").trim();
//       if (txt) {
//         sendMessage(chatId, txt);
//         input.value = "";
//       }
//     }
//   }, "send-btn-class");

//   const footer = createElement("div", { class: "chat-footer" }, [input, sendBtn]);

//   container.appendChild(header);
//   container.appendChild(messagesDiv);
//   container.appendChild(footer);

//   ChatState.setChatId(chatId);
//   setMessageContainer(messagesDiv);

//   await loadHistory(chatId);
//   await connectWebSocket(); // ensure WS ready
// }

// /* -------------------------
//    Expose programmatic close
//    -------------------------*/
// export function closeSocket() {
//   closeExistingSocket("manual");
// }
