import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { getState } from "../../state/state.js";
import { debounce } from "../../utils/deutils.js";
import { closeExistingSocket } from "./chatSocket.js";
import { t } from "./i18n.js";
import { safemereFetch, displayOneChat } from "./onechat.js";

/* -------------------------
   Search bar
   -------------------------*/
export function createSearchBar(chatView) {
  const inputId = "chat-search-input";
  const label = createElement("label", { for: inputId, class: "sr-only" }, [t("chat.search")]);

  const input = createElement("input", {
    id: inputId,
    class: "chat-search",
    type: "search",
    placeholder: t("chat.search"),
    "aria-label": t("chat.search")
  });

  const handler = debounce(() => {
    const term = (input.value || "").toLowerCase();
    const items = chatView.querySelectorAll(".msg-content");
    items.forEach(el => {
      const content = (el.innerText || "").toLowerCase();
      const parent = el.closest(".message-item");
      if (parent) parent.hidden = !content.includes(term);
    });
  }, 200);

  input.addEventListener("input", handler);

  return createElement("div", { class: "search-bar" }, [label, input]);
}

// /* -------------------------
//    Chat item
//    -------------------------*/
// function createChatButton(chat, user, chatModal) {
//   const label = (chat.participants || []).filter(p => p !== user).join(", ") || "(no one)";

//   const btn = createElement("button", {
//     class: "chat-item-button",
//     dataset: { id: chat.chatid },
//     role: "button",
//     "aria-label": `Chat with ${label}`
//   }, [label]);

//   btn.addEventListener("click", async () => {
//     chatModal.classList.add("active");

//     const backBtn = createElement("button", {
//       class: "chat-back-button",
//       "aria-label": "Back to chat list"
//     }, ["← Back"]);

//     const chatBody = createElement("div", { class: "chat-body" });

//     backBtn.addEventListener("click", () => {
//       chatModal.classList.remove("active");
//       while (chatModal.firstChild) chatModal.removeChild(chatModal.firstChild);
//       closeExistingSocket("back");
//     });

//     chatModal.replaceChildren(backBtn, chatBody);
//     await displayOneChat(chatBody, chat.chatid, Boolean(getState("token")));
//   });

//   return btn;
// }

/* -------------------------
   Chat item
   -------------------------*/
function createChatButton(chat, user, chatModal) {
  const label = (chat.participants || []).filter(p => p !== user).join(", ") || "(no one)";

  const btn = Button(label, "button", {
    "dataset": { id: chat.chatid },
    "role": "button",
    "aria-label": `Chat with ${label}`
  }, "chat-item-button buttonx");

  btn.addEventListener("click", async () => {
    chatModal.classList.add("active");

    const backBtn = createElement("button", {
      class: "chat-back-button",
      "aria-label": "Back to chat list"
    }, ["← Back"]);

    const chatBody = createElement("div", { class: "chat-body" });

    backBtn.addEventListener("click", () => {
      chatModal.classList.remove("active");
      while (chatModal.firstChild) chatModal.removeChild(chatModal.firstChild);
      closeExistingSocket("back");
    });

    chatModal.replaceChildren(backBtn, chatBody);
    await displayOneChat(chatBody, chat.chatid, Boolean(getState("token")));
  });

  return btn;
}

/* -------------------------
   Chat list + infinite scroll
   -------------------------*/
export async function loadChatList(listContainer, chatModal, reset = false) {
  if (listContainer.dataset.loading === "true") return;
  listContainer.dataset.loading = "true";

  if (reset) {
    listContainer.dataset.skip = "0";
    while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild);
    if (listContainer._observer) {
      listContainer._observer.disconnect();
      delete listContainer._observer;
    }
  }

  const skip = Number(listContainer.dataset.skip || "0");
  listContainer.setAttribute("aria-busy", "true");

  const url = `/merechats/all?skip=${skip}&limit=20`;
  let chats = [];
  try {
    chats = (await safemereFetch(url, "GET")) || [];
  } catch (e) {
    console.error("Failed to load chats", e);
    listContainer.appendChild(
      createElement("p", { class: "error", "aria-live": "polite" }, [t("chat.load_error")])
    );
    listContainer.setAttribute("aria-busy", "false");
    listContainer.dataset.loading = "false";
    return;
  }

  if (chats.length === 0 && skip === 0) {
    listContainer.appendChild(
      createElement("p", { class: "empty-chats", "aria-live": "polite" }, [t("chat.no_chats")])
    );
  }

  const user = getState("user") || "";
  const fragment = document.createDocumentFragment();

  chats.forEach(chat => {
    if (!listContainer.querySelector(`[data-id="${chat.chatid}"]`)) {
      fragment.appendChild(createChatButton(chat, user, chatModal));
    }
  });

  listContainer.appendChild(fragment);
  listContainer.dataset.skip = String(skip + chats.length);
  listContainer.setAttribute("aria-busy", "false");
  listContainer.dataset.loading = "false";

  // infinite scroll observer
  if (!listContainer.querySelector(".scroll-sentinel") && chats.length > 0) {
    const sentinel = createElement("div", { class: "scroll-sentinel" });
    listContainer.appendChild(sentinel);

    const observer = new IntersectionObserver(async entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        await loadChatList(listContainer, chatModal, false);
      }
    });
    listContainer._observer = observer;
    observer.observe(sentinel);
  }
}

/* -------------------------
   Main chat UI
   -------------------------*/
export async function displayChats(contentContainer, isLoggedIn) {
  while (contentContainer.firstChild) contentContainer.removeChild(contentContainer.firstChild);

  if (!isLoggedIn) {
    contentContainer.appendChild(
      createElement("p", { "aria-live": "polite" }, [t("chat.login_prompt")])
    );
    return;
  }

  const wrapper = createElement("div", {
    class: "merechatcon",
    role: "application",
    "aria-live": "polite"
  });

  const sidebar = createElement("aside", { class: "chat-sidebar", role: "complementary" });
  const main = createElement("div", { class: "chat-main", role: "main" });

  const chatList = createElement("nav", { class: "chat-list", role: "navigation" });
  const chatView = createElement("section", { class: "chat-view", role: "region" });

  sidebar.append(chatList);
  main.append(createSearchBar(chatView), chatView);
  wrapper.append(sidebar, main);
  contentContainer.appendChild(wrapper);

  await loadChatList(chatList, chatView, true);
}
