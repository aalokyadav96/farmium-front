import { createEventForm } from "../../services/event/createEventService.js";

async function Create(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    createEventForm(isLoggedIn, contentContainer);
}

export { Create };
