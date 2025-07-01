import { createElement } from "../../components/createElement.js";

/**
 * Creates edit and delete buttons for a message.
 * @param {Object} msg
 * @param {WebSocket} socket
 * @returns {HTMLElement}
 */
export function setupMessageActions(msg, socket) {
    const container = createElement('span', {
        style: 'margin-left: 10px;'
    });

    const editBtn = createElement('button', {
        style: 'margin-left: 5px; font-size: 12px;'
    }, ['Edit']);

    const deleteBtn = createElement('button', {
        style: 'margin-left: 5px; font-size: 12px; color: red;'
    }, ['Delete']);

    // Only allow editing if there's actual text content
    if (msg.content) {
        editBtn.addEventListener('click', () => {
            const wrapper = document.getElementById(`msg-${msg.id || msg.messageid}`);
            const contentSpan = wrapper.querySelector('.message-content');
            if (!contentSpan) return;

            const oldText = msg.content;

            const input = createElement('input', {
                type: 'text',
                value: oldText,
                style: 'margin-left: 10px; width: 60%; font-size: 14px;'
            });

            const saveBtn = createElement('button', {
                style: 'margin-left: 5px; font-size: 12px;'
            }, ['Save']);

            saveBtn.addEventListener('click', () => {
                const newText = input.value.trim();
                if (newText && newText !== oldText) {
                    socket.send(JSON.stringify({
                        action: 'edit',
                        id: msg.id || msg.messageid,
                        content: newText
                    }));
                }
            });

            contentSpan.replaceWith(input);
            container.replaceWith(saveBtn);
        });

        container.appendChild(editBtn);
    }

    // Always allow delete (text or media)
    deleteBtn.addEventListener('click', () => {
        const confirmed = confirm("Are you sure you want to delete this message?");
        if (confirmed) {
            socket.send(JSON.stringify({
                action: 'delete',
                id: msg.id || msg.messageid
            }));
        }
    });

    container.appendChild(deleteBtn);
    return container;
}

