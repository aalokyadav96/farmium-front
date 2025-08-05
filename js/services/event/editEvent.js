import { apiFetch } from "../../api/api.js";
import { navigate } from "../../routes/index.js";
import SnackBar from '../../components/ui/Snackbar.mjs';
import { createFormGroup } from "../../components/createFormGroup.js";
import Button from "../../components/base/Button.js";
import { addAutoConListeners } from "./createEventHelpers.js";


async function updateEvent(isLoggedIn, eventId) {
  if (!isLoggedIn) {
    SnackBar("Please log in to update the event.", 3000);
    return;
  }

  // Fetch input values
  const category = document.getElementById("event-category").value.trim();
  const title = document.getElementById("event-title").value.trim();
  const date = document.getElementById("event-date").value; // Expected format: "YYYY-MM-DD"
  let time = document.getElementById("event-time").value;      // Expected format: "HH:MM" or "HH:MM:SS"
  // const place = document.getElementById("event-place").value.trim();
  const place = document.getElementById("event-place");
  const placeid = place.dataset.id || ""; // Get stored placeID
  const placename = place.value; // Get place name (displayed to user)
  const location = document.getElementById("event-location").value.trim();
  const description = document.getElementById("event-description").value.trim();
  const bannerFile = document.getElementById("event-banner").files[0];
  const seatingPlanFile = document.getElementById("event-seating").files[0];

  // Validate required fields
  if (!category || !title || !date || !time || !place || !location || !description) {
    SnackBar("Please fill in all required fields.", 3000);
    return;
  }

  // Ensure time is in HH:MM:SS format (append ":00" if necessary)
  if (time.length === 5) {
    time += ":00";
  }

  // Combine date and time into a single Date object
  const eventDate = new Date(`${date}T${time}`);
  console.log("Event Date (Local Time):", eventDate.toString());
  console.log("Event Date (UTC Format):", eventDate.toISOString());

  // Construct the event payload (like in createEvent)
  const eventPayload = {
    category,
    title,
    date: eventDate.toISOString(), // Ensure proper formatting
    location,
    // place,
    placeid,
    placename,
    description
    // If you want to update category as well, add: category
  };

  // Create FormData and append event payload as a JSON string
  const formData = new FormData();
  formData.append("event", JSON.stringify(eventPayload));
  if (bannerFile) {
    formData.append("event-banner", bannerFile);
  }
  if (seatingPlanFile) {
    formData.append("event-seating", seatingPlanFile);
  }

  try {
    const result = await apiFetch(`/events/event/${eventId}`, "PUT", formData);
    SnackBar(`Event updated successfully: ${result.title}`, 3000);
    // navigate(`/event/${result.eventid}`);
  } catch (error) {
    console.error("Update Event Error:", error);
    SnackBar(`Error updating event: ${error.message}`, 3000);
  }
}


// async function editEventForm(isLoggedIn, eventId) {
//   const createSection = document.getElementById("editevent");

//   if (!isLoggedIn) {
//     navigate("/login");
//     return;
//   }

//   try {
//     // Fetch event data
//     const eventx = await apiFetch(`/events/event/${eventId}`);
//     console.log(eventx);


//     // Convert UTC date string to a Date object
//     const eventDateTime = new Date(eventx.date);

//     // Convert to local date in YYYY-MM-DD format
//     const eventDate = eventDateTime.toISOString().split("T")[0];

//     // Convert to local time in HH:MM:SS format
//     const eventTime = eventDateTime.toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//       hour12: false, // Use 24-hour format
//     });

//     // alert(eventTime);


//     // Clear existing content
//     createSection.innerHTML = "";

//     // Create form container
//     const formContainer = document.createElement("div");
//     formContainer.classList.add("form-container");

//     const formHeading = document.createElement("h2");
//     formHeading.textContent = "Edit Event";

//     // Create the form
//     const form = document.createElement("form");
//     form.id = "edit-event-form";
//     form.classList.add("edit-event-form");

//     // Define form fields
//     const formGroups = [
//       { label: "Event Title", inputType: "text", inputId: "event-title", inputValue: eventx.title, placeholder: "Event Title", isRequired: true },
//       { label: "Event Date", inputType: "date", inputId: "event-date", inputValue: eventDate, isRequired: true },
//       { label: "Event Time", inputType: "time", inputId: "event-time", inputValue: eventTime, isRequired: true },
//       { label: "Event Location", inputType: "text", inputId: "event-location", inputValue: eventx.location, placeholder: "Location", isRequired: true },
//       { label: "Event Place", inputType: "text", inputId: "event-place", inputValue: eventx.placename, placeholder: "Place", isRequired: true },
//       { label: "Event Description", inputType: "textarea", inputId: "event-description", inputValue: eventx.description, placeholder: "Description", isRequired: true },
//       { label: "Event Banner", inputType: "file", inputId: "event-banner", additionalProps: { accept: "image/*" } },
//       { label: "Seating Plan Map", inputType: "file", inputId: "event-seating", additionalProps: { accept: "image/*" } },
//     ];

