import { getState, setState } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";

import { t } from "./i18n.js";
import {
    createNewChatButton,
    createSearchBar,
    createMessageInputArea
} from "./chatComponents.js";

import {
    loadMessages,
    loadChatList,
    openChat
} from "./chatHandlers.js";

export async function displayChat(contentContainer, isLoggedIn) {
    contentContainer.textContent = "";

    if (!isLoggedIn) {
        contentContainer.appendChild(createElement("p", {}, [t("chat.login_prompt")]));
        return;
    }

    const wrapper = createElement("div", { class: "merechatcon", role: "application", "aria-live": "polite" });
    const sidebar = createElement("div", { class: "chat-sidebar", role: "complementary" });
    const main = createElement("div", { class: "chat-main", role: "main" });

    const chatList = createElement("div", { class: "chat-list", role: "navigation" });
    const chatView = createElement("div", { class: "chat-view", role: "region" });

    // sidebar.append(createNewChatButton(chatList, chatView), chatList);
    sidebar.append( chatList);
    main.append(createSearchBar(chatView), chatView);
    wrapper.append(sidebar, main);

    contentContainer.appendChild(wrapper);

    await loadChatList(chatList, chatView);
}

// // chatUI.js
// import { apiFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";
// import { SRC_URL, getState, setState } from "../../state/state.js";
// import { setupWebSocket, updatePresence, showTypingIndicator } from "./chatSocket.js";
// // import { buildMessageElement } from "./merehelpers.js";
// import { renderMessage } from "./chomponents/index.js";
    
// let currentChatId = null;
// let skip = 0;
// const limit = 50;
// let loading = false;

// // Stub i18n
// function t(key) {
//     const dict = {
//         "chat.login_prompt": "🔒 Please log in to use chat.",
//         "chat.new_chat": "➕ New Chat",
//         "chat.start": "Start",
//         "chat.placeholder_ids": "Comma‑separated user IDs",
//         "chat.send": "Send",
//         "chat.type_message": "Type a message…",
//         "chat.search": "Search…",
//         "chat.typing": "typing…",
//         "chat.online": "Online",
//         "chat.offline": "Offline",
//         "chat.upload": "📎"
//     };
//     return dict[key] || key;
// }

// // entry point
// export async function displayChat(contentContainer, isLoggedIn) {
//     contentContainer.textContent = "";

//     // const themeToggle = createElement("button", { class: "theme-toggle" }, ["🌙"]);
//     // themeToggle.addEventListener("click", () => {
//     //     document.body.classList.toggle("dark");
//     //     themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
//     // });

//     if (!isLoggedIn) {
//         contentContainer.appendChild(createElement("p", {}, [t("chat.login_prompt")]));
//         return;
//     }

//     const wrapper = createElement("div", { class: "merechatcon", role: "application", "aria-live": "polite" });
//     const sidebar = createElement("div", { class: "chat-sidebar", role: "complementary" });
//     const main = createElement("div", { class: "chat-main", role: "main" });

//     // sidebar.append(themeToggle, createNewChatButton(), createElement("div", { class: "chat-list", role: "navigation" }));
//     sidebar.append(createElement("div", { class: "chat-list", role: "navigation" }));
//     main.append(
//         // createPresenceIndicator(),
//         createSearchBar(),
//         createElement("div", { class: "chat-view", role: "region" })
//     );

//     wrapper.append(sidebar, main);
//     contentContainer.appendChild(wrapper);

//     await loadChatList(sidebar.querySelector(".chat-list"), main.querySelector(".chat-view"));
// }

// export function createNewChatButton() {
//     const btn = createElement("button", { class: "new-chat-btn" }, [t("chat.new_chat")]);
//     btn.addEventListener("click", () => showNewChatForm(btn.parentElement));
//     return btn;
// }

// function showNewChatForm(container) {
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
//         await loadChatList(container.querySelector(".chat-list"), document.querySelector(".chat-view"));
//         openChat(chat.id, document.querySelector(".chat-view"));
//     });
//     container.appendChild(form);
// }

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

