import Modal from '../../components/ui/Modal.mjs';
import { apiFetch } from '../../api/api';

const printTicketPDF = async (eventId, uniqueCode) => {
  try {
    const endpoint = `/ticket/print/${eventId}?uniqueCode=${encodeURIComponent(uniqueCode)}`;

    // Use apiFetch with blob response type
    const response = await apiFetch(endpoint, 'GET', null, { responseType: 'blob' });

    const blob = await response.blob();

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `ticket-${uniqueCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    console.error(`Error downloading ticket PDF:`, error);
    return false;
  }
};

const printTicket = async (eventId) => {
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
  submitButton.textContent = 'Print Ticket';

  form.append(codeLabel, codeInput, submitButton);

  const formModal = Modal({
    title: 'Print Your Ticket',
    content: form,
    onClose: () => formModal.remove(),
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const uniqueCode = codeInput.value.trim();

    if (!uniqueCode) {
      alert('Please enter both Ticket ID and Unique Code.');
      return;
    }

    const loadingText = document.createElement('p');
    loadingText.textContent = 'Printing your ticket...';

    const loadingModal = Modal({
      title: 'Ticket Printing',
      content: loadingText,
      onClose: () => loadingModal.remove(),
    });

    const success = await printTicketPDF(eventId, uniqueCode);

    loadingModal.remove();
    formModal.remove();

    const resultContent = document.createElement('div');
    const resultText = document.createElement('p');
    resultText.textContent = success
      ? 'Your ticket has been downloaded.'
      : 'Failed to generate ticket. Please try again.';
    resultContent.appendChild(resultText);

    Modal({
      title: 'Ticket Result',
      content: resultContent,
      onClose: () => document.querySelector('.modal')?.remove(),
    });
  });
};

export { printTicket };

// import Modal from '../../components/ui/Modal.mjs';
// import { apiFetch } from '../../api/api';

// const printTicketPDF = async (ticketId, eventId, uniqueCode) => {
//     try {
//       const endpoint = `/api/ticket/print/${eventId}/${ticketId}?uniqueCode=${encodeURIComponent(uniqueCode)}`;
  
//       // Use raw fetch for binary response
//       const response = await fetch(endpoint, {
//         method: 'GET',
//         headers: {
//           'Accept': 'application/pdf',
//         },
//       });
  
//       if (!response.ok) {
//         throw new Error(`Failed to fetch PDF: ${response.statusText}`);
//       }
  
//       const blob = await response.blob();
  
//       const downloadUrl = URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = downloadUrl;
//       link.download = `ticket-${ticketId}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       URL.revokeObjectURL(downloadUrl);
  
//       return true;
//     } catch (error) {
//       console.error(`Error downloading ticket PDF:`, error);
//       return false;
//     }
//   };
  

// const printTicket = async (eventId) => {
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

//   form.append(ticketLabel, ticketInput, codeLabel, codeInput, submitButton);

//   const formModal = Modal({
//     title: 'Print Your Ticket',
//     content: form,
//     onClose: () => formModal.remove(),
//   });

//   form.addEventListener('submit', async (e) => {
//     e.preventDefault();

//     const ticketId = ticketInput.value.trim();
//     const uniqueCode = codeInput.value.trim();

//     if (!ticketId || !uniqueCode) {
//       alert('Please enter both Ticket ID and Unique Code.');
//       return;
//     }

//     const loadingText = document.createElement('p');
//     loadingText.textContent = 'Printing your ticket...';

//     const loadingModal = Modal({
//       title: 'Ticket Printing',
//       content: loadingText,
//       onClose: () => loadingModal.remove(),
//     });

//     const success = await printTicketPDF(ticketId, eventId, uniqueCode);

//     loadingModal.remove();
//     formModal.remove();

//     const resultContent = document.createElement('div');
//     const resultText = document.createElement('p');
//     resultText.textContent = success ? 'Your ticket has been downloaded.' : 'Failed to generate ticket. Please try again.';
//     resultContent.appendChild(resultText);

//     Modal({
//       title: 'Ticket Result',
//       content: resultContent,
//       onClose: () => document.querySelector('.modal')?.remove(),
//     });
//   });
// };

// export { printTicket };
