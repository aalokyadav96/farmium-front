import { apiFetch } from "../../api/api.js";
import { navigate } from "../../routes/index.js";
import { SRC_URL, getState } from "../../state/state.js";
import Button from "../../components/base/Button.js";

// Module‐level state for quoted replies
let replyTo = null;

// Get existing WebSocket (if any) from application state
const socket = getState("socket") || null;

// Simple debounce utility
function debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

// Renders or removes the "Replying to…" banner above the input form
function renderReplyBanner() {
    const banner = document.getElementById("reply-banner");
    if (!banner) return;

    if (replyTo) {
        banner.textContent = `Replying to ${replyTo.user}: "${replyTo.text.slice(0, 50)}"`;
        banner.style.display = "flex";

        // Add a small cancel button if not already present
        if (!banner.querySelector("button.cancel-reply")) {
            const cancelBtn = document.createElement("button");
            cancelBtn.className = "cancel-reply";
            cancelBtn.textContent = "✕";
            cancelBtn.style.marginLeft = "auto";
            cancelBtn.onclick = () => {
                replyTo = null;
                renderReplyBanner();
            };
            banner.appendChild(cancelBtn);
        }
    } else {
        banner.style.display = "none";
        banner.textContent = "";
        // Remove any stray cancel button
        const cancelBtn = banner.querySelector("button.cancel-reply");
        if (cancelBtn) cancelBtn.remove();
    }
}

// Builds and returns a message <li> without inserting into the DOM
function buildMessageElement(message, chatid) {
    const li = document.createElement("li");
    li.dataset.id = message._id;

    const isSelf = isSender(message); // ← assume this is defined elsewhere
    li.className = `message-item ${isSelf ? "sent" : "received"}`;

    // Header
    const header = document.createElement("div");
    header.className = "message-header";

    const avatar = createAvatar(message.userID);
    const username = document.createElement("span");
    username.className = "message-username";
    username.textContent = message.userID;

    const timestamp = document.createElement("span");
    timestamp.className = "message-timestamp";
    timestamp.textContent = formatTimestamp(message.createdAt);

    if (!isSelf) header.appendChild(avatar);
    header.appendChild(username);
    header.appendChild(timestamp);
    if (isSelf) header.appendChild(avatar);

    // Body
    const body = document.createElement("div");
    body.className = "message-body";

    // Quoted reply block (if any)
    if (message.replyTo) {
        const quote = document.createElement("blockquote");
        quote.className = "quoteblock";
        quote.textContent = `${message.replyTo.user}: ${message.replyTo.text}`;
        quote.style.margin = "0 0 0.5rem 0";
        quote.style.paddingLeft = "0.5rem";
        quote.style.borderLeft = "2px solid #888";
        body.appendChild(quote);
    }

    if (message.text) {
        const text = document.createElement("p");
        text.className = "message-text";
        text.textContent = message.text;
        body.appendChild(text);
    }

    if (message.fileURL) {
        const media = createMediaElement(message.fileURL, message.fileType);
        if (media) {
            media.classList.add("message-media");
            body.appendChild(media);
        }
    }

    // Footer
    const footer = document.createElement("div");
    footer.className = "message-footer";

    const status = document.createElement("span");
    status.className = "message-status";
    status.textContent =
        message.status === "seen"
            ? "✓✓"
            : message.status === "delivered"
            ? "✓"
            : "";
    footer.appendChild(status);

    const reportBtn = document.createElement("button");
    reportBtn.className = "message-btn report";
    reportBtn.textContent = "Report";
    reportBtn.onclick = () => alert(`Reported message ${message._id}`);
    footer.appendChild(reportBtn);

    // "Reply" button
    const replyBtn = document.createElement("button");
    replyBtn.className = "message-btn reply";
    replyBtn.textContent = "Reply";
    replyBtn.onclick = () => {
        replyTo = {
            id: message._id,
            user: message.userID,
            text: message.text || "",
        };
        renderReplyBanner();
    };
    footer.appendChild(replyBtn);

    if (isSelf) {
        const editBtn = document.createElement("button");
        editBtn.className = "message-btn edit";
        editBtn.textContent = "Edit";
        editBtn.onclick = () => editMessage(chatid, message._id, li);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "message-btn delete";
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteMessage(chatid, message._id, li);

        footer.appendChild(editBtn);
        footer.appendChild(deleteBtn);
    }

    // Seen‐by avatars (read receipts) if present
    if (Array.isArray(message.seenBy) && message.seenBy.length > 0) {
        const seenContainer = document.createElement("div");
        seenContainer.className = "seen-by";
        seenContainer.style.display = "flex";
        seenContainer.style.marginTop = "0.5rem";
        message.seenBy.forEach((uid) => {
            const seenAv = createAvatar(uid);
            seenAv.classList.add("seen-avatar");
            seenAv.style.width = "16px";
            seenAv.style.height = "16px";
            seenAv.style.marginRight = "0.25rem";
            seenContainer.appendChild(seenAv);
        });
        footer.appendChild(seenContainer);
    }

    li.appendChild(header);
    li.appendChild(body);
    li.appendChild(footer);

    return li;
}

