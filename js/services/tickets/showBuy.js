import { bookTicket } from "./bookTicket";
import { Button } from "../../components/base/Button.js";
import  Modal  from "../../components/ui/Modal.mjs";
import { createElement } from "../../components/createElement.js";


export function showBuyTicketModal(ticketId, eventId, maxQuantity, isLoggedIn, isCreator) {
    if (!isLoggedIn || isCreator) return;

    const modal = createElement("div", { id: "buy-ticket-modal", style: "padding:20px;border:1px solid #ccc;background:#fff;" }, [
        createElement("h3", {}, [`Buy Ticket`]),
        createElement("label", { for: "quantity-input" }, ["Quantity:"]),
        createElement("input", {
            id: "quantity-input",
            type: "number",
            min: "1",
            max: String(maxQuantity),
            value: "1",
        }),
        Button("Confirm Purchase", "confirm-purchase-btn", {
            click: () => {
                const qtyInput = document.getElementById("quantity-input");
                const quantity = parseInt(qtyInput.value, 10);
                if (isNaN(quantity) || quantity < 1 || quantity > maxQuantity) {
                    alert(`Please enter a valid quantity (1 - ${maxQuantity})`);
                    return;
                }
                bookTicket(ticketId, eventId, quantity);
            },
        }),
        Button("Cancel", "cancel-btn", {
            click: () => modal.remove(),
        }),
    ]);

    Modal({title:"Buy Ticket", content: modal});
    // document.body.appendChild(modal);
}
