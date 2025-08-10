import { API_URL, state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { navigate } from "../../routes/index.js";
import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";



// Function to create form fields
function createFormField(field) {
    const formGroup = document.createElement("div");
    formGroup.className = "form-group";

    // Create label if applicable
    if (field.label) {
        const label = document.createElement("label");
        label.setAttribute("for", field.id);
        label.textContent = field.label;
        formGroup.appendChild(label);
    }

    let inputElement;
    if (field.type === "textarea") {
        inputElement = document.createElement("textarea");
    } else if (field.type === "select" || field.type === "multiselect") {
        inputElement = document.createElement("select");

        if (field.type === "multiselect") {
            inputElement.multiple = true; // ➡️ Allow multiple selection
        }

        field.options.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            inputElement.appendChild(optionElement);
        });
    } else {
        inputElement = document.createElement("input");
        inputElement.type = field.type;

        const previewContainer = createElement("div", {
            style: "display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;",
        });
        formGroup.appendChild(previewContainer);

        if (inputElement.type == "file") {
            inputElement.addEventListener("change", (e) => {
                previewContainer.innerHTML = "";
                const files = Array.from(e.target.files);
                files.forEach((file) => {
                    const img = createElement("img", {
                        src: URL.createObjectURL(file),
                        style: "max-width: 150px; max-height: 150px; object-fit: cover; border-radius: 6px;",
                    });
                    previewContainer.appendChild(img);
                });
            });
        }
    }

    inputElement.id = field.id;
    if (field.required) inputElement.required = true;
    if (field.accept) inputElement.accept = field.accept;

    formGroup.appendChild(inputElement);
    return formGroup;
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function addEventEventListeners(eventPlaceInput, createButton) {
    createButton.addEventListener("click", createEvent);
    addAutoConListeners(eventPlaceInput);
}

function addAutoConListeners(eventPlaceInput) {

    async function fetchPlaceSuggestions() {
        const query = eventPlaceInput.value.trim();
        const autocompleteList = document.getElementById("ac-list");

        if (query.length < 1) {
            autocompleteList.innerHTML = "";
            return;
        }

        try {
            const response = await fetch(`${API_URL}/suggestions/places?query=${query}`);
            const suggestions = await response.json();

            autocompleteList.innerHTML = "";
            suggestions.forEach((suggestion) => {
                const item = document.createElement("li");
                item.classList.add("ac-item");
                item.textContent = suggestion.name;
                eventPlaceInput.dataset.id = suggestion.id;
                item.addEventListener("click", () => {
                    eventPlaceInput.value = suggestion.name;
                    eventPlaceInput.dataset.id = suggestion.id;
                    autocompleteList.innerHTML = "";
                });
                autocompleteList.appendChild(item);
            });

            if (suggestions.length > 0) {
                autocompleteList.style.display = "block";
            } else {
                autocompleteList.style.display = "none";
            }
        } catch (error) {
            console.error("Error fetching autocomplete suggestions:", error);
        }
    }

    const debouncedFetchSuggestions = debounce(fetchPlaceSuggestions, 300);
    eventPlaceInput.addEventListener("input", debouncedFetchSuggestions);

    // Handle keyboard navigation
    eventPlaceInput.addEventListener("keydown", (event) => handleKeyboardNav(event, eventPlaceInput));

    // // Hide suggestions when clicking outside
    // document.addEventListener("click", (event) => {
    //     if (!event.target.closest(".suggestions-container")) {
    //         document.getElementById("ac-list").style.display = "none";
    //     }
    // });
}

// Handle keyboard navigation in autocomplete
function handleKeyboardNav(event, eventPlaceInput) {
    const autocompleteList = document.getElementById("ac-list");
    const items = autocompleteList.querySelectorAll(".ac-item");

    if (items.length === 0) return;

    let index = Array.from(items).findIndex((item) => item.classList.contains("selected"));

    if (event.key === "ArrowDown") {
        event.preventDefault();
        if (index < items.length - 1) index++;
        else index = 0;
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (index > 0) index--;
        else index = items.length - 1;
    } else if (event.key === "Enter") {
        event.preventDefault();
        if (index >= 0) {
            eventPlaceInput.value = items[index].textContent;
            autocompleteList.innerHTML = "";
        }
        return;
    } else {
        return;
    }

    items.forEach((item) => item.classList.remove("selected"));
    items[index].classList.add("selected");
}


async function createEvent(isLoggedIn) {
    if (isLoggedIn && state.user) {
        const title = document.getElementById("event-title").value.trim();
        const date = document.getElementById("event-date").value;
        const time = document.getElementById("event-time").value;
        const location = document.getElementById("event-location").value.trim();
        const description = document.getElementById("event-description").value.trim();
        const category = document.getElementById("category").value;
        const bannerFile = document.getElementById("event-banner").files[0];
        const seatingPlanFile = document.getElementById("event-seating").files[0];
        const place = document.getElementById("event-place");
        const placeID = place.dataset.id || "";
        const placeName = place.value;

        // Get selected artists
        // const artistSelect = document.getElementById("artist-select");
        // const selectedArtists = Array.from(artistSelect.selectedOptions).map(option => option.value);

        if (!title || !date || !time || !place || !location || !description || !category) {
            Notify("Please fill in all required fields.", { type: "warning", duration: 3000, dismissible: true });
            return;
        }

        const eventDate = new Date(`${date}T${time}:00`);

        const formData = new FormData();
        formData.append('event', JSON.stringify({
            title,
            date: eventDate.toISOString(),
            location,
            placeID,
            placeName,
            description,
            category
        }));

        // // ➡️ Attach artists JSON if any selected
        // if (selectedArtists.length > 0) {
        //     formData.append('artists', JSON.stringify(selectedArtists));
        // }

        if (bannerFile) {
            formData.append('banner', bannerFile);
        }
        if (seatingPlanFile) {
            formData.append('event-seating', seatingPlanFile);
        }

        try {
            const result = await apiFetch('/events/event', 'POST', formData);
            Notify(`Event created successfully: ${result.title}`, { type: "warning", duration: 3000, dismissible: true });
            navigate('/event/' + result.eventid);
        } catch (error) {
            Notify(`Error creating event: ${error.message}`, { type: "warning", duration: 3000, dismissible: true });
        }
    } else {
        navigate('/login');
    }
}

export { createFormField, addEventEventListeners, addAutoConListeners, handleKeyboardNav };