import { apiFetch } from "../../api/api.js";
// Edit an existing ticket
async function editTicket(ticketId, eventId) {
    try {
        // Fetch current ticket details from the backend
        const ticketData = await apiFetch(`/ticket/event/${eventId}/${ticketId}`, 'GET');

        if (!ticketData || !ticketData.ticketid) {
            alert("Failed to load ticket data.");
            return;
        }

        // Currency selection dropdown
        const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"]; // Add more if needed
        let currencySelectHTML = `<label for="ticket-currency">Currency:</label>
            <select id="ticket-currency" required>`;

        currencyOptions.forEach(currency => {
            const selected = ticketData.currency === currency ? 'selected' : '';
            currencySelectHTML += `<option value="${currency}" ${selected}>${currency}</option>`;
        });

        currencySelectHTML += `</select>`;

        // Show the edit form with the ticket data populated
        // const editEventDiv = document.getElementById('editevent');
        const editEventDiv = document.getElementById('edittabs');
        editEventDiv.innerHTML = `
            <br><h3>Edit Ticket</h3>
            <form id="edit-ticket-form">
                <input type="hidden" id="ticket-id" value="${ticketData.ticketid}" />
                <div class="form-group">
                <label for="ticket-name">Name:</label>
                <input type="text" id="ticket-name" value="${ticketData.name}" required />
                </div>
                <div class="form-group">
                <label for="ticket-price">Price:</label>
                <input type="number" id="ticket-price" value="${ticketData.price}" required />
                </div>
                <div class="form-group">
                ${currencySelectHTML}  <!-- Currency field added -->
                </div>
                <div class="form-group">
                <label for="ticket-quantity">Quantity Available:</label>
                <input type="number" id="ticket-quantity" value="${ticketData.quantity}" required />
                </div>
                <div class="form-group">
                <label for="ticket-color">Color Code:</label>
                <input type="color" id="ticket-color" value="${ticketData.color || '#ffffff'}" required />
                </div>
                <div class="form-group">
                <label for="seat-start">Start Seat Number: </label>
                <input type="number" id="seat-start" value="${ticketData.seatstart || '0'}" required />
                </div>
                <div class="form-group">
                <label for="seat-end">End Seat Number:</label>
                <input type="number" id="seat-end" value="${ticketData.seatend || ticketData.quantity}" required />
                </div>

                <button type="submit" class="button">Update Ticket</button>
            </form>
            <br><button id="cancel-edit-form">Cancel</button>
        `;

        // Attach event listeners
        document.getElementById('edit-ticket-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            updateTicket(ticketId, eventId);
        });

        document.getElementById('cancel-edit-form').addEventListener('click', clearTicketForm);
    } catch (error) {
        console.error("Error loading ticket data:", error);
        alert("An error occurred while loading the ticket data.");
    }
}

// Update the ticket
async function updateTicket(ticketId, eventId) {
    const name = document.getElementById('ticket-name').value.trim();
    const price = parseFloat(document.getElementById('ticket-price').value);
    const currency = document.getElementById('ticket-currency').value; // Get currency
    const quantity = parseInt(document.getElementById('ticket-quantity').value);
    const color = document.getElementById('ticket-color').value; // Corrected: Retrieve hex color as a string

    const seatStart = parseInt(document.getElementById('seat-start').value);
    const seatEnd = parseInt(document.getElementById('seat-end').value);
    
    if (isNaN(seatStart) || isNaN(seatEnd) || seatStart > seatEnd) {
        alert("Please enter a valid seat number range.");
        return;
    }
    
    if (!name || isNaN(price) || isNaN(quantity) || !currency) {
        alert("Please fill in all fields correctly.");
        return;
    }

    const updatedTicket = { name, price, currency, quantity, color,seatStart, seatEnd };

    try {
        const response = await apiFetch(`/ticket/event/${eventId}/${ticketId}`, 'PUT', JSON.stringify(updatedTicket), {
            'Content-Type': 'application/json'
        });

        if (response.success) {
            alert('Ticket updated successfully!');
            clearTicketForm();
            refreshTicketList(eventId); // Refresh tickets after update
        } else {
            alert(`Failed to update ticket: ${response.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Error updating ticket:", error);
        alert("An error occurred while updating the ticket.");
    }
}


// Clear ticket form
function clearTicketForm() {
    // const editEventDiv = document.getElementById('editevent');
    const editEventDiv = document.getElementById('edittabs');
    editEventDiv.innerHTML = ""; // Clear the form content
}

// Function to refresh the ticket list
async function refreshTicketList(eventId) {
    const ticketList = document.getElementById('ticket-list');
    if (ticketList) {
        const tickets = await apiFetch(`/ticket/event/${eventId}`, 'GET');
        displayTickets(ticketList, tickets, eventId, false, true); // Refresh with latest data
    }
}

async function deleteTicket(ticketId, eventId) {
    if (confirm('Are you sure you want to delete this ticket?')) {
        try {
            const response = await apiFetch(`/ticket/event/${eventId}/${ticketId}`, 'DELETE');

            // Check if the response was successful (status 200-299 range)
            if (response.success) {
                // Check if the response contains a message
                // const responseData = await response.json();
                // if (responseData.success) {
                alert('Ticket deleted successfully!');
                // Optionally, refresh the ticket list or update the UI
                // displayEvent(eventId); // Uncomment if you have access to eventId
                // }
            } else {
                // Handle cases where response is not OK (i.e., status 400 or 500 range)
                const errorData = await response.json();
                alert(`Failed to delete ticket: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting ticket:', error);
            alert('An error occurred while deleting the ticket.');
        }
    }
}


export { clearTicketForm, deleteTicket, editTicket };