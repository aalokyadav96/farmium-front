// chatUI.js
import { createElement } from "../../components/createElement";
import { t } from "./i18n.js";
// import { createNewChatButton, createSearchBar } from "./chatComponents.js";
import { createSearchBar } from "./chatComponents.js";
import { loadChatList } from "./chatHandlers.js";

export async function displayChat(contentContainer, isLoggedIn) {
  contentContainer.textContent = "";

  if (!isLoggedIn) {
    contentContainer.appendChild(createElement("p", {}, [t("chat.login_prompt")]));
    return;
  }

  const wrapper = createElement("div", {
    class: "merechatcon",
    role: "application",
    "aria-live": "polite"
  });

  const sidebar = createElement("aside", { class: "chat-sidebar", role: "complementary" });
  const main = createElement("main", { class: "chat-main", role: "main" });

  const chatList = createElement("nav", { class: "chat-list", role: "navigation" });
  const chatView = createElement("section", { class: "chat-view", role: "region" });

  sidebar.append(
    // createNewChatButton(sidebar, chatView),
    chatList
  );

  main.append(
    createSearchBar(chatView),
    chatView
  );

  wrapper.append(sidebar, main);
  contentContainer.appendChild(wrapper);

  await loadChatList(chatList, chatView, true);
}

// // chatUI.js
// import { createElement } from "../../components/createElement";
// import { t } from "./i18n.js";
// import { createNewChatButton, createSearchBar } from "./chatComponents.js";
// import { loadChatList } from "./chatHandlers.js";

// export async function displayChat(contentContainer, isLoggedIn) {
//   contentContainer.textContent = "";
//   if (!isLoggedIn) {
//     contentContainer.appendChild(createElement("p", {}, [ t("chat.login_prompt") ]));
//     return;
//   }

//   const wrapper = createElement("div", {
//     class: "merechatcon",
//     role: "application",
//     "aria-live": "polite"
//   });
//   const sidebar = createElement("div", { class: "chat-sidebar", role: "complementary" });
//   const main    = createElement("div", { class: "chat-main", role: "main" });

//   const chatList = createElement("div", { class: "chat-list", role: "navigation" });
//   const chatView = createElement("div", { class: "chat-view", role: "region" });

//   sidebar.append(createNewChatButton(sidebar, chatView), chatList);
//   main.append(createSearchBar(chatView), chatView);
//   wrapper.append(sidebar, main);
//   contentContainer.appendChild(wrapper);

//   await loadChatList(chatList, chatView, true);
// }

// // //chatUI.js
// // import { createElement } from "../../components/createElement.js";

// // import { t } from "./i18n.js";
// // import {
// //     createNewChatButton,
// //     createSearchBar,
// // } from "./chatComponents.js";

// // import {
// //     loadChatList,
// // } from "./chatHandlers.js";

// // export async function displayChat(contentContainer, isLoggedIn) {
// //     contentContainer.textContent = "";

// //     if (!isLoggedIn) {
// //         contentContainer.appendChild(createElement("p", {}, [t("chat.login_prompt")]));
// //         return;
// //     }

// //     const wrapper = createElement("div", { class: "merechatcon", role: "application", "aria-live": "polite" });
// //     const sidebar = createElement("div", { class: "chat-sidebar", role: "complementary" });
// //     const main = createElement("div", { class: "chat-main", role: "main" });

// //     const chatList = createElement("div", { class: "chat-list", role: "navigation" });
// //     const chatView = createElement("div", { class: "chat-view", role: "region" });

// //     // sidebar.append(createNewChatButton(chatList, chatView), chatList);
// //     sidebar.append(chatList);
// //     main.append(createSearchBar(chatView), chatView);
// //     wrapper.append(sidebar, main);

// //     contentContainer.appendChild(wrapper);

// //     await loadChatList(chatList, chatView);
// // }
