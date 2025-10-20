import { apiFetch } from "../../api/api.js";
import { clearTicketForm } from "./editTicket.js";
import { displayNewTicket } from "./displayTickets.js";
import Modal from "../../components/ui/Modal.mjs";
import Notify from "../../components/ui/Notify.mjs";
import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { createFormGroup } from "../../components/createFormGroup.js";

// Add ticket to the event
async function addTicket(eventId, ticketList) {
  const tickName = document.getElementById('ticket-name').value.trim();
  const tickPrice = parseFloat(document.getElementById('ticket-price').value);
  const tickQuantity = parseInt(document.getElementById('ticket-quantity').value);
  const tickColor = document.getElementById('ticket-color').value;
  const tickCurrency = document.getElementById('ticket-currency').value;
  const seatStart = parseInt(document.getElementById('seat-start').value);
  const seatEnd = parseInt(document.getElementById('seat-end').value);

  if (isNaN(seatStart) || isNaN(seatEnd) || seatStart > seatEnd) {
    Notify("Please enter a valid seat number range.", { type: "warning", dismissible: true, duration: 3000 });
    return;
  }

  if (!tickName || isNaN(tickPrice) || isNaN(tickQuantity) || !tickCurrency) {
    Notify("Please fill in all fields correctly.", { type: "warning", dismissible: true, duration: 3000 });
    return;
  }

  const formData = new FormData();
  formData.append('name', tickName);
  formData.append('price', tickPrice);
  formData.append('quantity', tickQuantity);
  formData.append('color', tickColor);
  formData.append('currency', tickCurrency);
  formData.append('seatStart', seatStart);
  formData.append('seatEnd', seatEnd);

  try {
    const response = await apiFetch(`/ticket/event/${eventId}`, 'POST', formData);

    if (response && response.ticketid) {
      Notify("Ticket added successfully!", { type: "success", duration: 3000, dismissible: true });
      displayNewTicket(response, ticketList);
      clearTicketForm();
    } else {
      Notify(`Failed to add ticket: ${response?.message || 'Unknown error'}`, { type: "error", dismissible: true });
    }
  } catch (error) {
    Notify(`Error adding ticket: ${error.message}`, { type: "error", dismissible: true });
    console.error(error);
  }
}

function addTicketForm(eventId, ticketList) {
  const form = createElement("form", { id: "add-ticket-form" });

  // Fields
  const fields = [
    { label: "Ticket Name", type: "text", id: "ticket-name", placeholder: "Ticket Name", required: true },
    { label: "Ticket Price", type: "number", id: "ticket-price", placeholder: "Ticket Price", required: true },
    { label: "Quantity Available", type: "number", id: "ticket-quantity", placeholder: "Quantity Available", required: true },
    { label: "Start Seat Number", type: "number", id: "seat-start", placeholder: "Start Seat Number" },
    { label: "End Seat Number", type: "number", id: "seat-end", placeholder: "End Seat Number" },
  ];

  fields.forEach(field => form.appendChild(createFormGroup(field)));

  // Currency
  const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];
  const currencySelect = createElement("select", { id: "ticket-currency", required: true });
  currencyOptions.forEach(currency =>
    currencySelect.appendChild(createElement("option", { value: currency }, [currency]))
  );
  const currencyGroup = createElement("div", { class: "form-group" }, [
    createElement("label", { for: "ticket-currency" }, ["Currency"]),
    currencySelect,
  ]);
  form.appendChild(currencyGroup);

  // Color
  const colorInput = createElement("input", { type: "color", id: "ticket-color", value: "#3498db" });
  const colorLabel = createElement("label", { for: "ticket-color" }, ["Choose Ticket Color: "]);
  colorLabel.appendChild(colorInput);
  form.appendChild(colorLabel);

  // Buttons
  const submitButton = Button("Add Ticket", "", {}, "buttonx");
  submitButton.type = "submit";

  let modalInstance;
  const cancelButton = Button("Cancel", "", {
    click: () => modalInstance.close(),
  }, "buttonx");

  form.append(submitButton, cancelButton);

  modalInstance = Modal({
    title: "Add Ticket",
    content: form,
  });

  // Form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTicket(eventId, ticketList);
    modalInstance.close();
  });
}

export { addTicketForm, addTicket, displayNewTicket };
