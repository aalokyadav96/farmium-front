import { createElement } from "./domUtils.js";
import { renderCartCategory } from "./cartUtils.js";
import { apiFetch } from "../../api/api.js";
import { displayCheckout } from "./checkout.js";

export async function displayCart(container, isLoggedIn) {
  if (!isLoggedIn) {
    container.innerHTML = "<p>Please log in to view your cart.</p>";
    return;
  }
  const grandTotalText = createElement("h3");
  // Fetch, bucket & merge same as before…
  const server = await apiFetch("/cart", "GET");
  const raw = {};
  server.forEach(it => {
    const cat = it.category || "crops";
    (raw[cat] = raw[cat] || []).push(it);
  });
  const cart = {};
  for (const cat in raw) {
    const m = {};
    raw[cat].forEach(it => {
      const key = cat === "crops" ? `${it.item}__${it.farm}` : it.item;
      if (!m[key]) m[key] = { ...it };
      else m[key].quantity += it.quantity;
    });
    cart[cat] = Object.values(m);
  }

  const cats = Object.keys(cart).filter(c => cart[c].length);
  if (!cats.length) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  // Build UI scaffold
  container.innerHTML = "";
  container.append(createElement("button", {
    textContent: "← Back",
    className: "back-button",
    onclick: () => window.history.back()
  }));
  container.append(createElement("h2", { textContent: "Your Cart" }));

  const tabBar = createElement("div", { className: "cart-tabs" });
  const tabPanels = createElement("div", { className: "cart-tab-panels" });
  const sectionTotals = {};

  // render categories
  cats.forEach(cat => {
    renderCartCategory({
      cart,
      category: cat,
      tabBar,
      tabPanels,
      sectionTotals,
      updateGrandTotal,
      displayCheckout,
      contentContainer: container
    });
  });

  // Grand total box
  const grandBox = createElement("div", {}, [
    grandTotalText,
    createElement("button", {
      textContent: "Checkout All",
      onclick: () => apiFetch("/cart/checkout", "POST", JSON.stringify(cart))
        .then(() => displayCheckout(container))
        .catch(e => console.error(e))
    })
  ]);

  container.append(tabBar, tabPanels, grandBox);

  function updateGrandTotal() {
    const total = Object.values(sectionTotals).reduce((a, b) => a + b, 0);
    grandTotalText.textContent = `Grand Total: ₹${total}`;
  }

  updateGrandTotal();
}


// import { displayCheckout } from "./checkout.js";
// import { apiFetch } from "../../api/api.js";
// import { createElement, renderCartCategory } from "./cartUtils.js";

// /**
//  * Renders the entire Cart view into `container`.
//  * Assumes a top-level <div id="app"></div> or similar.
//  */
// export async function displayCart(container, isLoggedIn) {
//   // 1) Guard: must be logged in
//   if (!isLoggedIn) {
//     container.innerHTML = "<p>Please log in to view your cart.</p>";
//     return;
//   }

//   // 2) Fetch raw items from server
//   let serverItems;
//   try {
//     serverItems = await apiFetch("/cart", "GET");
//   } catch (err) {
//     console.error("Failed to fetch cart:", err);
//     container.innerHTML = "<p>Unable to load cart right now.</p>";
//     return;
//   }

//   // 3) Bucket by category
//   const rawCart = {};
//   serverItems.forEach(item => {
//     const cat = item.category || "crops";
//     if (!rawCart[cat]) rawCart[cat] = [];
//     rawCart[cat].push(item);
//   });

//   // 4) Merge duplicates (same item+farm for crops)
//   const cart = {};
//   for (const cat in rawCart) {
//     const merged = {};
//     rawCart[cat].forEach(entry => {
//       const key = cat === "crops"
//         ? `${entry.item}__${entry.farm}`
//         : entry.item;
//       if (!merged[key]) merged[key] = { ...entry };
//       else merged[key].quantity += entry.quantity;
//     });
//     cart[cat] = Object.values(merged);
//   }

//   // 5) If empty, bail
//   const categories = Object.keys(cart).filter(c => cart[c].length > 0);
//   if (!categories.length) {
//     container.innerHTML = "<p>Your cart is empty.</p>";
//     return;
//   }

//   // 6) Clear & build static pieces
//   container.innerHTML = "";
//   const backBtn = createElement("button", {
//     textContent: "← Back",
//     className: "back-button",
//     onclick: () => window.history.back()
//   });
//   const title = createElement("h2", { textContent: "Your Cart" });
//   container.append(backBtn, title);

