import { createElement } from "../../../components/createElement.js";

export function setupMessageActions(msg, socket) {
  const container = createElement("span", { class: "msg-actions" });

  if (msg.content) {
    const editBtn = createElement("button", { class: "msg-btn edit-btn" }, ["Edit"]);
    editBtn.addEventListener("click", () => {
      const wrapper = document.getElementById(`msg-${msg.id || msg.messageid}`);
      const input = createElement("input", { type: "text", value: msg.content, class: "msg-edit-input" });
      const saveBtn = createElement("button", { class: "msg-btn save-btn" }, ["Save"]);
      saveBtn.addEventListener("click", () => {
        const newText = input.value.trim();
        if (newText && newText !== msg.content) {
          socket.send(JSON.stringify({ action: "edit", id: msg.id || msg.messageid, content: newText }));
        }
        wrapper.replaceChild(input, input); // You may want wrapper.replaceChild(newElement, oldElement)
      });
      wrapper.append(input, saveBtn);
    });
    container.appendChild(editBtn);
  }

  const deleteBtn = createElement("button", { class: "msg-btn delete-btn" }, ["Delete"]);
  deleteBtn.addEventListener("click", () => {
    if (confirm("Delete this message?")) {
      socket.send(JSON.stringify({ action: "delete", id: msg.id || msg.messageid }));
    }
  });
  container.appendChild(deleteBtn);

  return container;
}
