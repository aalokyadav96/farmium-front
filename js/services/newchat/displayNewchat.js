import { createElement } from "../../components/createElement.js";
import { CHATDROP_URL, state } from "../../state/state.js";
import { renderMessage } from "./renderMessage.js";
import { chatFetch } from "../../api/api.js";

export function displayOneChat(contentContainer, chatId, isLoggedIn, currentUserId) {
  clearContainer(contentContainer);

  const chatBox = createElement("div", { class: "chat-box" });
  const messagesContainer = createElement("div", { id: "messages", class: "messages-container" });

  const { inputRow, inputField, sendButton } = createInputRow();
  const { fileInput, uploadButton, dropZone, progressBar } = createUploadElements();

  if (!isLoggedIn) {
    disableInputs([inputField, sendButton, fileInput, uploadButton]);
    const warning = createElement("div", { class: "login-warning" }, ["You are not logged in."]);
    chatBox.appendChild(warning);
  }
  let upcon = createElement("div", {class:"upcon"}, []);
  upcon.append(inputRow, fileInput, uploadButton, progressBar, dropZone);
  chatBox.append(messagesContainer, upcon);
  contentContainer.appendChild(chatBox);

  const socket = createWebSocket(chatId);
  setupSocketListeners(socket, messagesContainer, currentUserId);
  setupMessageSending(inputField, sendButton, socket);
  setupFileUpload(fileInput, uploadButton, dropZone, chatId, progressBar);
}

/* ------------------ Helper Functions ------------------ */

function clearContainer(container) {
  while (container.firstChild) container.removeChild(container.firstChild);
}

function createInputRow() {
  const inputRow = createElement("div", { class: "input-row" });
  const inputField = createElement("input", {
    type: "text",
    placeholder: "Type a message...",
    id: "messageInput",
    class: "message-input"
  });
  const sendButton = createElement("button", { type: "button", class: "send-button" }, ["Send"]);
  inputRow.append(inputField, sendButton);
  return { inputRow, inputField, sendButton };
}

function createUploadElements() {
  const fileInput = createElement("input", {
    type: "file",
    // accept: "image/*,video/*,audio/mp3",
    accept: "image/*",
    class: "file-input",
    multiple: true
  });
  const uploadButton = createElement("button", { type: "button", class: "upload-button" }, ["Upload"]);
  const dropZone = createElement("div", { class: "drop-zone" }, ["Drag & drop files here"]);
  const progressBar = createElement("progress", { value: "0", max: "100", class: "upload-progress" });
  return { fileInput, uploadButton, dropZone, progressBar };
}

function disableInputs(elements) {
  elements.forEach(el => el.disabled = true);
}

function createWebSocket(chatId) {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  return new WebSocket(
    `${protocol}://localhost:3810/ws/newchat/${encodeURIComponent(chatId)}?token=${encodeURIComponent(state.token)}`
  );
}

function setupSocketListeners(socket, messagesContainer, currentUserId) {
  socket.addEventListener("message", async (event) => {
    try {
      const msg = JSON.parse(event.data);
      await renderMessage(msg, messagesContainer, currentUserId, socket);
    } catch (err) {
      console.error("Invalid message:", err);
    }
  });
}

function setupMessageSending(inputField, sendButton, socket) {
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
}

function setupFileUpload(fileInput, uploadButton, dropZone, chatId, progressBar) {
  const validateFile = file => {
    const allowed = ["image/", "video/", "audio/mp3"];
    return (
      (allowed.some(type => file.type.startsWith(type)) || file.name.toLowerCase().endsWith(".mp3")) &&
      file.size <= 10 * 1024 * 1024
    );
  };

  const uploadFile = file => {
    if (!validateFile(file)) return alert("Invalid file.");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chat", chatId);

    const xhr = new XMLHttpRequest();
    // xhr.open("POST", `http://localhost:6925/api/v1/filedrop`);
    xhr.open("POST", CHATDROP_URL);
    if (state.token) xhr.setRequestHeader("Authorization", `Bearer ${state.token}`);

    progressBar.style.display = "block";

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) progressBar.value = (e.loaded / e.total) * 100;
    };

    xhr.onload = () => {
      progressBar.style.display = "none";
      fileInput.value = "";

      try {
        const uploaded = JSON.parse(xhr.responseText); // filedrop response
        if (!Array.isArray(uploaded)) return;

        // artificial delay before calling chatFetch
        setTimeout(() => {
          chatFetch(
            "/newchat/upload",
            "POST",
            JSON.stringify({
              chat: chatId,
              files: uploaded
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${state.token}`
              }
            }
          ).then(async res => {
            if (!res) return;
            try {
              const msg = typeof res === "string" ? JSON.parse(res) : res;

              // another artificial delay before rendering
              await new Promise(resolve => setTimeout(resolve, 500));

              await renderMessage(msg, document.getElementById("messages"), state.userId, null);
            } catch (err) {
              console.error("Failed to render upload message", err);
            }
          });
        }, 500); // delay before chatFetch
      } catch (err) {
        console.error("Invalid upload response", err);
      }
    };


    xhr.onerror = () => {
      progressBar.style.display = "none";
      alert("Upload failed");
    };

    xhr.send(formData);
  };

  uploadButton.addEventListener("click", () => {
    Array.from(fileInput.files).forEach(uploadFile);
  });

  dropZone.addEventListener("dragover", e => e.preventDefault());
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    Array.from(e.dataTransfer.files).forEach(uploadFile);
  });
}
