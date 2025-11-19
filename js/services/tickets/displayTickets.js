// tickets.js

import TicketCard from '../../components/ui/TicketCard.mjs';
import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { deleteTicket, editTicket } from "./editTicket.js";
import { addTicketForm } from './ticketService.js';
import { printTicket } from './printTicket.js';
import { handlePurchase } from '../payment/pay.js';
import { verifyTicketAndShowModal, cancelTicket, transferTicket } from "./ticketTransfer.js";
import { listMyTickets } from './listmyTickets.js';

export function displayNewTicket(ticketData, ticketList) {
    const ticketItem = createElement("li", {
        class: "ticket-item",
        style: `background-color: ${ticketData.color || '#f3f3f3'};`
    });

    const infoContainer = createElement("div", { class: "hflex" }, [
        createElement("h3", {}, [`Name: ${ticketData.name}`]),
        createElement("p", {}, [`Price: ${ticketData.currency} ${(ticketData.price / 100).toFixed(2)}`]),
        createElement("p", {}, [`Available: ${ticketData.quantity}`])
    ]);

    const actionsContainer = createElement("div", { class: "ticket-actions" });

    const editBtn = Button("Edit Ticket", "", { click: () => editTicket(ticketData.ticketid, ticketData.eventid) });
    const deleteBtn = Button("Delete Ticket", "", { click: () => deleteTicket(ticketData.ticketid, ticketData.eventid) }, "buttonx delete-btn");

    actionsContainer.append(editBtn, deleteBtn);
    ticketItem.append(infoContainer, actionsContainer);
    ticketList.appendChild(ticketItem);
}

export async function displayTickets(ticketContainer, tickets, eventId, eventName, isCreator, isLoggedIn) {
    ticketContainer.replaceChildren();

    ticketContainer.appendChild(createElement('h2', {}, ["Tickets"]));

    const actionsCon = createElement("div", { class: "hvflex" });
    ticketContainer.appendChild(actionsCon);

    if (!isCreator && tickets?.length > 0) {
        const actions = [
            { text: "Verify Your Ticket", click: () => verifyTicketAndShowModal(eventId) },
            { text: "Print Your Ticket", click: () => printTicket(eventId) },
            { text: "Cancel Ticket", click: () => cancelTicket(eventId) },
            { text: "Transfer Ticket", click: () => transferTicket(eventId) },
            { text: "My Tickets", click: () => listMyTickets(eventId) }
        ];
        // actions.forEach(a => ticketContainer.appendChild(Button(a.text, "", { click: a.click, classes: ["buttonx", "action-btn"] })));
        actions.forEach(a => actionsCon.appendChild(Button(a.text, "", { click: a.click }, "buttonx action-btn")));
    }

    const ticketListDiv = createElement("div", { class: "hvflex gap20" });

    if (isCreator) {
        const addBtn = Button("Add Tickets", "add-ticket-btn", { click: () => addTicketForm(eventId, ticketListDiv) }, "buttonx");
        ticketContainer.appendChild(addBtn);
    }

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
                onClick: () => showBuyTicketModal(ticket.ticketid, eventId, ticket.quantity, isLoggedIn, isCreator)
            });

            if (isCreator) {
                let hflcon = createElement("div", { class: "hflex-sb", style: "padding: 0 0.2rem 0 0.5rem;" }, []);
                const editBtn = Button("Edit", "", { click: () => editTicket(ticket.ticketid, eventId) }, "buttonx primary");
                const deleteBtn = Button("Delete", "", { click: () => deleteTicket(ticket.ticketid, eventId) }, "buttonx delete-btn");
                hflcon.append(editBtn, deleteBtn);
                card.append(hflcon);
            }

            if (!isCreator && ticket.isOwned && !ticket.isResold) {
                const resellBtn = Button("Resell Ticket", "", {
                    click: async () => {
                        const price = prompt("Enter resale price:");
                        if (!price) return;
                        try {
                            const res = await fetch('/api/resell-ticket', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ticketId: ticket.ticketid, price, userId: currentUser.id })
                            });
                            const data = await res.json();
                            alert(data.success ? "Ticket listed for resale!" : "Error listing ticket.");
                        } catch (err) {
                            console.error(err);
                            alert("Error listing ticket for resale.");
                        }
                    }
                });
                card.append(resellBtn);
            }

            ticketListDiv.appendChild(card);
        });
    } else {
        ticketListDiv.appendChild(createElement("p", {}, ["No tickets available for this event."]));
    }

    ticketContainer.appendChild(ticketListDiv);
}

// --- Buy Ticket Modal ---
export function showBuyTicketModal(ticketId, eventId, maxQuantity, isLoggedIn, isCreator) {
    if (!isLoggedIn || isCreator) return;

    handlePurchase("ticket", ticketId, eventId, maxQuantity);
}
