import Modal from '../../components/ui/Modal.mjs';
import { apiFetch } from '../../api/api';

// // Updated function to check ticket validity using apiFetch
// const checkTicketValidity = async (ticketId) => {
//   try {
//       // Endpoint to verify the ticket
//       const endpoint = `/ticket/verify/${ticketId}`;
      
//       // Make an API call using the apiFetch wrapper
//       const response = await apiFetch(endpoint, "GET");
      
//       // Assume the response contains an "isValid" field indicating ticket validity
//       if (response && response.isValid) {
//           console.log(`Ticket ${ticketId} is valid.`);
//           return true;
//       } else {
//           console.log(`Ticket ${ticketId} is not valid.`);
//           return false;
//       }
//   } catch (error) {
//       console.error(`Error verifying ticket ${ticketId}:`, error);
//       return false; // Default to false on error
//   }
// };

const checkTicketValidity = async (ticketId, eventId) => {
  try {
      // Construct the endpoint to verify the ticket
      // const endpoint = `/event/${eventId}/ticket/verify/${ticketId}`;
      const endpoint = `/api/ticket/verify/${eventId}/${ticketId}`;
      
      // Make an API call using the apiFetch wrapper
      const response = await apiFetch(endpoint, "GET");
      
      // Validate the response structure and ticket validity
      if (response && response.isValid) {
          console.log(`Ticket ${ticketId} for event ${eventId} is valid.`);
          return true;
      } else {
          console.warn(`Ticket ${ticketId} for event ${eventId} is not valid.`);
          return false;
      }
  } catch (error) {
      console.error(`Error verifying ticket ${ticketId} for event ${eventId}:`, error);
      return false; // Default to false in case of any errors
  }
};


// // Simulated function to check ticket validity
// const checkTicketValidity = (ticketId) => {
//   // For now, randomly approve or reject
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       const isValid = Math.random() > 0.5;
//       resolve(isValid);
//     }, 1000); // simulate network delay
//   });
// };


const verifyTicketAndShowModal = async (eventId) => {
  // Create form elements
  const form = document.createElement('form');
  const label = document.createElement('label');
  label.textContent = 'Enter Ticket ID:';
  label.setAttribute('for', 'ticket-id');

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'ticket-id';
  input.name = 'ticket-id';
  input.required = true;

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Verify Ticket';

  // Append elements to the form
  form.appendChild(label);
  form.appendChild(input);
  form.appendChild(submitButton);

  // Create a modal for the form
  const formModal = Modal({
    title: 'Verify Your Ticket',
    content: form,
    onClose: () => formModal.remove(),
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    const ticketId = input.value.trim(); // Get the entered ticket ID
    if (!ticketId) {
      alert('Please enter a valid Ticket ID.');
      return;
    }

    const loadingText = document.createElement('p');
    loadingText.textContent = 'Verifying your ticket...';

    // Show a loading modal
    const loadingModal = Modal({
      title: 'Ticket Verification',
      content: loadingText,
      onClose: () => loadingModal.remove(),
    });

    const isValid = await checkTicketValidity(ticketId, eventId);

    loadingModal.remove(); // Remove the loader modal
    formModal.remove(); // Close the form modal

    // Show result
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

// const verifyTicketAndShowModal = async (ticketId) => {
//   const loadingText = document.createElement('p');
//   loadingText.textContent = 'Verifying your ticket...';

//   const loadingModal = Modal({
//     title: 'Ticket Verification',
//     content: loadingText,
//     onClose: () => loadingModal.remove()
//   });

//   const isValid = await checkTicketValidity(ticketId);

//   loadingModal.remove(); // remove the loader

//   const resultContent = document.createElement('div');
//   const resultText = document.createElement('p');
//   resultText.textContent = isValid
//     ? '✅ Your ticket is valid!'
//     : '❌ Invalid ticket. Please contact support.';

//   resultContent.appendChild(resultText);

//   Modal({
//     title: 'Ticket Result',
//     content: resultContent,
//     onClose: () => document.querySelector('.modal')?.remove()
//   });
// };

// Example usage
// verifyTicketAndShowModal("ABC123");

export {verifyTicketAndShowModal};