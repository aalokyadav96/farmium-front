import { displayOneChat } from "../../services/mechat/onechat.js";

async function OneChatPage(isLoggedIn, chatid, contentContainer) {
    contentContainer.innerHTML = '';
    displayOneChat(contentContainer, chatid, isLoggedIn);
}

export { OneChatPage };