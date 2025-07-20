// components/notifications/modal.js
import Modal from "../../components/ui/Modal.mjs";
import { createElement } from "../../components/createElement.js";

export function openNotificationsModal() {
    const wrapper = createElement("div", {
        style: "padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;"
    });

    // Example placeholder content
    wrapper.appendChild(createElement("p", {}, ["🔔 No new notifications."]));
    wrapper.appendChild(createElement("p", {}, ["Check back later for updates."]));

    const modal = Modal({
        title: "Notifications",
        content: wrapper,
        onClose: () => modal.remove()
    });
}
