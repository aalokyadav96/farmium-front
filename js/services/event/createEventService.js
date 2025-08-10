import { navigate } from "../../routes/index.js";
import SnackBar from '../../components/ui/Snackbar.mjs';
import { createFormField, addEventEventListeners } from "./createEventHelpers.js";
import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";

async function createEventForm(isLoggedIn, content) {
    const createSection = document.createElement("div");
    createSection.className = "create-section";

    if (isLoggedIn) {
        // Create and append the header
        const header = document.createElement("h2");
        header.textContent = "Create Event";
        createSection.appendChild(header);

        const formFields = [
            {
                type: "select", id: "category", label: "Event Type", required: true,
                options: [
                    { value: "", label: "Select a Type" },
                    { value: "conference", label: "Conference" },
                    { value: "concert", label: "Concert" },
                    { value: "sports", label: "Sports" },
                    { value: "festival", label: "Festival" },
                    { value: "meetup", label: "Meetup" },
                    { value: "workshop", label: "Workshop" },
                    { value: "other", label: "Other" }
                ]
            },
            { type: "text", id: "event-title", label: "Event Title", required: true },
            { type: "textarea", id: "event-description", label: "Event Description", required: true },
            { type: "text", id: "event-place", label: "Event Place", required: true },
            { type: "text", id: "event-location", label: "Event Location", required: true },
            { type: "date", id: "event-date", label: "Select a Date", required: true },
            { type: "time", id: "event-time", label: "Select a Time", required: true },
            { type: "text", id: "organizer-name", label: "Organizer Name", required: true },
            { type: "text", id: "organizer-contact", label: "Organizer Contact", required: true },
            { type: "number", id: "total-capacity", label: "Total Capacity", required: true },
            { type: "url", id: "website-url", label: "Website URL" },
            { type: "file", id: "event-banner", label: "Event Banner", accept: "image/*" },
            { type: "file", id: "event-seating", label: "Event Seating", accept: "image/*" },

        ];


        formFields.forEach(field => {
            if (field.id === "event-place") {
                // Wrap input in a container for positioning
                const wrapper = document.createElement("div");
                wrapper.className = "suggestions-container";

                const input = createFormField(field);
                wrapper.appendChild(input);

                const autocompleteList = document.createElement("ul");
                autocompleteList.id = "ac-list";
                autocompleteList.classList.add("ac-list");

                wrapper.appendChild(autocompleteList);

                createSection.appendChild(wrapper);
            } else {
                createSection.appendChild(createFormField(field));
            }
        });

        // Create and append the create button
        const createButton = document.createElement("button");
        createButton.id = "create-event-btn";
        createButton.textContent = "Create Event";
        createSection.appendChild(createButton);

        content.appendChild(createSection);

        const eventPlaceInput = createSection.querySelector("#event-place");

        // Add event listeners
        addEventEventListeners(eventPlaceInput, createButton);
    } else {
        Notify("Please log in to create an event.", {type: "warning", duration: 3000, dismissible: true});
        navigate('/login');
    }
}



export { createEventForm };