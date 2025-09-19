// import { displayOneChat } from "../../services/mechat/onechat.js";
import { displayOneChat } from "../../services/newchat/displayNewchat";

async function OneChatPage(isLoggedIn, chatid, contentContainer) {
    contentContainer.innerHTML = '';
    displayOneChat(contentContainer, chatid, isLoggedIn);
}

export { OneChatPage };