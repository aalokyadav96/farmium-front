import { showSeatSelection } from "./seats.js";
// import { handlePurchase } from "../payment/paymentService.js";
import { handlePurchase } from "../payment/pay.js";

// function showBuyTicketModal(ticketId, eventId, quantity, isLoggedIn, isCreator) {
//     if (!isLoggedIn) {
//         alert("Please log in to purchase tickets.");
//         return;
//     }

//     let maxQuantity = 6;

//     if (maxQuantity <= 0) {
//         // alert("You need to buy at least one ticket to select seats.");
//         alert("You need to buy at least one ticket.");
//         return;
//     }

//     showSeatSelection(ticketId, eventId, maxQuantity);
// }


function showBuyTicketModal(ticketId, eventId, totalQuantity, isLoggedIn, isCreator) {
    let maxQuantity = 6;
    if(isLoggedIn) {
        handlePurchase("ticket", ticketId, eventId, maxQuantity, totalQuantity);
    }
}


export { showBuyTicketModal };