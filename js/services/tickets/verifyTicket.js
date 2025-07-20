
import Modal from '../../components/ui/Modal.mjs';
import { apiFetch } from '../../api/api';


const checkTicketValidity = async (eventId, uniqueCode) => {
  try {
      const endpoint = `/ticket/verify/${eventId}?uniqueCode=${encodeURIComponent(uniqueCode)}`;
      const response = await apiFetch(endpoint, "GET");

      if (response && response.isValid) {
          console.log(`Ticket for event ${eventId} with code ${uniqueCode} is valid.`);
          return true;
      } else {
          console.warn(`Ticket for event ${eventId} with code ${uniqueCode} is not valid.`);
          return false;
      }
  } catch (error) {
      console.error(`Error verifying ticket for event ${eventId}:`, error);
      return false;
  }
};
const verifyTicketAndShowModal = async (eventId) => {
  const form = document.createElement('form');
  form.className = "vflex";

  const codeLabel = document.createElement('label');
  codeLabel.textContent = 'Enter Unique Code:';
  codeLabel.setAttribute('for', 'unique-code');
  const codeInput = document.createElement('input');
  codeInput.type = 'text';
  codeInput.id = 'unique-code';
  codeInput.name = 'unique-code';
  codeInput.required = true;

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Verify Ticket';

  form.appendChild(codeLabel);
  form.appendChild(codeInput);
  form.appendChild(submitButton);

  const formModal = Modal({
    title: 'Verify Your Ticket',
    content: form,
    onClose: () => formModal.remove(),
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const uniqueCode = codeInput.value.trim();
    if (!uniqueCode) {
      alert('Please enter the Unique Code.');
      return;
    }

    const loadingText = document.createElement('p');
    loadingText.textContent = 'Verifying your ticket...';

    const loadingModal = Modal({
      title: 'Ticket Verification',
      content: loadingText,
      onClose: () => loadingModal.remove(),
    });

    const isValid = await checkTicketValidity(eventId, uniqueCode);

    loadingModal.remove();
    formModal.remove();

    const resultContent = document.createElement('div');
    const resultText = document.createElement('p');
    resultText.textContent = isValid
      ? '✅ Your ticket is valid!'
      : '❌ Invalid ticket. Please contact support.';
    resultContent.appendChild(resultText);

    Modal({
      title: 'Ticket Result',
      content: resultContent,
      onClose: () => document.querySelector('.modal')?.remove(),
    });
  });
};

export {verifyTicketAndShowModal};

// import Modal from '../../components/ui/Modal.mjs';
// import { apiFetch } from '../../api/api';


// const checkTicketValidity = async (ticketId, eventId, uniqueCode) => {
//   try {
//       // Construct the endpoint to verify the ticket with the unique code as a query parameter
//       const endpoint = `/ticket/verify/${eventId}/${ticketId}?uniqueCode=${encodeURIComponent(uniqueCode)}`;

//       // Make an API call using the apiFetch wrapper
//       const response = await apiFetch(endpoint, "GET");

//       // Validate the response structure and ticket validity
//       if (response && response.isValid) {
//           console.log(`Ticket ${ticketId} for event ${eventId} with code ${uniqueCode} is valid.`);
//           return true;
//       } else {
//           console.warn(`Ticket ${ticketId} for event ${eventId} with code ${uniqueCode} is not valid.`);
//           return false;
//       }
//   } catch (error) {
//       console.error(`Error verifying ticket ${ticketId} for event ${eventId}:`, error);
//       return false; // Default to false in case of any errors
//   }
// };


// const verifyTicketAndShowModal = async (eventId) => {
//   // Create form elements
//   const form = document.createElement('form');
//   form.className = "vflex";

//   const ticketLabel = document.createElement('label');
//   ticketLabel.textContent = 'Enter Ticket ID:';
//   ticketLabel.setAttribute('for', 'ticket-id');
//   const ticketInput = document.createElement('input');
//   ticketInput.type = 'text';
//   ticketInput.id = 'ticket-id';
//   ticketInput.name = 'ticket-id';
//   ticketInput.required = true;

//   const codeLabel = document.createElement('label');
//   codeLabel.textContent = 'Enter Unique Code:';
//   codeLabel.setAttribute('for', 'unique-code');
//   const codeInput = document.createElement('input');
//   codeInput.type = 'text';
//   codeInput.id = 'unique-code';
//   codeInput.name = 'unique-code';
//   codeInput.required = true;

//   const submitButton = document.createElement('button');
//   submitButton.type = 'submit';
//   submitButton.textContent = 'Verify Ticket';

//   // Append elements to the form
//   form.appendChild(ticketLabel);
//   form.appendChild(ticketInput);
//   form.appendChild(codeLabel);
//   form.appendChild(codeInput);
//   form.appendChild(submitButton);

//   // Create a modal for the form
//   const formModal = Modal({
//     title: 'Verify Your Ticket',
//     content: form,
//     onClose: () => formModal.remove(),
//   });

//   // Handle form submission
//   form.addEventListener('submit', async (e) => {
//     e.preventDefault(); // Prevent default form submission behavior

//     const ticketId = ticketInput.value.trim(); // Get the entered ticket ID
//     const uniqueCode = codeInput.value.trim(); // Get the entered unique code

//     if (!ticketId || !uniqueCode) {
//       alert('Please enter both Ticket ID and Unique Code.');
//       return;
//     }

//     const loadingText = document.createElement('p');
//     loadingText.textContent = 'Verifying your ticket...';

//     // Show a loading modal
//     const loadingModal = Modal({
//       title: 'Ticket Verification',
//       content: loadingText,
//       onClose: () => loadingModal.remove(),
//     });

//     const isValid = await checkTicketValidity(ticketId, eventId, uniqueCode);

//     loadingModal.remove(); // Remove the loader modal
//     formModal.remove(); // Close the form modal

//     // Show result
//     const resultContent = document.createElement('div');
//     const resultText = document.createElement('p');
//     resultText.textContent = isValid
//       ? '✅ Your ticket is valid!'
//       : '❌ Invalid ticket. Please contact support.';
//     resultContent.appendChild(resultText);

//     Modal({
//       title: 'Ticket Result',
//       content: resultContent,
//       onClose: () => document.querySelector('.modal')?.remove(),
//     });
//   });
// };

// export {verifyTicketAndShowModal};