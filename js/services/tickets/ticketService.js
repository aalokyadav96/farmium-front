import { apiFetch } from "../../api/api.js";
import { clearTicketForm, deleteTicket, editTicket } from "./editTicket.js";
import SnackBar from "../../components/ui/Snackbar.mjs";
import { displayNewTicket, displayTickets } from "./displayTickets.js";
import Modal from "../../components/ui/Modal.mjs";
import Notify from "../../components/ui/Notify.mjs";
import { createFormGroup } from "../place/editPlace.js";
import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";


// Add ticket to the event
async function addTicket(eventId, ticketList) {
    const tickName = document.getElementById('ticket-name').value.trim();
    const tickPrice = parseFloat(document.getElementById('ticket-price').value);
    const tickQuantity = parseInt(document.getElementById('ticket-quantity').value);
    const tickColor = document.getElementById('ticket-color').value; // Get color
    const tickCurrency = document.getElementById('ticket-currency').value; // Get currency
    const seatStart = parseInt(document.getElementById('seat-start').value);
    const seatEnd = parseInt(document.getElementById('seat-end').value);

    if (isNaN(seatStart) || isNaN(seatEnd) || seatStart > seatEnd) {
        alert("Please enter a valid seat number range.");
        return;
    }

    if (!tickName || isNaN(tickPrice) || isNaN(tickQuantity) || !tickCurrency) {
        alert("Please fill in all fields correctly.");
        return;
    }

    const formData = new FormData();
    formData.append('name', tickName);
    formData.append('price', tickPrice);
    formData.append('quantity', tickQuantity);
    formData.append('color', tickColor); // Include color
    formData.append('currency', tickCurrency); // Include currency
    formData.append('seatStart', seatStart);
    formData.append('seatEnd', seatEnd);

    try {
        const response = await apiFetch(`/ticket/event/${eventId}`, 'POST', formData);

        if (response && response.ticketid) {
            SnackBar("Ticket added successfully!");
            displayNewTicket(response, ticketList);  // Display the newly added ticket
            clearTicketForm();  // Optionally clear the form after success
        } else {
            alert(`Failed to add ticket: ${response?.message || 'Unknown error'}`);
        }
    } catch (error) {
        alert(`Error adding ticket: ${error.message}`);
    }
}



function addTicketForm(eventId, ticketList) {
    const form = createElement("form", { id: "add-ticket-form" });

    // Standard input fields using createFormGroup
    const fields = [
        { label: "Ticket Name", inputType: "text", inputId: "ticket-name", placeholder: "Ticket Name", isRequired: true },
        { label: "Ticket Price", inputType: "number", inputId: "ticket-price", placeholder: "Ticket Price", isRequired: true },
        { label: "Quantity Available", inputType: "number", inputId: "ticket-quantity", placeholder: "Quantity Available", isRequired: true },
        { label: "Start Seat Number", inputType: "number", inputId: "seat-start", placeholder: "Start Seat Number (e.g. 1)" },
        { label: "End Seat Number", inputType: "number", inputId: "seat-end", placeholder: "End Seat Number (e.g. 100)" },
    ];

    fields.forEach(field => form.appendChild(createFormGroup(field)));

    // Currency select (custom build)
    const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];
    const currencySelect = createElement("select", { id: "ticket-currency", required: true });
    currencyOptions.forEach(currency => {
        const option = createElement("option", { value: currency }, [currency]);
        currencySelect.appendChild(option);
    });
    const currencyGroup = createElement("div", { class: "form-group" }, [
        createElement("label", { for: "ticket-currency" }, ["Currency"]),
        currencySelect,
    ]);

    form.appendChild(currencyGroup);

    // Color input wrapped in label
    const colorInput = createElement("input", { type: "color", id: "ticket-color", value: "#3498db" });
    const colorLabel = createElement("label", { for: "ticket-color" }, ["Choose Ticket Color: ", colorInput]);
    form.appendChild(colorLabel);

    // Buttons
    // const submitButton = createElement("button", { type: "submit" }, ["Add Ticket"]);
    const submitButton = Button("Add Ticket", "", {}, "buttonx");
    submitButton.type = "submit";

    // const cancelButton = createElement("button", { type: "button" }, ["Cancel"]);
    const cancelButton = Button("Cancel", "", {
        click: () => { modal.remove(); }
    }, "buttonx");

    form.append(submitButton, cancelButton);

    const modal = Modal({
        title: "Add Ticket",
        content: form,
        onClose: () => modal.remove(),
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        addTicket(eventId, ticketList);
        modal.remove();
    });

}

// function addTicketForm(eventId, ticketList) {
//     const form = document.createElement('form');
//     form.id = 'add-ticket-form';

//     const nameInput = document.createElement('input');
//     nameInput.type = 'text';
//     nameInput.id = 'ticket-name';
//     nameInput.placeholder = 'Ticket Name';
//     nameInput.required = true;

//     const priceInput = document.createElement('input');
//     priceInput.type = 'number';
//     priceInput.id = 'ticket-price';
//     priceInput.placeholder = 'Ticket Price';
//     priceInput.required = true;

//     const currencySelect = document.createElement('select');
//     currencySelect.id = 'ticket-currency';
//     currencySelect.required = true;

//     const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];
//     currencies.forEach(currency => {
//         const option = document.createElement('option');
//         option.value = currency;
//         option.textContent = currency;
//         currencySelect.appendChild(option);
//     });

//     const quantityInput = document.createElement('input');
//     quantityInput.type = 'number';
//     quantityInput.id = 'ticket-quantity';
//     quantityInput.placeholder = 'Quantity Available';
//     quantityInput.required = true;

//     const colorInput = document.createElement('input');
//     colorInput.type = 'color';
//     colorInput.id = 'ticket-color';
//     colorInput.value = '#3498db';

//     const colorLabel = document.createElement('label');
//     colorLabel.textContent = 'Choose Ticket Color: ';
//     colorLabel.appendChild(colorInput);

//     const seatStartInput = document.createElement('input');
//     seatStartInput.type = 'number';
//     seatStartInput.id = 'seat-start';
//     seatStartInput.placeholder = 'Start Seat Number (e.g. 1)';
//     seatStartInput.required = false;

//     const seatEndInput = document.createElement('input');
//     seatEndInput.type = 'number';
//     seatEndInput.id = 'seat-end';
//     seatEndInput.placeholder = 'End Seat Number (e.g. 100)';
//     seatEndInput.required = false;

//     const submitButton = document.createElement('button');
//     submitButton.type = 'submit';
//     submitButton.textContent = 'Add Ticket';

//     const cancelButton = document.createElement('button');
//     cancelButton.type = 'button';
//     cancelButton.textContent = 'Cancel';

//     form.appendChild(nameInput);
//     form.appendChild(priceInput);
//     form.appendChild(currencySelect);
//     form.appendChild(quantityInput);
//     form.appendChild(colorLabel);
//     form.appendChild(seatStartInput);
//     form.appendChild(seatEndInput);
//     form.appendChild(submitButton);
//     form.appendChild(cancelButton);

//     const modal = Modal({
//         title: "Add Ticket",
//         content: form,
//         onClose: () => modal.remove()
//     });

//     form.addEventListener('submit', (event) => {
//         event.preventDefault();
//         addTicket(eventId, ticketList);
//         modal.remove(); // close modal after adding
//     });

//     cancelButton.addEventListener('click', () => {
//         modal.remove();
//     });
// }

export { clearTicketForm, addTicketForm, addTicket, displayNewTicket, deleteTicket, displayTickets, editTicket };