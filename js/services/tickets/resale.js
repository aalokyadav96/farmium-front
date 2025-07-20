fetch('/api/get-tickets')
    .then(res => res.json())
    .then(tickets => {
        tickets.forEach(ticket => {
            const ticketElement = document.createElement("div");
            ticketElement.classList.add("ticket-card");
            ticketElement.innerHTML = `
                <h2>${ticket.name}</h2>
                <p>Price: ${ticket.isResold ? `Resale Price: $${ticket.resalePrice}` : `$${ticket.price}`}</p>
                <p>Available: ${ticket.available}</p>
            `;

            if (ticket.isResold) {
                const buyButton = createButton({
                    text: "Buy Resale Ticket",
                    classes: ["button"],
                    events: {
                        click: () => {
                            alert("Buying resale ticket logic here!");
                        }
                    }
                });
                ticketElement.appendChild(buyButton);
            }

            document.querySelector(".tickets-container").appendChild(ticketElement);
        });
    });
