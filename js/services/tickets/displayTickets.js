import TicketCard from '../../components/ui/TicketCard.mjs';
import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { deleteTicket, editTicket } from "./editTicket.js";
import { showBuyTicketModal } from "./showBuy.js";
// import { showBuyTicketModal } from "./showBuyModal.js";
import { verifyTicketAndShowModal } from "./verifyTicket.js";
import { createButton } from "../../components/eventHelper.js";
import { addTicketForm } from './ticketService.js';
import { printTicket } from './printTicket.js';

function displayNewTicket(ticketData, ticketList) {
    const ticketItem = document.createElement("li");
    ticketItem.className = 'ticket-item';
    ticketItem.style.backgroundColor = ticketData.color || '#f3f3f3'; // Use color or default gray

    ticketItem.innerHTML = `
        <div class="hflex">
            <h3>Name: ${ticketData.name}</h3>
            <p>Price: ${ticketData.currency} ${(ticketData.price / 100).toFixed(2)}</p>
            <p>Available: ${ticketData.quantity}</p>
        </div>
        <div class="ticket-actions">
            <button class="edit-ticket-btn">Edit Ticket</button>
            <button class="delete-ticket-btn delete-btn">Delete Ticket</button>
        </div>
    `;

    ticketItem.querySelector('.edit-ticket-btn').addEventListener('click', () => editTicket(ticketData.ticketid, ticketData.eventid));
    ticketItem.querySelector('.delete-ticket-btn').addEventListener('click', () => deleteTicket(ticketData.ticketid, ticketData.eventid));

    ticketList.appendChild(ticketItem);
}

async function displayTickets(ticketLixt, ticketData, eventId, isCreator, isLoggedIn) {

    if (!Array.isArray(ticketData)) {
        throw new Error("Invalid ticket data received.");
    }

    ticketLixt.innerHTML = ""; // Clear existing content

    ticketLixt.appendChild(createElement('h2',"",["Tickets"]));
    
    // if (ticketData && !isCreator) {
    //     ticketLixt.appendChild(createButton({
    //         text: "Verify Your Ticket", classes: ["button"], events: {
    //             click: () => {
    //                 alert("hi");
    //             }
    //         }
    //     }))
    // };


    if (ticketData && (ticketData.length > 0 ) && !isCreator) {
        ticketLixt.appendChild(createButton({
            text: "Verify Your Ticket",
            classes: ["buttonx", "action-btn"],
            events: {
              click: () => {
                verifyTicketAndShowModal(eventId);
              },
            },
          }));
          

          ticketLixt.appendChild(createButton({
            text: "Print Your Ticket",
            classes: ["buttonx", "action-btn"],
            events: {
              click: () => {
                printTicket(eventId);
              },
            },
          }));
          
          ticketLixt.appendChild(createButton({
            text: "Cancel Ticket",
            classes: ["buttonx", "action-btn"],
            events: {
              click: () => {
                cancelTicket(eventId);
              },
            },
          }));
           
          ticketLixt.appendChild(createButton({
            text: "Transfer Ticket",
            classes: ["buttonx", "action-btn"],
            events: {
              click: () => {
                transferTicket(eventId);
              },
            },
          }));
          
        // ticketLixt.appendChild(createButton({
        //     text: "Verify Your Ticket", classes: ["button"], events: {
        //         click: (eventId) => {
        //             // alert("Ticket verification logic here!");
        //             verifyTicketAndShowModal(eventId);
        //         }
        //     }
        // }));
    
        // Check if user owns the ticket and has not already listed it for resale
        if (ticketData.isOwned && !ticketData.isResold) {
            ticketLixt.appendChild(createButton({
                text: "Resell Ticket", classes: ["button"], events: {
                    click: () => {
                        const resalePrice = prompt("Enter resale price:");
                        if (resalePrice) {
                            // Send resale request to the server
                            fetch('/api/resell-ticket', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    ticketId: ticketData.ticketId,
                                    price: resalePrice,
                                    userId: currentUser.id
                                })
                            })
                            .then(res => res.json())
                            .then(data => {
                                if (data.success) {
                                    alert("Ticket listed for resale!");
                                    ticketData.isResold = true; // Prevent multiple listings
                                } else {
                                    alert("Error listing ticket for resale.");
                                }
                            });
                        }
                    }
                }
            }));
        }
    }
    
    let ticketList = document.createElement('div');
    ticketList.className = ('hvflex gap20');


    try {
        // if (!Array.isArray(ticketData)) {
        //     throw new Error("Invalid ticket data received.");
        // }

        if (isCreator) {
            const button = Button("Add Tickets", "add-ticket-btn", {
                click: () => addTicketForm(eventId, ticketList),
                mouseenter: () => console.log("Button hovered"),
            });

            ticketLixt.appendChild(button);
        }

        if (ticketData.length > 0) {
            ticketData.forEach((ticket) => {
                const card = TicketCard({
                    isl: isLoggedIn,
                    seatstart: ticket.seatstart,
                    seatend: ticket.seatend,
                    creator: isCreator,
                    name: ticket.name,
                    price: `${ticket.currency} ${ticket.price}`,
                    quantity: ticket.quantity,
                    color: ticket.color,
                    attributes: {
                        "data-ticket-id": ticket.ticketid,
                    },
                    onClick: () => showBuyTicketModal(ticket.ticketid, eventId, ticket.quantity, isLoggedIn, isCreator),
                });

                if (isLoggedIn && isCreator) {
                    const editButton = Button("Edit", "edit-ticket-btn", {
                        click: () => editTicket(ticket.ticketid, eventId),
                        mouseenter: () => console.log("Edit hovered"),
                    });

                    const deleteButton = Button("Delete", "delete-ticket-btn", {
                        click: () => deleteTicket(ticket.ticketid, eventId),
                        mouseenter: () => console.log("Delete hovered"),
                    });
                    deleteButton.className = "delete-btn";

                    card.prepend(editButton);
                    card.prepend(deleteButton);
                }
                ticketList.appendChild(card);
            });
        } else {
            ticketList.appendChild(createElement("p", {}, ["No tickets available for this event."]));

            let seatcon = createElement("p", {}, []);

            ticketList.appendChild(seatcon);
        }
    } catch (error) {
        console.error("Error loading tickets:", error);
        ticketList.appendChild(createElement("p", { textContent: `Error loading tickets: ${error.message}` }));
    }
    ticketLixt.appendChild(ticketList);
}

function cancelTicket(eventid) {
    alert(`cancel ${eventid}`);
}

function transferTicket(eventid) {
    alert(`transfer ${eventid}`);
}

export { displayNewTicket, displayTickets };