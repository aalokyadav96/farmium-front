import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { displayCheckout } from "./checkout.js";

/**
 * Render a single cart category section (e.g., "Crops", "Seeds", etc.)
 *
 * @param {Object} params
 * @param {Object} params.cart
 * @param {string} params.category
 * @param {HTMLElement} params.contentContainer
 * @param {Object} params.sectionTotals
 * @param {Function} params.updateGrandTotal
 * @param {Function} params.displayCheckout
 */
export function renderCartCategory({ cart, category, contentContainer, sectionTotals, updateGrandTotal, displayCheckout }) {
  const items = cart[category];
  if (!items || items.length === 0) return;

  const section = createElement("section", { class: "cart-category" });

  // Header with category name and count
  const header = createElement("div", { class: "cart-category-header" }, [
    createElement("h3", {}, [`${capitalize(category)} (${items.length})`]),
  ]);

  const cardsContainer = createElement("div", { class: "cart-cards" });
  const subtotalDisplay = createElement("p", { class: "cart-subtotal" });

  const checkoutBtn = Button(
    `Checkout ${capitalize(category)}`,
    "checkoutbtn",
    { click: () => displayCheckout(contentContainer, items) },
    "buttonx primary"
  );

  section.append(header, cardsContainer, subtotalDisplay, checkoutBtn);
  contentContainer.appendChild(section);

  renderItems();

  // ---------------- INTERNALS ----------------

  function renderItems() {
    cardsContainer.replaceChildren();

    if (items.length === 0) {
      section.remove();
      delete cart[category];
      delete sectionTotals[category];
      updateGrandTotal();
      return;
    }

    items.forEach((item, index) => cardsContainer.appendChild(createCard(item, index)));

    const subtotal = items.reduce((sum, x) => sum + x.price * x.quantity, 0);
    sectionTotals[category] = subtotal;
    updateGrandTotal();

    subtotalDisplay.replaceChildren(
      createElement("strong", {}, ["Subtotal: "]),
      `₹${subtotal}`
    );
  }

  function createCard(it, i) {
    const details = [
      createElement("p", {}, [`Item: ${it.itemName}`]),
    ];

    if (it.itemType)
      details.push(createElement("p", {}, [`Type: ${it.itemType}`]));

    if (it.entityName)
      details.push(
        createElement("p", {}, [`${it.entityType || "Entity"}: ${it.entityName}`])
      );

    const quantityLine = createElement("div", { class: "quantity-line" }, [
      createElement("span", {}, ["Qty:"]),
      Button("−", "rem-button", { click: () => updateQty(i, -1) }, "buttonx subtle"),
      createElement("span", { class: "quantity-value" }, [String(it.quantity)]),
      Button("+", "add-button", { click: () => updateQty(i, 1) }, "buttonx subtle"),
    ]);

    const pricing = [
      createElement("p", {}, [`Unit Price: ₹${it.price}`]),
      createElement("p", {}, [`Subtotal: ₹${it.price * it.quantity}`]),
    ];

    const actions = createElement("div", { class: "action-row" }, [
      Button("✕ Remove", "rem-button", {
        click: () => {
          items.splice(i, 1);
          syncCategory().then(renderItems);
        },
      }, "buttonx danger"),
      Button("♡ Save for Later", "wishlist-btn", {
        click: () => alert(`Saved "${it.itemName}" for later!`),
      }, "buttonx secondary"),
    ]);

    return createElement("div", { class: "cart-card" }, [
      createElement("div", { class: "cart-card-details" }, details),
      quantityLine,
      createElement("div", { class: "cart-card-pricing" }, pricing),
      actions,
    ]);
  }

  async function updateQty(i, delta) {
    const item = items[i];
    item.quantity = Math.max(1, item.quantity + delta);
    await syncCategory();
    renderItems();
  }

  async function syncCategory() {
    try {
      await apiFetch("/cart/update", "POST", JSON.stringify({ category, items }));
    } catch (err) {
      console.error(`Sync failed for ${category}:`, err);
    }
  }
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}