// function createSearchBar() {
//     const input = createElement("input", {
//         class: "chat-search",
//         type: "search",
//         placeholder: t("chat.search"),
//         "aria-label": t("chat.search")
//     });
//     input.addEventListener("input", () => {
//         const term = input.value.toLowerCase();
//         const msgList = document.querySelector(".message-list");
//         msgList.querySelectorAll(".message").forEach(el => {
//             const text = el.textContent.toLowerCase();
//             el.style.display = text.includes(term) ? "" : "none";
//         });
//     });
//     return createElement("div", { class: "search-bar" }, [input]);
// }

// function createPresenceIndicator() {
//     return createElement("div", { class: "presence" }, [
//         createElement("span", { class: "presence-status" }, [t("chat.offline")]),
//         createElement("span", { class: "typing", style: "display:none;" }, [])
//     ]);
// }

// export async function openChat(chatId, container) {
//     setState({ "currentChatId": chatId });
//     currentChatId = chatId;
//     skip = 0;
//     container.textContent = "";

//     const msgList = createElement("div", {
//         class: "message-list",
//         role: "log",
//         "aria-relevant": "additions text"
//     });
//     const inputArea = createMessageInputArea(msgList);

//     container.append(msgList, inputArea);
//     await loadMessages(msgList, false);
//     // setupWebSocket(msgList);
//     setTimeout(() => setupWebSocket(msgList), 0);
//     setupScrollLoading(msgList);
// }

// async function loadMessages(msgList, prepend) {
//     const messages = await apiFetch(
//         `/merechats/chat/${currentChatId}/messages?skip=${skip}&limit=${limit}`,
//         "GET"
//     ) || [];
//     skip += messages.length;

//     if (prepend) {
//         const prevHeight = msgList.scrollHeight;
//         messages.reverse().forEach(msg => msgList.prepend(renderMessage(msg)));
//         msgList.scrollTop = msgList.scrollHeight - prevHeight;
//     } else {
//         // determine if at bottom
//         // const atBottom = msgList.scrollHeight - msgList.scrollTop < msgList.clientHeight + 100;
//         const atBottom = (msgList.scrollHeight - msgList.scrollTop - msgList.clientHeight) < 100;

//         messages.forEach(msg => msgList.appendChild(renderMessage(msg)));
//         if (atBottom) msgList.scrollTop = msgList.scrollHeight;
//     }
// }

// function setupScrollLoading(msgList) {
//     // let loading = false;
//     msgList.addEventListener("scroll", async () => {
//         if (msgList.scrollTop === 0 && !loading) {
//             loading = true;
//             await loadMessages(msgList, true);
//             loading = false;
//         }
//     });

// }

// function createMessageInputArea(msgList) {
//     const textInput = createElement("input", {
//         type: "text",
//         placeholder: t("chat.type_message"),
//         "aria-label": t("chat.type_message")
//     });
//     const sendBtn = createElement("button", {}, [t("chat.send")]);
//     const fileBtn = createElement("button", { class: "file-upload-btn" }, [t("chat.upload")]);
//     const fileInput = createElement("input", { type: "file", hidden: true });

//     sendBtn.addEventListener("click", () => sendText(textInput, msgList));
//     textInput.addEventListener("keydown", e => {
//         if (e.key === "Enter") sendText(textInput, msgList);
//     });

//     fileBtn.addEventListener("click", () => fileInput.click());
//     fileInput.addEventListener("change", async () => {
//         const file = fileInput.files[0];
//         // if (!file) return;
//         if (!fileInput.files.length) return;
//         const form = new FormData();
//         form.append("file", file);
//         try {
//             const att = await apiFetch(
//                 `/merechats/chat/${currentChatId}/upload`,
//                 "POST",
//                 form,
//                 { isFormData: true }
//             );
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

// async function sendText(input, msgList) {
//     const content = input.value.trim();
//     if (!content) return;
//     input.value = "";

//     if (window.socket?.readyState === WebSocket.OPEN) {
//         window.socket.send(JSON.stringify({
//             type: "message",
//             chatId: currentChatId,
//             content
//         }));
//     } else {
//         const msg = await apiFetch(
//             `/merechats/chat/${currentChatId}/message`,
//             "POST",
//             { content }
//         );
//         // msgList.appendChild(renderMessage(msg));
//         if (msgList.querySelector(`[data-id="${msg.id}"]`)) return;
//         msgList.appendChild(renderMessage(msg));

//     }
// }
