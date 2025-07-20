import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { getState } from "../../state/state.js";

let socket = null;
let currentChatId = null;
let skip = 0;
const limit = 50;

// Stub i18n
function t(key) {
    const dict = {
        "chat.login_prompt": "🔒 Please log in to use chat.",
        "chat.new_chat": "➕ New Chat",
        "chat.start": "Start",
        "chat.placeholder_ids": "Comma‑separated user IDs",
        "chat.send": "Send",
        "chat.type_message": "Type a message…",
        "chat.search": "Search…",
        "chat.typing": "typing…",
        "chat.online": "Online",
        "chat.offline": "Offline",
        "chat.upload": "📎"
    };
    return dict[key] || key;
}

// entry point
export async function displayChat(contentContainer, isLoggedIn) {
    contentContainer.textContent = "";

    // theme toggle & accessibility wrapper
    const themeToggle = createElement("button", { class: "theme-toggle" }, ["🌙"]);
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
    });

    if (!isLoggedIn) {
        contentContainer.appendChild(createElement("p", {}, [t("chat.login_prompt")]));
        return;
    }

    const wrapper = createElement("div", { class: "chat-wrapper", role: "application", "aria-live": "polite" });
    const sidebar = createElement("div", { class: "chat-sidebar", role: "complementary" });
    const main = createElement("div", { class: "chat-main", role: "main" });

    // sidebar.append(themeToggle, createNewChatButton(), createElement("div", { class: "chat-list", role: "navigation" }));
    sidebar.append(themeToggle, createElement("div", { class: "chat-list", role: "navigation" }));
    main.append(
        createSearchBar(),
        createElement("div", { class: "chat-view", role: "region" }),
        createPresenceIndicator()
    );

    wrapper.append(sidebar, main);
    contentContainer.appendChild(wrapper);

    await loadChatList(sidebar.querySelector(".chat-list"), main.querySelector(".chat-view"));
}

// — Sidebar ——————————————————————————————————————————————

export function createNewChatButton() {
    const btn = createElement("button", { class: "new-chat-btn" }, [t("chat.new_chat")]);
    btn.addEventListener("click", () => showNewChatForm(btn.parentElement));
    return btn;
}

function showNewChatForm(container) {
    container.querySelectorAll(".new-chat-form").forEach(el => el.remove());
    const form = createElement("div", { class: "new-chat-form" }, [
        createElement("input", { type: "text", placeholder: t("chat.placeholder_ids"), "aria-label": t("chat.placeholder_ids") }),
        createElement("button", {}, [t("chat.start")])
    ]);
    const [input, startBtn] = form.children;
    startBtn.addEventListener("click", async () => {
        const participants = input.value.split(",").map(s => s.trim()).filter(Boolean);
        if (participants.length < 2) return alert("Need at least 2");
        if (!participants.includes(getState("user"))) participants.push(getState("user"));
        const chat = await apiFetch("/merechats/start", "POST", { participants });
        form.remove();
        await loadChatList(container.querySelector(".chat-list"), document.querySelector(".chat-view"));
        openChat(chat.id, document.querySelector(".chat-view"));
    });
    container.appendChild(form);
}

export async function loadChatList(listContainer, chatContainer) {
    const chats = await apiFetch("/merechats/all", "GET") || [];
    listContainer.textContent = "";
    chats.forEach(chat => {
        const label = chat.participants.filter(p => p !== getState("user")).join(", ");
        const btn = createElement("button", {
            class: "chat-item",
            dataset: { id: chat.id },
            role: "button",
            "aria-label": `Chat with ${label}`
        }, [label || "(no one else)"]);
        btn.addEventListener("click", () => openChat(chat.id, chatContainer));
        listContainer.appendChild(btn);
    });
}

// — Search Bar (jump‑to) ——————————————————————————————————————

function createSearchBar() {
    const input = createElement("input", {
        class: "chat-search",
        type: "search",
        placeholder: t("chat.search"),
        "aria-label": t("chat.search")
    });
    input.addEventListener("input", () => {
        const term = input.value.toLowerCase();
        document.querySelectorAll(".message").forEach(el => {
            const text = el.textContent.toLowerCase();
            el.style.display = text.includes(term) ? "" : "none";
        });
    });
    return createElement("div", { class: "search-bar" }, [input]);
}

// — Presence & Typing ——————————————————————————————————————

function createPresenceIndicator() {
    const div = createElement("div", { class: "presence" }, [
        createElement("span", { class: "presence-status" }, [t("chat.offline")])
    ]);
    return div;
}

function updatePresence(status) {
    const span = document.querySelector(".presence-status");
    if (span) span.textContent = status ? t("chat.online") : t("chat.offline");
}

// — Main Chat View ——————————————————————————————————————

export async function openChat(chatId, container) {
    currentChatId = chatId;
    skip = 0;
    container.textContent = "";

    // const header = createElement("div", { class: "chat-header" }, [
    //     createElement("h3", {}, [`Chat: ${chatId}`])
    // ]);
    const msgList = createElement("div", {
        class: "message-list",
        role: "log",
        "aria-relevant": "additions text"
    });
    const inputArea = createMessageInputArea(msgList);

    // container.append(header, msgList, inputArea);
    container.append(msgList, inputArea);
    await loadMessages(msgList, /*prepend=*/false);
    setupScrollLoading(msgList);
    setupWebSocket(msgList);
}

