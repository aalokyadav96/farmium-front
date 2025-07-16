// chomponents/index.js
import { createElement } from "../../../components/createElement";
import { getState, SRC_URL } from "../../../state/state";

import { renderAvatar } from "./renderAvatar.js";
import { renderMedia } from "./renderMedia.js";
import { renderMenu } from "./renderMenu.js";

function renderHeader(msg, time, isMine) {
  const sender = createElement("span", {
    class: "msg-sender",
    "aria-label": `Sender: ${msg.sender}`,
    tabindex: "0"
  }, [msg.sender]);

  const timestamp = createElement("span", {
    class: "msg-time",
    "aria-label": `Sent at ${time}`
  }, [time]);

  const edited = msg.editedAt
    ? createElement("span", { class: "msg-edited" }, [" (edited)"])
    : null;

  const status = isMine
    ? createElement("span", { class: "msg-status", "aria-label": "Sent" }, ["✓"])
    : null;

  const menu = renderMenu(msg);

  return createElement("div", { class: "msg-header" }, [
    sender, timestamp, edited, status, menu
  ]);
}

function renderBody(msg) {
  if (msg.deleted) {
    return createElement("div", { class: "msg-content" }, ["[deleted]"]);
  }
  return createElement("div", { class: "msg-content" }, renderMedia(msg));
}

export function renderMessage(msg, { isInline = false } = {}) {
  const isMine = msg.sender === getState("user");
  const classes = ["message", isMine ? "mine" : "theirs"];
  if (msg.deleted) classes.push("deleted");
  if (msg.media)   classes.push("attachment");

  // 24‑hour forced format
  const time = new Date(msg.createdAt)
    .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const avatar = renderAvatar(msg, { isMine });
  const header = renderHeader(msg, time, isMine);
  const body   = renderBody(msg);

  // keyboard focusable; announce as article
  return createElement("div", {
    class: classes.join(" "),
    dataset: { id: msg.id },
    role: "article",
    "aria-label": `Message from ${msg.sender} at ${time}`,
    tabindex: "0"
  }, [
    avatar,
    createElement("div", { class: "msg-body" }, [ header, body ])
  ]);
}

// // chomponents/index.js
// import { createElement } from "../../../components/createElement";
// import { getState, SRC_URL } from "../../../state/state";

// import { renderAvatar } from "./renderAvatar.js";
// import { renderMedia } from "./renderMedia.js";
// import { renderMenu } from "./renderMenu.js";

// export function renderMessage(msg, { isInline = false } = {}) {
//     const isMine = msg.sender === getState("user");
//     const bubbleClasses = ["message", isMine ? "mine" : "theirs"];
//     if (msg.deleted) bubbleClasses.push("deleted");
//     if (msg.media) bubbleClasses.push("attachment");

//     const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

//     const avatar = renderAvatar(msg, { isMine });

//     const sender = createElement("span", {
//         class: "msg-sender",
//         "aria-label": `Sender: ${msg.sender}`
//     }, [msg.sender]);

//     const timestamp = createElement("span", {
//         class: "msg-time",
//         "aria-label": `Sent at ${time}`
//     }, [time]);

//     const status = isMine
//         ? createElement("span", { class: "msg-status" }, ["✓"])
//         : null;

//     const menu = renderMenu(msg);

//     const edited = msg.editedAt
//         ? createElement("span", { class: "msg-edited" }, [" (edited)"])
//         : null;

//     const header = createElement("div", { class: "msg-header" }, [
//         sender,
//         timestamp,
//         edited,
//         status,
//         menu
//     ]);

//     const body = createElement("div", { class: "msg-content" },
//         msg.deleted
//             ? ["[deleted]"]
//             : renderMedia(msg)
//     );

//     const contentWrapper = createElement("div", { class: "msg-body" }, [body]);

//     return createElement("div", {
//         class: bubbleClasses.join(" "),
//         dataset: { id: msg.id },
//         role: "article",
//         "aria-label": `Message from ${msg.sender} at ${time}`
//     }, [
//         avatar,
//         createElement("div", { class: "msg-meta" }, [
//             header,
//             contentWrapper
//         ])
//     ]);
// }
