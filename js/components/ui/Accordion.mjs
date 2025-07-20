import "../../../css/ui/Accordion.css";

const Accordion = (sections = []) => {
  const container = document.createElement('div');
  container.className = 'accordion';

  sections.forEach(({ title, content }) => {
    const details = document.createElement('details');
    details.className = 'accordion-section';

    const summary = document.createElement('summary');
    summary.className = 'accordion-header';
    summary.textContent = title;

    const abody = document.createElement('div');
    abody.className = 'accordion-body';
    abody.innerHTML = content; // Ensure content is sanitized to prevent XSS

    details.appendChild(summary);
    details.appendChild(abody);
    container.appendChild(details);
  });

  return container;
};

export default Accordion;
export { Accordion };
