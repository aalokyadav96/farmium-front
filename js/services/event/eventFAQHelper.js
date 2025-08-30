import { Button } from "../../components/base/Button.js";
import  Modal  from "../../components/ui/Modal.mjs";
import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js"; // Assuming you have these utility functions
import { Accordion } from "../../components/ui/Accordion.mjs";
// import { createFormGroup } from "../place/editPlace.js";
import { createFormGroup } from "../../components/createFormGroup.js";


async function displayEventFAQs(isCreator, faqContainer, eventId, faques) {
    faqContainer.innerHTML = ''; // Clear existing content
    faqContainer.appendChild(createElement('h2',"",["FAQs"]));
    // If the user is the creator, show the "Add FAQs" button
    if (isCreator) {
        const addFaqButton = Button("Add FAQs", "add-faq-btn", {
            click: () => showFaqForm(faqContainer, eventId),
        });
        faqContainer.appendChild(addFaqButton);
    }
    faqContainer.appendChild(Accordion(faques));
}

// Function to render a single FAQ item
function renderFaqItem(title, content, container) {
    const faqItem = createElement('div', { classes: ['faq-item'] });
    const faqTitle = createElement('h3', { textContent: title, classes: ['faq-title'] });
    const faqContent = createElement('p', { textContent: content, classes: ['faq-content'] });

    faqItem.appendChild(faqTitle);
    faqItem.appendChild(faqContent);
    container.appendChild(faqItem);
}


function showFaqForm(faqContainer, eventId) {
    // Prevent multiple modals
    if (document.getElementById("faq-form")) return;
  
    const form = createElement("form", { id: "faq-form", classes: ["faq-form"] });
  
    const questionGroup = createFormGroup({
      label: "FAQ Title",
      type: "text",
      id: "faq-title",
      placeholder: "Enter FAQ title",
      required: true,
      additionalProps: { className: "faq-input" }
    });
  
    const answerGroup = createFormGroup({
      label: "FAQ Content",
      type: "textarea",
      id: "faq-content",
      placeholder: "Enter FAQ content",
      required: true,
      additionalProps: { className: "faq-textarea" }
    });
  
    form.append(questionGroup, answerGroup);
  
    const submitButton = createElement("input", {
      type: "submit",
      value: "Add New FAQ",
      className: "submit-faq-btn buttonx"
    });
  
    form.appendChild(submitButton);
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      submitButton.disabled = true;
  
      const title = form.querySelector("#faq-title").value.trim();
      const content = form.querySelector("#faq-content").value.trim();
  
      if (!title || !content) {
        alert("Please fill out both fields.");
        submitButton.disabled = false;
        return;
      }
  
      try {
        const response = await apiFetch(`/events/event/${eventId}/faqs`, "POST", { title, content });
  
        if (response.success) {
          renderFaqItem(title, content, faqContainer);
          modal.remove();
        } else {
          alert("Failed to add FAQ. Please try again.");
        }
      } catch (error) {
        console.error("Failed to add FAQ:", error);
        alert("An error occurred while adding the FAQ.");
      } finally {
        submitButton.disabled = false;
      }
    });
  
    const modal = Modal({
      title: "Add New FAQ",
      content: form,
      onClose: () => modal.remove()
    });
  }
  
export { displayEventFAQs };
