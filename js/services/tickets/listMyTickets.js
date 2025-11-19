import { apiFetch } from "../../api/api.js";
import Datex from "../../components/base/Datex.js";
import { createElement } from "../../components/createElement.js";
import Modal from '../../components/ui/Modal.mjs';
import { printTicketPDF } from './printTicket.js'; // import your helper

export async function listMyTickets(eventid) {
    const container = createElement("div", {}, []);

    try {
        let tickets = await apiFetch(`/ticket/mytickets/${eventid}`, "GET");

        if (!tickets || tickets.length === 0) {
            container.appendChild(
                createElement("p", { style: "color:#888;font-style:italic;" }, ["No tickets found for this event."])
            );
        } else {
            // Sort tickets: Active → Transferred → Cancelled
            tickets.sort((a, b) => {
                const statusOrder = { "Active": 0, "Transferred": 1, "Cancelled": 2 };
                return statusOrder[a.status] - statusOrder[b.status];
            });

            tickets.forEach(ticket => {
                let statusText = ticket.status;
                let statusColor = "green";

                if (statusText === "Cancelled") statusColor = "red";
                else if (statusText === "Transferred") statusColor = "orange";

                // Action buttons
                const buttons = [];

                if (!ticket.canceled) {
                    const printBtn = createElement("button", {}, ["Print"]);
                    printBtn.addEventListener("click", () => printTicketPDF(eventid, ticket.uniqueCode));
                    buttons.push(printBtn);

                    const cancelBtn = createElement("button", {}, ["Cancel"]);
                    cancelBtn.addEventListener("click", async () => {
                        // call cancel API
                        const confirmed = confirm("Are you sure you want to cancel this ticket?");
                        if (!confirmed) return;
                        try {
                            await apiFetch(`/ticket/cancel/${eventid}`, "POST", { uniqueCode: ticket.uniqueCode });
                            alert("Ticket canceled successfully.");
                            // Optionally refresh modal
                            listMyTickets(eventid);
                        } catch (err) {
                            alert("Failed to cancel ticket.");
                        }
                    });
                    buttons.push(cancelBtn);

                    const transferBtn = createElement("button", {}, ["Transfer"]);
                    transferBtn.addEventListener("click", () => {
                        // Implement transfer modal here
                        alert("Transfer modal would open here.");
                    });
                    buttons.push(transferBtn);
                }

                const ticketBox = createElement("div", {
                    style: `
                        border:1px solid #ccc;
                        border-radius:8px;
                        padding:10px 14px;
                        margin-bottom:10px;
                        background:#fafafa;
                    `
                }, [
                    createElement("h4", { style: "margin:0 0 6px 0;" }, [`Ticket ID: ${ticket.ticketID}`]),
                    createElement("p", {}, [`Unique Code: ${ticket.uniqueCode}`]),
                    createElement("p", {}, [`Buyer: ${ticket.buyerName}`]),
                    // createElement("p", {}, [`Purchase Date: ${new Date(ticket.purchaseDate).toLocaleString()}`]),
                    createElement("p", {}, [`Purchase Date: ${Datex(ticket.purchaseDate)}`]),
                    createElement("p", { style: `color:${statusColor};font-weight:bold;` }, [`Status: ${statusText}`]),
                    ticket.canceled && ticket.refundStatus
                        ? createElement("p", { style: "color:#444;" }, [`Refund Status: ${ticket.refundStatus}`])
                        : null,
                    ticket.transferredTo
                        ? createElement("p", { style: "color:#444;" }, [`Transferred To: ${ticket.transferredTo}`])
                        : null,
                    buttons.length > 0 ? createElement("div", { style: "margin-top:8px;display:flex;gap:6px;" }, buttons) : null
                ]);

                container.appendChild(ticketBox);
            });
        }
    } catch (err) {
        console.error("Error fetching tickets:", err);
        container.appendChild(
            createElement("p", { style: "color:red;" }, ["Failed to load your tickets."])
        );
    }

    // Show modal
    Modal({
        title: "My Tickets",
        content: container,
        size: "large",
    });
}
