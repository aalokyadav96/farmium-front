import { displayTickets } from "../tickets/ticketService.js";
import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import SnackBar from "../../components/ui/Snackbar.mjs";
import { state } from "../../state/state.js";

// Fetch Event Data
async function fetchEventData(eventId) {
    // const eventData = await apiFetch(`/ticket/event/${eventId}`);
    const eventData = await apiFetch(`/events/event/${eventId}`);
    if (!eventData || !Array.isArray(eventData.tickets)) {
        throw new Error("Invalid event data received.");
    }
    return eventData;
}

// Display Full Event
async function renderTicksPage(isLoggedIn, eventId, container) {
    try {
        container.innerHTML = "";
        const eventData = await fetchEventData(eventId);
        console.log(eventData);
        const isCreator = isLoggedIn && state.user === eventData.creatorid;

        const tickcon = createElement("div", {class:"tickcon"}, []);

        container.appendChild(createElement("div", {id:"edittabs"},[]));
        container.appendChild(tickcon);

        await displayTickets(tickcon, eventData.tickets, eventId, isCreator, isLoggedIn);

    } catch (error) {
        container.innerHTML = "";
        container.appendChild(
            createElement("h1", { textContent: `Error loading event details: ${error.message}` })
        );
        SnackBar("Failed to load event details. Please try again later.", 3000);
    }
}


export { renderTicksPage };