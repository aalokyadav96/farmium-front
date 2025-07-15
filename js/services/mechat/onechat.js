import { createElement } from "../../components/createElement";
import { openChat } from "./chatHandlers";



export function displayOneChat(contentContainer, chatId, isLoggedIn) {
  // Clear container
  contentContainer.innerHTML = "";
  let container = createElement('div', { "class": "onechatcon" }, []);
  contentContainer.appendChild(container);

    openChat(chatId, container);
}


// export function displayOneChat(contentContainer, chatId, isLoggedIn) {
//   // Clear container
//   contentContainer.innerHTML = "";
//   let container = createElement('div', { "class": "onechatcon" }, []);
//   contentContainer.appendChild(container);
//   // document.addEventListener("click", () => {
//   //   document.querySelectorAll(".dropdown.open").forEach(el => el.classList.remove("open"));
// // });

// }