// Imports
import { apiFetch } from "../../api/api.js";
import Modal from "../../components/ui/Modal.mjs";
import { logActivity } from "../activity/activity_x.js";
import { createElement } from "../../components/createElement.js";

// --- Entity Configuration ---
const ENTITY_CONFIG = {
  ticket: {
    base: "event",
    apiPath: (eventId, ticketId) => `/ticket/event/${eventId}/${ticketId}/payment-session`,
    payload: (ticketId, eventId, quantity) => ({ ticketId, eventId, quantity }),
    confirmApiPath: (eventId, ticketId) => `/ticket/event/${eventId}/${ticketId}/confirm-purchase`,
    confirmPayload: (session) => ({
      ticketId: session.ticketId || session.ticketid,
      eventId: session.eventId || session.eventid,
      quantity: session.quantity
    })
  },
  merch: {
    base: "event",
    apiPath: (eventId, merchId) => `/merch/event/${eventId}/${merchId}/payment-session`,
    payload: (merchId, eventId, quantity) => ({ merchId, eventId, quantity }),
    confirmApiPath: (eventId, merchId) => `/merch/event/${eventId}/${merchId}/confirm-purchase`,
    confirmPayload: (session) => ({
      merchId: session.merchId,
      eventId: session.eventId,
      quantity: session.quantity
    })
  },
  menu: {
    base: "place",
    apiPath: (placeId, menuId) => `/places/menu/${placeId}/${menuId}/payment-session`,
    payload: (menuId, placeId, quantity) => ({ menuId, placeId, quantity }),
    confirmApiPath: (placeId, menuId) => `/places/menu/${placeId}/${menuId}/confirm-purchase`,
    confirmPayload: (session) => ({
      menuId: session.menuId,
      placeId: session.placeId,
      quantity: session.quantity
    })
  }
};

// --- Create Payment Session ---
async function createPaymentSession(type, itemId, eventId, quantity) {
  const config = ENTITY_CONFIG[type];
  if (!config) throw new Error(`Unsupported type: ${type}`);

  try {
    const response = await apiFetch(
      config.apiPath(eventId, itemId),
      "POST",
      JSON.stringify(config.payload(itemId, eventId, quantity)),
      { headers: { "Content-Type": "application/json" } }
    );

    if (response?.success && response.data) return response.data;
    throw new Error(response?.message || "Failed to create payment session.");
  } catch (err) {
    console.error("Error creating payment session:", err);
    alert(`Error: ${err.message}`);
    return null;
  }
}

// --- Show Payment Modal ---
function showPaymentModal(type, session, eventId, itemId, quantity) {
  const cardInput = createElement("input", { 
    type: "text", 
    id: "card-number", 
    name: "card-number", 
    placeholder: "Card Number (16 digits)", 
    maxLength: 16 
  });
  const expiryInput = createElement("input", { 
    type: "text", 
    id: "expiry-date", 
    name: "expiry-date", 
    placeholder: "MM/YY", 
    pattern: "^(0[1-9]|1[0-2])/?([0-9]{2})$" 
  });
  const cvvInput = createElement("input", { 
    type: "text", 
    id: "cvv", 
    name: "cvv", 
    placeholder: "CVV (3 digits)", 
    maxLength: 3, 
    pattern: "\\d{3}" 
  });
  const message = createElement("p", {}, ["Enter your card details to proceed."]);
  const submitBtn = createElement("button", { type: "submit" }, ["Submit"]);
  const form = createElement("form", {}, [cardInput, expiryInput, cvvInput, message, submitBtn]);

  let modalInstance;
  modalInstance = Modal({
    title: "Payment Information",
    content: form,
    autofocusSelector: "#card-number",
    onClose: () => {
      // optional cleanup
    }
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    submitBtn.disabled = true;

    const formData = new FormData(form);
    const card = (formData.get("card-number") || "").replace(/\s+/g, "");
    const expiry = (formData.get("expiry-date") || "").trim();
    const cvv = (formData.get("cvv") || "").trim();

    if (!/^\d{16}$/.test(card) || !/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry) || !/^\d{3}$/.test(cvv)) {
      message.textContent = "Please fill all fields correctly.";
      submitBtn.disabled = false;
      return;
    }

    message.textContent = "Processing payment...";
    const redirectTo = `/${ENTITY_CONFIG[type].base}/${eventId}`;

    const isDev = typeof process !== "undefined" && process.env?.NODE_ENV === "development";
    if (isDev) {
      setTimeout(() => {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} purchased! [Dev Mode]`);
        logActivity(`${type}_purchased`, { itemId, eventId, quantity });
        window.location.href = redirectTo;
      }, 500);
      return;
    }

    try {
      const config = ENTITY_CONFIG[type];
      const payload = { ...config.confirmPayload(session), quantity };
      const res = await apiFetch(
        config.confirmApiPath(eventId, itemId),
        "POST",
        JSON.stringify(payload),
        { headers: { "Content-Type": "application/json" } }
      );

      if (res?.success) {
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} purchased successfully!`);
        logActivity(`${type}_purchased`, { itemId, eventId, quantity });
        modalInstance.close();
        window.location.href = redirectTo;
      } else {
        throw new Error(res?.message || "Payment failed.");
      }
    } catch (err) {
      console.error(err);
      message.textContent = "Payment failed. Try again.";
      submitBtn.disabled = false;
    }
  });
}

// --- Unified Purchase Handler ---
export async function handlePurchase(type, itemId, eventId, maxQuantity, note = "") {
  const config = ENTITY_CONFIG[type];
  if (!config) {
    alert(`Unsupported purchase type: ${type}`);
    return;
  }

  const proceedPayment = async (quantity) => {
    const session = await createPaymentSession(type, itemId, eventId, quantity);
    if (session) showPaymentModal(type, session, eventId, itemId, quantity);
  };

  if (type === "menu") {
    // menu has no quantity form, just note
    return proceedPayment(maxQuantity);
  }

  // ticket/merch flow
  const label = createElement("label", { for: "quantity-input" }, ["Enter Quantity:"]);
  const input = createElement("input", {
    type: "number",
    id: "quantity-input",
    name: "quantity-input",
    min: 1,
    max: maxQuantity,
    value: 1
  });
  const wrapper = createElement("div", { class: "modal-form-group" }, [label, input]);

  let modalInstance;
  modalInstance = Modal({
    title: `Purchase ${type === "merch" ? "Merchandise" : "Ticket"}`,
    content: wrapper,
    autofocusSelector: "#quantity-input",
    actions: () => {
      const submitBtn = createElement("button", { 
        type: "button", 
        class: "modal-confirm" 
      }, ["Submit"]);

      submitBtn.addEventListener("click", () => {
        const quantity = parseInt(input.value, 10);
        if (isNaN(quantity) || quantity < 1 || quantity > maxQuantity) {
          alert(`Please enter a valid quantity (1-${maxQuantity}).`);
          return;
        }
        proceedPayment(quantity);
        modalInstance.close();
      });

      return submitBtn;
    },
    onClose: () => {
      // optional cleanup
    }
  });
}
