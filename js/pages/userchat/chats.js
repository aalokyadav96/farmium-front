import { displayChats } from "../../services/chats/newchats.js";
// import { displayChats } from "../../services/chats/chats.js";

async function Chats(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayChats(contentContainer, isLoggedIn);
}

export { Chats };
