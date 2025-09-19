// import "../../../css/ui/TicketCard.css";
import { applyButtonColors, getContrastColor } from "../../utils/lumicolor.js";

const TicketCard = ({ isl, seatstart, seatend, creator, name, price, quantity, color, attributes = {}, onClick }) => {
  const card = document.createElement('div');
  card.className = 'ticket-card';
  card.style.position = 'relative';
  card.style.display = 'flex';
  card.style.border = '1px solid #ddd';
  card.style.borderRadius = '12px';
  card.style.overflow = 'hidden';
  card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
  card.style.backgroundColor = '#fff';
  card.style.width = '300px';
  card.style.fontFamily = 'sans-serif';

  // Dynamic attributes
  Object.entries(attributes).forEach(([key, value]) => card.setAttribute(key, value));

  // Folded corner
  const corner = document.createElement('div');
  corner.style.position = 'absolute';
  corner.style.top = '0';
  corner.style.right = '0';
  corner.style.width = '30px';
  corner.style.height = '30px';
  corner.style.background = '#fff';
  corner.style.borderTopRightRadius = '12px';
  corner.style.clipPath = 'polygon(0 0, 100% 0, 100% 100%)';
  corner.style.boxShadow = '-2px 2px 2px rgba(0,0,0,0.1)';
  card.appendChild(corner);

  // Left color stripe with perforation effect
  const stripeContainer = document.createElement('div');
  stripeContainer.style.width = '16px';
  stripeContainer.style.position = 'relative';
  stripeContainer.style.backgroundColor = color;

  const perforation = document.createElement('div');
  perforation.style.position = 'absolute';
  perforation.style.top = '0';
  perforation.style.left = '50%';
  perforation.style.width = '1px';
  perforation.style.height = '100%';
  perforation.style.backgroundImage = `repeating-linear-gradient(to bottom, #fff 0 4px, transparent 4px 8px)`;
  stripeContainer.appendChild(perforation);

  card.appendChild(stripeContainer);

  // Main content
  const content = document.createElement('div');
  content.style.flex = '1';
  content.style.padding = '12px 16px';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.justifyContent = 'space-between';
  content.style.gap = '6px';

  // Ticket name
  const nameElement = document.createElement('h2');
  nameElement.textContent = name;
  nameElement.style.margin = 0;
  nameElement.style.fontSize = '1.1rem';
  nameElement.style.color = color;
  content.appendChild(nameElement);

  // Seats info
  if (seatstart && seatend) {
    const seats = document.createElement('p');
    seats.textContent = `Seats: ${seatstart} - ${seatend}`;
    seats.style.margin = 0;
    seats.style.fontSize = '0.85rem';
    seats.style.color = '#666';
    content.appendChild(seats);
  }

  // Price & availability
  const info = document.createElement('div');
  info.style.display = 'flex';
  info.style.justifyContent = 'space-between';
  info.style.alignItems = 'center';

  const priceElement = document.createElement('span');
  priceElement.textContent = `Price: ${price}`;
  priceElement.style.fontWeight = 'bold';
  priceElement.style.color = '#333';

  const availableElement = document.createElement('span');
  availableElement.textContent = `Available: ${quantity}`;
  availableElement.style.fontSize = '0.85rem';
  availableElement.style.color = '#666';

  info.appendChild(priceElement);
  info.appendChild(availableElement);
  content.appendChild(info);

  // Buy button
  if (!creator && isl) {
    const button = document.createElement('button');
    button.style.marginTop = '12px';
    button.style.padding = '8px 16px';
    button.style.borderRadius = '8px';
    button.style.fontWeight = 'bold';
    button.style.cursor = 'pointer';
    applyButtonColors(button, color);

    if (quantity > 0) {
      button.textContent = 'Buy Ticket';
      button.addEventListener('click', () => onClick(name, quantity));
    } else {
      button.textContent = 'Sold Out';
      button.style.backgroundColor = '#ddd';
      button.style.color = '#000';
      button.disabled = true;
    }

    content.appendChild(button);
  }

  card.appendChild(content);
  return card;
};

export default TicketCard;

// import "../../../css/ui/TicketCard.css";
// import { applyButtonColors, getContrastColor } from "../../utils/lumicolor.js";

