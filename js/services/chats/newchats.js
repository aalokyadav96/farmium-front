import { apiFetch } from "../../api/api.js";
import { getState } from "../../state/state.js";
import { navigate } from "../../routes/index.js";
import { displayChat } from "./displayNewchat.js";

export async function displayChats(contentContainer, isLoggedIn) {
    // Clear previous content
    while (contentContainer.firstChild) {
        contentContainer.removeChild(contentContainer.firstChild);
    }

    // Layout
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
        display: "flex",
        height: "100%",
    });

    // Sidebar
    const sidebar = document.createElement("div");
    sidebar.id = "chat-sidebar";
    Object.assign(sidebar.style, {
        width: "300px",
        borderRight: "1px solid #ccc",
        overflowY: "auto",
        boxSizing: "border-box",
    });

    const list = document.createElement("ul");
    list.id = "chat-list";
    Object.assign(list.style, {
        listStyle: "none",
        padding: "0",
        margin: "0",
    });
    sidebar.appendChild(list);

    // Chat view
    const chatView = document.createElement("div");
    chatView.id = "chat-view";
    Object.assign(chatView.style, {
        flex: "1",
        overflow: "hidden",
        position: "relative",
    });

    // Add components to container
    wrapper.appendChild(sidebar);
    wrapper.appendChild(chatView);
    contentContainer.appendChild(wrapper);

    // Fetch and display chats
    try {
        const chats = await apiFetch("/newchats/all");
        const currentUser = getState("user");

        if (!Array.isArray(chats) || chats.length === 0) {
            const noChatsLi = document.createElement("li");
            noChatsLi.textContent = "No chats found.";
            noChatsLi.style.padding = "1rem";
            list.appendChild(noChatsLi);
            return;
        }

        chats.forEach(chat => {
            const otherUser = chat.users.find(id => id !== currentUser);
            // const isRead = chat.readStatus?.[currentUser];
            const lastMsg = chat.lastMessage?.text || "No messages yet";
            const timestamp = chat.lastMessage?.timestamp
                ? new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : "";

            const li = document.createElement("li");
            Object.assign(li.style, {
                display: "flex",
                alignItems: "center",
                padding: "10px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                // background: isRead ? "#fff" : "#f0f8ff",
            });

            li.addEventListener("click", () => {
                displayChat(chatView, chat._id, isLoggedIn);
            });

            // Avatar
            const avatar = document.createElement("div");
            avatar.textContent = otherUser?.charAt(0).toUpperCase();
            Object.assign(avatar.style, {
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#888",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "10px",
                fontWeight: "bold",
            });

            // Info
            const info = document.createElement("div");
            info.style.flex = "1";

            const name = document.createElement("strong");
            name.textContent = otherUser || "Unknown";
            // name.style.fontWeight = isRead ? "normal" : "bold";

            const messagePreview = document.createElement("div");
            messagePreview.textContent = lastMsg;
            Object.assign(messagePreview.style, {
                fontSize: "0.9em",
                color: "#666",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
            });

            const time = document.createElement("div");
            time.textContent = timestamp;
            Object.assign(time.style, {
                fontSize: "0.75em",
                color: "#999",
                marginLeft: "auto",
            });

            info.appendChild(name);
            info.appendChild(messagePreview);

            li.appendChild(avatar);
            li.appendChild(info);
            li.appendChild(time);

            list.appendChild(li);
        });
    } catch (err) {
        console.error("Error loading chats:", err);

        const errorLi = document.createElement("li");
        errorLi.textContent = "Failed to load chats.";
        errorLi.style.padding = "1rem";
        list.appendChild(errorLi);
    }
}

export async function userNewChatInit(targetUserId) {
    try {
        const currentUserId = getState("user");
        if (!currentUserId || !targetUserId) {
            throw new Error("Missing user IDs");
        }

        const payload = { userA: currentUserId, userB: targetUserId };
        const data = await apiFetch("/newchats/init", "POST", JSON.stringify(payload));

        if (!data.chatid) {
            throw new Error("Chat ID missing in response.");
        }

        navigate(`/newchat/${data.chatid}`);
    } catch (err) {
        console.error("Chat init error:", err);
        alert("Unable to start or find chat.");
    }
}
