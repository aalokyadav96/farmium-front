import { apiFetch } from "../../api/api.js";
import Toast from "../../components/ui/Toast.mjs"; // Adjust the import path as needed

export async function addToCart({ category, item, unit = "kg", farm, quantity, price, isLoggedIn }) {
  if (!isLoggedIn) {
    Toast("Please log in to add items to your cart", "error");
    return;
  }

  try {
    await apiFetch("/cart", "POST", JSON.stringify({ category, item, unit, farm, quantity, price }));
    Toast(`${quantity} ${unit} of ${item} from ${farm} added to cart`, "success");
  } catch (error) {
    console.error("Backend sync failed:", error);
    Toast("Something went wrong while adding to cart", "error");
  }
}

// import { apiFetch } from "../../api/api.js";

// export async function addToCart({ category, item, unit = "kg", farm, quantity, price, isLoggedIn, showToast }) {
//   if (!isLoggedIn) {
//     showToast?.("Please log in to add items to your cart");
//     return;
//   }

//   try {
//     await apiFetch("/cart", "POST", JSON.stringify({ category, item, unit, farm, quantity, price }));
//     showToast?.(`${quantity} ${unit} of ${item} from ${farm} added to cart`);
//   } catch (error) {
//     console.error("Backend sync failed:", error);
//     showToast?.("Something went wrong while adding to cart");
//   }
// }
