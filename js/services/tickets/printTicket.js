import Modal from '../../components/ui/Modal.mjs';
import { apiFetch } from '../../api/api';

const printTicketPDF = async (eventId, uniqueCode) => {
  try {
    const endpoint = `/ticket/print/${eventId}?uniqueCode=${encodeURIComponent(uniqueCode)}`;

    // Use apiFetch with blob response type
    const response = await apiFetch(endpoint, 'GET', null, { responseType: 'blob' });

    // const blob = await response.blob();
    const blob = response;

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

  const { close: closeFormModal } = Modal({
    title: 'Print Your Ticket',
    content: form,
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const uniqueCode = codeInput.value.trim();

    if (!uniqueCode) {
      alert('Please enter the Unique Code.');
      return;
    }

    const loadingText = document.createElement('p');
    loadingText.textContent = 'Printing your ticket...';

    const { close: closeLoadingModal } = Modal({
      title: 'Ticket Printing',
      content: loadingText,
    });

    const success = await printTicketPDF(eventId, uniqueCode);

    closeLoadingModal();
    closeFormModal();

    const resultContent = document.createElement('div');
    const resultText = document.createElement('p');
    resultText.textContent = success
      ? '✅ Your ticket has been downloaded.'
      : '❌ Failed to generate ticket. Please try again.';
    resultContent.appendChild(resultText);

    Modal({
      title: 'Ticket Result',
      content: resultContent,
    });
  });
};

export { printTicket, printTicketPDF };
