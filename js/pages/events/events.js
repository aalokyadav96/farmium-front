import { displayEvents } from "../../services/event/displayEvents.js";

async function Events(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';

    const content = document.createElement("div");
    content.classList = "event-details";
    contentContainer.appendChild(content);

    displayEvents(isLoggedIn, content, contentContainer, 1)
}

export { Events };
