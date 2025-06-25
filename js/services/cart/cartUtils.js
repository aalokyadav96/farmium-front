// cartCategory.js
import { apiFetch } from "../../api/api.js";
import { createElement } from "./domUtils.js";

/**
 * Render one cart category: tab button + panel with table, controls, and checkout.
 * - `cart` is the shared in-memory cart object.
 * - `updateGrandTotal` should recompute overall total.
 * - Removing all items auto-removes its tab/panel.
 */
export function renderCartCategory({
  cart,
  category,
  tabBar,
  tabPanels,
  sectionTotals,
  updateGrandTotal,
  displayCheckout,
  contentContainer
}) {
  const items = cart[category];

  // ——— Tab Button ———
  const tabBtn = createElement("button", {
    textContent: `${category[0].toUpperCase()}${category.slice(1)} (${items.length})`,
    className: tabBar.children.length === 0 ? "active" : "",
    onclick: () => activateTab()
  });
  tabBar.appendChild(tabBtn);

  // ——— Panel ———
  const panel = createElement("div", {
    className: "cart-panel",
    style: `display: ${tabBar.children.length === 1 ? "block" : "none"}`,
    "data-category": category
  });
  tabPanels.appendChild(panel);

  // Build table skeleton
  const table = createElement("table");
  const thead = createElement("thead");
  const headerRow = createElement("tr");
  const cols = ["Item", ...(category === "crops" ? ["Farm"] : []), "Qty", "Price", "Subtotal", ""];
  cols.forEach(c => headerRow.appendChild(createElement("th", { textContent: c })));
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = createElement("tbody");
  table.appendChild(tbody);

  // Subtotal + Checkout button
  const subtotalDisplay = createElement("p");
  const checkoutBtn = createElement("button", {
    textContent: `Checkout ${category}`,
    onclick: () => {
      apiFetch("/cart/checkout", "POST", JSON.stringify({ category, items }))
        .then(() => displayCheckout(contentContainer))
        .catch(e => console.error("Checkout failed:", e));
    }
  });

  panel.append(createElement("div", { className: "cart-section" }, [
    table, subtotalDisplay, checkoutBtn
  ]));

  // ——— Sync helper ———
  async function syncCategory() {
    try {
      await apiFetch("/cart/update", "POST", JSON.stringify({ category, items }));
    } catch (err) {
      console.error(`Sync failed for ${category}:`, err);
    }
  }

  // ——— Render Rows ———
  function renderItems() {
    tbody.innerHTML = "";

    if (items.length === 0) {
      // Remove this category entirely
      delete cart[category];
      tabBar.removeChild(tabBtn);
      tabPanels.removeChild(panel);
      delete sectionTotals[category];
      updateGrandTotal();
      // activate first remaining tab
      if (tabBar.firstChild) {
        tabBar.firstChild.click();
      }
      return;
    }

    items.forEach((it, i) => {
      const row = createElement("tr");
      row.appendChild(createElement("td", { textContent: it.item }));
      if (category === "crops") {
        row.appendChild(createElement("td", { textContent: it.farm || "-" }));
      }

      // Quantity controls
      const dec = createElement("button", {
        textContent: "−",
        onclick: async () => {
          if (it.quantity > 1) {
            it.quantity--;
            await syncCategory();
            renderItems();
          }
        }
      });
      const inc = createElement("button", {
        textContent: "+",
        onclick: async () => {
          it.quantity++;
          await syncCategory();
          renderItems();
        }
      });
      const qtySpan = createElement("span", {
        textContent: it.quantity,
        className: "quantity-value"
      });
      const qtyCell = createElement("td", {}, [
        createElement("div", { className: "quantity-control" }, [dec, qtySpan, inc])
      ]);
      row.appendChild(qtyCell);

      // Price & subtotal
      row.appendChild(createElement("td", { textContent: `₹${it.price}` }));
      row.appendChild(createElement("td", { textContent: `₹${it.price * it.quantity}` }));

      // Remove button
      const rm = createElement("button", {
        textContent: "✕",
        onclick: async () => {
          items.splice(i, 1);
          await syncCategory();
          renderItems();
        }
      });
      row.appendChild(createElement("td", {}, [rm]));

      tbody.appendChild(row);
    });

    // update subtotal + grand total
    const sub = items.reduce((sum, x) => sum + x.price * x.quantity, 0);
    sectionTotals[category] = sub;
    subtotalDisplay.innerHTML = `<strong>Subtotal:</strong> ₹${sub}`;
    updateGrandTotal();

    // refresh tab label count
    tabBtn.textContent = `${category[0].toUpperCase()}${category.slice(1)} (${items.length})`;
  }

  function activateTab() {
    // show/hide panels
    tabPanels.querySelectorAll(".cart-panel").forEach(p => {
      p.style.display = p.dataset.category === category ? "block" : "none";
    });
    // update active class
    tabBar.querySelectorAll("button").forEach(b => {
      b.classList.toggle("active", b === tabBtn);
    });
  }

  // initial draw
  renderItems();
}

// import { apiFetch } from "../../api/api.js";

// /**
//  * Lightweight element creator.
//  */
// export function createElement(tag, attributes = {}, children = []) {
//   const el = document.createElement(tag);

