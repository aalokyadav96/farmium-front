// import { displayChat } from "../../services/mechat/merechat.js";
import { displayChats } from "../../services/newchat/newchats";

async function Mechat(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    displayChats(contentContainer, isLoggedIn);
}

export { Mechat };
