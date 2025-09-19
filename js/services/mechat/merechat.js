// merechat.js
import { createElement } from "../../components/createElement";
import { getState } from "../../state/state.js";
import { t } from "./i18n.js";
import { safeApiFetch, displayOneChat } from "./onechat.js";

/* -------------------------
   Utils
   -------------------------*/
function debounce(fn, ms = 200) {
  let tId;
  return (...args) => {
    clearTimeout(tId);
    tId = setTimeout(() => fn(...args), ms);
  };
}

/* -------------------------
   Search bar
   -------------------------*/
export function createSearchBar(chatView, messagesRef) {
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
    const term = String(input.value || "").toLowerCase();
    messagesRef.forEach(el => {
      const contentEl = el.querySelector(".msg-content");
      const content = contentEl ? String(contentEl.innerText || "") : "";
      el.hidden = !content.toLowerCase().includes(term);
    });
  }, 200);

  input.addEventListener("input", handler);

  return createElement("div", { class: "search-bar" }, [label, input]);
}

/* -------------------------
   Chat item
   -------------------------*/
function createChatButton(chat, user, chatModal) {
  const label = (chat.participants || []).filter(p => p !== user).join(", ") || "(no one)";

  const btn = createElement("button", {
    class: "chat-item-button",
    dataset: { id: chat.id },
    role: "button",
    "aria-label": `Chat with ${label}`
  }, [label]);

  btn.addEventListener("click", async () => {
    chatModal.classList.add("active");

    const backBtn = createElement("button", {
      class: "chat-back-button",
      "aria-label": "Back to chat list"
    }, ["← Back"]);

    backBtn.addEventListener("click", () => {
      chatModal.classList.remove("active");
      while (chatModal.firstChild) chatModal.removeChild(chatModal.firstChild);
      closeExistingSocket("back");
    });

    chatModal.replaceChildren(backBtn);
    await displayOneChat(chatModal, chat.id, Boolean(getState("token")));
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
    }
  
    const skip = Number(listContainer.dataset.skip || "0");
    listContainer.setAttribute("aria-busy", "true");
  
    const url = `/merechats/all?skip=${skip}&limit=20`;
    let chats = [];
    try {
      chats = await safeApiFetch(url, "GET") || [];
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
      if (!listContainer.querySelector(`[data-id="${chat.id}"]`)) {
        fragment.appendChild(createChatButton(chat, user, chatModal));
      }
    });
  
    listContainer.appendChild(fragment);
    listContainer.dataset.skip = String(skip + chats.length);
    listContainer.setAttribute("aria-busy", "false");
    listContainer.dataset.loading = "false";
  
    if (!listContainer.querySelector(".scroll-sentinel") && chats.length > 0) {
      const sentinel = createElement("div", { class: "scroll-sentinel" });
      listContainer.appendChild(sentinel);
  
      const observer = new IntersectionObserver(async entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          await loadChatList(listContainer, chatModal, false);
        }
      });
      observer.observe(sentinel);
    }
  }
  

/* -------------------------
   Main chat UI
   -------------------------*/
export async function displayChat(contentContainer, isLoggedIn) {
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

  // keep reference for search
  const messagesRef = [];

  sidebar.append(chatList);
  main.append(createSearchBar(chatView, messagesRef), chatView);
  wrapper.append(sidebar, main);
  contentContainer.appendChild(wrapper);

  await loadChatList(chatList, chatView, true);
}

// // merechat.js
// import { createElement } from "../../components/createElement";
// import { getState } from "../../state/state.js";
// import { t } from "./i18n.js";
// import { safeApiFetch, displayOneChat } from "./onechat.js";

// /* -------------------------
//    Search bar
//    -------------------------*/
// function debounce(fn, ms = 200) {
//   let tId;
//   return (...args) => {
//     clearTimeout(tId);
//     tId = setTimeout(() => fn(...args), ms);
//   };
// }

// export function createSearchBar(chatView) {
//   const input = createElement("input", {
//     class: "chat-search",
//     type: "search",
//     placeholder: t("chat.search"),
//     "aria-label": t("chat.search")
//   });

//   const handler = debounce(() => {
//     const term = String(input.value || "").toLowerCase();
//     Array.from(chatView.querySelectorAll(".message")).forEach(el => {
//       const contentEl = el.querySelector(".msg-content");
//       const content = contentEl ? String(contentEl.innerText || "") : "";
//       el.style.display = content.toLowerCase().includes(term) ? "" : "none";
//     });
//   }, 200);

//   input.addEventListener("input", handler);

//   return createElement("div", { class: "search-bar" }, [input]);
// }


// /* -------------------------
//    Chat list + infinite scroll
//    -------------------------*/
// export async function loadChatList(listContainer, chatModal, reset = false) {
//   if (reset) {
//     listContainer.dataset.skip = "0";
//     while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild);
//   }

//   const skip = Number(listContainer.dataset.skip || "0");
//   listContainer.setAttribute("aria-busy", "true");

//   const url = `/merechats/all?skip=${skip}&limit=20`;
//   const chats = await safeApiFetch(url, "GET") || [];

//   chats.forEach(chat => {
//     const user = getState("user") || "";
//     const label = (chat.participants || []).filter(p => p !== user).join(", ") || "(no one)";

//     const btn = createElement("button", {
//       class: "chat-item-button",
//       dataset: { id: chat.id },
//       role: "button",
//       "aria-label": `Chat with ${label}`
//     }, [label]);

//     btn.addEventListener("click", async () => {
//       chatModal.classList.add("active");

//       const backBtn = createElement("button", { class: "chat-back-button", "aria-label": "Back to chat list" }, ["← Back"]);
//       backBtn.addEventListener("click", () => {
//         chatModal.classList.remove("active");
//         while (chatModal.firstChild) chatModal.removeChild(chatModal.firstChild);
//         closeExistingSocket("back");
//       });

//       chatModal.replaceChildren(backBtn);
//       await displayOneChat(chatModal, chat.id, Boolean(getState("token")));
//     });

//     listContainer.appendChild(btn);
//   });

//   listContainer.dataset.skip = String(skip + chats.length);
//   listContainer.setAttribute("aria-busy", "false");

//   const parent = listContainer.parentElement;
//   if (parent && !parent.hasAttribute("data-scroll-registered")) {
//     parent.setAttribute("data-scroll-registered", "true");
//     parent.addEventListener("scroll", async () => {
//       const { scrollTop, scrollHeight, clientHeight } = parent;
//       if (scrollTop + clientHeight >= scrollHeight - 50) {
//         await loadChatList(listContainer, chatModal, false);
//       }
//     });
//   }
// }


// export async function displayChat(contentContainer, isLoggedIn) {
//   while (contentContainer.firstChild) contentContainer.removeChild(contentContainer.firstChild);

//   if (!isLoggedIn) {
//     contentContainer.appendChild(createElement("p", {}, [t("chat.login_prompt")]));
//     return;
//   }

//   const wrapper = createElement("div", { class: "merechatcon", role: "application", "aria-live": "polite" });
//   const sidebar = createElement("aside", { class: "chat-sidebar", role: "complementary" });
//   const main = createElement("div", { class: "chat-main", role: "main" });

//   const chatList = createElement("nav", { class: "chat-list", role: "navigation" });
//   const chatView = createElement("section", { class: "chat-view", role: "region" });

//   sidebar.append(chatList);
//   main.append(createSearchBar(chatView), chatView);
//   wrapper.append(sidebar, main);
//   contentContainer.appendChild(wrapper);

//   await loadChatList(chatList, chatView, true);
// }
