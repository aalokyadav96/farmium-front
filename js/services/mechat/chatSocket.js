import { getState } from "../../state/state.js";
import { buildMessageElement } from "./merehelpers.js";

export let socket = null;

let previousTypingListener = null;

export function setupWebSocket(msgList) {
    if (socket) {
        socket.close();
        socket = null;
    }

    // socket = new WebSocket(`${window.location.protocol.replace("http", "ws")}//${window.location.host}/ws/merechat`);
    socket = new WebSocket(`${window.location.protocol.replace("http", "ws")}//127.0.0.1:4000/ws/merechat`);

    socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ type: "presence", online: true }));
        updatePresence(true);
    });

    socket.addEventListener("close", () => {
        updatePresence(false);

        // Optional auto-reconnect after 5s
        setTimeout(() => {
            setupWebSocket(msgList);
        }, 5000);
    });

    socket.addEventListener("message", ({ data }) => {
        let payload;
        try {
            payload = JSON.parse(data);
        } catch (err) {
            console.error("Invalid JSON in WebSocket message:", err);
            return;
        }

        switch (payload.type) {
            case "message":
                if (
                    payload.message &&
                    payload.message.chatId === getState("currentChatId")
                ) {
                    const atBottom = msgList.scrollHeight - msgList.scrollTop < msgList.clientHeight + 100;
                    msgList.appendChild(renderInlineMessage(payload.message));
                    if (atBottom) msgList.scrollTop = msgList.scrollHeight;
                }
                break;

            case "typing":
                if (payload.chatId === getState("currentChatId")) {
                    showTypingIndicator(payload.from);
                }
                break;

            case "presence":
                updatePresence(payload.online);
                break;

            default:
                console.warn("Unhandled WebSocket payload:", payload);
        }
    });

    // Attach input typing event listener
    const input = msgList.parentElement.querySelector("input[type=text]");
    if (input) {
        if (previousTypingListener) {
            input.removeEventListener("input", previousTypingListener);
        }

        previousTypingListener = () => {
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: "typing",
                    chatId: getState("currentChatId")
                }));
            }
        };

        input.addEventListener("input", previousTypingListener);
    }
}

export function updatePresence(isOnline) {
    const span = document.querySelector(".presence-status");
    if (span) span.textContent = isOnline ? "Online" : "Offline";
}

export function showTypingIndicator(user) {
    const bar = document.querySelector(".presence");
    if (!bar) return;

    const tip = bar.querySelector(".typing");
    tip.textContent = "typing…";
    tip.style.display = "";

    clearTimeout(bar._typingTimeout);
    bar._typingTimeout = setTimeout(() => {
        tip.style.display = "none";
    }, 2000);
}

function renderInlineMessage(msg) {
    return buildMessageElement(msg, { isInline: true });
}

// // chatSocket.js
// // import { persistMessage } from "./chatSocketHelpers.js"; // if you split out persist helper
// import { getState } from "../../state/state.js";
// import { buildMessageElement } from "./merehelpers.js";

// export let socket = null;

// export function setupWebSocket(msgList) {
//     if (socket) {
//         socket.close();
//         socket = null;
//     }
//     socket = new WebSocket(`${window.location.protocol.replace("http", "ws")}//${window.location.host}/ws/merechat`);

//     socket.addEventListener("open", () => {
//         socket.send(JSON.stringify({ type: "presence", online: true }));
//         updatePresence(true);
//     });

//     socket.addEventListener("close", () => {
//         updatePresence(false);
//     });

//     socket.addEventListener("message", ({ data }) => {
//         const payload = JSON.parse(data);
//         switch (payload.type) {
//             case "message":
//                 if (payload.message.chatId === getState("currentChatId")) {
//                     msgList.appendChild(renderInlineMessage(payload.message));
//                     // scroll if at bottom
//                     const atBottom = msgList.scrollHeight - msgList.scrollTop < msgList.clientHeight + 100;
//                     if (atBottom) msgList.scrollTop = msgList.scrollHeight;
//                 }
//                 break;
//             case "typing":
//                 if (payload.chatId === getState("currentChatId")) {
//                     showTypingIndicator(payload.from);
//                 }
//                 break;
//             case "presence":
//                 updatePresence(payload.online);
//                 break;
//         }
//     });

//     // typing broadcast
//     msgList.parentElement.querySelector("input[type=text]")
//         ?.addEventListener("input", () => {
//             if (socket.readyState === WebSocket.OPEN) {
//                 socket.send(JSON.stringify({
//                     type:   "typing",
//                     chatId: getState("currentChatId")
//                 }));
//             }
//         });
// }

// export function updatePresence(isOnline) {
//     const span = document.querySelector(".presence-status");
//     if (span) span.textContent = isOnline ? "Online" : "Offline";
// }

// export function showTypingIndicator(user) {
//     const bar = document.querySelector(".presence");
//     if (!bar) return;
//     const tip = bar.querySelector(".typing");
//     tip.textContent = "typing…";
//     tip.style.display = "";
//     clearTimeout(bar._typingTimeout);
//     bar._typingTimeout = setTimeout(() => {
//         tip.style.display = "none";
//     }, 2000);
// }

// function renderInlineMessage(msg) {
//     return buildMessageElement(msg, { isInline: true });
// }

// // // function renderInlineMessage(msg) {
// // //     const div = document.createElement("div");
// // //     div.classList.add("message");
// // //     div.dataset.id = msg.id;
// // //     const sender = document.createElement("span");
// // //     sender.classList.add("msg-sender");
// // //     sender.textContent = `${msg.sender}: `;
// // //     const content = document.createElement("span");
// // //     content.classList.add("msg-content");
// // //     content.textContent = msg.content;
// // //     div.append(sender, content);
// // //     return div;
// // // }

// // function renderInlineMessage(msg) {
// //     const div = document.createElement("div");
// //     div.classList.add("message");
// //     div.dataset.id = msg.id;

// //     const sender = document.createElement("span");
// //     sender.classList.add("msg-sender");
// //     sender.textContent = `${msg.sender}: `;

// //     const content = document.createElement("span");
// //     content.classList.add("msg-content");

// //     if (msg.deleted) {
// //         content.textContent = "[deleted]";
// //     } else if (msg.media?.url && msg.media?.type) {
// //         if (msg.media.type.startsWith("image/")) {
// //             const img = document.createElement("img");
// //             img.src = `${SRC_URL}/${msg.media.url}`;
// //             img.classList.add("msg-image");
// //             content.appendChild(img);
// //         } else {
// //             const link = document.createElement("a");
// //             link.href = msg.media.url;
// //             link.textContent = msg.media.url.split("/").pop();
// //             link.download = "";
// //             link.classList.add("msg-file");
// //             content.appendChild(link);
// //         }
// //     } else {
// //         content.textContent = msg.content;
// //     }

// //     div.append(sender, content);
// //     return div;
// // }