//   for (const key in attributes) {
//     const val = attributes[key];
//     if (key === "textContent") {
//       el.textContent = val;
//     } else if (key === "onclick") {
//       el.onclick = val;
//     } else if (key === "className") {
//       el.className = val;
//     } else if (key === "style") {
//       el.style.cssText = val;
//     } else {
//       el.setAttribute(key, val);
//     }
//   }

//   // append children
//   for (const child of (Array.isArray(children) ? children : [children])) {
//     if (child) el.appendChild(child);
//   }

//   return el;
// }

// /**
//  * Renders one category’s tab and panel, including 
//  * quantity controls, remove buttons, and checkout button.
//  */
// export function renderCartCategory({
//   cart,
//   category,
//   index,
//   tabBar,
//   tabPanels,
//   sectionTotals,
//   updateGrandTotal,
//   contentContainer,
//   displayCheckout
// }) {
//   const items = cart[category] || [];

//   // --- Tab button ---
//   const tabBtn = createElement("button", {
//     textContent: `${category[0].toUpperCase()}${category.slice(1)} (${items.length})`,
//     className: index === 0 ? "active" : "",
//     onclick: () => showTab(category, tabBtn)
//   });
//   tabBar.appendChild(tabBtn);

//   // --- Panel container ---
//   const panel = createElement("div", {
//     className: "cart-panel",
//     style: `display: ${index === 0 ? "block" : "none"}`,
//     "data-category": category
//   });

//   // Build table
//   const table = createElement("table");
//   const thead = createElement("thead");
//   const headerRow = createElement("tr");
//   const columns = ["Item", ...(category === "crops" ? ["Farm"] : []), "Qty", "Price", "Subtotal", ""];
//   for (const col of columns) {
//     headerRow.appendChild(createElement("th", { textContent: col }));
//   }
//   thead.appendChild(headerRow);
//   table.appendChild(thead);

//   const tbody = createElement("tbody");
//   table.appendChild(tbody);

//   // Subtotal display & Checkout button
//   const subtotalDisplay = createElement("p");
//   const checkoutBtn = createElement("button", {
//     textContent: `Checkout ${category}`,
//     onclick: () => {
//       apiFetch("/cart/checkout", "POST", JSON.stringify({ category, items }))
//         .then(() => displayCheckout(contentContainer))
//         .catch(err => console.error("Checkout failed:", err));
//     }
//   });

//   const section = createElement("div", { className: "cart-section" }, [
//     table,
//     subtotalDisplay,
//     checkoutBtn
//   ]);

//   panel.appendChild(section);
//   tabPanels.appendChild(panel);

//   // --- Functions to handle sync & UI updates ---

//   // Push the updated array for this category
//   function syncCategory() {
//     return apiFetch("/cart/update", "POST", JSON.stringify({
//       category,
//       items
//     })).catch(err => console.error(`Sync failed for ${category}:`, err));
//   }

//   function updateSubtotal() {
//     const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
//     sectionTotals[category] = subtotal;
//     subtotalDisplay.innerHTML = `<strong>Subtotal:</strong> ₹${subtotal}`;
//     updateGrandTotal();
//   }

//   // Render table rows
//   function renderItems() {
//     tbody.innerHTML = "";

//     if (items.length === 0) {
//       // remove empty category
//       delete cart[category];
//       // re-render entire cart (or you could choose to just remove this panel)
//       window.location.reload();
//       return;
//     }

//     items.forEach((entry, i) => {
//       const row = createElement("tr");

//       // Item name
//       row.appendChild(createElement("td", { textContent: entry.item }));

//       // Farm (only for crops)
//       if (category === "crops") {
//         row.appendChild(createElement("td", { textContent: entry.farm || "-" }));
//       }

//       // Quantity controls
//       const decBtn = createElement("button", {
//         textContent: "−",
//         onclick: async () => {
//           if (entry.quantity > 1) {
//             entry.quantity--;
//             await syncCategory();
//             renderItems();
//           }
//         }
//       });
//       const incBtn = createElement("button", {
//         textContent: "+",
//         onclick: async () => {
//           entry.quantity++;
//           await syncCategory();
//           renderItems();
//         }
//       });
//       const qtyVal = createElement("span", {
//         textContent: entry.quantity,
//         className: "quantity-value"
//       });
//       const qtyCell = createElement("td", {}, [
//         createElement("div", { className: "quantity-control" }, [decBtn, qtyVal, incBtn])
//       ]);
//       row.appendChild(qtyCell);

//       // Price & Subtotal columns
//       row.appendChild(createElement("td", { textContent: `₹${entry.price}` }));
//       row.appendChild(createElement("td", { textContent: `₹${entry.price * entry.quantity}` }));

//       // Remove button
//       const removeBtn = createElement("button", {
//         textContent: "✕",
//         onclick: async () => {
//           items.splice(i, 1);
//           await syncCategory();
//           renderItems();
//         }
//       });
//       row.appendChild(createElement("td", {}, [removeBtn]));

//       tbody.appendChild(row);
//     });

//     updateSubtotal();
//   }

//   // initial render
//   renderItems();

//   // Tab switcher
//   function showTab(tabId, clickedBtn) {
//     tabPanels.querySelectorAll(".cart-panel").forEach(panel => {
//       panel.style.display = panel.dataset.category === tabId ? "block" : "none";
//     });
//     tabBar.querySelectorAll("button").forEach(btn => {
//       btn.classList.toggle("active", btn === clickedBtn);
//     });
//   }
// }
