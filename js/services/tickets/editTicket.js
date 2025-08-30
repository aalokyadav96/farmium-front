import { apiFetch } from "../../api/api.js";
import { displayTickets } from "./displayTickets.js";
import { createElement } from "../../components/createElement.js";

// Edit an existing ticket
async function editTicket(ticketId, eventId) {
    try {
        const ticketData = await apiFetch(`/ticket/event/${eventId}/${ticketId}`, 'GET');

        if (!ticketData || !ticketData.ticketid) {
            alert("Failed to load ticket data.");
            return;
        }

        const editEventDiv = document.getElementById('edittabs');
        editEventDiv.innerHTML = ""; // Clear previous form

        const form = createElement("form", { id: "edit-ticket-form" });

        // Hidden ticket ID
        form.appendChild(createElement("input", { type: "hidden", id: "ticket-id", value: ticketData.ticketid }));

        // Fields
        const fields = [
            { label: "Name:", type: "text", id: "ticket-name", value: ticketData.name, required: true },
            { label: "Price:", type: "number", id: "ticket-price", value: ticketData.price, required: true },
            { label: "Quantity Available:", type: "number", id: "ticket-quantity", value: ticketData.quantity, required: true },
            { label: "Start Seat Number:", type: "number", id: "seat-start", value: ticketData.seatstart || 0, required: true },
            { label: "End Seat Number:", type: "number", id: "seat-end", value: ticketData.seatend || ticketData.quantity, required: true },
            { label: "Color Code:", type: "color", id: "ticket-color", value: ticketData.color || "#ffffff", required: true },
        ];

        fields.forEach(field => {
            const group = createElement("div", { class: "form-group" });
            group.appendChild(createElement("label", { for: field.id }, [field.label]));
            const input = createElement("input", {
                type: field.type,
                id: field.id,
                value: field.value,
                required: field.required || false
            });
            group.appendChild(input);
            form.appendChild(group);
        });

        // Currency select
        const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];
        const currencyGroup = createElement("div", { class: "form-group" });
        currencyGroup.appendChild(createElement("label", { for: "ticket-currency" }, ["Currency:"]));
        const currencySelect = createElement("select", { id: "ticket-currency", required: true });
        currencyOptions.forEach(curr => {
            const option = createElement("option", { value: curr }, [curr]);
            if (ticketData.currency === curr) option.selected = true;
            currencySelect.appendChild(option);
        });
        currencyGroup.appendChild(currencySelect);
        form.appendChild(currencyGroup);

        // Submit & Cancel buttons
        const submitBtn = createElement("button", { type: "submit", class: "button" }, ["Update Ticket"]);
        const cancelBtn = createElement("button", { type: "button", class: "button" }, ["Cancel"]);
        cancelBtn.addEventListener("click", () => clearTicketForm());
        form.append(submitBtn, cancelBtn);

        editEventDiv.appendChild(createElement("h3", {}, ["Edit Ticket"]));
        editEventDiv.appendChild(form);

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            await updateTicket(ticketId, eventId);
        });
    } catch (error) {
        console.error("Error loading ticket data:", error);
        alert("An error occurred while loading the ticket data.");
    }
}

// Update the ticket
async function updateTicket(ticketId, eventId) {
    const name = document.getElementById('ticket-name').value.trim();
    const price = parseFloat(document.getElementById('ticket-price').value);
    const currency = document.getElementById('ticket-currency').value;
    const quantity = parseInt(document.getElementById('ticket-quantity').value);
    const color = document.getElementById('ticket-color').value;
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

    const updatedTicket = { name, price, currency, quantity, color, seatStart, seatEnd };

    try {
        const response = await apiFetch(`/ticket/event/${eventId}/${ticketId}`, 'PUT', JSON.stringify(updatedTicket), {
            'Content-Type': 'application/json'
        });

        if (response.success) {
            alert('Ticket updated successfully!');
            clearTicketForm();
            refreshTicketList(eventId);
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
    const editEventDiv = document.getElementById('edittabs');
    editEventDiv.innerHTML = "";
}

// Refresh ticket list
async function refreshTicketList(eventId) {
    const ticketList = document.getElementById('ticket-list');
    if (ticketList) {
        const tickets = await apiFetch(`/ticket/event/${eventId}`, 'GET');
        displayTickets(ticketList, tickets, eventId, false, true);
    }
}

// Delete ticket
async function deleteTicket(ticketId, eventId) {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
        const response = await apiFetch(`/ticket/event/${eventId}/${ticketId}`, 'DELETE');

        if (response.success) {
            alert('Ticket deleted successfully!');
            refreshTicketList(eventId);
        } else {
            alert(`Failed to delete ticket: ${response.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error deleting ticket:', error);
        alert('An error occurred while deleting the ticket.');
    }
}

export { clearTicketForm, deleteTicket, editTicket };
