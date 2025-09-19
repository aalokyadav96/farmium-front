import { createElement } from "../../../components/createElement.js";
import { SRC_URL } from "../../../state/state.js";
import { setupMessageActions } from "./actions.js";
import { createChatContent } from "./mediaRender.js";

export function renderMessage(msg, container, currentUserId, socket) {
  console.log((msg));
  const messageId = msg.id;
  let wrapper = document.getElementById(`msg-${messageId}`);

  if (!wrapper) {
    wrapper = createElement("div", { class: "chat-message-wrapper", id: `msg-${messageId}` });
    container.appendChild(wrapper);
  } else {
    wrapper.innerHTML = ""; // reset content
  }

  const time = new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let contentNode;

  if (msg.path) {
    const fileUrl = `${SRC_URL}/newchatpic/${msg.path}`;
    const ext = msg.filename.split('.').pop().toLowerCase();
    const type = ['jpg','jpeg','png'].includes(ext) ? "image" : 
                 ['mp4','webm','ogg'].includes(ext) ? "video" :
                 ['mp3','wav','ogg'].includes(ext) ? "audio" : "file";
  
    if (type === "file") {
      contentNode = createElement("a", { href: fileUrl, download: msg.filename, target: "_blank", class: "chat-file-link" }, [msg.filename]);
    } else {
      contentNode = createChatContent({ type }, [fileUrl], msg.senderId === currentUserId || msg.userId === currentUserId);
    }
  } else {
    contentNode = createElement("div", { class: "chat-message-text" }, [`${msg.content || ""}`]);
  }

  const timeNode = createElement("div", { class: "chat-message-time" }, [time]);
  wrapper.append(timeNode, contentNode);

  if (msg.senderId === currentUserId || msg.userId === currentUserId) {
    wrapper.appendChild(setupMessageActions(msg, socket));
  }

  container.scrollTop = container.scrollHeight;
}
