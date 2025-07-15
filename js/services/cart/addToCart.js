// src/ui/cart/addToCart.js
import { apiFetch } from "../../api/api.js";
import Toast from "../../components/ui/Toast.mjs"; // Adjust path if needed

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
  console.log("category", "item", "unit", "farm" , "farmid", "quantity", "price", "isLoggedIn");
  console.log(category, item, unit, farm , farmid, quantity, price, isLoggedIn);
  if (!isLoggedIn) {
    Toast("Please log in to add items to your cart", "error");
    return;
  }

  if (!item || quantity <= 0 || price <= 0) {
    Toast("Invalid item data", "error");
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
    Toast(`${label}${farm ? ` from ${farm}` : ""} added to cart`, "success");
  } catch (err) {
    console.error("Add to cart failed:", err);
    Toast("Failed to add item to cart", "error");
  }
}
