import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import {apiFetch} from "../../api/api.js";

const CalendarForm = (onSubmit, eventId) => {
    const form = document.createElement("form");
    form.className = "booking-form";

    const title = document.createElement("h3");
    title.innerText = "Select a Date";

    const dateInput = document.createElement("input");
    dateInput.type = "text"; // Flatpickr will convert this into a calendar picker
    dateInput.placeholder = "Pick an Available Date";
    dateInput.required = true;

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Confirm Booking";

    form.append(title, dateInput, submitButton);

    // Fetch booked dates from the backend
    const bookedDates = fetchBookedDates(eventId);

    console.log(bookedDates);

    // Initialize Flatpickr with disabled booked dates
    flatpickr(dateInput, {
        dateFormat: "Y-m-d",
        minDate: "today", // Disable past dates
        disable: bookedDates, // Disable already booked dates
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            alert("Please select a date.");
            return;
        }
        onSubmit({ date: selectedDate });
        form.reset();
    });
    
    return form;
};

// Fetch booked dates from the backend
// const fetchBookedDates = async (eventId) => {
const fetchBookedDates =  (eventId) => {
    try {
        // const response = await apiFetch(`/arena/${eventId}/booked-dates`, "GET");
        const jsonResponse = '{"bookedDates": ["2025-03-05","2025-03-10","2025-03-15"]}';
        const response = JSON.parse(jsonResponse);
        return response.bookedDates || [];
    } catch (error) {
        console.error("Error fetching booked dates:", error);
        return [];
    }
};


export default CalendarForm;
