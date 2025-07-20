import { createElement } from "../../components/createElement.js";

function showBuyTicketModal(ticketId, eventId, quantity, isLoggedIn, isCreator) {
    if (!isLoggedIn || isCreator) return;

    // Remove existing modal if open
    const existingModal = document.getElementById('buy-ticket-modal');
    if (existingModal) existingModal.remove();

    // Create modal container
    const modal = createElement("div", { id: "buy-ticket-modal", className: "modal-overlay" });

    const modalContent = createElement("div", { className: "modal-content" });
    const title = createElement("h2", {}, ["Select a Seat"]);

    const seatList = createElement("div", { className: "seat-list" });

    // Fetch seat data for the ticket
    fetch(`/api/ticket/event/${eventId}/${ticketId}/seats`)
        .then(res => res.json())
        .then(data => {
            if (!data.success || !Array.isArray(data.seats)) {
                seatList.appendChild(createElement("p", {}, ["No seat info available."]));
                return;
            }

            data.seats.forEach(seat => {
                const seatBtn = createElement("button", {
                    className: "seat-btn",
                    "data-seat": seat,
                }, [seat]);

                seatBtn.addEventListener("click", () => {
                    document.querySelectorAll(".seat-btn.selected").forEach(btn => btn.classList.remove("selected"));
                    seatBtn.classList.add("selected");
                });

                seatList.appendChild(seatBtn);
            });
        })
        .catch(err => {
            console.error("Failed to load seats", err);
            seatList.appendChild(createElement("p", {}, ["Error loading seat data."]));
        });

    // Purchase button
    const buyButton = createElement("button", { className: "button" }, ["Buy Ticket"]);
    buyButton.addEventListener("click", () => {
        const selectedSeat = modal.querySelector(".seat-btn.selected")?.dataset?.seat;
        if (!selectedSeat) {
            alert("Please select a seat!");
            return;
        }

        fetch("/api/buy-ticket", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticketId,
                eventId,
                seat: selectedSeat
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Ticket purchased successfully!");
                modal.remove();
            } else {
                alert(data.message || "Purchase failed.");
            }
        })
        .catch(err => {
            console.error("Purchase error", err);
            alert("Error processing purchase.");
        });
    });

    // Close button
    const closeButton = createElement("button", { className: "modal-close" }, ["✖"]);
    closeButton.addEventListener("click", () => modal.remove());

    modalContent.append(title, seatList, buyButton, closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

export { showBuyTicketModal };
