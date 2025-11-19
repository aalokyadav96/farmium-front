import { displayTickets } from "../tickets/displayTickets.js";
import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { getState } from "../../state/state.js";
import Notify from "../../components/ui/Notify.mjs";
import Datex from "../../components/base/Datex.js";

async function fetchEventData(eventId) {
    const eventData = await apiFetch(`/events/event/${eventId}`);
    if (!eventData || !Array.isArray(eventData.tickets)) {
        throw new Error("Invalid event data received.");
    }
    return eventData;
}

async function renderTicksPage(isLoggedIn, eventId, containerx) {
    let container = createElement("div", { class: "tickscon" }, []);
    containerx.append(container);
    try {
        container.replaceChildren();
        const eventData = await fetchEventData(eventId);

        const isCreator =
            isLoggedIn && getState("user") === eventData.creatorid;

        // --- <header> ---
        const header = createElement(
            "header",
            { class: "event-header" },
            [
                createElement(
                    "h1",
                    {},
                    [eventData.title]
                ),

                createElement(
                    "p",
                    { class: "event-description" },
                    [eventData.description || "No description available."]
                ),

                createElement(
                    "section",
                    { class: "event-meta" },
                    [
                        createElement(
                            "p",
                            {},
                            [`📅 Date: ${Datex(eventData.date, true)}`]
                        ),
                        createElement(
                            "p",
                            {},
                            [`📍 Location: ${eventData.placename || eventData.location || "TBA"}`]
                        ),
                        createElement(
                            "p",
                            {},
                            [`🎟 Category: ${eventData.category || "Uncategorized"}`]
                        ),
                        createElement(
                            "p",
                            {},
                            [`💲 Currency: ${eventData.currency || "N/A"}`]
                        )
                    ]
                )
            ]
        );

        // --- <aside> Organizer ---
        let organizer = null;
        if (eventData.organizer_name || eventData.organizer_contact) {
            organizer = createElement(
                "aside",
                { class: "event-organizer" },
                [
                    createElement("h2", {}, ["Organizer"]),
                    createElement(
                        "p",
                        {},
                        [`Name: ${eventData.organizer_name || "Unknown"}`]
                    ),
                    createElement(
                        "p",
                        {},
                        [`Contact: ${eventData.organizer_contact || "Not Provided"}`]
                    )
                ]
            );
        }

        // --- <main> Tickets ---
        const main = createElement("div", { class: "event-main" });

        // editing toolbar wrapper
        const editTabs = createElement("nav", { id: "edittabs", class: "edit-tabs" }, []);

        const tickcon = createElement("section", {
            class: "ticket-section",
            "aria-label": "Ticket List"
        });

        main.append(editTabs, tickcon);

        // Append everything to container in semantic order
        container.append(header);
        if (organizer) container.append(organizer);
        container.append(main);

        await displayTickets(
            tickcon,
            eventData.tickets,
            eventId,
            isCreator,
            isLoggedIn
        );
    } catch (error) {
        container.replaceChildren();
        container.append(
            createElement(
                "h1",
                {},
                [`Error loading event details: ${error.message}`]
            )
        );

        Notify("Failed to load event details. Please try again later.", {
            type: "error",
            duration: 3000
        });
    }
}

export { renderTicksPage };
