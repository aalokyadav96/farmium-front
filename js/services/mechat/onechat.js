// onechat.js
import { createElement } from "../../components/createElement.js";
import { openChat } from "./chatHandlers";

export function displayOneChat(contentContainer, chatId, isLoggedIn) {
  contentContainer.innerHTML = "";
  const container = createElement("div", { class: "onechatcon" }, []);
  contentContainer.appendChild(container);
  if (isLoggedIn) openChat(chatId, container);
  else container.appendChild(createElement("p", {}, ["🔒 Please log in to view this chat."]));
}

// // onechat.js
// import { createElement } from "../../components/createElement";
// import { openChat } from "./chatHandlers";



// export function displayOneChat(contentContainer, chatId, isLoggedIn) {
//   // Clear container
//   contentContainer.innerHTML = "";
//   let container = createElement('div', { "class": "onechatcon" }, []);
//   contentContainer.appendChild(container);

//     openChat(chatId, container);
// }
