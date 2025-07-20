// chatComponents.js
import { createElement } from "../../components/createElement";
import { apiFetch } from "../../api/api";
import { t } from "./i18n.js";
import { getState } from "../../state/state";
import { openChat, loadChatList } from "./chatHandlers.js";
import { renderMessage } from "./chomponents/index.js";

export function createNewChatButton(listContainer, chatContainer) {
  const btn = createElement("button", { class: "new-chat-btn" }, [
    t("chat.new_chat")
  ]);
  btn.addEventListener("click", () =>
    showNewChatForm(btn.parentElement, listContainer, chatContainer)
  );
  return btn;
}

function showNewChatForm(container, listContainer, chatContainer) {
  // scope to this sidebar only
  const existing = container.querySelector(".new-chat-form");
  if (existing) existing.remove();

  const form = createElement("div", { class: "new-chat-form" }, [
    createElement("input", {
      type: "text",
      placeholder: t("chat.placeholder_ids"),
      "aria-label": t("chat.placeholder_ids")
    }),
    createElement("button", {}, [ t("chat.start") ])
  ]);

  const [input, startBtn] = form.children;
  startBtn.addEventListener("click", async () => {
    const participants = input.value
      .split(",").map(s=>s.trim()).filter(Boolean);
    if (participants.length < 2) {
      return alert("Need at least 2 IDs");
    }
    if (!participants.includes(getState("user"))) {
      participants.push(getState("user"));
    }
    const chat = await apiFetch("/merechats/start", "POST", { participants });
    form.remove();
    await loadChatList(listContainer, chatContainer, true);
    openChat(chat.id, chatContainer);
  });

  container.appendChild(form);
}

export function createSearchBar(chatView) {
  const input = createElement("input", {
    class: "chat-search",
    type: "search",
    placeholder: t("chat.search"),
    "aria-label": t("chat.search")
  });
  input.addEventListener("input", () => {
    const term = input.value.toLowerCase();
    chatView.querySelectorAll(".message").forEach(el => {
      const content = el.querySelector(".msg-content")?.textContent.toLowerCase() || "";
      el.style.display = content.includes(term) ? "" : "none";
    });
  });
  return createElement("div", { class: "search-bar" }, [ input ]);
}

// export function createMessageInputArea(msgList, chatId, onMessageSent) {
//   const textInput = createElement("input", {
//     type: "text",
//     placeholder: t("chat.type_message"),
//     "aria-label": t("chat.type_message"),
//     "aria-keyshortcuts": "Enter"
//   });
//   const sendBtn = createElement("button", {}, [ t("chat.send") ]);
//   const fileBtn = createElement("button", { class: "file-upload-btn" }, [ t("chat.upload") ]);
//   const fileInput = createElement("input", { type: "file", hidden: true });

//   // drag & drop
//   msgList.addEventListener("dragover", e => { e.preventDefault(); });
//   msgList.addEventListener("drop", async e => {
//     e.preventDefault();
//     if (!e.dataTransfer.files.length) return;
//     const f = e.dataTransfer.files[0];
//     const fd = new FormData();
//     fd.append("file", f);
//     try {
//       const att = await apiFetch(`/merechats/chat/${chatId}/upload`, "POST", fd, { isFormData: true });
//       msgList.appendChild(renderMessage(att));
//       msgList.scrollTop = msgList.scrollHeight;
//     } catch {
//       alert("Upload failed");
//     }
//   });

//   sendBtn.addEventListener("click", () => onMessageSent(textInput, msgList));
//   textInput.addEventListener("keydown", e => {
//     if (e.key === "Enter") onMessageSent(textInput, msgList);
//     else {
//       // typing indicator
//       if (window.socket?.readyState === WebSocket.OPEN) {
//         window.socket.send(JSON.stringify({ type: "typing", chatId }));
//       }
//     }
//   });

//   fileBtn.addEventListener("click", () => fileInput.click());
//   fileInput.addEventListener("change", async () => {
//     if (!fileInput.files.length) return;
//     const file = fileInput.files[0];
//     const form = new FormData();
//     form.append("file", file);
//     try {
//       const att = await apiFetch(`/merechats/chat/${chatId}/upload`, "POST", form, { isFormData: true });
//       msgList.appendChild(renderMessage(att));
//       msgList.scrollTop = msgList.scrollHeight;
//     } catch {
//       alert("Failed to upload file.");
//     }
//     fileInput.value = "";
//   });

//   const container = createElement("div", { class: "message-input" }, [
//     textInput, sendBtn, fileBtn, fileInput
//   ]);

