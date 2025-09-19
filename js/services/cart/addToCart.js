import { apiFetch } from "../../api/api.js";
import Notify from "../../components/ui/Notify.mjs";

/**
 * Adds an item to the cart after validating login and input.
 *
 * @param {Object} params
 * @param {string} params.category — "crops", "product", or "tool"
 * @param {string} params.itemName — Item display name
 * @param {string} params.itemId   — Unique item ID
 * @param {string} params.unit     — e.g., "kg", "litre", "unit"
 * @param {string} params.entityName — Optional: farm, event, shop name
 * @param {string} params.entityId   — Optional: farm/event/shop id
 * @param {string} params.entityType — Optional: "farm", "event", "shop"
 * @param {number} params.quantity — Must be > 0
 * @param {number} params.price    — Price per unit
 * @param {boolean} params.isLoggedIn
 */
export async function addToCart({ category, itemName, itemId, itemType = "", unit = "unit", entityName = "", entityId = "", entityType = "", quantity, price, isLoggedIn }) {
  if (!isLoggedIn) {
    Notify("Please log in to add items to your cart", { type: "warning", duration: 3000 });
    return;
  }

  console.log("teyhtio",category, itemName, itemId, itemType, unit, entityName, entityId, entityType, quantity, price, isLoggedIn);

  if (!itemName || !itemId || quantity <= 0 || price <= 0) {
    Notify("Invalid item data", { type: "warning", duration: 3000 });
    return;
  }

  const payload = {
    category,
    itemName,
    itemId,
    itemType,
    unit,
    entityName,
    entityId,
    entityType,
    quantity,
    price
  };

  try {
    await apiFetch("/cart", "POST", JSON.stringify(payload));
    const label = `${quantity} ${unit} of ${itemName}`;
    Notify(`${label}${entityName ? ` from ${entityName}` : ""} added to cart`, { type: "success", duration: 3000 });
  } catch (err) {
    console.error("Add to cart failed:", err);
    Notify("Failed to add item to cart", { type: "error", duration: 3000 });
  }
}