//     // Generate form fields
//     formGroups.forEach(group => form.appendChild(createFormGroup(group)));

//     // Create buttons
//     const updateButton = document.createElement("button");
//     updateButton.type = "submit";
//     updateButton.classList.add("button", "update-btn");
//     updateButton.textContent = "Update Event";

//     const cancelButton = Button("Cancel", "cancel-btn", {
//       click: () => (createSection.innerHTML = ""),
//     });
//     cancelButton.type = "button";

//     // Append buttons to form
//     form.appendChild(updateButton);
//     form.appendChild(cancelButton);

//     // Append form to container
//     formContainer.appendChild(formHeading);
//     formContainer.appendChild(form);

//     // Append container to section
//     createSection.appendChild(formContainer);

//     // Handle form submission
//     form.addEventListener("submit", async (event) => {
//       event.preventDefault();
//       await updateEvent(isLoggedIn, eventId);
//     });

//   } catch (error) {
//     console.error("Edit Event Form Error:", error);
//     SnackBar(`Error loading event: ${error.message}`, 3000);
//   }
// }

async function editEventForm(isLoggedIn, eventId) {
  const createSection = document.getElementById("editevent");
  if (!isLoggedIn) {
    navigate("/login");
    return;
  }

  try {
    const eventx = await apiFetch(`/events/event/${eventId}`);
    console.log(eventx);

    const eventDateTime = new Date(eventx.date);
    const eventDate = eventDateTime.toISOString().split("T")[0];
    const eventTime = eventDateTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    createSection.innerHTML = "";

    const formContainer = document.createElement("div");
    formContainer.classList.add("form-container");

    const formHeading = document.createElement("h2");
    formHeading.textContent = "Edit Event";

    const form = document.createElement("form");
    form.id = "edit-event-form";
    form.classList.add("edit-event-form");

    const formGroups = [
      {
        inputType: "select", inputId: "event-category", label: "Event Type", isRequired: true,
        options: [
          { value: eventx.category, label: eventx.category },
          { value: "Conference", label: "Conference" },
          { value: "Concert", label: "Concert" },
          { value: "Sports", label: "Sports" },
          { value: "Festival", label: "Festival" },
          { value: "Meetup", label: "Meetup" },
          { value: "Workshop", label: "Workshop" },
          { value: "Other", label: "Other" }
        ]
      },
      { label: "Event Title", inputType: "text", inputId: "event-title", inputValue: eventx.title, placeholder: "Event Title", isRequired: true },
      { label: "Event Date", inputType: "date", inputId: "event-date", inputValue: eventDate, isRequired: true },
      { label: "Event Time", inputType: "time", inputId: "event-time", inputValue: eventTime, isRequired: true },
      { label: "Event Location", inputType: "text", inputId: "event-location", inputValue: eventx.location, placeholder: "Location", isRequired: true },
      { label: "Event Place", inputType: "text", inputId: "event-place", inputValue: eventx.placename, placeholder: "Place", isRequired: true },
      { label: "Event Description", inputType: "textarea", inputId: "event-description", inputValue: eventx.description, placeholder: "Description", isRequired: true },
      { label: "Event Banner", inputType: "file", inputId: "event-banner", additionalProps: { accept: "image/*" } },
      { label: "Seating Plan Map", inputType: "file", inputId: "event-seating", additionalProps: { accept: "image/*" } },
    ];

    formGroups.forEach(field => {
      if (field.inputId === "event-place") {
        const wrapper = document.createElement("div");
        wrapper.className = "suggestions-container";

        const input = createFormGroup(field); // Make sure this returns the actual input element
        wrapper.appendChild(input);

        const autocompleteList = document.createElement("ul");
        autocompleteList.id = "ac-list";
        autocompleteList.classList.add("ac-list");

        wrapper.appendChild(autocompleteList);

        form.appendChild(wrapper);
      } else {
        form.appendChild(createFormGroup(field));
      }
    });

    const updateButton = document.createElement("button");
    updateButton.type = "submit";
    updateButton.classList.add("button", "update-btn");
    updateButton.textContent = "Update Event";
    updateButton.addEventListener("click", () => { updateEvent(isLoggedIn, eventId) });

    const cancelButton = Button("Cancel", "cancel-btn", {
      click: () => (createSection.innerHTML = ""),
    });
    cancelButton.type = "button";

    form.appendChild(updateButton);
    form.appendChild(cancelButton);

    formContainer.appendChild(formHeading);
    formContainer.appendChild(form);

    createSection.appendChild(formContainer);

    // form.addEventListener("submit", async (event) => {
    //   event.preventDefault();
    //   await updateEvent(isLoggedIn, eventId);
    // });

    const eventPlaceInput = form.querySelector("#event-place");

    // ✅ Fix: Use the correct autocomplete listeners
    addAutoConListeners(eventPlaceInput);

  } catch (error) {
    console.error("Edit Event Form Error:", error);
    SnackBar(`Error loading event: ${error.message}`, 3000);
  }
}

export { updateEvent, editEventForm };