// Inserts a message <li> into the list, with optional "prepend" for infinite scroll
function addMessageToList(message, chatid, list, options = { prepend: false }) {
    const li = buildMessageElement(message, chatid);

    if (options.prepend) {
        // Simply insert at top; date dividers for older pages are omitted
        list.insertBefore(li, list.firstChild);
    } else {
        list.appendChild(li);
    }
}

export async function displayChat(chatContainer, chatid, isLoggedIn) {
    chatContainer.innerHTML = "";

    // --- SEARCH FORM ---
    const searchForm = document.createElement("form");
    searchForm.id = "chat-search-form";
    searchForm.style.display = "flex";
    searchForm.style.margin = "0 auto";

    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = "Search messages…";
    searchInput.style.flex = "1";
    searchInput.style.padding = "0.5rem";

    const searchBtn = document.createElement("button");
    searchBtn.type = "submit";
    searchBtn.textContent = "Go";
    // searchBtn.style.marginLeft = "0.5rem";

    searchForm.appendChild(searchInput);
    searchForm.appendChild(searchBtn);
    chatContainer.appendChild(searchForm);

    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const q = searchInput.value.trim();
        if (!q) return;

        try {
            const data = await apiFetch(`/chat/${chatid}/search?q=${encodeURIComponent(q)}`);
            messagesList.innerHTML = "";
            if (!data.matches || data.matches.length === 0) {
                const noRes = document.createElement("p");
                noRes.textContent = "No matches found.";
                noRes.style.padding = "1rem";
                messagesList.appendChild(noRes);
                return;
            }
            // Show results without date dividers
            data.matches.forEach((msg) => {
                addMessageToList(msg, chatid, messagesList);
            });
        } catch (err) {
            console.error(err);
            alert("Search failed.");
        }
    });

    // --- CHAT WRAPPER ---
    const chatWrapper = document.createElement("div");
    chatWrapper.id = "chat-container";
    chatWrapper.style.display = "flex";
    chatWrapper.style.flexDirection = "column";
    // chatWrapper.style.height = "100%";
    chatWrapper.style.position = "relative"; // for drag/drop styling

    function toggleTheme() {
        const current = document.body.dataset.theme || "light";
        document.body.dataset.theme = current === "light" ? "dark" : "light";
    }

    const chatHeader = document.createElement("div");
    chatHeader.appendChild(Button("Toggle Dark Mode", "toggle-dark", { click: toggleTheme }));

    const messagesList = document.createElement("ul");
    messagesList.id = "messages-list";
    messagesList.style.flex = "1";
    messagesList.style.overflowY = "auto";
    messagesList.style.margin = "0";
    messagesList.style.padding = "1rem 1rem 4rem 1rem";
    messagesList.style.listStyle = "none";

    // Reply banner (hidden by default)
    const replyBanner = document.createElement("div");
    replyBanner.id = "reply-banner";
    replyBanner.style.display = "none";
    replyBanner.style.padding = "0.5rem";
    replyBanner.style.borderLeft = "4px solid #888";
    replyBanner.style.alignItems = "center";
    replyBanner.style.backgroundColor = "#f0f0f0";
    replyBanner.style.margin = "0 1rem";
    replyBanner.style.position = "sticky";
    replyBanner.style.bottom = "0";

    const inputForm = createMessageForm(chatid, messagesList);

    chatWrapper.appendChild(chatHeader);
    chatWrapper.appendChild(messagesList);
    chatWrapper.appendChild(replyBanner);
    chatWrapper.appendChild(inputForm);
    chatContainer.appendChild(chatWrapper);

    // Infinite scroll state
    let page = 0;
    const pageSize = 20;
    let loadingOld = false;

    // Load a page of messages
    async function loadPage(p, prepend = false) {
        try {
            const data = await apiFetch(
                `/chat/${chatid}?page=${p}&size=${pageSize}`
            );
            if (!data.messages || data.messages.length === 0) {
                return;
            }

            if (prepend) {
                // Older messages: just insert at top, no date dividers
                // in chronological order: oldest first
                data.messages
                    .slice()
                    .reverse()
                    .forEach((msg) => {
                        addMessageToList(msg, chatid, messagesList, { prepend: true });
                    });
            } else {
                // Initial load: show date dividers + messages
                let lastDateLabel = null;
                data.messages.forEach((msg) => {
                    const msgDate = new Date(msg.createdAt);
                    const dateLabel = getDateLabel(msgDate);

                    if (dateLabel !== lastDateLabel) {
                        const dateDivider = document.createElement("li");
                        dateDivider.className = "date-divider";
                        dateDivider.style.textAlign = "center";
                        dateDivider.style.margin = "0.5rem 0";
                        dateDivider.textContent = dateLabel;
                        messagesList.appendChild(dateDivider);
                        lastDateLabel = dateLabel;
                    }
                    addMessageToList(msg, chatid, messagesList);
                });

                // Scroll to bottom after initial load
                messagesList.scrollTop = messagesList.scrollHeight;
            }
        } catch (err) {
            console.error(err);
            if (!prepend) {
                messagesList.innerHTML =
                    "<p style='color:red; padding:1rem;'>Could not load chat.</p>";
            }
        }
    }

    // Initial page load
    await loadPage(page);

    // // Infinite scroll: fetch older when near top
    // messagesList.addEventListener("scroll", () => {
    //     if (messagesList.scrollTop < 100 && !loadingOld) {
    //         loadingOld = true;
    //         page++;
    //         const prevHeight = messagesList.scrollHeight;
    //         loadPage(page, true).finally(() => {
    //             // Maintain scroll position
    //             const newHeight = messagesList.scrollHeight;
    //             messagesList.scrollTop = newHeight - prevHeight;
    //             loadingOld = false;
    //         });
    //     }
    // });

    // Typing indicator setup (if WebSocket is present)
    if (socket) {
        const typingIndicator = document.createElement("div");
        typingIndicator.id = "typing-indicator";
        typingIndicator.textContent = "";
        typingIndicator.style.padding = "0.5rem";
        typingIndicator.style.fontStyle = "italic";
        typingIndicator.style.color = "#666";
        typingIndicator.style.height = "1.5rem";
        chatWrapper.insertBefore(typingIndicator, replyBanner);

        // Notify server when user is typing
        const inputField = inputForm.querySelector('input[type="text"]');
        const notifyTyping = debounce(() => {
            socket.emit("typing", { chatid });
        }, 500);
        inputField.addEventListener("input", () => {
            notifyTyping();
        });

        // Show when another user is typing
        socket.on("typing", ({ userID }) => {
            typingIndicator.textContent = `${userID} is typing…`;
            clearTimeout(typingIndicator._hideTimer);
            typingIndicator._hideTimer = setTimeout(() => {
                typingIndicator.textContent = "";
            }, 2000);
        });

        // When a message is in view, mark it as seen
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(({ isIntersecting, target }) => {
                    if (isIntersecting) {
                        const msgId = target.dataset.id;
                        socket.emit("markSeen", { chatid, messageId: msgId });
                    }
                });
            },
            { root: messagesList, threshold: 0.5 }
        );

        // Listen for server’s seen updates
        socket.on("messageSeenUpdate", (updatedMsg) => {
            const li = messagesList.querySelector(`li[data-id="${updatedMsg._id}"]`);
            if (!li) return;
            const footer = li.querySelector(".message-footer");
            // Remove existing seen avatars
            const existing = footer.querySelector(".seen-by");
            if (existing) existing.remove();
            // Re‐add with fresh data
            if (Array.isArray(updatedMsg.seenBy) && updatedMsg.seenBy.length > 0) {
                const seenContainer = document.createElement("div");
                seenContainer.className = "seen-by";
                seenContainer.style.display = "flex";
                seenContainer.style.marginTop = "0.5rem";
                updatedMsg.seenBy.forEach((uid) => {
                    const seenAv = createAvatar(uid);
                    seenAv.classList.add("seen-avatar");
                    seenAv.style.width = "16px";
                    seenAv.style.height = "16px";
                    seenAv.style.marginRight = "0.25rem";
                    seenContainer.appendChild(seenAv);
                });
                footer.appendChild(seenContainer);
            }
        });

        // After each new <li> is inserted, observe it
        const originalAdd = addMessageToList;
        window.addMessageToList = addMessageToList; // preserve reference if needed
        addMessageToList = function (message, chatid, list, options = {}) {
            const li = buildMessageElement(message, chatid);
            if (options.prepend) {
                list.insertBefore(li, list.firstChild);
            } else {
                list.appendChild(li);
            }
            observer.observe(li);
        };
    }

    // Drag & Drop file upload
    chatWrapper.addEventListener("dragover", (e) => {
        e.preventDefault();
        chatWrapper.classList.add("drag-over");
    });
    chatWrapper.addEventListener("dragleave", () => {
        chatWrapper.classList.remove("drag-over");
    });
    chatWrapper.addEventListener("drop", (e) => {
        e.preventDefault();
        chatWrapper.classList.remove("drag-over");
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            const fileInput = inputForm.querySelector('input[type="file"]');
            fileInput.files = e.dataTransfer.files;
            inputForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
    });
}

