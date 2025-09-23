import { displayChat } from "../../services/mechat/merechat";

async function Discord(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayChat(contentContainer, isLoggedIn);
}

export { Discord };
