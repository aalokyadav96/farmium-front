// renderListingCard.js
import { createElement } from "../../../components/createElement";
import Button from "../../../components/base/Button";
import { navigate } from "../../../routes";
import { addToCart } from "../../cart/addToCart.js";

export function renderListingCard(listing, cropName, isLoggedIn) {
  let quantity = 1;

  const quantityDisplay = createElement("span", { class: "quantity-value" }, [quantity]);
  const incrementBtn = createElement("button", {}, ["+"]);
  const decrementBtn = createElement("button", {}, ["−"]);

  incrementBtn.onclick = () => {
    quantity++;
    quantityDisplay.textContent = quantity;
  };

  decrementBtn.onclick = () => {
    if (quantity > 1) {
      quantity--;
      quantityDisplay.textContent = quantity;
    }
  };

  const quantityWrapper = createElement("div", { class: "quantity-control" }, [
    decrementBtn, quantityDisplay, incrementBtn
  ]);

  const farmLink = createElement("a", { href: "#" }, [listing.farmName]);
  farmLink.onclick = e => {
    e.preventDefault();
    navigate(`/farm/${listing.farmId}`);
  };

  const handleAddToCart = () => {
    addToCart({
      category: "crops",
      item: cropName,
      farm: listing.farmName,
      quantity,
      price: listing.pricePerKg,
      unit: "kg",
      isLoggedIn
    });
  };

  return createElement("div", { class: "listing-card" }, [
    farmLink,
    createElement("p", {}, [`Location: ${listing.location}`]),
    createElement("p", {}, [`Breed: ${listing.breed}`]),
    createElement("p", {}, [`Price: ₹${listing.pricePerKg} per kg`]),
    createElement("label", {}, ["Quantity (kg):"]),
    quantityWrapper,
    Button("Add-To-Cart", "a2c-crop", { click: handleAddToCart })
  ]);
}

// import { createElement } from "../../../components/createElement";
// import Button from "../../../components/base/Button";
// import { navigate } from "../../../routes";
// import { showToast } from "./helpers";

// export function renderListingCard(listing, cropName, isLoggedIn) {
//   let quantity = 1;

//   const quantityDisplay = createElement("span", { class: "quantity-value" }, [quantity]);
//   const incrementBtn = createElement("button", {}, ["+"]);
//   const decrementBtn = createElement("button", {}, ["−"]);

//   incrementBtn.onclick = () => {
//     quantity++;
//     quantityDisplay.textContent = quantity;
//   };

//   decrementBtn.onclick = () => {
//     if (quantity > 1) {
//       quantity--;
//       quantityDisplay.textContent = quantity;
//     }
//   };

//   const quantityWrapper = createElement("div", { class: "quantity-control" }, [
//     decrementBtn, quantityDisplay, incrementBtn
//   ]);

//   const farmLink = createElement("a", { href: "#" }, [listing.farmName]);
//   farmLink.onclick = e => {
//     e.preventDefault();
//     navigate(`/farm/${listing.farmId}`);
//   };

//   const addToCart = () => {
//     if (!isLoggedIn) {
//       alert("Please log in to add items to your cart.");
//       return;
//     }

//     const stored = localStorage.getItem("multiCart");
//     const cart = stored ? JSON.parse(stored) : { crops: [], merchandise: [], tickets: [], menu: [] };
//     const key = `${cropName}__${listing.farmName}`;

//     const existing = cart.crops.find(item => `${item.item}__${item.farm}` === key);
//     if (existing) {
//       existing.quantity += quantity;
//     } else {
//       cart.crops.push({
//         item: cropName,
//         farm: listing.farmName,
//         quantity,
//         price: listing.pricePerKg
//       });
//     }

//     localStorage.setItem("multiCart", JSON.stringify(cart));
//     showToast(`${quantity} kg of ${cropName} from ${listing.farmName} added to cart`);
//   };

//   return createElement("div", { class: "listing-card" }, [
//     farmLink,
//     createElement("p", {}, [`Location: ${listing.location}`]),
//     createElement("p", {}, [`Breed: ${listing.breed}`]),
//     createElement("p", {}, [`Price: ₹${listing.pricePerKg} per kg`]),
//     createElement("label", {}, ["Quantity (kg):"]),
//     quantityWrapper,
//     Button("Add-To-Cart", "a2c-crop", { click: addToCart })
//   ]);
// }
