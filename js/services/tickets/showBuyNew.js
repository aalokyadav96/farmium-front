import { bookTicketNew } from "./bookTicketNew";
import { Button } from "../../components/base/Button.js";
import  Modal  from "../../components/ui/Modal.mjs";
import { createElement } from "../../components/createElement.js";


export function showBuyTicketModalNew(ticket, eventname, isLoggedIn, isCreator) {
    if (!isLoggedIn || isCreator) return;

    const modal = createElement("div", { id: "buy-ticket-modal", style: "padding:20px;border:1px solid #ccc;background:#fff;" }, [
        createElement("h3", {}, [`Buy Ticket`]),
        createElement("label", { for: "quantity-input" }, ["Quantity:"]),
        createElement("input", {
            id: "quantity-input",
            type: "number",
            min: "1",
            max: String(ticket.quantity),
            value: "1",
        }),
        Button("Confirm Purchase", "confirm-purchase-btn", {
            click: () => {
                const qtyInput = document.getElementById("quantity-input");
                const buyingQuantity = parseInt(qtyInput.value, 10);
                if (isNaN(buyingQuantity) || buyingQuantity < 1 || buyingQuantity > ticket.quantity) {
                    alert(`Please enter a valid Quantity (1 - ${ticket.quantity})`);
                    return;
                }
                bookTicketNew(ticket, eventname, buyingQuantity);
            },
        }),
        Button("Cancel", "cancel-btn", {
            click: () => modal.remove(),
        }),
    ]);

    Modal({title:"Buy Ticket", content: modal});
    // document.body.appendChild(modal);
}
