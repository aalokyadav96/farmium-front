import { SRC_URL, apiFetch } from "../../api/api.js";
import { displayMerchandise } from "../merch/merchService.js";
// import { displayMedia } from "../media/mediaService.js";
import { createElement } from "../../components/createElement.js";
import Modal from "../../components/ui/Modal.mjs";
import Button from "../../components/base/Button.js";
import { navigate } from "../../routes/index.js";

async function renderAlbumsTab(container, artistID, isCreator) {
    try {
        const albums = await apiFetch(`/artists/${artistID}/albums`);
        if (!albums.length) {
            container.innerHTML = "<p>No albums available.</p>";
            return;
        }

        albums.forEach(album => {
            if (!album.published && !isCreator) return;

            const div = document.createElement("div");
            div.className = "album-block";
            div.innerHTML = `
                <h3>${album.title}</h3>
                <p><strong>Release:</strong> ${album.releaseDate}</p>
                <p>${album.description}</p>
            `;
            container.appendChild(div);
        });
    } catch (err) {
        container.innerHTML = "<p>Error loading albums.</p>";
    }
}

async function renderMerchTab(container, artistID, isCreator, isLoggedIn) {
    try {
        const merchItems = await apiFetch(`/artists/${artistID}/merch`);
        container.appendChild(createElement('div', { "id": "edittabs" }));
        displayMerchandise(container, merchItems, "artist", artistID, isCreator, isLoggedIn);
    } catch (err) {
        container.innerHTML = "<p>Error loading merch.</p>";
    }
}

async function renderEventsTab(container, artistID, isCreator) {
    try {
        const events = await apiFetch(`/artists/${artistID}/events`);

        // Clear container
        container.replaceChildren();

        // Creator-specific actions
        if (isCreator) {
            const createEventBtn = createElement("button", { class: "create-event-btn action-btn buttonx" }, ["Create New Event"]);
            createEventBtn.addEventListener("click", () => openEventModal(artistID));
            container.appendChild(createEventBtn);

            const addArtistToEventBtn = createElement("button", { class: "action-btn buttonx" }, ["Add Artist to an Event"]);
            addArtistToEventBtn.addEventListener("click", () => openAddToEventModal(artistID));
            container.appendChild(addArtistToEventBtn);
        }

        // Events List
        if (!events || events.length === 0) {
            container.appendChild(createElement("p", {}, ["No upcoming events."]));
            return;
        }

        const ul = createElement("ul");
        events.forEach(eventx => {
            const li = createElement("li", {}, [
                createElement("strong", {}, [eventx.title]),
                createElement("br"),
                `${eventx.date} at ${eventx.venue} — ${eventx.city}, ${eventx.country}`,
                createElement("br"),
                eventx.eventid
                    ? Button("View Event", "", {
                        click: () => { navigate(`/event/${eventx.eventid}`) }
                    })
                    : ""
            ]);
            ul.appendChild(li);
        });

        container.appendChild(ul);
    } catch (err) {
        container.appendChild(createElement("p", {}, ["Error loading events."]));
    }
}



// Open Event Creation Modal
function openEventModal(artistID) {
    const form = document.createElement("form");
    form.className = "event-form";

    const fields = [
        { type: "text", name: "title", placeholder: "Event Title", required: true },
        { type: "date", name: "date", required: true },
        { type: "text", name: "venue", placeholder: "Venue", required: true },
        { type: "text", name: "city", placeholder: "City", required: true },
        { type: "text", name: "country", placeholder: "Country", required: true },
        { type: "url", name: "ticketUrl", placeholder: "Ticket URL (optional)" }
    ];

    fields.forEach(field => {
        const input = document.createElement("input");
        Object.entries(field).forEach(([key, value]) => input[key] = value);
        form.appendChild(input);
    });

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Create Event";
    form.appendChild(submitButton);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const eventData = Object.fromEntries(formData);

        try {
            await apiFetch(`/artists/${artistID}/events`, "POST", eventData);
            alert("Event created successfully!");
            document.getElementById("app").removeChild(modal);

            // Re-fetch events and re-render using the actual container
            const eventsContainer = document.getElementById("events-container");
            if (eventsContainer) {
                await renderEventsTab(eventsContainer, artistID);
            }
        } catch (error) {
            console.error("Failed to create event:", error);
            alert("Error creating event. Please try again.");
        }
    });


    const modal = Modal({ title: "Create New Event", content: form, onClose: () => document.getElementById("app").removeChild(modal) });
}

// Open Event Creation Modal
function openAddToEventModal(artistID) {
    const form = document.createElement("form");
    form.className = "event-form";

    const fields = [
        { type: "text", name: "eventid", placeholder: "Event Id", required: true },
    ];

    fields.forEach(field => {
        const input = document.createElement("input");
        Object.entries(field).forEach(([key, value]) => input[key] = value);
        form.appendChild(input);
    });

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Add";
    form.appendChild(submitButton);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const eventData = Object.fromEntries(formData);

        try {
            await apiFetch(`/artists/${artistID}/events/addtoevent`, "PUT", eventData);

            alert("Artist added to event  successfully!");
            document.getElementById("app").removeChild(modal);
        } catch (error) {
            console.error("Failed to add artist to event:", error);
            alert("Error adding artist to event. Please try again.");
        }
    });


    const modal = Modal({ title: "Add Artist To Event", content: form, onClose: () => document.getElementById("app").removeChild(modal) });
}


export {
    renderAlbumsTab,
    renderMerchTab,
    // renderBehindTheScenesTab,
    renderEventsTab
};