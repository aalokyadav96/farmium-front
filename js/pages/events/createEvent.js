import { createEventForm } from "../../services/event/createEventService.js";

async function CreateEvent(isLoggedIn, contentContainer) {
    contentContainer.innerHTML = '';
    createEventForm(isLoggedIn, contentContainer);
}

export { CreateEvent };
