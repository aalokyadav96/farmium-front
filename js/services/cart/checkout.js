import { apiFetch } from "../../api/api.js";
import { displayPayment } from "./payment.js";

const previousAddresses = [
  "12A Palm Street, Jaipur, Rajasthan, 302001",
  "Flat 201, Green Residency, Mumbai, Maharashtra, 400062",
  "15 Sector 10, Hisar, Haryana, 125001"
];

function renderAddressForm(container, onSubmit) {
  const form = document.createElement("form");
  form.className = "address-form";
  form.innerHTML = `
    <h2>Delivery Details</h2>
    <label>
      <span>Enter Address:</span>
      <textarea required placeholder="Flat No, Street, City, State, ZIP" rows="3" class="address-input"></textarea>
      <div class="autocomplete-box"></div>
    </label>
    <label>
      <span>Coupon Code (optional):</span>
      <input type="text" class="coupon-input" placeholder="Enter coupon code" />
    </label>
    <button type="submit" class="primary-button">Proceed to Checkout</button>
  `;

  const addressInput = form.querySelector(".address-input");
  const autocompleteBox = form.querySelector(".autocomplete-box");

  addressInput.addEventListener("input", () => {
    const value = addressInput.value.trim().toLowerCase();
    autocompleteBox.innerHTML = "";
    if (!value) return;

    const matches = previousAddresses.filter(addr => addr.toLowerCase().includes(value));
    matches.forEach(match => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.textContent = match;
      item.onclick = () => {
        addressInput.value = match;
        autocompleteBox.innerHTML = "";
      };
      autocompleteBox.appendChild(item);
    });
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const address = addressInput.value.trim();
    const couponCode = form.querySelector(".coupon-input").value.trim();
    if (address) onSubmit(address, couponCode);
  };

  container.innerHTML = "";
  container.appendChild(form);
}

function calculateTotals(items, couponCode = "") {
  let subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discount = 0;

  if (couponCode.toLowerCase() === "save10") {
    discount = +(subtotal * 0.1).toFixed(2);
  }

  const tax = +((subtotal - discount) * 0.05).toFixed(2);
  const delivery = 20;
  const total = +(subtotal - discount + tax + delivery).toFixed(2);

  return { subtotal, discount, tax, delivery, total };
}

function buildSessionPayload(items, address, userId, total) {
  const grouped = {};
  items.forEach(item => {
    grouped[item.category] = grouped[item.category] || [];
    grouped[item.category].push(item);
  });

  return {
    userId,
    address,
    items: grouped,
    total
  };
}

function renderCartSummary(container, items, totals, onProceed) {
  const list = items.map(i => `
    <li>
      ${i.item} – ${i.quantity} ${i.unit || ""} ${i.farm ? `from ${i.farm}` : ""}
      <span class="price">₹${i.price * i.quantity}</span>
    </li>`).join("");

  container.innerHTML = `
    <section class="checkout-summary">
      <h2>Checkout Summary</h2>
      <ul>${list}</ul>
      <div class="summary-line">Subtotal: ₹${totals.subtotal}</div>
      ${totals.discount ? `<div class="summary-line">Discount: −₹${totals.discount}</div>` : ""}
      <div class="summary-line">Tax (5%): ₹${totals.tax}</div>
      <div class="summary-line">Delivery: ₹${totals.delivery}</div>
      <div class="summary-line total">Total: ₹${totals.total}</div>
      <button id="proceedPayment" class="primary-button">Proceed to Payment</button>
    </section>
  `;

  document.getElementById("proceedPayment").onclick = onProceed;
}

function renderError(container, error) {
  let message = "Something went wrong.";
  if (error.message?.includes("Network")) {
    message = "Network error. Check your connection.";
  } else if (error.response?.status === 500) {
    message = "Server error. Try again later.";
  }
  container.innerHTML = `<div class="error" role="alert">${message}</div>`;
}

export async function displayCheckout(container, passedItems = null) {
  container.innerHTML = "<p class='loading'>Loading your cart...</p>";

  try {
    const items = passedItems || await apiFetch("/cart", "GET");

    if (!items.length) {
      container.innerHTML = "<p class='empty'>Nothing to checkout</p>";
      return;
    }

    renderAddressForm(container, async (address, couponCode) => {
      const totals = calculateTotals(items, couponCode);

      renderCartSummary(container, items, totals, async () => {
        container.innerHTML = "<p class='loading'>Creating payment session...</p>";

        try {
          const userId = items[0]?.userId || "anonymous";
          const payload = buildSessionPayload(items, address, userId, totals.total);
          const session = await apiFetch("/checkout/session", "POST", JSON.stringify(payload));
          displayPayment(container, session);
        } catch (err) {
          renderError(container, err);
        }
      });
    });

  } catch (err) {
    renderError(container, err);
  }
}
