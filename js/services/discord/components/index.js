import { createElement } from "../../../components/createElement.js";
import { getState } from "../../../state/state.js";

import { renderAvatar } from "./renderAvatar.js";
import { renderMedia } from "./renderMedia.js";
import { renderMenu } from "./renderMenu.js";

/* -------------------------
   Header Renderer
   -------------------------*/
function renderHeader(msg, time, isMine) {
  const sender = createElement("span", {
    class: "msg-sender",
    "aria-label": `Sender: ${msg.sender || "Unknown"}`,
    tabindex: "0"
  }, [msg.sender || "Unknown"]);

  const timestamp = createElement("span", {
    class: "msg-time",
    "aria-label": `Sent at ${time}`
  }, [time]);

  const edited = msg.editedAt
    ? createElement("span", { class: "msg-edited" }, [" (edited)"])
    : null;

  const pending = msg.pending
    ? createElement("span", { class: "msg-pending" }, [" (pending)"])
    : null;

  const status = isMine && !msg.pending
    ? createElement("span", { class: "msg-status", "aria-label": "Sent" }, ["✓"])
    : null;

  const menu = renderMenu(msg);

  const headerChildren = [sender, timestamp];
  if (edited) headerChildren.push(edited);
  if (pending) headerChildren.push(pending);
  headerChildren.push(menu);
  if (status) headerChildren.push(status);

  return createElement("div", { class: "msg-header" }, headerChildren);
}

/* -------------------------
   Body Renderer
   -------------------------*/
   function renderBody(msg) {
    if (msg.deleted) {
      return createElement("div", { class: "msg-content" }, ["[deleted]"]);
    }
  
    const contentNodes = [];
  
    if (msg.content && String(msg.content).trim() !== "") {
      contentNodes.push(msg.content);
    }
  
    const media = renderMedia(msg);
    if (media) contentNodes.push(media);
  
    return createElement("div", { class: "msg-content" }, contentNodes);
  }
  

/* -------------------------
   Message Renderer
   -------------------------*/
export function renderMessage(msg, { isInline = false } = {}) {
  const user = getState("user");
  const isMine = msg.sender === user;

  const classes = ["message-item", isMine ? "mine" : "theirs"];
  if (msg.deleted) classes.push("deleted");
  if (msg.media) classes.push("attachment");
  if (msg.pending) classes.push("pending");

  const createdAt = msg.createdAt ? new Date(msg.createdAt) : new Date();
  const time = isNaN(createdAt)
    ? ""
    : createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const avatar = renderAvatar(msg, { isMine });
  const header = renderHeader(msg, time, isMine);
  const body = renderBody(msg);

  const msgBody = createElement("div", { class: "msg-body" }, [header, body]);

  const msgId = msg.messageid || msg.id || "";
  const root = createElement("div", {
    class: classes.join(" "),
    dataset: { id: msgId },
    role: "article",
    "aria-label": `Message from ${msg.sender || "unknown"} at ${time}`,
    tabindex: "0"
  }, [avatar, msgBody]);

  if (msg.pending) root.setAttribute("data-pending", "true");

  return root;
}
