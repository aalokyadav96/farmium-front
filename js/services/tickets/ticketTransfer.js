import Modal from '../../components/ui/Modal.mjs';
import { apiFetch } from '../../api/api';
import { createElement } from '../../components/createElement.js';
import { listMyTickets } from './listmyTickets.js';

// Generic function to handle ticket actions
const handleTicketAction = async (action, eventId) => {
  const form = createElement('form', { class: 'vflex' });

  const codeLabel = createElement('label', { for: 'unique-code' }, ['Enter Unique Code:']);
  const codeInput = createElement('input', { type: 'text', id: 'unique-code', name: 'unique-code', required: true });

  form.append(codeLabel, codeInput);

  let recipientInput;
  if (action === 'transfer') {
    const recipientLabel = createElement('label', { for: 'recipient' }, ['Enter Recipient Email or User ID:']);
    recipientInput = createElement('input', { type: 'text', id: 'recipient', name: 'recipient', required: true });
    form.append(recipientLabel, recipientInput);
  }

  const submitButton = createElement('button', { type: 'submit' }, [action.charAt(0).toUpperCase() + action.slice(1)]);
  form.append(submitButton);

  const { close: closeFormModal } = Modal({
    title: `${action.charAt(0).toUpperCase() + action.slice(1)} Your Ticket`,
    content: form,
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const uniqueCode = codeInput.value.trim();
    if (!uniqueCode) return alert('Please enter the Unique Code.');

    let recipient;
    if (action === 'transfer') {
      recipient = recipientInput.value.trim();
      if (!recipient) return alert('Please enter the recipient.');
    }

    const loadingText = createElement('p', {}, [`${action.charAt(0).toUpperCase() + action.slice(1)} in progress...`]);
    const { close: closeLoadingModal } = Modal({ title: `${action.charAt(0).toUpperCase() + action.slice(1)} Ticket`, content: loadingText });

    let success = false;
    try {
      if (action === 'verify') success = await checkTicketValidity(eventId, uniqueCode);
      if (action === 'cancel') success = await cancelTicketApi(eventId, uniqueCode);
      if (action === 'transfer') success = await transferTicketApi(eventId, uniqueCode, recipient);
    } catch (err) {
      console.error(`Error during ${action}:`, err);
      success = false;
    }

    closeLoadingModal();
    closeFormModal();

    const resultText = createElement('p', {}, [
      success
        ? `✅ Ticket ${action}ed successfully.`
        : `❌ Failed to ${action} ticket. Please check your details or contact support.`,
    ]);

    Modal({ title: `${action.charAt(0).toUpperCase() + action.slice(1)} Result`, content: createElement('div', {}, [resultText]) });
  });
};

// Exported functions
const verifyTicketAndShowModal = (eventId) => handleTicketAction('verify', eventId);
const cancelTicket = (eventId) => handleTicketAction('cancel', eventId);
const transferTicket = (eventId) => handleTicketAction('transfer', eventId);
const myTickets = (eventId) => listMyTickets(eventId);

// API Functions
const checkTicketValidity = async (eventId, uniqueCode) => {
  try {
    const endpoint = `/ticket/verify/${eventId}?uniqueCode=${encodeURIComponent(uniqueCode)}`;
    const response = await apiFetch(endpoint, 'GET');
    if (response?.isValid) {
      console.log(`Ticket for event ${eventId} with code ${uniqueCode} is valid.`);
      return true;
    } else {
      console.warn(`Ticket for event ${eventId} with code ${uniqueCode} is invalid.`);
      return false;
    }
  } catch (error) {
    console.error(`Error verifying ticket for event ${eventId}:`, error);
    return false;
  }
};

const cancelTicketApi = async (eventId, uniqueCode) => {
  try {
    const endpoint = `/ticket/cancel/${eventId}`;
    const response = await apiFetch(endpoint, 'POST', { uniqueCode });
    if (response?.success) return true;
    console.warn(`Failed to cancel ticket for event ${eventId}.`);
    return false;
  } catch (error) {
    console.error(`Error cancelling ticket for event ${eventId}:`, error);
    return false;
  }
};

const transferTicketApi = async (eventId, uniqueCode, recipient) => {
  try {
    const endpoint = `/ticket/transfer/${eventId}`;
    const response = await apiFetch(endpoint, 'POST', { uniqueCode, recipient });
    if (response?.success) return true;
    console.warn(`Failed to transfer ticket for event ${eventId} to recipient ${recipient}.`);
    return false;
  } catch (error) {
    console.error(`Error transferring ticket for event ${eventId}:`, error);
    return false;
  }
};

export { verifyTicketAndShowModal, cancelTicket, transferTicket };
