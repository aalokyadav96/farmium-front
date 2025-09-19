// src/ui/cart/cartPage.js
import { createElement } from "../../components/createElement.js";
import { renderCartCategory } from "./cartUtils.js";
import { apiFetch } from "../../api/api.js";
import { displayCheckout } from "./checkout.js";
import Button from "../../components/base/Button.js";

/**
 * Display the user's cart.
 * @param {HTMLElement} content Container to render cart into
 * @param {boolean} isLoggedIn Whether user is logged in
 */
export async function displayCart(content, isLoggedIn) {
  const container = createElement("div", { class: "cartpage" }, []);
  content.textContent = "";
  content.appendChild(container);

  if (!isLoggedIn) {
    return renderMessage(container, "Please log in to view your cart.");
  }

  let server;
  try {
    server = await apiFetch("/cart", "GET");
  } catch (err) {
    console.error("Cart fetch failed", err);
    return renderMessage(container, "Failed to load cart. Try again.");
  }

  const grouped = groupCartByCategory(server);
  const categories = Object.keys(grouped).filter(cat => grouped[cat].length);

  if (!categories.length) {
    return renderMessage(container, "Your cart is empty.");
  }

  container.textContent = "";
  container.append(
    createElement("button", { class: "back-button", onclick: () => history.back() }, ["← Back"]),
    createElement("h2", {}, ["Your Cart"])
  );

  const sectionTotals = {};
  const grandTotalText = createElement("h3", { class: "grand-total" });

  categories.forEach(cat => {
    renderCartCategory({
      cart: grouped,
      category: cat,
      sectionTotals,
      updateGrandTotal,
      displayCheckout,
      contentContainer: container
    });
  });

  const checkoutAllBtn = Button("Checkout All", "ckout-button", {
    click: () =>
      displayCheckout(container, Object.values(grouped).flat())
  });

  const grandBox = createElement("div", { class: "grand-box" }, [grandTotalText, checkoutAllBtn]);
  container.appendChild(grandBox);

  function updateGrandTotal() {
    const total = Object.values(sectionTotals).reduce((sum, val) => sum + val, 0);
    grandTotalText.textContent = `Grand Total: ₹${total}`;
  }

  updateGrandTotal();
}

/**
 * Group cart items by category and merge duplicates (same itemId & entityId)
 * @param {Object} cartData Backend cart response (object keyed by category)
 * @returns {Object} grouped cart
 */
function groupCartByCategory(cartData) {
  // Flatten object values into array
  const items = Object.values(cartData).flat();

  const raw = {};
  items.forEach(it => {
    const cat = it.category || "unknown";
    (raw[cat] = raw[cat] || []).push(it);
  });

  const grouped = {};
  for (const cat in raw) {
    const map = {};
    raw[cat].forEach(it => {
      const key = `${it.itemId}__${it.entityId || ""}`;
      if (!map[key]) map[key] = { ...it };
      else map[key].quantity += it.quantity;
    });
    grouped[cat] = Object.values(map);
  }

  return grouped;
}

function renderMessage(container, message) {
  container.textContent = "";
  container.appendChild(createElement("p", {}, [message]));
}
