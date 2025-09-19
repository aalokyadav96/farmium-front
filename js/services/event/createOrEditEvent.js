import { APIG_URL, getState } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { navigate } from "../../routes/index.js";
import { createElement } from "../../components/createElement.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import Button from "../../components/base/Button.js";
import Notify from "../../components/ui/Notify.mjs";

import {debounce} from "../../utils/deutils.js";

// /** Debounce helper */
// function debounce(func, delay) {
//     let timeout;
//     return function (...args) {
//         clearTimeout(timeout);
//         timeout = setTimeout(() => func.apply(this, args), delay);
//     };
// }

/** Add autocomplete listeners for the place input */
function addAutoConListeners(eventPlaceInput) {
    async function fetchPlaceSuggestions() {
        const query = eventPlaceInput.value.trim();
        const autocompleteList = document.getElementById("ac-list");

        if (!query) {
            autocompleteList.replaceChildren();
            return;
        }

        try {
            const response = await fetch(`${APIG_URL}/suggestions/places?query=${query}`);
            const suggestions = await response.json();

            autocompleteList.replaceChildren();
            suggestions.forEach(suggestion => {
                const item = createElement("li", { class: "ac-item" }, [suggestion.name]);
                item.addEventListener("click", () => {
                    eventPlaceInput.value = suggestion.name;
                    eventPlaceInput.dataset.id = suggestion.id;
                    autocompleteList.replaceChildren();
                });
                autocompleteList.appendChild(item);
            });
            autocompleteList.style.display = suggestions.length ? "block" : "none";

        } catch (err) {
            console.error("Autocomplete fetch error:", err);
        }
    }

    const debouncedFetch = debounce(fetchPlaceSuggestions, 300);
    eventPlaceInput.addEventListener("input", debouncedFetch);

    eventPlaceInput.addEventListener("keydown", (e) => {
        const autocompleteList = document.getElementById("ac-list");
        const items = Array.from(autocompleteList.querySelectorAll(".ac-item"));
        if (!items.length) return;

        let index = items.findIndex(i => i.classList.contains("selected"));
        if (e.key === "ArrowDown") { e.preventDefault(); index = index < items.length - 1 ? index + 1 : 0; }
        else if (e.key === "ArrowUp") { e.preventDefault(); index = index > 0 ? index - 1 : items.length - 1; }
        else if (e.key === "Enter") { e.preventDefault(); if (index >= 0) { eventPlaceInput.value = items[index].textContent; autocompleteList.replaceChildren(); } return; }

        items.forEach(i => i.classList.remove("selected"));
        items[index].classList.add("selected");
    });
}

/** Shared function for creating or updating an event */
async function submitEvent(form, isLoggedIn, eventId = null) {
    if (!isLoggedIn || !getState("user")) { navigate('/login'); return; }

    if (!form.checkValidity()) { form.reportValidity(); return; }

    const placeInput = form.querySelector("#event-place");
    const payload = {
        category: form.querySelector("#event-category")?.value,
        title: form.querySelector("#event-title")?.value.trim(),
        description: form.querySelector("#event-description")?.value.trim(),
        location: form.querySelector("#event-location")?.value.trim(),
        placename: placeInput?.value.trim(),
        placeid: placeInput?.dataset.id || "",
    };

    const date = form.querySelector("#event-date")?.value;
    let time = form.querySelector("#event-time")?.value;
    if (time?.length === 5) time += ":00";
    payload.date = new Date(`${date}T${time}`).toISOString();

    const formData = new FormData();
    formData.append("event", JSON.stringify(payload));

    const bannerFile = form.querySelector("#event-banner")?.files[0];
    const seatingFile = form.querySelector("#event-seating")?.files[0];
    if (bannerFile) formData.append("event-banner", bannerFile);
    if (seatingFile) formData.append("event-seating", seatingFile);

    try {
        const url = eventId ? `/events/event/${eventId}` : `/events/event`;
        const method = eventId ? "PUT" : "POST";
        const result = await apiFetch(url, method, formData);

        Notify(`Event ${eventId ? "updated" : "created"} successfully: ${result.title}`, { type: "success", duration: 3000, dismissible: true });
        if (!eventId) navigate(`/event/${result.eventid}`);
    } catch (err) {
        console.error(err);
        Notify(`Error submitting event: ${err.message}`, { type: "error", duration: 3000, dismissible: true });
    }
}

/** Generate event form (Create or Edit) */
// function generateEventForm(isLoggedIn, container, eventData = null) {
//     if (!isLoggedIn) { Notify("Please log in.", { type: "warning", duration: 3000, dismissible: true }); navigate("/login"); return; }

//     container.replaceChildren();
//     const section = createElement("div", { class: "create-section" });
//     const header = createElement("h2", {}, [eventData ? "Edit Event" : "Create Event"]);
//     section.appendChild(header);

