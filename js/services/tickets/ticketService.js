import { apiFetch } from "../../api/api.js";
import { clearTicketForm, deleteTicket, editTicket } from "./editTicket.js";
import SnackBar from "../../components/ui/Snackbar.mjs";
import { displayNewTicket, displayTickets } from "./displayTickets.js";
import Modal from "../../components/ui/Modal.mjs";

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

// function addTicketForm(eventId, ticketList) {
//     // const editEventDiv = document.getElementById('editevent');
//     const editEventDiv = document.getElementById('edittabs');

//     const heading = document.createElement('h3');
//     heading.textContent = 'Add Ticket';

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

//     // Currency selection dropdown
//     const currencySelect = document.createElement('select');
//     currencySelect.id = 'ticket-currency';
//     currencySelect.required = true;

//     const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]; // Add more if needed
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

//     // 🎨 Color picker input
//     const colorInput = document.createElement('input');
//     colorInput.type = 'color';
//     colorInput.id = 'ticket-color';
//     colorInput.value = '#3498db'; // Default color

//     const colorLabel = document.createElement('label');
//     colorLabel.textContent = 'Choose Ticket Color: ';
//     colorLabel.appendChild(colorInput);

//     // Start Seat Number input
//     const seatStartInput = document.createElement('input');
//     seatStartInput.type = 'number';
//     seatStartInput.id = 'seat-start';
//     seatStartInput.placeholder = 'Start Seat Number (e.g. 1)';
//     seatStartInput.required = true;

//     // End Seat Number input
//     const seatEndInput = document.createElement('input');
//     seatEndInput.type = 'number';
//     seatEndInput.id = 'seat-end';
//     seatEndInput.placeholder = 'End Seat Number (e.g. 100)';
//     seatEndInput.required = true;


//     const submitButton = document.createElement('button');
//     submitButton.type = 'submit';
//     submitButton.textContent = 'Add Ticket';

//     form.appendChild(nameInput);
//     form.appendChild(priceInput);
//     form.appendChild(currencySelect); // Add currency dropdown
//     form.appendChild(quantityInput);
//     form.appendChild(colorLabel);  // Add color picker
//     form.appendChild(seatStartInput);
//     form.appendChild(seatEndInput);
//     form.appendChild(submitButton);

//     const cancelButton = document.createElement('button');
//     cancelButton.id = 'cancel-ticket-form';
//     cancelButton.textContent = 'Cancel';

//     // Use replaceChildren to clear and replace the content
//     editEventDiv.replaceChildren(heading, form, cancelButton);

//     // Attach event listeners
//     form.addEventListener('submit', (event) => {
//         event.preventDefault();
//         addTicket(eventId, ticketList);
//     });
//     cancelButton.addEventListener('click', clearTicketForm);
// }


function addTicketForm(eventId, ticketList) {
    const form = document.createElement('form');
    form.id = 'add-ticket-form';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'ticket-name';
    nameInput.placeholder = 'Ticket Name';
    nameInput.required = true;

    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.id = 'ticket-price';
    priceInput.placeholder = 'Ticket Price';
    priceInput.required = true;

    const currencySelect = document.createElement('select');
    currencySelect.id = 'ticket-currency';
    currencySelect.required = true;

    const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];
    currencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency;
        option.textContent = currency;
        currencySelect.appendChild(option);
    });

    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.id = 'ticket-quantity';
    quantityInput.placeholder = 'Quantity Available';
    quantityInput.required = true;

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.id = 'ticket-color';
    colorInput.value = '#3498db';

    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Choose Ticket Color: ';
    colorLabel.appendChild(colorInput);

    const seatStartInput = document.createElement('input');
    seatStartInput.type = 'number';
    seatStartInput.id = 'seat-start';
    seatStartInput.placeholder = 'Start Seat Number (e.g. 1)';
    seatStartInput.required = true;

    const seatEndInput = document.createElement('input');
    seatEndInput.type = 'number';
    seatEndInput.id = 'seat-end';
    seatEndInput.placeholder = 'End Seat Number (e.g. 100)';
    seatEndInput.required = true;

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Add Ticket';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';

    form.appendChild(nameInput);
    form.appendChild(priceInput);
    form.appendChild(currencySelect);
    form.appendChild(quantityInput);
    form.appendChild(colorLabel);
    form.appendChild(seatStartInput);
    form.appendChild(seatEndInput);
    form.appendChild(submitButton);
    form.appendChild(cancelButton);

    const modal = Modal({
        title: "Add Ticket",
        content: form,
        onClose: () => modal.remove()
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        addTicket(eventId, ticketList);
        modal.remove(); // close modal after adding
    });

    cancelButton.addEventListener('click', () => {
        modal.remove();
    });
}

export { clearTicketForm, addTicketForm, addTicket, displayNewTicket, deleteTicket, displayTickets, editTicket };