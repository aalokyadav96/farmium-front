import { apiFetch } from "../../api/api.js";
import { displayPayment } from "./payment.js";

function renderAddressForm(container, onSubmit) {
  const form = document.createElement("form");
  form.className = "address-form";
  form.innerHTML = `
    <h2>Delivery Details</h2>
    <label>
      <span>Enter Address:</span>
      <textarea required placeholder="Flat No, Street, City, State, ZIP" rows="3" class="address-input"></textarea>
    </label>
    <button type="submit" class="primary-button">Proceed to Checkout</button>
  `;

  form.onsubmit = (e) => {
    e.preventDefault();
    const address = form.querySelector("textarea").value.trim();
    if (address) onSubmit(address);
  };

  container.innerHTML = "";
  container.appendChild(form);
}

function calculateTotals(items) {
  let subtotal = 0;
  items.forEach(item => {
    subtotal += item.price;
  });
  const tax = +(subtotal * 0.05).toFixed(2);
  const delivery = 20;
  const total = +(subtotal + tax + delivery).toFixed(2);
  return { subtotal, tax, delivery, total };
}

function buildSessionPayload(items, address, userId) {
  const grouped = {};
  items.forEach(item => {
    grouped[item.category] = grouped[item.category] || [];
    grouped[item.category].push(item);
  });

  const { subtotal, tax, delivery, total } = calculateTotals(items);

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
      ${i.item} – ${i.quantity} ${i.unit} from ${i.farm}
      <span class="price">₹${i.price}</span>
    </li>`).join("");

  container.innerHTML = `
    <section class="checkout-summary">
      <h2>Checkout Summary</h2>
      <ul>${list}</ul>
      <div class="summary-line">Subtotal: ₹${totals.subtotal}</div>
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

export async function displayCheckout(container) {
  container.innerHTML = "<p class='loading'>Loading your cart...</p>";
  try {
    const items = await apiFetch("/cart", "GET");
    if (!items.length) {
      container.innerHTML = "<p class='empty'>Nothing to checkout</p>";
      return;
    }

    renderAddressForm(container, async (address) => {
      const totals = calculateTotals(items);
      renderCartSummary(container, items, totals, async () => {
        container.innerHTML = "<p class='loading'>Creating payment session...</p>";
        try {
          const userId = items[0].userId;
          const payload = buildSessionPayload(items, address, userId);
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

// import { apiFetch } from "../../api/api.js";
// import { displayPayment } from "./payment.js";

// function getCartAsync() {
//   return new Promise(resolve => {
//     const cart = JSON.parse(localStorage.getItem("multiCart") || "{}");
//     resolve(cart);
//   });
// }

// function renderCartSummary(container, cartItems) {
//   const summary = cartItems.map(item => 
//     `<li>
//       <strong>${item.item}</strong> – ${item.quantity} ${item.unit} from ${item.farm} <span class="price">₹${item.price}</span>
//     </li>`
//   ).join("");

//   container.innerHTML = `
//     <section class="checkout-summary">
//       <h2>Checkout Summary</h2>
//       <ul>${summary}</ul>
//       <button id="proceedPayment" class="primary-button">Proceed to Payment</button>
//     </section>
//   `;
// }

// function renderError(container, error) {
//   let message = "Something went wrong.";
//   if (error.message?.includes("Network")) {
//     message = "Network error. Please check your internet connection.";
//   } else if (error.response?.status === 500) {
//     message = "Server error. Please try again later.";
//   }

//   container.innerHTML = `<div class="error" role="alert">${message}</div>`;
// }

// export async function displayCheckout(container) {
//   // const cart = await getCartAsync();
//   // if (!Object.keys(cart).length) {
//   //   container.innerHTML = "<p class='empty'>Nothing to checkout</p>";
//   //   return;
//   // }
//   container.innerHTML = "<p class='loading'>Loading checkout summary...</p>";

//   try {
//     const fullCart = await apiFetch("/cart", "GET");
//     if (!fullCart.length) {
//       container.innerHTML = "<p class='empty'>Nothing to checkout</p>";
//       return;
//     }
  
//     renderCartSummary(container, fullCart);
//     // [continue with event listener here...]
  
//   } catch (err) {
//     renderError(container, err);
//   }
  
//   container.innerHTML = "<p class='loading'>Loading checkout summary...</p>";

//   try {
//     const fullCart = await apiFetch("/cart", "GET");
//     renderCartSummary(container, fullCart);

//     document.getElementById("proceedPayment").addEventListener("click", async () => {
//       container.innerHTML = "<p class='loading'>Initiating payment...</p>";
//       try {
//         const session = await apiFetch("/checkout/session", "POST", JSON.stringify(fullCart));
//         displayPayment(container, session);
//       } catch (err) {
//         renderError(container, err);
//       }
//     });

//   } catch (err) {
//     renderError(container, err);
//   }
// }

// // import { apiFetch } from "../../api/api.js";
// // // import { createElement } from "./domUtils.js";
// // import { displayPayment } from "./payment.js";

// // export async function displayCheckout(container) {
// //   const cart = JSON.parse(localStorage.getItem("multiCart") || "{}");
// //   if (!Object.keys(cart).length) {
// //     container.innerHTML = "<p>Nothing to checkout</p>";
// //     return;
// //   }

// //   container.innerHTML = "<p>Processing checkout...</p>";

// //   try {
// //     const fullCart = await apiFetch("/cart", "GET");
// //     const session = await apiFetch("/checkout/session", "POST", JSON.stringify(fullCart));
// //     displayPayment(container, session);
// //   } catch (err) {
// //     console.error("Checkout failed", err);
// //     container.innerHTML = "<p>Checkout failed. Try again.</p>";
// //   }
// // }
