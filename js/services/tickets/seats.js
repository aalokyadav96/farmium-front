import { handlePurchase } from "../payment/paymentService.js";

// Dummy seat data
const dummySeats = [
    { seatId: "A1", status: "available" },
    { seatId: "A2", status: "available" },
    { seatId: "A3", status: "locked" },  // Locked seat (not selectable)
    { seatId: "A4", status: "booked" },
    { seatId: "A5", status: "available" },
    { seatId: "B1", status: "available" },
    { seatId: "B2", status: "booked" },  // Already booked seat
    { seatId: "B3", status: "available" },
    { seatId: "B4", status: "available" },
    { seatId: "B5", status: "available" },
];

function showSeatSelection(ticketId, eventId, maxQuantity) {
    // let hasSeats = false;
    // if (!hasSeats) {
    //     handlePurchase("ticket", ticketId, eventId, maxQuantity);
    // }

    const modal = document.createElement("div");
    modal.classList.add("modal");

    modal.innerHTML = `
        <div class="modal-content">
            <h2>Select Your Seats</h2>
            <p>You can select up to <strong>${maxQuantity}</strong> seat(s).</p>
            <div id="seat-container" class="seat-container"></div>
            <p id="seat-message"></p>
            <button id="confirm-seats">Confirm Selection</button>
            <button id="close-modal">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);
    const seatContainer = modal.querySelector("#seat-container");
    const seatMessage = modal.querySelector("#seat-message");
    const confirmButton = modal.querySelector("#confirm-seats");
    const closeButton = modal.querySelector("#close-modal");

    let selectedSeats = [];

    // Render seats
    dummySeats.forEach(seat => {
        const seatElement = document.createElement("div");
        seatElement.classList.add("seat");
        seatElement.textContent = seat.seatId;

        if (seat.status === "available") {
            seatElement.classList.add("available");
            seatElement.addEventListener("click", () => toggleSeatSelection(seat, seatElement));
        } else if (seat.status === "locked") {
            seatElement.classList.add("locked");
        } else if (seat.status === "booked") {
            seatElement.classList.add("booked");
        }

        seatContainer.appendChild(seatElement);
    });

    function toggleSeatSelection(seat, seatElement) {
        if (selectedSeats.includes(seat.seatId)) {
            // Deselect seat
            selectedSeats = selectedSeats.filter(s => s !== seat.seatId);
            seatElement.classList.remove("selected");
        } else {
            if (selectedSeats.length >= maxQuantity) {
                seatMessage.textContent = `You can only select ${maxQuantity} seat(s).`;
                return;
            }
            // Select seat
            selectedSeats.push(seat.seatId);
            seatElement.classList.add("selected");
        }
        seatMessage.textContent = "";
    }

    // Confirm selection
    confirmButton.addEventListener("click", () => {
        // if (selectedSeats.length !== maxQuantity) {
        //     seatMessage.textContent = `You must select exactly ${maxQuantity} seat(s).`;
        //     return;
        // }
        document.body.removeChild(modal);
        handlePurchase("ticket", ticketId, eventId, selectedSeats.length, selectedSeats);
    });

    // Close modal
    closeButton.addEventListener("click", () => document.body.removeChild(modal));
}


export {showSeatSelection};