async function loadMessages(msgList, prepend) {
    const messages = await apiFetch(
        `/merechats/chat/${currentChatId}/messages?skip=${skip}&limit=${limit}`,
        "GET"
    ) || [];
    skip += messages.length;
    if (prepend) {
        const prevHeight = msgList.scrollHeight;
        messages.reverse().forEach(msg => msgList.prepend(renderMessage(msg, msgList)));
        // keep scroll position stable
        msgList.scrollTop = msgList.scrollHeight - prevHeight;
    } else {
        messages.forEach(msg => msgList.appendChild(renderMessage(msg, msgList)));
        // scroll to bottom
        msgList.scrollTop = msgList.scrollHeight;
    }
}

// — Infinite scroll loading older ——————————————————————————————————

function setupScrollLoading(msgList) {
    msgList.addEventListener("scroll", async () => {
        if (msgList.scrollTop === 0) {
            await loadMessages(msgList, /*prepend=*/true);
        }
    });
}

// — Message Input + File Upload ——————————————————————————————————

function createMessageInputArea(msgList) {
    const textInput = createElement("input", {
        type: "text",
        placeholder: t("chat.type_message"),
        "aria-label": t("chat.type_message")
    });
    const sendBtn = createElement("button", {}, [t("chat.send")]);
    const fileBtn = createElement("button", { class: "file-upload-btn" }, [t("chat.upload")]);
    const fileInput = createElement("input", { type: "file", hidden: true });

    // text send
    sendBtn.addEventListener("click", () => sendText(textInput, msgList));
    textInput.addEventListener("keydown", e => {
        if (e.key === "Enter") sendText(textInput, msgList);
    });

    // file upload
    fileBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;
        const form = new FormData();
        form.append("file", file);
        const attachment = await apiFetch(
            `/merechats/chat/${currentChatId}/upload`,
            "POST",
            form,
            { isFormData: true }
        );
        // render attachment
        msgList.appendChild(renderAttachment(attachment));
        fileInput.value = "";
    });

    return createElement("div", { class: "message-input" }, [
        textInput, sendBtn, fileBtn, fileInput
    ]);
}

async function sendText(input, msgList) {
    const content = input.value.trim();
    if (!content) return;
    input.value = "";
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ chatId: currentChatId, content }));
    } else {
        const msg = await apiFetch(
            `/merechats/chat/${currentChatId}/message`,
            "POST",
            { content }
        );
        msgList.appendChild(renderMessage(msg, msgList));
    }
}

// — Render Message & Attachment ——————————————————————————————————

function renderMessage(msg, msgList) {
    const isMine = msg.sender === getState("user");
    const container = createElement("div", { class: "message", dataset: { id: msg.id } }, [
        createElement("span", { class: "msg-sender" }, [`${msg.sender}: `]),
        createElement("span", { class: "msg-content" }, [
            msg.deleted ? "[deleted]" : msg.content
        ])
    ]);

    // edit/delete as before...
    // omitted here for brevity, same as prior code

    return container;
}

function renderAttachment(att) {
    const { id, url, type } = att; // type: "image"|"file"
    let contentEl;
    if (type.startsWith("image/")) {
        contentEl = createElement("img", { src: url, class: "msg-image", alt: "" });
    } else {
        contentEl = createElement("a", { href: url, download: "", class: "msg-file" }, [url.split("/").pop()]);
    }
    return createElement("div", { class: "message attachment", dataset: { id } }, [contentEl]);
}

// — WebSocket ——————————————————————————————————————————

function setupWebSocket(msgList) {
    if (socket) socket.close();
    socket = new WebSocket(`${window.location.protocol.replace("http", "ws")}//${window.location.host}/ws/merechat`);

    socket.addEventListener("open", () => {
        // announce presence
        socket.send(JSON.stringify({ type: "presence", online: true }));
    });
    socket.addEventListener("close", () => {
        socket = null;
        updatePresence(false);
    });

    socket.addEventListener("message", ({ data }) => {
        const payload = JSON.parse(data);
        switch (payload.type) {
            case "message":
                if (payload.chatId === currentChatId) {
                    msgList.appendChild(renderMessage(payload.message, msgList));
                    msgList.scrollTop = msgList.scrollHeight;
                }
                break;
            case "typing":
                showTypingIndicator(payload.from);
                break;
            case "presence":
                updatePresence(payload.online);
                break;
        }
    });

    // send typing events
    const input = document.querySelector(".message-input input[type=text]");
    input?.addEventListener("input", () => {
        socket.send(JSON.stringify({ type: "typing", chatId: currentChatId }));
    });
}

// — Typing Indicator ——————————————————————————————————————

let typingTimeout;
function showTypingIndicator(user) {
    const bar = document.querySelector(".presence");
    if (!bar) return;
    let tip = bar.querySelector(".typing");
    if (!tip) {
        tip = createElement("span", { class: "typing" }, [t("chat.typing")]);
        bar.appendChild(tip);
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => tip.remove(), 2000);
}
