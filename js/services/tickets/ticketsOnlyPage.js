import { displayTickets } from "../tickets/ticketService.js";
import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { state } from "../../state/state.js";
import Notify from "../../components/ui/Notify.mjs";

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

        const tickcon = createElement("div", { class: "tickcon" }, []);

        container.appendChild(createElement("div", { id: "edittabs" }, []));
        container.appendChild(tickcon);

        await displayTickets(tickcon, eventData.tickets, eventId, isCreator, isLoggedIn);

    } catch (error) {
        container.innerHTML = "";
        container.appendChild(
            createElement("h1", { textContent: `Error loading event details: ${error.message}` })
        );
        Notify("Failed to load event details. Please try again later.", { type: "error", duration: 3000 });
    }
}


export { renderTicksPage };