// tickets.js

import TicketCard from '../../components/ui/TicketCard.mjs';
import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { deleteTicket, editTicket } from "./editTicket.js";
import { verifyTicketAndShowModal } from "./verifyTicket.js";
import { addTicketForm } from './ticketService.js';
import { printTicket } from './printTicket.js';
import { handlePurchase } from '../payment/pay.js';

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
    const deleteBtn = Button("Delete Ticket", "", { click: () => deleteTicket(ticketData.ticketid, ticketData.eventid), classes: ["delete-btn"] });

    actionsContainer.append(editBtn, deleteBtn);
    ticketItem.append(infoContainer, actionsContainer);
    ticketList.appendChild(ticketItem);
}

export async function displayTickets(ticketContainer, tickets, eventId, eventName, isCreator, isLoggedIn) {
    ticketContainer.replaceChildren();

    ticketContainer.appendChild(createElement('h2', {}, ["Tickets"]));

    if (!isCreator && tickets?.length > 0) {
        const actions = [
            { text: "Verify Your Ticket", click: () => verifyTicketAndShowModal(eventId) },
            { text: "Print Your Ticket", click: () => printTicket(eventId) },
            { text: "Cancel Ticket", click: () => cancelTicket(eventId) },
            { text: "Transfer Ticket", click: () => transferTicket(eventId) }
        ];
        // actions.forEach(a => ticketContainer.appendChild(Button(a.text, "", { click: a.click, classes: ["buttonx", "action-btn"] })));
        actions.forEach(a => ticketContainer.appendChild(Button(a.text, "", { click: a.click}, "buttonx action-btn")));
    }

    const ticketListDiv = createElement("div", { class: "hvflex gap20" });

    if (isCreator) {
        const addBtn = Button("Add Tickets", "add-ticket-btn", { click: () => addTicketForm(eventId, ticketListDiv) });
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
                const editBtn = Button("Edit", "", { click: () => editTicket(ticket.ticketid, eventId) });
                const deleteBtn = Button("Delete", "", { click: () => deleteTicket(ticket.ticketid, eventId), classes: ["delete-btn"] });
                card.prepend(editBtn, deleteBtn);
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

// Placeholder actions
function cancelTicket(eventId) { alert(`Cancel ticket for event ${eventId}`); }
function transferTicket(eventId) { alert(`Transfer ticket for event ${eventId}`); }

// // tickets.js

// import TicketCard from '../../components/ui/TicketCard.mjs';
// import { Button } from "../../components/base/Button.js";
// import { createElement } from "../../components/createElement.js";
// import { deleteTicket, editTicket } from "./editTicket.js";
// import { verifyTicketAndShowModal } from "./verifyTicket.js";
// import { addTicketForm } from './ticketService.js';
// import { printTicket } from './printTicket.js';
// import { handlePurchase } from '../payment/pay.js';




// export function displayNewTicket(ticketData, ticketList) {
//     const ticketItem = createElement("li", { class: "ticket-item", style: `background-color: ${ticketData.color || '#f3f3f3'};` });

//     const infoContainer = createElement("div", { class: "hflex" }, [
//         createElement("h3", {}, [`Name: ${ticketData.name}`]),
//         createElement("p", {}, [`Price: ${ticketData.currency} ${(ticketData.price / 100).toFixed(2)}`]),
//         createElement("p", {}, [`Available: ${ticketData.quantity}`])
//     ]);

//     const actionsContainer = createElement("div", { class: "ticket-actions" });

//     const editBtn = Button("Edit Ticket", "", { click: () => editTicket(ticketData.ticketid, ticketData.eventid) });
//     const deleteBtn = Button("Delete Ticket", "", { click: () => deleteTicket(ticketData.ticketid, ticketData.eventid) });
//     deleteBtn.className = "delete-btn";

//     actionsContainer.append(editBtn, deleteBtn);
//     ticketItem.append(infoContainer, actionsContainer);
//     ticketList.appendChild(ticketItem);
// }

// export async function displayTickets(ticketContainer, tickets, eventId, eventName, isCreator, isLoggedIn) {
//     ticketContainer.replaceChildren(); // Clear container
//     ticketContainer.appendChild(createElement('h2', {}, ["Tickets"]));

//     // Non-creator actions (top buttons)
//     if (!isCreator && tickets?.length > 0) {
//         const actions = [
//             { text: "Verify Your Ticket", click: () => verifyTicketAndShowModal(eventId) },
//             { text: "Print Your Ticket", click: () => printTicket(eventId) },
//             { text: "Cancel Ticket", click: () => cancelTicket(eventId) },
//             { text: "Transfer Ticket", click: () => transferTicket(eventId) }
//         ];
//         actions.forEach(a => ticketContainer.appendChild(Button(a.text, "", { click: a.click, classes: ["buttonx", "action-btn"] })));
//     }

//     const ticketListDiv = createElement("div", { class: "hvflex gap20" });

//     // Creator can add tickets
//     if (isCreator) {
//         const addBtn = Button("Add Tickets", "add-ticket-btn", { click: () => addTicketForm(eventId, ticketListDiv) });
//         ticketContainer.appendChild(addBtn);
//     }

//     // Display ticket cards
//     if (tickets?.length > 0) {
//         tickets.forEach(ticket => {
//             const card = TicketCard({
//                 isl: isLoggedIn,
//                 seatstart: ticket.seatstart,
//                 seatend: ticket.seatend,
//                 creator: isCreator,
//                 name: ticket.name,
//                 price: `${ticket.currency} ${ticket.price}`,
//                 quantity: ticket.quantity,
//                 color: ticket.color,
//                 attributes: { "data-ticket-id": ticket.ticketid },
//                 onClick: () => showBuyTicketModal(ticket.ticketid, eventId, ticket.quantity, isLoggedIn, isCreator)
//             });

//             // Creator actions per ticket
//             if (isCreator) {
//                 const editBtn = Button("Edit", "", { click: () => editTicket(ticket.ticketid, eventId) });
//                 const deleteBtn = Button("Delete", "", { click: () => deleteTicket(ticket.ticketid, eventId) });
//                 deleteBtn.className = "delete-btn";
//                 card.prepend(editBtn, deleteBtn);
//             }

//             // Resell option for owned tickets
//             if (!isCreator && ticket.isOwned && !ticket.isResold) {
//                 const resellBtn = Button("Resell Ticket", "", {
//                     click: async () => {
//                         const price = prompt("Enter resale price:");
//                         if (!price) return;
//                         try {
//                             const res = await fetch('/api/resell-ticket', {
//                                 method: 'POST',
//                                 headers: { 'Content-Type': 'application/json' },
//                                 body: JSON.stringify({ ticketId: ticket.ticketid, price, userId: currentUser.id })
//                             });
//                             const data = await res.json();
//                             alert(data.success ? "Ticket listed for resale!" : "Error listing ticket.");
//                         } catch (err) {
//                             console.error(err);
//                             alert("Error listing ticket for resale.");
//                         }
//                     }
//                 });
//                 card.appendChild(resellBtn);
//             }

//             ticketListDiv.appendChild(card);
//         });
//     } else {
//         ticketListDiv.appendChild(createElement("p", {}, ["No tickets available for this event."]));
//     }

//     ticketContainer.appendChild(ticketListDiv);
// }

// // --- Buy Ticket Modal ---
// export function showBuyTicketModal(ticketId, eventId, maxQuantity, isLoggedIn, isCreator) {
//     if (!isLoggedIn || isCreator) return;

//     // Directly call handlePurchase; it will show quantity modal internally
//     handlePurchase("ticket", ticketId, eventId, maxQuantity);
// }


// // Placeholder actions
// function cancelTicket(eventId) { alert(`Cancel ticket for event ${eventId}`); }
// function transferTicket(eventId) { alert(`Transfer ticket for event ${eventId}`); }


// // import TicketCard from '../../components/ui/TicketCard.mjs';
// // import { Button } from "../../components/base/Button.js";
// // import { createElement } from "../../components/createElement.js";
// // import { deleteTicket, editTicket } from "./editTicket.js";
// // import { showBuyTicketModal } from "./showBuy.js";
// // import { verifyTicketAndShowModal } from "./verifyTicket.js";
// // import { createButton } from "../../components/eventHelper.js";
// // import { addTicketForm } from './ticketService.js';
// // import { printTicket } from './printTicket.js';

// // function displayNewTicket(ticketData, ticketList) {
// //     const ticketItem = createElement("li", { class: "ticket-item", style: `background-color: ${ticketData.color || '#f3f3f3'};` });

// //     const infoContainer = createElement("div", { class: "hflex" }, [
// //         createElement("h3", {}, [`Name: ${ticketData.name}`]),
// //         createElement("p", {}, [`Price: ${ticketData.currency} ${(ticketData.price / 100).toFixed(2)}`]),
// //         createElement("p", {}, [`Available: ${ticketData.quantity}`])
// //     ]);

// //     const actionsContainer = createElement("div", { class: "ticket-actions" });

// //     const editBtn = Button("Edit Ticket", "", { click: () => editTicket(ticketData.ticketid, ticketData.eventid) });
// //     const deleteBtn = Button("Delete Ticket", "", { click: () => deleteTicket(ticketData.ticketid, ticketData.eventid) });
// //     deleteBtn.className = "delete-btn";

// //     actionsContainer.append(editBtn, deleteBtn);
// //     ticketItem.append(infoContainer, actionsContainer);
// //     ticketList.appendChild(ticketItem);
// // }

// // async function displayTickets(ticketContainer, tickets, eventId, eventname, isCreator, isLoggedIn) {
// //     ticketContainer.replaceChildren(); // Clear container
// //     ticketContainer.appendChild(createElement('h2', {}, ["Tickets"]));

// //     // Non-creator actions
// //     if (!isCreator && tickets?.length > 0) {
// //         ticketContainer.append(
// //             createButton({ text: "Verify Your Ticket", classes: ["buttonx", "action-btn"], events: { click: () => verifyTicketAndShowModal(eventId) } }),
// //             createButton({ text: "Print Your Ticket", classes: ["buttonx", "action-btn"], events: { click: () => printTicket(eventId) } }),
// //             createButton({ text: "Cancel Ticket", classes: ["buttonx", "action-btn"], events: { click: () => cancelTicket(eventId) } }),
// //             createButton({ text: "Transfer Ticket", classes: ["buttonx", "action-btn"], events: { click: () => transferTicket(eventId) } })
// //         );

// //         tickets.forEach(ticket => {
// //             if (ticket.isOwned && !ticket.isResold) {
// //                 ticketContainer.append(createButton({
// //                     text: "Resell Ticket",
// //                     classes: ["button"],
// //                     events: {
// //                         click: () => {
// //                             const resalePrice = prompt("Enter resale price:");
// //                             if (resalePrice) {
// //                                 fetch('/api/resell-ticket', {
// //                                     method: 'POST',
// //                                     headers: { 'Content-Type': 'application/json' },
// //                                     body: JSON.stringify({ ticketId: ticket.ticketId, price: resalePrice, userId: currentUser.id })
// //                                 })
// //                                     .then(res => res.json())
// //                                     .then(data => data.success ? alert("Ticket listed for resale!") : alert("Error listing ticket for resale."));
// //                             }
// //                         }
// //                     }
// //                 }));
// //             }
// //         });
// //     }

// //     const ticketListDiv = createElement("div", { class: "hvflex gap20" });

// //     // Creator can add tickets
// //     if (isCreator) {
// //         const addButton = Button("Add Tickets", "add-ticket-btn", { click: () => addTicketForm(eventId, ticketListDiv) });
// //         ticketContainer.appendChild(addButton);
// //     }

// //     // Display ticket cards
// //     if (tickets?.length > 0) {
// //         tickets.forEach(ticket => {
// //             const card = TicketCard({
// //                 isl: isLoggedIn,
// //                 seatstart: ticket.seatstart,
// //                 seatend: ticket.seatend,
// //                 creator: isCreator,
// //                 name: ticket.name,
// //                 price: `${ticket.currency} ${ticket.price}`,
// //                 quantity: ticket.quantity,
// //                 color: ticket.color,
// //                 attributes: { "data-ticket-id": ticket.ticketid },
// //                 onClick: () => showBuyTicketModal(ticket.ticketid, eventId, ticket.quantity, isLoggedIn, isCreator),
// //                 // onClick: () => showBuyTicketModalNew(ticket, eventname, isLoggedIn, isCreator),
// //             });

// //             if (isCreator) {
// //                 const editButton = Button("Edit", "edit-ticket-btn", { click: () => editTicket(ticket.ticketid, eventId) });
// //                 const deleteButton = Button("Delete", "delete-ticket-btn", { click: () => deleteTicket(ticket.ticketid, eventId) });
// //                 deleteButton.className = "delete-btn";
// //                 card.prepend(editButton, deleteButton);
// //             }

// //             ticketListDiv.appendChild(card);
// //         });
// //     } else {
// //         ticketListDiv.appendChild(createElement("p", {}, ["No tickets available for this event."]));
// //     }

// //     ticketContainer.appendChild(ticketListDiv);
// // }

// // // Placeholder actions
// // function cancelTicket(eventId) { alert(`Cancel ticket for event ${eventId}`); }
// // function transferTicket(eventId) { alert(`Transfer ticket for event ${eventId}`); }

// // export { displayNewTicket, displayTickets };
