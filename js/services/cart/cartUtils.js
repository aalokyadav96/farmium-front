import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { displayCheckout } from "./checkout.js";

export function renderCartCategory({ cart, category, contentContainer, sectionTotals, updateGrandTotal, displayCheckout }) {
  const items = cart[category];
  const section = createElement("div", { class: "cart-category" });

  section.appendChild(createElement("h3", {}, [`${capitalize(category)} (${items.length})`]));

  const cardsContainer = createElement("div", { class: "cart-cards" });
  const subtotalDisplay = createElement("p");

  const checkoutBtn = Button(`Checkout ${category}`, "chutbtn", {
    click: () => displayCheckout(contentContainer, items)
  });

  section.appendChild(cardsContainer);
  section.appendChild(subtotalDisplay);
  section.appendChild(checkoutBtn);
  contentContainer.appendChild(section);

  renderItems();

  function renderItems() {
    cardsContainer.textContent = "";

    if (items.length === 0) {
      section.remove();
      delete cart[category];
      delete sectionTotals[category];
      updateGrandTotal();
      return;
    }

    items.forEach((item, index) => {
      cardsContainer.appendChild(createCard(item, index));
    });

    const subtotal = items.reduce((sum, x) => sum + x.price * x.quantity, 0);
    sectionTotals[category] = subtotal;
    updateGrandTotal();

    subtotalDisplay.replaceChildren(
      createElement("strong", {}, ["Subtotal:"]),
      ` ₹${subtotal}`
    );
  }

  function createCard(it, i) {
    const card = createElement("div", { class: "cart-card" }, [
      createElement("p", {}, [`Item: ${it.itemName}`]),
      ...(it.itemType ? [createElement("p", {}, [`Type: ${it.itemType}`])] : []),
      ...(it.entityName ? [createElement("p", {}, [`${it.entityType || "Entity"}: ${it.entityName}`])] : []),
      createElement("div", { class: "quantity-line" }, [
        createElement("span", {}, ["Qty:"]),
        Button("−", "rem-button", { click: () => updateQty(i, -1) }),
        createElement("span", { class: "quantity-value" }, [String(it.quantity)]),
        Button("+", "add-button", { click: () => updateQty(i, 1) })
      ]),
      createElement("p", {}, [`Price: ₹${it.price}`]),
      createElement("p", {}, [`Subtotal: ₹${it.price * it.quantity}`]),
      createElement("div", { class: "action-row" }, [
        Button("✕", "rem-button", {
          click: () => {
            items.splice(i, 1);
            syncCategory().then(renderItems);
          }
        }),
        Button("♡ Save for Later", "wishlist-btn", {
          click: () => alert(`Saved "${it.itemName}" for later!`)
        })
      ])
    ]);

    return card;
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

// import { apiFetch } from "../../api/api.js";
// import Button from "../../components/base/Button.js";
// import { createElement } from "../../components/createElement.js";
// import { displayCheckout } from "./checkout.js";

// export function renderCartCategory({ cart, category, contentContainer, sectionTotals, updateGrandTotal, displayCheckout }) {
//   const items = cart[category];
//   const section = createElement("div", { class: "cart-category" });

//   section.appendChild(createElement("h3", {}, [`${capitalize(category)} (${items.length})`]));

//   const cardsContainer = createElement("div", { class: "cart-cards" });
//   const subtotalDisplay = createElement("p");

//   const checkoutBtn = Button(`Checkout ${category}`, "chutbtn", {
//     click: () => displayCheckout(contentContainer, items)
//   });

//   section.appendChild(cardsContainer);
//   section.appendChild(subtotalDisplay);
//   section.appendChild(checkoutBtn);
//   contentContainer.appendChild(section);

//   renderItems();

//   function renderItems() {
//     cardsContainer.textContent = "";

//     if (items.length === 0) {
//       section.remove();
//       delete cart[category];
//       delete sectionTotals[category];
//       updateGrandTotal();
//       return;
//     }

//     items.forEach((item, index) => {
//       cardsContainer.appendChild(createCard(item, index));
//     });

//     const subtotal = items.reduce((sum, x) => sum + x.price * x.quantity, 0);
//     sectionTotals[category] = subtotal;
//     updateGrandTotal();

//     subtotalDisplay.replaceChildren(
//       createElement("strong", {}, ["Subtotal:"]),
//       ` ₹${subtotal}`
//     );
//   }

//   function createCard(it, i) {
//     const card = createElement("div", { class: "cart-card" }, [
//       createElement("p", {}, [`Item: ${it.itemName}`]),
//       ...(it.entityName ? [createElement("p", {}, [`${it.entityType || "Entity"}: ${it.entityName}`])] : []),
//       createElement("div", { class: "quantity-line" }, [
//         createElement("span", {}, ["Qty:"]),
//         Button("−", "rem-button", { click: () => updateQty(i, -1) }),
//         createElement("span", { class: "quantity-value" }, [String(it.quantity)]),
//         Button("+", "add-button", { click: () => updateQty(i, 1) })
//       ]),
//       createElement("p", {}, [`Price: ₹${it.price}`]),
//       createElement("p", {}, [`Subtotal: ₹${it.price * it.quantity}`]),
//       createElement("div", { class: "action-row" }, [
//         Button("✕", "rem-button", {
//           click: () => {
//             items.splice(i, 1);
//             syncCategory().then(renderItems);
//           }
//         }),
//         Button("♡ Save for Later", "wishlist-btn", {
//           click: () => alert(`Saved "${it.itemName}" for later!`)
//         })
//       ])
//     ]);

//     return card;
//   }

//   async function updateQty(i, delta) {
//     const item = items[i];
//     item.quantity = Math.max(1, item.quantity + delta);
//     await syncCategory();
//     renderItems();
//   }

//   async function syncCategory() {
//     try {
//       await apiFetch("/cart/update", "POST", JSON.stringify({ category, items }));
//     } catch (err) {
//       console.error(`Sync failed for ${category}:`, err);
//     }
//   }
// }

// function capitalize(str) {
//   return str[0].toUpperCase() + str.slice(1);
// }
