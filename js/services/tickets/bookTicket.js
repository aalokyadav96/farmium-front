import { apiFetch } from "../../api/api";
import { handlePurchase } from "../payment/paymentService.js";

export function bookTicket(ticketId, eventId, quantity) {

    handlePurchase("ticket", "event", eventId, ticketId,quantity);

    // apiFetch(`/tickets/book`, "POST", {
    //     ticketId,
    //     eventId,
    //     quantity,
    // })
    //     .then((res) => {
    //         if (res.success) {
    //             alert("Ticket booked successfully.");
    //             document.getElementById("buy-ticket-modal").remove();
    //             // Optionally reload or update ticket list
    //         } else {
    //             alert(res.message || "Booking failed.");
    //         }
    //     })
    //     .catch(() => alert("An error occurred while booking."));
}
