import { addToCart } from "../cart/addToCart";

import {getState} from "../../state/state";


/**
 * Adds a ticket to the cart with the updated model.
 */
export function bookTicketNew(ticket, eventName, quantity) {
  addToCart({
    category: "tickets",
    itemName: ticket.name,
    itemId: ticket.ticketid,
    entityName: eventName,
    entityType: "event",
    entityId: ticket.entity_id,
    quantity,
    price: ticket.price,
    unit: "unit",
    isLoggedIn: Boolean(getState("token"))
  });
}