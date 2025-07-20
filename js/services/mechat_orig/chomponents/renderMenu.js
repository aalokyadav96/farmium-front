import Button from "../../../components/base/Button.js";
import { createElement } from "../../../components/createElement.js";

export function renderMenu(msg) {
    return createElement("div", { class: "msg-menu" }, [
        Button("⋮", "menu-btn", {
            click: (e) => {
                e.stopPropagation();
                const wrapper = e.currentTarget.closest(".msg-menu");
                wrapper?.querySelector(".dropdown")?.classList.toggle("open");
            }
        }, "menu-btn"),
        createElement("div", { class: "dropdown" }, [
            Button("Edit", "edit-btn-chat", { click: () => handleEdit(msg.id) }),
            Button("Delete", "del-btn-chat", { click: () => handleDelete(msg.id) }),
            Button("Copy", "cpy-btn", { click: () => copyToClipboard(msg.content || msg.media?.url) })
        ])
    ]);
}