// Creates the message input form (with a hidden file input + icon label + text + send button)
export function createMessageForm(chatid, messagesList) {
    // Wrapper form
    const form = document.createElement("form");
    form.enctype = "multipart/form-data";
    form.className = "message-form";
  
    // 1) HIDDEN file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*,video/*";
    fileInput.id = `file-input-${chatid}`;
    fileInput.style.display = "none"; // hide the raw file input
  
    // 2) Label acting as the icon/button for file upload
    const fileLabel = document.createElement("label");
    fileLabel.htmlFor = fileInput.id;
    fileLabel.className = "file-label";
    // You can swap out the emoji for an <img> or SVG if you have an asset
    fileLabel.textContent = "📎";
    fileLabel.title = "Attach image or video";
  
    // 3) Text input
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type a message…";
    input.required = true;
    input.className = "text-input";
  
    // 4) Send button
    const sendBtn = document.createElement("button");
    sendBtn.type = "submit";
    sendBtn.textContent = "Send";
    sendBtn.className = "send-button";
  
    // Assemble form elements (flex order: [icon] [text] [send])
    form.appendChild(fileInput);
    form.appendChild(fileLabel);
    form.appendChild(input);
    form.appendChild(sendBtn);
  
    // Submit handler
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      const file = fileInput.files[0];
      if (!text && !file) return;
  
      const formData = new FormData();
      if (text) formData.append("text", text);
      if (file) formData.append("file", file);
      // Attach replyTo if present
      if (replyTo) {
        formData.append("replyTo", JSON.stringify(replyTo));
      }
  
      try {
        const message = await apiFetch(`/chat/${chatid}/message`, "POST", formData, true);
        addMessageToList(message, chatid, messagesList);
        input.value = "";
        fileInput.value = "";
        replyTo = null;
        renderReplyBanner();
      } catch (err) {
        console.error(err);
        if (err.status === 403) {
          alert("You are not a participant of this chat.");
        } else if (err.status === 401) {
          alert("You must be logged in to send messages.");
        } else {
          alert("Failed to send message.");
        }
      }
    });
  
    return form;
  }
  
