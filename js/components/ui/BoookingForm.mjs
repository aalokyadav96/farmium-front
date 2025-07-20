import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import {apiFetch} from "../../api/api.js";

const BoookingForm = (onSubmit, placeType) => {
    const form = document.createElement("form");
    form.className = "booking-form";

    const title = document.createElement("h3");
    title.innerText = "Book Now";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Your Name";
    nameInput.required = true;

    const dateInput = document.createElement("input");
    dateInput.type = "text"; // Flatpickr will handle this
    dateInput.placeholder = "Select a Date";
    dateInput.required = true;

    setTimeout(() => {
        flatpickr(dateInput, {
            enableTime: placeType === "restaurant", // Show time picker for restaurants
            dateFormat: "Y-m-d" + (placeType === "restaurant" ? " H:i" : ""), // Include time for restaurants
            minDate: "today", // Prevent past dates
            disable: placeType === "arena" ? fetchBookedDates() : [],
        });
    });

    const seatsInput = document.createElement("input");
    seatsInput.type = "number";
    seatsInput.placeholder = "Number of Seats";
    seatsInput.min = 1;
    seatsInput.required = true;

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Book Now";

    form.append(title, nameInput, dateInput, seatsInput, submitButton);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const bookingDetails = {
            name: nameInput.value,
            date: dateInput.value,
            seats: seatsInput.value,
        };
        onSubmit(bookingDetails);
        form.reset();
    });

    return form;
};

const fetchBookedDates = async () => {
    try {
        const response = await apiFetch("/arena/booked-dates", "GET");
        return response.bookedDates || [];
    } catch (error) {
        console.error("Error fetching booked dates:", error);
        return [];
    }
};

export default BoookingForm;