//     // actual form wrapper
//     const form = createElement("form", { class: "event-form" });
//     const fields = [
//         { 
//             type: "select", 
//             id: "event-category", 
//             label: "Event Type", 
//             required: true, 
//             value: eventData?.category || "",   // ✅ preselect category
//             options: [
//                 { value: "", label: "Select a Type" },
//                 "Conference","Concert","Sports","Festival","Meetup","Workshop","Other"
//             ].map(v => typeof v === "string" ? { value: v, label: v } : v) 
//         },
//         { type: "text", id: "event-title", label: "Event Title", value: eventData?.title || "", required: true },
//         { type: "textarea", id: "event-description", label: "Description", value: eventData?.description || "", required: true },
//         { type: "text", id: "event-place", label: "Place", value: eventData?.placename || "", required: true },
//         { type: "text", id: "event-location", label: "Location", value: eventData?.location || "", required: true },
//         { type: "date", id: "event-date", label: "Date", value: eventData ? new Date(eventData.date).toISOString().split("T")[0] : "", required: true },
//         { type: "time", id: "event-time", label: "Time", value: eventData ? new Date(eventData.date).toTimeString().split(" ")[0] : "", required: true },
//         // { type: "file", id: "event-banner", label: "Event Banner", additionalProps: { accept: "image/*" } },
//         // { type: "file", id: "event-seating", label: "Seating Plan", additionalProps: { accept: "image/*" } },
//     ];
    
//     fields.forEach(f => {
//         if (f.id === "event-place") {
//             const wrapper = createElement("div", { class: "suggestions-container" });
//             const input = createFormGroup(f);
//             wrapper.appendChild(input);

//             const acList = createElement("ul", { id: "ac-list", class: "ac-list" });
//             wrapper.appendChild(acList);

//             form.appendChild(wrapper);
//         } else form.appendChild(createFormGroup(f));
//     });

//     const submitBtn = Button(eventData ? "Update Event" : "Create Event", "", {
//         click: (e) => {
//             e.preventDefault();
//             submitEvent(form, isLoggedIn, eventData?.eventid);
//         }
//     }, "buttonx");
//     form.appendChild(submitBtn);

//     section.appendChild(form);
//     container.appendChild(section);

//     // Attach autocomplete
//     const placeInput = form.querySelector("#event-place");
//     if (placeInput) addAutoConListeners(placeInput);
// }


function generateEventForm(isLoggedIn, container, eventData = {}) {
    if (!isLoggedIn) {
        Notify("Please log in.", { type: "warning", duration: 3000, dismissible: true });
        navigate("/login");
        return;
    }

    container.replaceChildren();
    const section = createElement("div", { class: "create-section" });
    const header = createElement("h2", {}, [eventData.eventid ? "Edit Event" : "Create Event"]);
    section.appendChild(header);

    const form = createElement("form", { class: "event-form" });
    const fields = [
        { 
            type: "select", 
            id: "event-category", 
            label: "Event Type", 
            required: true, 
            value: eventData.category || "",   // ✅ preselect category safely
            placeholder: "Select a Type",
            options: ["Conference","Concert","Sports","Festival","Meetup","Workshop","Other"].map(v => ({ value: v, label: v }))
        },
        { type: "text", id: "event-title", label: "Event Title", value: eventData.title || "", placeholder: "Enter title", required: true },
        { type: "textarea", id: "event-description", label: "Description", value: eventData.description || "", placeholder: "Enter description", required: true },
        { type: "text", id: "event-place", label: "Place", value: eventData.placename || "", placeholder: "Enter place", required: true },
        { type: "text", id: "event-location", label: "Location", value: eventData.location || "", placeholder: "Enter location", required: true },
        { type: "date", id: "event-date", label: "Date", value: eventData.date ? new Date(eventData.date).toISOString().split("T")[0] : "", required: true },
        { type: "time", id: "event-time", label: "Time", value: eventData.date ? new Date(eventData.date).toTimeString().split(" ")[0] : "", required: true },
    ];

    fields.forEach(f => {
        if (f.id === "event-place") {
            const wrapper = createElement("div", { class: "suggestions-container" });
            const input = createFormGroup(f);
            wrapper.appendChild(input);

            const acList = createElement("ul", { id: "ac-list", class: "ac-list" });
            wrapper.appendChild(acList);

            form.appendChild(wrapper);
        } else {
            form.appendChild(createFormGroup(f));
        }
    });

    const submitBtn = Button(eventData.eventid ? "Update Event" : "Create Event", "", {
        click: (e) => {
            e.preventDefault();
            submitEvent(form, isLoggedIn, eventData.eventid);
        }
    }, "buttonx");

    form.appendChild(submitBtn);
    section.appendChild(form);
    container.appendChild(section);

    const placeInput = form.querySelector("#event-place");
    if (placeInput) addAutoConListeners(placeInput);
}

export { generateEventForm, submitEvent };
