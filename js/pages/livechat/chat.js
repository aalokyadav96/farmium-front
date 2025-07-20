// import { displayChat } from "../../services/chats/displayNewchat.js";
import { displayChat } from "../../services/chats/chatPage.js";

async function LiveChat(isLoggedIn, chatID, contentContainer) {
    contentContainer.innerHTML = '';
    displayChat(contentContainer, chatID, isLoggedIn);
}

export { LiveChat };
