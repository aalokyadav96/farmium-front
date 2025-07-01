import { createElement } from "../../components/createElement.js";
import { SRC_URL } from "../../state/state.js";
import { setupMessageActions } from "./actions.js";
import { createChatContent } from "./mediaRender.js";

/**
 * Renders a chat message.
 * @param {Object} msg
 * @param {HTMLElement} container
 * @param {string} currentUserId
 * @param {WebSocket} socket
 */
export function renderMessage(msg, container, currentUserId, socket) {
    const time = new Date(msg.timestamp * 1000).toLocaleTimeString();
    const messageId = msg.id || msg.messageid;

    if (msg.action === 'delete') {
        const deletedNode = document.getElementById(`msg-${messageId}`);
        if (deletedNode) deletedNode.style.display = "none";
        return;
    }

    const wrapper = createElement('div', {
        class: 'chat-message-wrapper',
        id: `msg-${messageId}`
    });

    let contentNode;

    if (msg.path) {
        const fileUrl = `${SRC_URL}/newchatpic/${msg.path}`;
        const ext = msg.filename.split('.').pop().toLowerCase();
        const post = {};

        if (['jpg', 'png', 'jpeg'].includes(ext)) {
            post.type = "image";
        } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
            post.type = "video";
        } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
            post.type = "audio";
        }

        if (post.type) {
            const timeLabel = createElement('div', { class: 'chat-message-time' }, [time]);
            contentNode = createChatContent(post, [fileUrl]);
            wrapper.append(timeLabel, contentNode);
        } else {
            const link = createElement('a', {
                href: fileUrl,
                download: msg.filename,
                target: '_blank',
                class: 'chat-message-file-link'
            }, [msg.filename]);

            contentNode = createElement('div', { class: 'chat-message-text' }, [`${time}: `, link]);
            wrapper.appendChild(contentNode);
        }
    } else {
        contentNode = createElement('div', {
            class: 'chat-message-text'
        }, [`${time}: ${msg.content || ""}`]);
        wrapper.appendChild(contentNode);
    }

    if (msg.senderId === currentUserId || msg.userId === currentUserId) {
        const actions = setupMessageActions(msg, socket);
        wrapper.appendChild(actions);
    }

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}
