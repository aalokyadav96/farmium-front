// file: displayChat.js

import { createElement } from "../../components/createElement.js";
import { SRC_URL, state } from "../../state/state.js";
import { renderMessage } from "./renderMessage.js";

export function displayChat(contentContainer, chat, isLoggedIn, currentUserId) {
  // Clear any existing content
  contentContainer.innerHTML = "";

  // Chat box container
  const chatBox = createElement("div", {
    class: "chat-box",
  });

  // Messages container (scrollable area)
  const messagesContainer = createElement("div", {
    id: "messages", // CSS targets #messages inside .chat-box
  });

  // Input row (text input + send button)
  const inputRow = createElement("div", {
    class: "input-row",
  });

  const inputField = createElement("input", {
    type: "text",
    placeholder: "Type a message...",
    id: "messageInput", // JS logic relies on this ID
  });

  const sendButton = createElement(
    "button",
    {
      type: "button",
      class: "send-button",
    },
    ["Send"]
  );

  // File input (raw picker)
  const fileInput = createElement("input", {
    type: "file",
    accept: "image/*,video/*,audio/mp3",
    id: "fileInput", // If you need to reference it elsewhere
  });

  // Upload button
  const uploadButton = createElement(
    "button",
    {
      type: "button",
      class: "upload-button",
    },
    ["Upload File"]
  );

  // Drag-and-drop zone
  const dropZone = createElement(
    "div",
    {
      class: "drop-zone",
    },
    ["Drag & drop a file here"]
  );

  // Progress bar (hidden by default via CSS)
  const progressBar = createElement("progress", {
    value: "0",
    max: "100",
  });

  // If user is not logged in, disable inputs and show warning
  if (!isLoggedIn) {
    const warning = createElement(
      "div",
      {
        style: "color: red; margin-bottom: 10px;", // a small inline style is okay for this single warning
      },
      ["You are not logged in."]
    );
    chatBox.appendChild(warning);
    inputField.disabled = true;
    sendButton.disabled = true;
    fileInput.disabled = true;
    uploadButton.disabled = true;
  }

  // Assemble input row
  inputRow.appendChild(inputField);
  inputRow.appendChild(sendButton);

  // Assemble chatBox
  chatBox.appendChild(messagesContainer);
  chatBox.appendChild(inputRow);
  chatBox.appendChild(fileInput);
  chatBox.appendChild(uploadButton);
  chatBox.appendChild(dropZone);
  chatBox.appendChild(progressBar);

  // Add chatBox to the provided container
  contentContainer.appendChild(chatBox);

  // Set up WebSocket connection
  const token = state.token;
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(
    `${protocol}://localhost:4000/ws/newchat/${encodeURIComponent(
      chat
    )}?token=${encodeURIComponent(token)}`
  );

  socket.addEventListener("message", (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "edit") {
        const wrapper = document.getElementById(`msg-${msg.id}`);
        const span = wrapper?.querySelector(".message-content");
        if (span) {
          span.textContent = `${new Date(
            msg.timestamp * 1000
          ).toLocaleTimeString()}: ${msg.content}`;
        }
      } else if (msg.type === "delete") {
        const wrapper = document.getElementById(`msg-${msg.id}`);
        if (wrapper) wrapper.remove();
      } else {
        renderMessage(msg, messagesContainer, currentUserId, socket);
      }
    } catch (err) {
      console.error("Invalid message:", err);
    }
  });

  // Send button logic
  sendButton.addEventListener("click", () => {
    const content = inputField.value.trim();
    if (!content || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        action: "chat",
        content: content,
      })
    );
    inputField.value = "";
  });

  // Allow Enter key to send
  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendButton.click();
    }
  });

  // File validation helper
  function validateFile(file) {
    const allowed = ["image/", "video/", "audio/mp3"];
    const isValidType =
      allowed.some((type) => file.type.startsWith(type)) ||
      file.name.toLowerCase().endsWith(".mp3");
    const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
    return isValidType && isValidSize;
  }

  // File upload logic
  function uploadFile(file) {
    if (!validateFile(file)) return alert("Invalid file.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chat", chat);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `http://localhost:4000/newchat/upload`);

    // Add JWT header if available
    if (state.token) {
      xhr.setRequestHeader("Authorization", `Bearer ${state.token}`);
    }

    // Show progress bar
    progressBar.style.display = "block";
    progressBar.value = 0;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        progressBar.value = (e.loaded / e.total) * 100;
      }
    };

    xhr.onload = () => {
      progressBar.style.display = "none";
      if (xhr.status === 200) {
        try {
          // Optionally parse response:
          // const fileMsg = JSON.parse(xhr.responseText);
          fileInput.value = "";
        } catch (e) {
          console.error("Upload response parsing failed", e);
        }
      } else {
        alert("Upload failed");
      }
    };

    xhr.onerror = () => {
      progressBar.style.display = "none";
      alert("Upload failed");
    };

    xhr.send(formData);
  }

  // Upload button click handler
  uploadButton.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (file) uploadFile(file);
  });

  // Drag-and-drop handlers
  dropZone.addEventListener("dragover", (e) => e.preventDefault());
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  });
}

// import { createElement } from "../../components/createElement.js";
// import { SRC_URL, state } from "../../state/state.js";
// import { renderMessage } from "./renderMessage.js";

// export function displayChat(contentContainer, chat, isLoggedIn, currentUserId) {
//     contentContainer.innerHTML = '';

//     const chatBox = createElement('div', {
//         style: 'display: flex; flex-direction: column; height: 100%; max-height: 600px; border: 1px solid #ccc; padding: 10px;'
//     });

