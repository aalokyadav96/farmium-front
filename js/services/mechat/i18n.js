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

export function t(key) {
    return dict[key] || key;
}
