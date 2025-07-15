import { displayChat } from "../../services/mechat/chatUI.js";

async function Mechat(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayChat(contentContainer, isLoggedIn);
}

export { Mechat };
