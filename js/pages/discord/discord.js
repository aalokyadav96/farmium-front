import { displayChats } from "../../services/discord/merechat";

async function Discord(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayChats(contentContainer, isLoggedIn);
}

export { Discord };
