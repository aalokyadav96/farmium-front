import { apiFetch } from "../../api/api.js";
import { getState } from "../../state/state.js";
import { displayChat } from "./chatPage.js"; // assuming you have these

export async function displayChats(contentContainer, isLoggedIn) {
    contentContainer.innerHTML = ""; // Clear full layout container

    // Main wrapper: sidebar + chat view
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.height = "100%";

    // Sidebar
    const sidebar = document.createElement("div");
    sidebar.id = "chat-sidebar";
    sidebar.style.width = "300px";
    sidebar.style.borderRight = "1px solid #ccc";
    sidebar.style.overflowY = "auto";
    sidebar.style.boxSizing = "border-box";

    const list = document.createElement("ul");
    list.id = "chat-list";
    list.style.listStyle = "none";
    list.style.padding = "0";
    list.style.margin = "0";
    sidebar.appendChild(list);

    // Chat view container (right side)
    const chatView = document.createElement("div");
    chatView.id = "chat-view";
    chatView.style.flex = "1";
    chatView.style.overflow = "hidden";
    chatView.style.position = "relative";
    chatView.style.maxWidth = "450px";

    wrapper.appendChild(sidebar);
    wrapper.appendChild(chatView);
    contentContainer.appendChild(wrapper);

    try {
        const chats = await apiFetch("/chats/all");
        const currentUser = getState("user");

        if (!Array.isArray(chats) || chats.length === 0) {
            list.innerHTML = "<li style='padding: 1rem;'>No chats found.</li>";
            return;
        }

        chats.forEach(chat => {
            const otherUser = chat.users.find(id => id !== currentUser);
            const isRead = chat.readStatus?.[currentUser];
            const lastMsg = chat.lastMessage?.text || "No messages yet";
            const timestamp = chat.lastMessage?.timestamp
                ? new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "";

            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.padding = "10px";
            li.style.cursor = "pointer";
            li.style.borderBottom = "1px solid #eee";
            li.style.background = isRead ? "#fff" : "#f0f8ff";

            li.addEventListener("click", () => {
                displayChat(chatView, chat._id, isLoggedIn); // only updates right panel
            });

            const avatar = document.createElement("div");
            avatar.textContent = otherUser?.charAt(0).toUpperCase();
            avatar.style.width = "40px";
            avatar.style.height = "40px";
            avatar.style.borderRadius = "50%";
            avatar.style.background = "#888";
            avatar.style.color = "#fff";
            avatar.style.display = "flex";
            avatar.style.alignItems = "center";
            avatar.style.justifyContent = "center";
            avatar.style.marginRight = "10px";
            avatar.style.fontWeight = "bold";

            const info = document.createElement("div");
            info.style.flex = "1";

            const name = document.createElement("strong");
            name.textContent = `${otherUser}`;
            name.style.fontWeight = isRead ? "normal" : "bold";

            const messagePreview = document.createElement("div");
            messagePreview.textContent = lastMsg;
            messagePreview.style.fontSize = "0.9em";
            messagePreview.style.color = "#666";
            messagePreview.style.overflow = "hidden";
            messagePreview.style.textOverflow = "ellipsis";
            messagePreview.style.whiteSpace = "nowrap";

            const time = document.createElement("div");
            time.textContent = timestamp;
            time.style.fontSize = "0.75em";
            time.style.color = "#999";
            time.style.marginLeft = "auto";

            info.appendChild(name);
            info.appendChild(messagePreview);

            li.appendChild(avatar);
            li.appendChild(info);
            li.appendChild(time);

            list.appendChild(li);
        });
    } catch (err) {
        console.error(err);
        list.innerHTML = "<li style='padding: 1rem;'>Failed to load chats.</li>";
    }
}
