// chomponents/renderMenu.js
import Button from "../../../components/base/Button.js";
import { createElement } from "../../../components/createElement.js";
import {mereFetch} from "../../../api/api.js";

// DRY handlers factory
const handlers = {
  edit: id => () => startEditingMessage(id),
  delete: id => () => confirmDelete(id),
  copy: content => () => copyToClipboard(content)
};

export function renderMenu(msg) {
  return createElement("div", { class: "msg-menu" }, [
    Button("⋮", "menu-btn", { click: e => {
      e.stopPropagation();
      e.currentTarget.nextSibling.classList.toggle("open");
    }}, "menu-btn"),
    createElement("div", { class: "dropdown" }, [
      Button("Edit", "edit-btn-chat", { click: handlers.edit(msg.messageid) }),
      Button("Delete", "del-btn-chat", { click: handlers.delete(msg.messageid) }),
      Button("Copy",   "cpy-btn",      { click: handlers.copy(msg.content || msg.media?.url) })
    ])
  ]);
}

// // placeholder implementations — define in chat logic
// function startEditingMessage(id) { /* see chatHandlers.js */ }
// function confirmDelete(id)       { /* calls handleDelete */ }
// function copyToClipboard(txt)    { navigator.clipboard.writeText(txt); }


// placeholder implementations — define in chat logic
function startEditingMessage(id) { handleEdit(id) }
function confirmDelete(id)       { handleDelete(id) }
function copyToClipboard(txt)    { navigator.clipboard.writeText(txt); }

async function handleEdit(messageid) {
  const newRating = parseInt(prompt("Enter a new rating (1-5):"), 10);
  const newComment = prompt("Enter a new comment:");

  if (newRating && newComment && newRating >= 1 && newRating <= 5) {
      try {
          await mereFetch(
              `/reviews/${entityType}/${entityId}/${reviewId}`,
              "PUT",
              JSON.stringify({ rating: newRating, comment: newComment })
          );
          alert("Review updated successfully!");
          refreshReviews();
      } catch (error) {
          console.error("Error editing review:", error);
          alert("Failed to update review.");
      }
  } else {
      alert("Invalid input. Rating must be between 1-5, and comment cannot be empty.");
  }
}

async function handleDelete(messageid) {
  if (confirm("Are you sure you want to delete this Message?")) {
      try {
          await mereFetch(`/merechats/messages/${messageid}`, "DELETE");
          alert("Message deleted successfully!");
      } catch (error) {
          console.error("Error deleting Message:", error);
          alert("Failed to delete Message.");
      }
  }
}
