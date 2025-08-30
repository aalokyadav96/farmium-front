
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
