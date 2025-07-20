import "../../../css/ui/TicketCard.css";
import { applyButtonColors, getContrastColor } from "../../utils/lumicolor.js";

const TicketCard = ({ isl, seatstart, seatend, creator, name, price, quantity, color, attributes = {}, onClick }) => {
  const card = document.createElement('div');
  card.className = 'ticket-card';
  
  // // card.style.borderColor = color || '#f3f3f3'; // Use color or default gray
  // card.style.borderColor = (color == "#ffffff") ? '#c4c4c4' : color ;

  card.style.borderColor = color;
  // card.style.boxShadow = "inset 3px 3px 3px #f3f3f3, 3px 3px 3px #f3f3f3";

  // Add attributes dynamically
  Object.entries(attributes).forEach(([key, value]) => {
    card.setAttribute(key, value);
  });

  const nameElement = document.createElement('h2');
  nameElement.textContent = name;

  const priceElement = document.createElement('p');
  // priceElement.textContent = `Price: $${(price / 100).toFixed(2)}`;
  priceElement.textContent = `Price: ${(price)}`;

  const availableElement = document.createElement('p');
  availableElement.className = 'availability'; // For easier updates
  availableElement.textContent = `Available: ${quantity}`;

  card.appendChild(nameElement);
  card.appendChild(priceElement);
  card.appendChild(availableElement);

  if (!creator && isl) {
    const button = document.createElement('button');
    // button.style.background = color || '#f3f3f3'; // Use color or default gray

    applyButtonColors(button, color);

    if (quantity > 0) {
      button.textContent = 'Buy Ticket';
      button.addEventListener('click', () => onClick(name, quantity));
    } else {
      button.textContent = 'Sold Out';
      button.style.backgroundColor = "#ddd";
      button.style.color = "#000";
      button.disabled = true;
    }
    card.appendChild(button);
  }

  return card;
};

export default TicketCard;