//   const tabBar = createElement("div", { className: "cart-tabs" });
//   const tabPanels = createElement("div", { className: "cart-tab-panels" });

//   // For totals
//   const sectionTotals = {};
//   const grandTotalText = createElement("h3");
//   const grandTotalBox = createElement("div", {}, [
//     grandTotalText,
//     createElement("button", {
//       textContent: "Checkout All",
//       onclick: () => {
//         apiFetch("/api/cart/checkout", "POST", JSON.stringify(cart))
//           .then(() => displayCheckout(container))
//           .catch(err => console.error("Checkout All failed:", err));
//       }
//     })
//   ]);

//   // 7) Render each category tab/panel
//   categories.forEach((cat, idx) => {
//     renderCartCategory({
//       cart,
//       category: cat,
//       index: idx,
//       tabBar,
//       tabPanels,
//       sectionTotals,
//       updateGrandTotal,
//       contentContainer: container,
//       displayCheckout
//     });
//   });

//   // 8) Attach to container
//   container.append(tabBar, tabPanels, grandTotalBox);

//   // 9) Grand total recompute
//   function updateGrandTotal() {
//     const total = Object.values(sectionTotals).reduce((sum, v) => sum + v, 0);
//     grandTotalText.textContent = `Grand Total: ₹${total}`;
//   }

//   // Kick off initial total
//   updateGrandTotal();
// }

// // import { displayCheckout } from "./checkout.js";
// // import { apiFetch } from "../../api/api.js";
// // import { createElement, renderCartCategory } from "./cartUtils.js";

// // export async function displayCart(contentContainer, isLoggedIn) {
// //   if (!isLoggedIn) {
// //     contentContainer.innerHTML = "<p>Please log in to view your cart.</p>";
// //     return;
// //   }

// //   let rawCart = {};

// //   try {
// //     const serverData = await apiFetch("/cart", "GET");
// //     serverData.forEach(item => {
// //       const category = item.category || "crops";
// //       if (!rawCart[category]) rawCart[category] = [];
// //       rawCart[category].push(item);
// //     });
// //   } catch (err) {
// //     console.error("Failed to fetch cart from server:", err);
// //     contentContainer.innerHTML = "<p>Unable to load cart right now.</p>";
// //     return;
// //   }

// //   const cart = {};
// //   for (const category in rawCart) {
// //     const merged = {};
// //     rawCart[category].forEach(entry => {
// //       const key = category === "crops" ? `${entry.item}__${entry.farm}` : entry.item;
// //       if (!merged[key]) {
// //         merged[key] = { ...entry };
// //       } else {
// //         merged[key].quantity += entry.quantity;
// //       }
// //     });
// //     cart[category] = Object.values(merged);
// //   }

// //   const categories = Object.keys(cart).filter(c => cart[c].length > 0);
// //   if (!categories.length) {
// //     contentContainer.innerHTML = "<p>Your cart is empty.</p>";
// //     return;
// //   }

// //   contentContainer.innerHTML = "";
// //   contentContainer.appendChild(createElement("button", {
// //     textContent: "← Back",
// //     className: "back-button",
// //     onclick: () => window.history.back()
// //   }));

// //   contentContainer.appendChild(createElement("h2", { textContent: "Your Cart" }));

// //   const tabBar = createElement("div", { className: "cart-tabs" });
// //   const tabPanels = createElement("div", { className: "cart-tab-panels" });
// //   const sectionTotals = {};
// //   const grandTotalText = createElement("h3");
// //   const grandTotalBox = createElement("div", {}, [grandTotalText]);

// //   categories.forEach((category, index) => {
// //     renderCartCategory({
// //       cart,
// //       category,
// //       index,
// //       tabBar,
// //       tabPanels,
// //       sectionTotals,
// //       updateGrandTotal,
// //       contentContainer,
// //       displayCheckout
// //     });
// //   });

// //   const allCheckoutBtn = createElement("button", {
// //     textContent: "Checkout All",
// //     onclick: () => {
// //       apiFetch("/cart/checkout", "POST", JSON.stringify(cart))
// //         .then(() => displayCheckout(contentContainer))
// //         .catch(err => console.error("Checkout failed:", err));
// //     }
// //   });

// //   grandTotalBox.appendChild(allCheckoutBtn);
// //   contentContainer.appendChild(tabBar);
// //   contentContainer.appendChild(tabPanels);
// //   contentContainer.appendChild(grandTotalBox);

// //   function updateGrandTotal() {
// //     const total = Object.values(sectionTotals).reduce((a, b) => a + b, 0);
// //     grandTotalText.textContent = `Grand Total: ₹${total}`;
// //   }
// // }