export { addMessageToList };

function getDateLabel(date) {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const diff = now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0);

    if (diff === 0) return "Today";
    if (diff === oneDay) return "Yesterday";
    return date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatTimestamp(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return then.toLocaleDateString();
}

function createMediaElement(fileURL, fileType) {
    if (!fileURL || !fileType) return null;

    const fullURL = fileURL.startsWith("http") ? fileURL : `${SRC_URL}${fileURL}`;

    if (fileType === "image") {
        const img = document.createElement("img");
        img.src = fullURL;
        img.alt = "uploaded image";
        img.className = "chat-media-image";
        img.loading = "lazy";
        return img;
    }

    if (fileType === "video") {
        const video = document.createElement("video");
        video.src = fullURL;
        video.controls = true;
        video.className = "chat-media-video";
        video.style.maxWidth = "300px";
        return video;
    }

    return null;
}

function createAvatar(userId) {
    const img = document.createElement("img");
    img.className = "chatavatar circle";
    img.src = `${SRC_URL}/userpic/thumb/${userId}.jpg`;
    img.alt = "User avatar";
    img.loading = "lazy";
    // img.onerror = () => {
    //     img.src = `${SRC_URL}/userpic/thumb/default.png`;
    // };
    return img;
}



async function editMessage(chatid, messageid, spanEl) {
    const newText = prompt("Edit message:", spanEl.textContent);
    if (newText === null || newText.trim() === "") return;

    try {
        await apiFetch(
            `/chat/${chatid}/message/${messageid}`,
            "PUT",
            JSON.stringify({ text: newText })
        );
        spanEl.textContent = newText;
    } catch (err) {
        console.error(err);
        alert("Could not edit message.");
    }
}

async function deleteMessage(chatid, messageid, liEl) {
    if (!confirm("Delete this message?")) return;

    try {
        await apiFetch(`/chat/${chatid}/message/${messageid}`, "DELETE");
        liEl.remove();
    } catch (err) {
        console.error(err);
        alert("Could not delete message.");
    }
}

export async function userChatInit(targetUserId) {
    try {
        // const currentUserId = localStorage.getItem("user");
        const currentUserId = getState("user");
        if (!currentUserId || !targetUserId) {
            throw new Error("Missing user IDs");
        }

        const payload = {
            userA: currentUserId,
            userB: targetUserId,
        };

        const data = await apiFetch('/chats/init', 'POST', JSON.stringify(payload));

        if (!data.chatId) {
            throw new Error('Chat ID missing in response.');
        }

        navigate(`/chat/${data.chatId}`);
    } catch (err) {
        console.error(err);
        alert('Unable to start or find chat.');
    }
}

function isSender(message) {
    let user = getState("user");
    // let user = localStorage.getItem("user");
    if (message.userID == user) {
        return true
    }
    return false
}