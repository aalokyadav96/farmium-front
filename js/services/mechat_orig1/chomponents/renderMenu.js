// chomponents/renderMenu.js
import Button from "../../../components/base/Button.js";
import { createElement } from "../../../components/createElement";

// DRY handlers factory
const handlers = {
  edit: id => () => startEditingMessage(id),
  delete: id => () => confirmDelete(id),
  copy: content => () => copyToClipboard(content)
};

export function renderMenu(msg) {
  return createElement("div", { class: "msg-menu" }, [
    Button("⋮", "menu-btn", { click: e => {
      e.stopPropagation();
      e.currentTarget.nextSibling.classList.toggle("open");
    }}, "menu-btn"),
    createElement("div", { class: "dropdown" }, [
      Button("Edit", "edit-btn-chat", { click: handlers.edit(msg.id) }),
      Button("Delete", "del-btn-chat", { click: handlers.delete(msg.id) }),
      Button("Copy",   "cpy-btn",      { click: handlers.copy(msg.content || msg.media?.url) })
    ])
  ]);
}

// placeholder implementations — define in chat logic
function startEditingMessage(id) { /* see chatHandlers.js */ }
function confirmDelete(id)       { /* calls handleDelete */ }
function copyToClipboard(txt)    { navigator.clipboard.writeText(txt); }

// // chomponents/renderMenu.js
// import Button from "../../../components/base/Button.js";
// import { createElement } from "../../../components/createElement.js";

// export function renderMenu(msg) {
//     return createElement("div", { class: "msg-menu" }, [
//         Button("⋮", "menu-btn", {
//             click: (e) => {
//                 e.stopPropagation();
//                 const wrapper = e.currentTarget.closest(".msg-menu");
//                 wrapper?.querySelector(".dropdown")?.classList.toggle("open");
//             }
//         }, "menu-btn"),
//         createElement("div", { class: "dropdown" }, [
//             Button("Edit", "edit-btn-chat", { click: () => handleEdit(msg.id) }),
//             Button("Delete", "del-btn-chat", { click: () => handleDelete(msg.id) }),
//             Button("Copy", "cpy-btn", { click: () => copyToClipboard(msg.content || msg.media?.url) })
//         ])
//     ]);
// }