// const TicketCard = ({ isl, seatstart, seatend, creator, name, price, quantity, color, attributes = {}, onClick }) => {
//   const card = document.createElement('div');
//   card.className = 'ticket-card';
//   card.style.display = 'flex';
//   card.style.border = '1px solid #ddd';
//   card.style.borderRadius = '12px';
//   card.style.overflow = 'hidden';
//   card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
//   card.style.backgroundColor = '#fff';
//   card.style.width = '300px';
//   card.style.fontFamily = 'sans-serif';
  
//   // Add dynamic attributes
//   Object.entries(attributes).forEach(([key, value]) => {
//     card.setAttribute(key, value);
//   });

//   // Left color stripe
//   const stripe = document.createElement('div');
//   stripe.style.width = '12px';
//   stripe.style.backgroundColor = color;
//   card.appendChild(stripe);

//   // Content container
//   const content = document.createElement('div');
//   content.style.flex = '1';
//   content.style.padding = '12px 16px';
//   content.style.display = 'flex';
//   content.style.flexDirection = 'column';
//   content.style.justifyContent = 'space-between';
//   content.style.gap = '8px';

//   // Ticket name
//   const nameElement = document.createElement('h2');
//   nameElement.textContent = name;
//   nameElement.style.margin = 0;
//   nameElement.style.fontSize = '1.1rem';
//   nameElement.style.color = color;
//   content.appendChild(nameElement);

//   // Seats info
//   if (seatstart && seatend) {
//     const seats = document.createElement('p');
//     seats.textContent = `Seats: ${seatstart} - ${seatend}`;
//     seats.style.margin = 0;
//     seats.style.fontSize = '0.85rem';
//     seats.style.color = '#666';
//     content.appendChild(seats);
//   }

//   // Price and availability container
//   const info = document.createElement('div');
//   info.style.display = 'flex';
//   info.style.justifyContent = 'space-between';
//   info.style.alignItems = 'center';

//   const priceElement = document.createElement('span');
//   priceElement.textContent = `Price: ${price}`;
//   priceElement.style.fontWeight = 'bold';
//   priceElement.style.color = '#333';

//   const availableElement = document.createElement('span');
//   availableElement.textContent = `Available: ${quantity}`;
//   availableElement.style.fontSize = '0.85rem';
//   availableElement.style.color = '#666';

//   info.appendChild(priceElement);
//   info.appendChild(availableElement);
//   content.appendChild(info);

//   // Action button
//   if (!creator && isl) {
//     const button = document.createElement('button');
//     button.style.marginTop = '12px';
//     button.style.padding = '8px 16px';
//     button.style.borderRadius = '8px';
//     button.style.fontWeight = 'bold';
//     button.style.cursor = 'pointer';
//     applyButtonColors(button, color);

//     if (quantity > 0) {
//       button.textContent = 'Buy Ticket';
//       button.addEventListener('click', () => onClick(name, quantity));
//     } else {
//       button.textContent = 'Sold Out';
//       button.style.backgroundColor = '#ddd';
//       button.style.color = '#000';
//       button.disabled = true;
//     }

//     content.appendChild(button);
//   }

//   card.appendChild(content);
//   return card;
// };

// export default TicketCard;

// // import "../../../css/ui/TicketCard.css";
// // import { applyButtonColors, getContrastColor } from "../../utils/lumicolor.js";

// // const TicketCard = ({ isl, seatstart, seatend, creator, name, price, quantity, color, attributes = {}, onClick }) => {
// //   const card = document.createElement('div');
// //   card.className = 'ticket-card';
// //   card.style.border = `2px solid ${color}`;
// //   card.style.borderRadius = '12px';
// //   card.style.padding = '16px';
// //   card.style.display = 'flex';
// //   card.style.flexDirection = 'column';
// //   card.style.alignItems = 'flex-start';
// //   card.style.gap = '8px';
// //   card.style.backgroundColor = '#fff';
// //   card.style.boxShadow = `0 4px 6px rgba(0,0,0,0.1)`;

// //   // Add dynamic attributes
// //   Object.entries(attributes).forEach(([key, value]) => {
// //     card.setAttribute(key, value);
// //   });

