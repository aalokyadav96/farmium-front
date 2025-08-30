import TicketCard from '../../components/ui/TicketCard.mjs';
import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { deleteTicket, editTicket } from "./editTicket.js";
import { showBuyTicketModal } from "./showBuy.js";
import { verifyTicketAndShowModal } from "./verifyTicket.js";
import { createButton } from "../../components/eventHelper.js";
import { addTicketForm } from './ticketService.js';
import { printTicket } from './printTicket.js';

function displayNewTicket(ticketData, ticketList) {
    const ticketItem = createElement("li", { class: "ticket-item", style: `background-color: ${ticketData.color || '#f3f3f3'};` });

    const infoContainer = createElement("div", { class: "hflex" }, [
        createElement("h3", {}, [`Name: ${ticketData.name}`]),
        createElement("p", {}, [`Price: ${ticketData.currency} ${(ticketData.price / 100).toFixed(2)}`]),
        createElement("p", {}, [`Available: ${ticketData.quantity}`])
    ]);

    const actionsContainer = createElement("div", { class: "ticket-actions" });

    const editBtn = Button("Edit Ticket", "", { click: () => editTicket(ticketData.ticketid, ticketData.eventid) });
    const deleteBtn = Button("Delete Ticket", "", { click: () => deleteTicket(ticketData.ticketid, ticketData.eventid) });
    deleteBtn.className = "delete-btn";

    actionsContainer.append(editBtn, deleteBtn);
    ticketItem.append(infoContainer, actionsContainer);
    ticketList.appendChild(ticketItem);
}

async function displayTickets(ticketContainer, tickets, eventId, isCreator, isLoggedIn) {
    ticketContainer.innerHTML = ""; // Clear container
    ticketContainer.appendChild(createElement('h2', {}, ["Tickets"]));

    // Non-creator actions
    if (!isCreator && tickets?.length > 0) {
        ticketContainer.append(
            createButton({ text: "Verify Your Ticket", classes: ["buttonx", "action-btn"], events: { click: () => verifyTicketAndShowModal(eventId) } }),
            createButton({ text: "Print Your Ticket", classes: ["buttonx", "action-btn"], events: { click: () => printTicket(eventId) } }),
            createButton({ text: "Cancel Ticket", classes: ["buttonx", "action-btn"], events: { click: () => cancelTicket(eventId) } }),
            createButton({ text: "Transfer Ticket", classes: ["buttonx", "action-btn"], events: { click: () => transferTicket(eventId) } })
        );

        tickets.forEach(ticket => {
            if (ticket.isOwned && !ticket.isResold) {
                ticketContainer.append(createButton({
                    text: "Resell Ticket",
                    classes: ["button"],
                    events: {
                        click: () => {
                            const resalePrice = prompt("Enter resale price:");
                            if (resalePrice) {
                                fetch('/api/resell-ticket', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ticketId: ticket.ticketId, price: resalePrice, userId: currentUser.id })
                                })
                                .then(res => res.json())
                                .then(data => data.success ? alert("Ticket listed for resale!") : alert("Error listing ticket for resale."));
                            }
                        }
                    }
                }));
            }
        });
    }

    const ticketListDiv = createElement("div", { class: "hvflex gap20" });

    // Creator can add tickets
    if (isCreator) {
        const addButton = Button("Add Tickets", "add-ticket-btn", { click: () => addTicketForm(eventId, ticketListDiv) });
        ticketContainer.appendChild(addButton);
    }

    // Display ticket cards
    if (tickets?.length > 0) {
        tickets.forEach(ticket => {
            const card = TicketCard({
                isl: isLoggedIn,
                seatstart: ticket.seatstart,
                seatend: ticket.seatend,
                creator: isCreator,
                name: ticket.name,
                price: `${ticket.currency} ${ticket.price}`,
                quantity: ticket.quantity,
                color: ticket.color,
                attributes: { "data-ticket-id": ticket.ticketid },
                onClick: () => showBuyTicketModal(ticket.ticketid, eventId, ticket.quantity, isLoggedIn, isCreator),
            });

            if (isCreator) {
                const editButton = Button("Edit", "edit-ticket-btn", { click: () => editTicket(ticket.ticketid, eventId) });
                const deleteButton = Button("Delete", "delete-ticket-btn", { click: () => deleteTicket(ticket.ticketid, eventId) });
                deleteButton.className = "delete-btn";
                card.prepend(editButton, deleteButton);
            }

            ticketListDiv.appendChild(card);
        });
    } else {
        ticketListDiv.appendChild(createElement("p", {}, ["No tickets available for this event."]));
    }

    ticketContainer.appendChild(ticketListDiv);
}

// Placeholder actions
function cancelTicket(eventId) { alert(`Cancel ticket for event ${eventId}`); }
function transferTicket(eventId) { alert(`Transfer ticket for event ${eventId}`); }

export { displayNewTicket, displayTickets };
