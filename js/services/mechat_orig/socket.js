import { renderMessage } from "./chomponents/index.js";
import { getChatState } from "./chatState.js";

export function setupWebSocket(msgList) {
    const { currentChatId } = getChatState();

    if (window.socket) window.socket.close();

    // window.socket = new WebSocket(`ws://yourserver.com/ws/${currentChatId}`);
    window.socket = new WebSocket(`${window.location.protocol.replace("http", "ws")}//127.0.0.1:4000/ws/merechat`);

    window.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
            msgList.appendChild(renderMessage(data));
        }
    };

    window.socket.onclose = () => {
        console.warn("Socket closed.");
    };
}
