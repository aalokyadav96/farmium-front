import { apiFetch } from "../../api/api.js";
import { setChatId, incrementSkip, resetSkip } from "./chatState.js";
import { getState } from "../../state/state.js";
import { createElement } from "../../components/createElement.js";
import { renderMessage } from "./chomponents/index.js";
import { createMessageInputArea } from "./chatComponents.js";
import { setupWebSocket } from "./socket.js";
import { getChatState } from "./chatState.js";


export async function loadChatList(listContainer, chatContainer) {
    const chats = await apiFetch("/merechats/all", "GET") || [];
    listContainer.textContent = "";
    chats.forEach(chat => {
        const label = chat.participants.filter(p => p !== getState("user")).join(", ");
        const btn = createElement("button", {
            class: "chat-item",
            dataset: { id: chat.id },
            role: "button",
            "aria-label": `Chat with ${label || "no one"}`
        }, [label || "(no one)"]);
        btn.addEventListener("click", () => openChat(chat.id, chatContainer));
        listContainer.appendChild(btn);
    });
}

export async function openChat(chatId, container) {
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
    setTimeout(() => setupWebSocket(msgList), 0);
    setupScrollLoading(msgList);
}
export async function loadMessages(msgList, prepend) {
    const { currentChatId, skip } = getChatState();
    const messages = await apiFetch(`/merechats/chat/${currentChatId}/messages?skip=${skip}&limit=50`, "GET") || [];

    incrementSkip(messages.length);

    if (prepend) {
        const prevHeight = msgList.scrollHeight;
        messages.reverse().forEach(msg => msgList.prepend(renderMessage(msg)));
        msgList.scrollTop = msgList.scrollHeight - prevHeight;
    } else {
        const atBottom = (msgList.scrollHeight - msgList.scrollTop - msgList.clientHeight) < 100;
        messages.forEach(msg => msgList.appendChild(renderMessage(msg)));
        if (atBottom) msgList.scrollTop = msgList.scrollHeight;
    }
}

// export async function loadMessages(msgList, prepend) {
//     const { currentChatId, skip } = await import("./chatState.js").then(mod => mod.getChatState());
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

// async function sendText(input, msgList) {
//     const content = input.value.trim();
//     if (!content) return;
//     input.value = "";

//     const { currentChatId } = await import("./chatState.js").then(mod => mod.getChatState());

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
async function sendText(input, msgList) {
    const content = input.value.trim();
    if (!content) return;
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
        if (msgList.querySelector(`[data-id="${msg.id}"]`)) return;
        msgList.appendChild(renderMessage(msg));
    }
}
