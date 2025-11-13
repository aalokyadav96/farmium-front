import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import Modal from "../../components/ui/Modal.mjs";
import Datex from "../../components/base/Datex.js";

/**
 * Display a list of notices for an entity.
 * Shows "Add Notice" button if user is the creator.
 */
export async function displayNotices(entityType, entityId, container, isCreator) {
    container.replaceChildren();

    const header = createElement("div", { id: "notice-header" }, [
        createElement("h3", {}, [document.createTextNode("Notices")])
    ]);
    container.appendChild(header);

    // Add Notice Button (for creator only)
    if (isCreator) {
        const addBtn = Button("➕ Add Notice", "addNoticeBtn", {
            click: async () => {
                const title = prompt("Enter notice title:");
                if (!title) return;
                const content = prompt("Enter notice content:");
                if (!content) return;

                const endpoint = `/notices/${entityType}/${entityId}`;
                const res = await apiFetch(endpoint, "POST", { title, content });
                if (res && res._id) {
                    await displayNotices(entityType, entityId, container, isCreator);
                } else {
                    alert("Failed to create notice.");
                }
            }
        }, "notice-add-btn");
        header.appendChild(addBtn);
    }

    // Fetch all notices (list view uses summary)
    const notices = await apiFetch(`/notices/${entityType}/${entityId}`, "GET");
    if (!Array.isArray(notices)) {
        container.appendChild(createElement("p", {}, [document.createTextNode("Failed to load notices.")]));
        return;
    }

    if (notices.length === 0) {
        container.appendChild(createElement("p", {}, [document.createTextNode("No notices yet.")]));
        return;
    }

    const list = createElement("div", { id: "notice-list" });

    notices.forEach(notice => {
        const noticeBox = createElement("div", { class: "notice-item", tabindex: "0" }, [
            createElement("h4", {}, [document.createTextNode(notice.title || "Untitled")]),
            createElement("p", {}, [document.createTextNode(notice.summary.length > 80 ? notice.summary.slice(0, 80) + "..." : notice.summary)]),
            // createElement("small", {}, [document.createTextNode(`Posted on ${new Date(notice.createdAt).toLocaleString()}`)])
            createElement("small", {}, [document.createTextNode(`Posted on ${Datex(notice.createdAt, true)}`)])
        ]);

        // On click → fetch full notice and open modal
        noticeBox.addEventListener("click", async () => {
            const fullNotice = await apiFetch(`/notices/${entityType}/${entityId}/${notice._id}`, "GET");
            if (fullNotice && fullNotice._id) {
                openNoticeModal(fullNotice, entityType, entityId, isCreator, container);
            } else {
                alert("Failed to load notice.");
            }
        });

        list.appendChild(noticeBox);
    });

    container.appendChild(list);
}

/**
 * Open a modal showing a single notice.
 */
function openNoticeModal(notice, entityType, entityId, isCreator, container) {
    const modalContent = createElement("div", { class: "notice-modal-content" });

    const titleEl = createElement("h3", {}, [document.createTextNode(notice.title || "Untitled Notice")]);
    const contentEl = createElement("p", { class: "notice-modal-text" }, [document.createTextNode(notice.content)]);
    // const dateEl = createElement("small", {}, [document.createTextNode(`Posted on ${new Date(notice.createdAt).toLocaleString()}`)]);
    const dateEl = createElement("small", {}, [document.createTextNode(`Posted on ${Datex(notice.createdAt)}`)]);

    modalContent.appendChild(titleEl);
    modalContent.appendChild(contentEl);
    modalContent.appendChild(dateEl);

    if (isCreator) {
        const actions = createElement("div", { class: "notice-modal-actions" });

        const editBtn = Button("✏️ Edit", "", {
            click: async () => {
                const newTitle = prompt("Edit title:", notice.title);
                if (newTitle === null) return;
                const newContent = prompt("Edit content:", notice.content);
                if (newContent === null) return;

                const endpoint = `/notices/${entityType}/${entityId}/${notice._id}`;
                const res = await apiFetch(endpoint, "PUT", { title: newTitle, content: newContent });
                if (res && res._id) {
                    modal.close();
                    await displayNotices(entityType, entityId, container, isCreator);
                } else {
                    alert("Failed to update notice.");
                }
            }
        }, "notice-edit-btn buttonx");

        const delBtn = Button("🗑️ Delete", "", {
            click: async () => {
                if (!confirm("Delete this notice?")) return;
                const endpoint = `/notices/${entityType}/${entityId}/${notice._id}`;
                const res = await apiFetch(endpoint, "DELETE");
                if (res === null) { // DELETE returns 204
                    modal.close();
                    await displayNotices(entityType, entityId, container, isCreator);
                } else {
                    alert("Failed to delete notice.");
                }
            }
        }, "notice-delete-btn buttonx");

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        modalContent.appendChild(actions);
    }

    const modal = Modal({
        title: "Notice",
        content: modalContent,
        size: "medium"
    });
}