//     const messagesContainer = createElement('div', {
//         id: 'messages',
//         style: 'flex: 1; overflow-y: auto; border: 1px solid #ddd; padding: 8px; margin-bottom: 10px; background: #fafafa;'
//     });

//     const inputRow = createElement('div', {
//         style: 'display: flex; gap: 5px; margin-top: 8px;'
//     });

//     const inputField = createElement('input', {
//         type: 'text',
//         placeholder: 'Type a message...',
//         style: 'flex: 1; padding: 5px; font-size: 14px;',
//         id: 'messageInput'
//     });

//     const sendButton = createElement('button', {
//         type: 'button',
//         style: 'padding: 6px 12px; font-size: 14px;',
//     }, ['Send']);

//     const fileInput = createElement('input', {
//         type: 'file',
//         style: 'margin-top: 10px;',
//         accept: 'image/*,video/*,audio/mp3'
//     });

//     const uploadButton = createElement('button', {
//         type: 'button',
//         style: 'margin-top: 10px; padding: 6px 12px; font-size: 14px;'
//     }, ['Upload File']);

//     const dropZone = createElement('div', {
//         style: 'margin-top: 10px; padding: 10px; border: 2px dashed #aaa; text-align: center; color: #666;'
//     }, ['Drag & drop a file here']);

//     const progressBar = createElement('progress', {
//         value: '0',
//         max: '100',
//         style: 'width: 100%; height: 12px; display: none; margin-top: 5px;'
//     });

//     if (!isLoggedIn) {
//         chatBox.appendChild(createElement('div', {
//             style: 'color: red; margin-bottom: 10px;'
//         }, ['You are not logged in.']));
//         inputField.disabled = true;
//         sendButton.disabled = true;
//         fileInput.disabled = true;
//         uploadButton.disabled = true;
//     }

//     inputRow.appendChild(inputField);
//     inputRow.appendChild(sendButton);

//     chatBox.appendChild(messagesContainer);
//     chatBox.appendChild(inputRow);
//     chatBox.appendChild(fileInput);
//     chatBox.appendChild(uploadButton);
//     chatBox.appendChild(dropZone);
//     chatBox.appendChild(progressBar);
//     contentContainer.appendChild(chatBox);

//     const token = state.token;
//     const protocol = location.protocol === "https:" ? "wss" : "ws";
//     const socket = new WebSocket(`${protocol}://localhost:4000/ws/newchat/${encodeURIComponent(chat)}?token=${encodeURIComponent(token)}`);
    
//     socket.addEventListener('message', (event) => {
//         try {
//             const msg = JSON.parse(event.data);

//             if (msg.type === 'edit') {
//                 const wrapper = document.getElementById(`msg-${msg.id}`);
//                 const span = wrapper.querySelector('.message-content');
//                 if (span) span.textContent = `${new Date(msg.timestamp * 1000).toLocaleTimeString()}: ${msg.content}`;
//             } else if (msg.type === 'delete') {
//                 const wrapper = document.getElementById(`msg-${msg.id}`);
//                 if (wrapper) wrapper.remove();
//             } else {
//                 renderMessage(msg, messagesContainer, currentUserId, socket);
//             }
//         } catch (err) {
//             console.error('Invalid message:', err);
//         }
//     });

//     sendButton.addEventListener('click', () => {
//         const content = inputField.value.trim();
//         if (!content || socket.readyState !== WebSocket.OPEN) return;

//         socket.send(JSON.stringify({
//             action: "chat",
//             content: content
//         }));
//         inputField.value = '';
//     });

//     inputField.addEventListener('keydown', (e) => {
//         if (e.key === 'Enter') sendButton.click();
//     });

//     function validateFile(file) {
//         const allowed = ['image/', 'video/', 'audio/mp3'];
//         const isValidType = allowed.some(type => file.type.startsWith(type) || file.name.endsWith('.mp3'));
//         const isValidSize = file.size <= 10 * 1024 * 1024;
//         return isValidType && isValidSize;
//     }

//     function uploadFile(file) {
//         if (!validateFile(file)) return alert("Invalid file.");

//         const formData = new FormData();
//         formData.append('file', file);
//         formData.append('chat', chat);

//         const xhr = new XMLHttpRequest();
//         xhr.open('POST', `http://localhost:4000/newchat/upload`);

//         // Add JWT header
//         if (state.token) {
//             xhr.setRequestHeader('Authorization', `Bearer ${state.token}`);
//         }

//         progressBar.style.display = 'block';
//         progressBar.value = 0;

//         xhr.upload.onprogress = (e) => {
//             if (e.lengthComputable) {
//                 progressBar.value = (e.loaded / e.total) * 100;
//             }
//         };

//         xhr.onload = () => {
//             progressBar.style.display = 'none';
//             if (xhr.status === 200) {
//                 try {
//                     // If needed: const fileMsg = JSON.parse(xhr.responseText);
//                     fileInput.value = '';
//                 } catch (e) {
//                     console.error("Upload response parsing failed", e);
//                 }
//             } else {
//                 alert("Upload failed");
//             }
//         };

//         xhr.onerror = () => {
//             progressBar.style.display = 'none';
//             alert("Upload failed");
//         };

//         xhr.send(formData);
//     }

//     uploadButton.addEventListener('click', () => {
//         const file = fileInput.files[0];
//         if (file) uploadFile(file);
//     });

//     dropZone.addEventListener('dragover', e => e.preventDefault());
//     dropZone.addEventListener('drop', e => {
//         e.preventDefault();
//         const file = e.dataTransfer.files[0];
//         if (file) uploadFile(file);
//     });
// }