//   return container;
// }
// import { apiFetch } from "../../../api/api";
// import { createElement } from "../../../components/createElement";
// import { renderMessage } from "./renderMessage"; // assuming you have this
// import { t } from "../../../i18n/i18n";

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
      if (!rendered) throw new Error("renderMessage failed");

      msgList.appendChild(rendered);
      msgList.scrollTop = msgList.scrollHeight;
    } catch (err) {
      console.error(err);
      alert("Upload failed");
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

  const sendBtn = createElement("button", {}, [t("chat.send")]);
  const fileBtn = createElement("button", { class: "file-upload-btn" }, [t("chat.upload")]);
  const fileInput = createElement("input", { type: "file", hidden: true });

  // Drag & Drop
  msgList.addEventListener("dragover", (e) => e.preventDefault());

  msgList.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!e.dataTransfer.files.length) return;
    uploadFile(e.dataTransfer.files[0]);
  });

  // Send button
  sendBtn.addEventListener("click", () => onMessageSent(textInput, msgList));

  // Enter key + typing event
  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      onMessageSent(textInput, msgList);
    } else if (window.socket?.readyState === WebSocket.OPEN) {
      window.socket.send(JSON.stringify({ type: "typing", chatId }));
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
    textInput,
    sendBtn,
    fileBtn,
    fileInput,
  ]);
}
// // chatComponents.js
// import { createElement } from "../../components/createElement.js";
// import { apiFetch } from "../../api/api.js";
// import { t } from "./i18n.js";
// import { getState } from "../../state/state.js";
// import { openChat, loadChatList } from "./chatHandlers.js";

// export function createNewChatButton(listContainer, chatContainer) {
//     const btn = createElement("button", { class: "new-chat-btn" }, [t("chat.new_chat")]);
//     btn.addEventListener("click", () => showNewChatForm(btn.parentElement, listContainer, chatContainer));
//     return btn;
// }

// function showNewChatForm(container, listContainer, chatContainer) {
//     container.querySelectorAll(".new-chat-form").forEach(el => el.remove());
//     const form = createElement("div", { class: "new-chat-form" }, [
//         createElement("input", { type: "text", placeholder: t("chat.placeholder_ids"), "aria-label": t("chat.placeholder_ids") }),
//         createElement("button", {}, [t("chat.start")])
//     ]);
//     const [input, startBtn] = form.children;

//     startBtn.addEventListener("click", async () => {
//         const participants = input.value.split(",").map(s => s.trim()).filter(Boolean);
//         if (participants.length < 2) return alert("Need at least 2 IDs");
//         if (!participants.includes(getState("user"))) participants.push(getState("user"));
//         const chat = await apiFetch("/merechats/start", "POST", { participants });
//         form.remove();
//         await loadChatList(listContainer, chatContainer);
//         openChat(chat.id, chatContainer);
//     });

//     container.appendChild(form);
// }

// export function createSearchBar(chatView) {
//     const input = createElement("input", {
//         class: "chat-search",
//         type: "search",
//         placeholder: t("chat.search"),
//         "aria-label": t("chat.search")
//     });
//     input.addEventListener("input", () => {
//         const term = input.value.toLowerCase();
//         chatView.querySelectorAll(".message").forEach(el => {
//             const text = el.textContent.toLowerCase();
//             el.style.display = text.includes(term) ? "" : "none";
//         });
//     });
//     return createElement("div", { class: "search-bar" }, [input]);
// }

// export function createMessageInputArea(msgList, chatId, onMessageSent) {
//     const textInput = createElement("input", {
//         type: "text",
//         placeholder: t("chat.type_message"),
//         "aria-label": t("chat.type_message")
//     });
//     const sendBtn = createElement("button", {}, [t("chat.send")]);
//     const fileBtn = createElement("button", { class: "file-upload-btn" }, [t("chat.upload")]);
//     const fileInput = createElement("input", { type: "file", hidden: true });

//     sendBtn.addEventListener("click", () => onMessageSent(textInput, msgList));
//     textInput.addEventListener("keydown", e => {
//         if (e.key === "Enter") onMessageSent(textInput, msgList);
//     });

//     fileBtn.addEventListener("click", () => fileInput.click());
//     fileInput.addEventListener("change", async () => {
//         if (!fileInput.files.length) return;
//         const file = fileInput.files[0];
//         const form = new FormData();
//         form.append("file", file);
//         try {
//             const att = await apiFetch(`/merechats/chat/${chatId}/upload`, "POST", form, { isFormData: true });
//             msgList.appendChild(renderMessage(att));
//         } catch {
//             alert("Failed to upload file.");
//         }
//         fileInput.value = "";
//     });

//     return createElement("div", { class: "message-input" }, [
//         textInput, sendBtn, fileBtn, fileInput
//     ]);
// }
