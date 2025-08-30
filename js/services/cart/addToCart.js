// src/ui/cart/addToCart.js
import { apiFetch } from "../../api/api.js";
import Notify from "../../components/ui/Notify.mjs"; // Adjust path if needed

/**
 * Adds an item to the cart after validating login and input.
 *
 * @param {Object} params
 * @param {string} params.category — "crops", "product", or "tool"
 * @param {string} params.item     — Item name
 * @param {string} params.unit     — e.g., "kg", "litre", "unit"
 * @param {string} params.farm     — Farm name (optional for tools/products)
 * @param {string} params.farmid     — Farm Id (optional for tools/products)
 * @param {number} params.quantity — Must be > 0
 * @param {number} params.price    — Price per unit
 * @param {boolean} params.isLoggedIn
 */
export async function addToCart({ category, item, unit = "unit", farm = "", farmid, quantity, price, isLoggedIn }) {
  console.log("category", "item", "unit", "farm", "farmid", "quantity", "price", "isLoggedIn");
  console.log(category, item, unit, farm, farmid, quantity, price, isLoggedIn);
  if (!isLoggedIn) {
    Notify("Please log in to add items to your cart", { type: "warning", duration: 3000 });
    return;
  }

  if (!item || quantity <= 0 || price <= 0) {
    Notify("Invalid item data", { type: "warning", duration: 3000 });
    return;
  }

  const payload = {
    category,
    item,
    unit,
    farm,
    farmid,
    quantity,
    price
  };

  try {
    await apiFetch("/cart", "POST", JSON.stringify(payload));
    const label = `${quantity} ${unit} of ${item}`;
    Notify(`${label}${farm ? ` from ${farm}` : ""} added to cart`, { type: "success", duration: 3000 });
  } catch (err) {
    console.error("Add to cart failed:", err);
    Notify("Failed to add item to cart", { type: "error", duration: 3000 });
  }
}
