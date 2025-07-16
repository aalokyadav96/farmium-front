// chatHandlers.js
import { apiFetch } from "../../api/api";
import { setChatId, incrementSkip, resetSkip,
         resetChatListSkip, incrementChatListSkip, getChatListSkip,
         getChatState } from "./chatState.js";
import { getState } from "../../state/state";
import { createElement } from "../../components/createElement";
import { renderMessage } from "./chomponents/index.js";
import { createMessageInputArea } from "./chatComponents.js";
import { setupWebSocket } from "./socket.js";

let currentChatId = null; // Track open chat globally

export async function loadChatList(listContainer, chatModal, reset = false) {
  if (reset) {
    resetChatListSkip();
    currentChatId = null;
    listContainer.textContent = "";
  }

  const skip = getChatListSkip();
  const chats = await apiFetch(`/merechats/all?skip=${skip}&limit=20`, "GET") || [];

  chats.forEach(chat => {
    const label = chat.participants.filter(p => p !== getState("user")).join(", ") || "(no one)";
    const btn = createElement("button", {
      class: "chat-item",
      dataset: { id: chat.id },
      role: "button",
      "aria-label": `Chat with ${label}`
    }, [label]);

    btn.addEventListener("click", async () => {
      if (chat.id === currentChatId) return;
      currentChatId = chat.id;

      chatModal.classList.add("active");
      chatModal.textContent = "";

      const backBtn = createElement("button", {
        class: "back-button",
        "aria-label": "Back to chat list"
      }, ["← Back"]);

      backBtn.addEventListener("click", () => {
        chatModal.classList.remove("active");
        chatModal.textContent = "";
        currentChatId = null;
      });

      chatModal.appendChild(backBtn);
      await openChat(chat.id, chatModal);
    });

    listContainer.appendChild(btn);
  });

  incrementChatListSkip(chats.length);

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

// let currentChatId = null; // ← Track the open chat globally in this module

// export async function loadChatList(listContainer, chatContainer, reset = false) {
//   if (reset) {
//     resetChatListSkip();
//     currentChatId = null; // optional: reset current chat state too
//   }

//   const skip = getChatListSkip();
//   const chats = await apiFetch(`/merechats/all?skip=${skip}&limit=20`, "GET") || [];

//   if (reset) {
//     listContainer.textContent = "";
//   }

//   chats.forEach(chat => {
//     const label = chat.participants.filter(p => p !== getState("user")).join(", ") || "(no one)";
//     const btn = createElement("button", {
//       class: "chat-item",
//       dataset: { id: chat.id },
//       role: "button",
//       "aria-label": `Chat with ${label}`
//     }, [label]);

//     btn.addEventListener("click", () => {
//       if (chat.id === currentChatId) return; // ← Skip if already open
//       currentChatId = chat.id;
//       openChat(chat.id, chatContainer);
//     });

//     listContainer.appendChild(btn);
//   });

//   incrementChatListSkip(chats.length);

//   // Infinite scroll (only register once)
//   if (!listContainer.parentElement.hasAttribute("data-scroll-registered")) {
//     listContainer.parentElement.setAttribute("data-scroll-registered", "true");

//     listContainer.parentElement.addEventListener("scroll", async () => {
//       const { scrollTop, scrollHeight, clientHeight } = listContainer.parentElement;
//       if (scrollTop + clientHeight >= scrollHeight - 50) {
//         await loadChatList(listContainer, chatContainer);
//       }
//     });
//   }
// }
// // export async function loadChatList(listContainer, chatContainer, reset = false) {
// //   if (reset) resetChatListSkip();
// //   const skip = getChatListSkip();
// //   const chats = await apiFetch(`/merechats/all?skip=${skip}&limit=20`, "GET") || [];
// //   if (reset) listContainer.textContent = "";

// //   chats.forEach(chat => {
// //     const label = chat.participants.filter(p => p !== getState("user")).join(", ") || "(no one)";
// //     const btn = createElement("button", {
// //       class: "chat-item",
// //       dataset: { id: chat.id },
// //       role: "button",
// //       "aria-label": `Chat with ${label}`
// //     }, [ label ]);
// //     btn.addEventListener("click", () => openChat(chat.id, chatContainer));
// //     listContainer.appendChild(btn);
// //   });

// //   incrementChatListSkip(chats.length);

// //   // infinite scroll
// //   listContainer.parentElement.addEventListener("scroll", async () => {
// //     const { scrollTop, scrollHeight, clientHeight } = listContainer.parentElement;
// //     if (scrollTop + clientHeight >= scrollHeight - 50) {
// //       await loadChatList(listContainer, chatContainer);
// //     }
// //   });
// // }
export async function openChat(chatId, container) {
    if (container.dataset.openChatId === chatId) return; // Already open
  
    container.dataset.openChatId = chatId; // Track current open chat
    setChatId(chatId);
    resetSkip();
  
    container.textContent = "";
  
    const msgList = createElement("div", {
      class: "message-list",
      role: "log",
      "aria-relevant": "additions text"
    });
  
    const inputArea = createMessageInputArea(msgList, chatId, sendText);
    container.append(msgList, inputArea);
  
    await loadMessages(msgList, false);
    setupWebSocket(msgList);
    setupScrollLoading(msgList);
  
    // Activate modal (mobile)
    container.classList.add("active");
  }
  
// export async function openChat(chatId, container) {
//   setChatId(chatId);
//   resetSkip();

//   container.textContent = "";
//   const msgList = createElement("div", {
//     class: "message-list",
//     role: "log",
//     "aria-relevant": "additions text"
//   });
//   const inputArea = createMessageInputArea(msgList, chatId, sendText);

//   container.append(msgList, inputArea);
//   await loadMessages(msgList, false);
//   setupWebSocket(msgList);
//   setupScrollLoading(msgList);
// }

export async function loadMessages(msgList, prepend) {
  const { currentChatId, skip } = getChatState();
  const messages = await apiFetch(
    `/merechats/chat/${currentChatId}/messages?skip=${skip}&limit=50`, "GET"
  ) || [];

  incrementSkip(messages.length);

  if (prepend) {
    const prevH = msgList.scrollHeight;
    messages.reverse().forEach(msg => msgList.prepend(renderMessage(msg)));
    msgList.scrollTop = msgList.scrollHeight - prevH;
  } else {
    const atBottom = (msgList.scrollHeight - msgList.scrollTop - msgList.clientHeight) < 100;
    messages.forEach(msg => msgList.appendChild(renderMessage(msg)));
    if (atBottom) msgList.scrollTop = msgList.scrollHeight;
  }
}

function setupScrollLoading(msgList) {
  let loading = false;
  msgList.addEventListener("scroll", async () => {
    if (msgList.scrollTop === 0 && !loading) {
      loading = true;
      await loadMessages(msgList, true);
      loading = false;
    }
  });
}

async function sendText(input, msgList) {
  const content = input.value.trim();
  if (!content) return;
  // show pending
  const pending = { id: `p-${Date.now()}`, sender: getState("user"), createdAt: new Date().toISOString(), content, pending: true };
  msgList.appendChild(renderMessage(pending));
  msgList.scrollTop = msgList.scrollHeight;
  input.value = "";

  const { currentChatId } = getChatState();
  if (window.socket?.readyState === WebSocket.OPEN) {
    window.socket.send(JSON.stringify({
      type: "message",
      chatId: currentChatId,
      content
    }));
  } else {
    const msg = await apiFetch(`/merechats/chat/${currentChatId}/message`, "POST", { content });
    // dedupe
    if (!msgList.querySelector(`[data-id="${msg.id}"]`)) {
      msgList.appendChild(renderMessage(msg));
    }
  }
}

// //chatHandlers.js
// import { apiFetch } from "../../api/api.js";
// import { setChatId, incrementSkip, resetSkip } from "./chatState.js";
// import { getState } from "../../state/state.js";
// import { createElement } from "../../components/createElement.js";
// import { renderMessage } from "./chomponents/index.js";
// import { createMessageInputArea } from "./chatComponents.js";
// import { setupWebSocket } from "./socket.js";
// import { getChatState } from "./chatState.js";


// export async function loadChatList(listContainer, chatContainer) {
//     const chats = await apiFetch("/merechats/all", "GET") || [];
//     listContainer.textContent = "";
//     chats.forEach(chat => {
//         const label = chat.participants.filter(p => p !== getState("user")).join(", ");
//         const btn = createElement("button", {
//             class: "chat-item",
//             dataset: { id: chat.id },
//             role: "button",
//             "aria-label": `Chat with ${label || "no one"}`
//         }, [label || "(no one)"]);
//         btn.addEventListener("click", () => openChat(chat.id, chatContainer));
//         listContainer.appendChild(btn);
//     });
// }

// export async function openChat(chatId, container) {
//     setChatId(chatId);
//     resetSkip();

//     container.textContent = "";
//     const msgList = createElement("div", {
//         class: "message-list",
//         role: "log",
//         "aria-relevant": "additions text"
//     });

//     const inputArea = createMessageInputArea(msgList, chatId, sendText);
//     container.append(msgList, inputArea);
//     await loadMessages(msgList, false);
//     setTimeout(() => setupWebSocket(msgList), 0);
//     setupScrollLoading(msgList);
// }
// export async function loadMessages(msgList, prepend) {
//     const { currentChatId, skip } = getChatState();
//     const messages = await apiFetch(`/merechats/chat/${currentChatId}/messages?skip=${skip}&limit=50`, "GET") || [];

//     incrementSkip(messages.length);

//     if (prepend) {
//         const prevHeight = msgList.scrollHeight;
//         messages.reverse().forEach(msg => msgList.prepend(renderMessage(msg)));
//         msgList.scrollTop = msgList.scrollHeight - prevHeight;
//     } else {
//         const atBottom = (msgList.scrollHeight - msgList.scrollTop - msgList.clientHeight) < 100;
//         messages.forEach(msg => msgList.appendChild(renderMessage(msg)));
//         if (atBottom) msgList.scrollTop = msgList.scrollHeight;
//     }
// }

// function setupScrollLoading(msgList) {
//     let loading = false;
//     msgList.addEventListener("scroll", async () => {
//         if (msgList.scrollTop === 0 && !loading) {
//             loading = true;
//             await loadMessages(msgList, true);
//             loading = false;
//         }
//     });
// }

// async function sendText(input, msgList) {
//     const content = input.value.trim();
//     if (!content) return;
//     input.value = "";

//     const { currentChatId } = getChatState();

//     if (window.socket?.readyState === WebSocket.OPEN) {
//         window.socket.send(JSON.stringify({
//             type: "message",
//             chatId: currentChatId,
//             content
//         }));
//     } else {
//         const msg = await apiFetch(`/merechats/chat/${currentChatId}/message`, "POST", { content });
//         if (msgList.querySelector(`[data-id="${msg.id}"]`)) return;
//         msgList.appendChild(renderMessage(msg));
//     }
// }