// //   // Ticket header with name and seats
// //   const header = document.createElement('div');
// //   header.style.display = 'flex';
// //   header.style.justifyContent = 'space-between';
// //   header.style.width = '100%';

// //   const nameElement = document.createElement('h2');
// //   nameElement.textContent = name;
// //   nameElement.style.margin = 0;
// //   nameElement.style.fontSize = '1.2rem';
// //   nameElement.style.color = color;

// //   const seatsElement = document.createElement('span');
// //   seatsElement.textContent = seatstart && seatend ? `Seats: ${seatstart}-${seatend}` : '';
// //   seatsElement.style.fontSize = '0.9rem';
// //   seatsElement.style.color = '#666';

// //   header.appendChild(nameElement);
// //   header.appendChild(seatsElement);
// //   card.appendChild(header);

// //   // Price and availability
// //   const info = document.createElement('div');
// //   info.style.display = 'flex';
// //   info.style.justifyContent = 'space-between';
// //   info.style.width = '100%';
// //   info.style.fontSize = '0.95rem';
// //   info.style.color = '#333';

// //   const priceElement = document.createElement('span');
// //   priceElement.textContent = `Price: ${price}`;

// //   const availableElement = document.createElement('span');
// //   availableElement.textContent = `Available: ${quantity}`;

// //   info.appendChild(priceElement);
// //   info.appendChild(availableElement);
// //   card.appendChild(info);

// //   // Action button
// //   if (!creator && isl) {
// //     const button = document.createElement('button');
// //     applyButtonColors(button, color);
// //     button.style.marginTop = '12px';
// //     button.style.padding = '8px 16px';
// //     button.style.borderRadius = '8px';
// //     button.style.cursor = 'pointer';
// //     button.style.fontWeight = 'bold';

// //     if (quantity > 0) {
// //       button.textContent = 'Buy Ticket';
// //       button.addEventListener('click', () => onClick(name, quantity));
// //     } else {
// //       button.textContent = 'Sold Out';
// //       button.style.backgroundColor = "#ddd";
// //       button.style.color = "#000";
// //       button.disabled = true;
// //     }
// //     card.appendChild(button);
// //   }

// //   return card;
// // };

// // export default TicketCard;

// // // import "../../../css/ui/TicketCard.css";
// // // import { applyButtonColors, getContrastColor } from "../../utils/lumicolor.js";

// // // const TicketCard = ({ isl, seatstart, seatend, creator, name, price, quantity, color, attributes = {}, onClick }) => {
// // //   const card = document.createElement('div');
// // //   card.className = 'ticket-card';
  
// // //   card.style.borderColor = color;
// // //   card.style.boxShadow = "inset 3px 3px 3px #f3f3f3, 3px 3px 3px #f3f3f3";

// // //   // Add attributes dynamically
// // //   Object.entries(attributes).forEach(([key, value]) => {
// // //     card.setAttribute(key, value);
// // //   });

// // //   const nameElement = document.createElement('h2');
// // //   nameElement.textContent = name;

// // //   const priceElement = document.createElement('p');
// // //   // priceElement.textContent = `Price: $${(price / 100).toFixed(2)}`;
// // //   priceElement.textContent = `Price: ${(price)}`;

// // //   const availableElement = document.createElement('p');
// // //   availableElement.className = 'availability'; // For easier updates
// // //   availableElement.textContent = `Available: ${quantity}`;

// // //   card.appendChild(nameElement);
// // //   card.appendChild(priceElement);
// // //   card.appendChild(availableElement);

// // //   if (!creator && isl) {
// // //     const button = document.createElement('button');
// // //     // button.style.background = color || '#f3f3f3'; // Use color or default gray

// // //     applyButtonColors(button, color);

// // //     if (quantity > 0) {
// // //       button.textContent = 'Buy Ticket';
// // //       button.addEventListener('click', () => onClick(name, quantity));
// // //     } else {
// // //       button.textContent = 'Sold Out';
// // //       button.style.backgroundColor = "#ddd";
// // //       button.style.color = "#000";
// // //       button.disabled = true;
// // //     }
// // //     card.appendChild(button);
// // //   }

// // //   return card;
// // // };

// // // export default TicketCard;
