import { displayChat } from "../../services/mechat/merechat.js";

async function Mechat(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayChat(contentContainer, isLoggedIn);
}

export { Mechat };
