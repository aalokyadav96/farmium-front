import { createElement } from "../../../components/createElement.js";
import { state } from "../../../state/state.js";
import { renderMessage } from "./renderMessage.js";

export function displayOneChat(contentContainer, chatId, isLoggedIn, currentUserId) {
  while (contentContainer.firstChild) contentContainer.removeChild(contentContainer.firstChild);

  const chatBox = createElement("div", { class: "chat-box" });

  const messagesContainer = createElement("div", { id: "messages", class: "messages-container" });

  const inputRow = createElement("div", { class: "input-row" });

  const inputField = createElement("input", {
    type: "text",
    placeholder: "Type a message...",
    id: "messageInput",
    class: "message-input"
  });

  const sendButton = createElement("button", { type: "button", class: "send-button" }, ["Send"]);

  const fileInput = createElement("input", {
    type: "file",
    accept: "image/*,video/*,audio/mp3",
    class: "file-input"
  });

  const uploadButton = createElement("button", { type: "button", class: "upload-button" }, ["Upload"]);

  const dropZone = createElement("div", { class: "drop-zone" }, ["Drag & drop files here"]);

  const progressBar = createElement("progress", { value: "0", max: "100", class: "upload-progress" });

  if (!isLoggedIn) {
    const warning = createElement("div", { class: "login-warning" }, ["You are not logged in."]);
    chatBox.appendChild(warning);
    [inputField, sendButton, fileInput, uploadButton].forEach(el => el.disabled = true);
  }

  inputRow.appendChild(inputField);
  inputRow.appendChild(sendButton);
  chatBox.append(messagesContainer, inputRow, fileInput, uploadButton, dropZone, progressBar);
  contentContainer.appendChild(chatBox);

  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(
    `${protocol}://localhost:4000/ws/newchat/${encodeURIComponent(chatId)}?token=${encodeURIComponent(state.token)}`
  );

  socket.addEventListener("message", (event) => {
    try {
      const msg = JSON.parse(event.data);
      renderMessage(msg, messagesContainer, currentUserId, socket);
    } catch (err) {
      console.error("Invalid message:", err);
    }
  });

  sendButton.addEventListener("click", () => {
    const content = inputField.value.trim();
    if (!content || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ action: "chat", content }));
    inputField.value = "";
  });

  inputField.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendButton.click();
    }
  });

  const validateFile = file => {
    const allowed = ["image/", "video/", "audio/mp3"];
    return (allowed.some(type => file.type.startsWith(type)) || file.name.toLowerCase().endsWith(".mp3")) && file.size <= 10 * 1024 * 1024;
  };

  const uploadFile = file => {
    if (!validateFile(file)) return alert("Invalid file.");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chat", chatId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `http://localhost:4000/newchat/upload`);
    if (state.token) xhr.setRequestHeader("Authorization", `Bearer ${state.token}`);
    progressBar.style.display = "block";
    xhr.upload.onprogress = e => { if (e.lengthComputable) progressBar.value = (e.loaded / e.total) * 100; };
    xhr.onload = () => { progressBar.style.display = "none"; fileInput.value = ""; };
    xhr.onerror = () => { progressBar.style.display = "none"; alert("Upload failed"); };
    xhr.send(formData);
  };

  uploadButton.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (file) uploadFile(file);
  });

  dropZone.addEventListener("dragover", e => e.preventDefault());
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  });
}
