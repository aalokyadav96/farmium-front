import Modal from "../../components/ui/Modal.mjs";
import { stripeFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";

import {STRIPE_PUB_KEY} from "./pubkey.js";

// Dynamic Stripe.js loader
let stripePromise = null;
function loadStripeJs(publishableKey) {
  if (stripePromise) return stripePromise;
  stripePromise = new Promise((resolve, reject) => {
    if (window.Stripe) return resolve(window.Stripe(publishableKey));
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = () => window.Stripe ? resolve(window.Stripe(publishableKey)) : reject(new Error("Stripe.js failed to load"));
    script.onerror = () => reject(new Error("Failed to load Stripe.js"));
    document.head.appendChild(script);
  });
  return stripePromise;
}


export async function payVia({ entityType, entityId, amount, currency = "usd", description = "", type = "fixed", options = [], allowCustom = false }) {
  const stripe = await loadStripeJs(STRIPE_PUB_KEY);

  let selectedAmount = amount; // <-- move to outer scope

  const modalContent = () => {
    const container = createElement("div", { id: "stripe-elements-container" });

    if (type === "voluntary") {
      const amountsContainer = createElement("div", { style: "margin-bottom:10px;" });
      options.forEach(opt => {
        const btn = createElement("button", { type: "button", style: "margin:0 5px;" }, [`$${(opt/100).toFixed(2)}`]);
        btn.addEventListener("click", () => {
          selectedAmount = opt; // now correctly updates outer variable
          amountsContainer.querySelectorAll("button").forEach(b => b.disabled = false);
          btn.disabled = true;
          if (customInput) customInput.value = "";
        });
        amountsContainer.appendChild(btn);
      });
      container.appendChild(amountsContainer);

      let customInput = null;
      if (allowCustom) {
        customInput = createElement("input", { type: "number", placeholder: "Custom amount $", min: 1, style: "margin-top:5px;width:100%;" });
        customInput.addEventListener("input", () => {
          const val = Math.round(parseFloat(customInput.value) * 100);
          if (!isNaN(val) && val > 0) selectedAmount = val;
        });
        container.appendChild(customInput);
      }
    }

    const cardDiv = createElement("div", { id: "card-element", style: "margin-bottom:10px;" });
    const messageDiv = createElement("div", { id: "payment-message", style: "color:red;margin-top:10px;" });
    container.append(cardDiv, messageDiv);

    return container;
  };

  const { close } = Modal({
    title: type === "fixed" ? "Complete Payment" : "Support Artist",
    content: modalContent,
    size: "small",
    returnDataOnClose: false,
    force: false,
    onOpen: async () => {
      const elements = stripe.elements();
      const card = elements.create("card");
      card.mount("#card-element");

      const payButton = createElement("button", { type: "button", style: "margin-top:10px;" }, ["Pay"]);
      const messageDiv = document.getElementById("payment-message");
      messageDiv.textContent = "";

      payButton.addEventListener("click", async () => {
        messageDiv.style.color = "black";
        messageDiv.textContent = "Processing payment...";
        payButton.disabled = true;

        try {
          const res = await stripeFetch("/create-payment-intent", "POST", {
            entityType,
            entityId,
            amount: type === "fixed" ? amount : selectedAmount,
            currency,
            description
          });

          if (!res.clientSecret) throw new Error("Failed to create payment intent");

          const { error, paymentIntent } = await stripe.confirmCardPayment(res.clientSecret, { payment_method: { card } });

          if (error) {
            messageDiv.style.color = "red";
            messageDiv.textContent = error.message;
            payButton.disabled = false;
          } else if (paymentIntent.status === "succeeded") {
            messageDiv.style.color = "green";
            messageDiv.textContent = "Payment successful!";
            await stripeFetch("/payment-success", "POST", {
              entityType,
              entityId,
              paymentIntentId: paymentIntent.id,
              amount: type === "fixed" ? amount : selectedAmount
            });
            setTimeout(() => close(), 1200);
          }
        } catch (err) {
          messageDiv.style.color = "red";
          messageDiv.textContent = "Payment failed. Try again.";
          console.error(err);
          payButton.disabled = false;
        }
      });

      document.getElementById("stripe-elements-container").appendChild(payButton);
    }
  });
}

/* 
USAGE EXAMPLE

import Button from "../../components/base/Button.js";
import { payVia } from "./payVia.js";

// Fixed price payment
const payBtn = Button("Pay $10", "pay-btn", {
  click: () => payVia({
    entityType: "order",
    entityId: "12345",
    amount: 1000, // cents
    description: "Order #12345",
    type: "fixed"
  })
}, "buttonx secondary");

// Voluntary funding with predefined amounts and custom input
const fundBtn = Button("Fund Artist", "fund-artist-btn", {
  click: () => payVia({
    entityType: "funding",
    entityId: "artist-5678",
    type: "voluntary",
    options: [500, 1000, 2000], // predefined amounts in cents
    allowCustom: true,
    description: "Support your favorite artist"
  })
}, "buttonx secondary");

document.body.append(payBtn, fundBtn);

*/