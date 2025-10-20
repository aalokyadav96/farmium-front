import { createElement } from "../../components/createElement.js";
import { createChatContent } from "./mediaRender.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Imagex from "../../components/base/Imagex.js";

export function setupMessageActions(msg, socket) {
  const container = createElement("nav", { 
    class: "msg-actions-container", 
    "aria-label": "Message actions" 
  });

  const triggerBtn = createElement("button", { 
    class: "msg-actions-trigger", 
    "aria-haspopup": "true", 
    "aria-expanded": "false", 
    "aria-label": "Open message actions menu" 
  }, ["⋮"]);

  const dropdown = createElement("ul", { 
    class: "msg-actions-dropdown hidden", 
    role: "menu" 
  });

  // --- Edit action ---
  if (msg.content) {
    const editItem = createElement("li", { role: "menuitem" }, [
      createElement("button", { class: "msg-action-item edit-item", "aria-label": "Edit message" }, ["Edit"])
    ]);
    editItem.firstChild.addEventListener("click", () => {
      const wrapper = document.getElementById(`msg-${msg.id || msg.messageid}`);
      const input = createElement("input", { 
        type: "text", 
        value: msg.content, 
        class: "msg-edit-input", 
        "aria-label": "Edit message text" 
      });
      const saveBtn = createElement("button", { class: "msg-btn save-btn", "aria-label": "Save edited message" }, ["Save"]);

      saveBtn.addEventListener("click", () => {
        const newText = input.value.trim();
        if (newText && newText !== msg.content) {
          socket.send(JSON.stringify({ action: "edit", id: msg.id || msg.messageid, content: newText }));
        }
        wrapper.innerHTML = ""; 
        wrapper.append(newText);
      });

      wrapper.append(input, saveBtn);
      dropdown.classList.add("hidden");
      triggerBtn.setAttribute("aria-expanded", "false");
    });
    dropdown.appendChild(editItem);
  }

  // --- Delete action ---
  const deleteItem = createElement("li", { role: "menuitem" }, [
    createElement("button", { class: "msg-action-item delete-item", "aria-label": "Delete message" }, ["Delete"])
  ]);
  deleteItem.firstChild.addEventListener("click", () => {
    if (confirm("Delete this message?")) {
      socket.send(JSON.stringify({ action: "delete", id: msg.id || msg.messageid }));
    }
    dropdown.classList.add("hidden");
    triggerBtn.setAttribute("aria-expanded", "false");
  });
  dropdown.appendChild(deleteItem);

  // Toggle dropdown
  triggerBtn.addEventListener("click", () => {
    const isHidden = dropdown.classList.toggle("hidden");
    triggerBtn.setAttribute("aria-expanded", !isHidden);
  });

  container.append(triggerBtn, dropdown);
  return container;
}

export async function renderMessage(msg, container, currentUserId, socket) {
  if (!msg.id && !msg.content && !msg.files) return;
  const messageId = msg.id || `temp-${msg.timestamp}`;
  let wrapper = document.getElementById(`msg-${messageId}`);

  if (!wrapper) {
    wrapper = createElement("article", { 
      class: "chat-message-wrapper", 
      id: `msg-${messageId}`, 
      role: "group", 
      "aria-label": "Chat message" 
    });
    container.appendChild(wrapper);
  } else {
    wrapper.innerHTML = "";
  }

  const time = new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  let contentNode;

  if (msg.files && msg.files.length > 0) {
    const file = msg.files[0];
    const fileUrl = file.path;
    const ext = file.filename.split('.').pop().toLowerCase();

    const type = ['jpg','jpeg','png'].includes(ext) ? "image" : 
                 ['mp4','webm','ogg'].includes(ext) ? "video" :
                 ['mp3','wav','ogg'].includes(ext) ? "audio" : "file";

    if (type === "file") {
      contentNode = createElement("a", { 
        href: fileUrl, 
        download: file.filename, 
        target: "_blank", 
        class: "chat-file-link", 
        "aria-label": `Download file ${file.filename}` 
      }, [file.filename]);
    } else {
      contentNode = await createChatContent(
        { type }, 
        [fileUrl], 
        msg.sender_id === currentUserId || msg.userId === currentUserId
      );
    }
  } else if (msg.content) {
    contentNode = createElement("p", { class: "chat-message-text" }, [msg.content]);
  } else {
    contentNode = createElement("p", { class: "chat-message-text system-msg" }, [""]);
  }

  const timeNode = createElement("time", { 
    class: "chat-message-time", 
    datetime: new Date(msg.timestamp * 1000).toISOString(), 
    "aria-label": `Sent at ${time}` 
  }, [time]);

  const avatarUrl = resolveImagePath(EntityType.USER, PictureType.THUMB, `${msg.sender_id}.jpg`);
  const avatarNode = Imagex( { 
    src: avatarUrl, 
    alt: "User avatar", 
    classes: "chat-message-avatar" 
  });

  const bubble = createElement("section", { 
    class: "chat-message-bubble", 
    role: "group", 
    "aria-label": "Message content" 
  }, [
    contentNode,
    timeNode
  ]);

  wrapper.append(avatarNode, bubble);

  if (msg.sender_id === currentUserId || msg.userId === currentUserId) {
    wrapper.appendChild(setupMessageActions(msg, socket));
  }

  container.scrollTop = container.scrollHeight;
}
