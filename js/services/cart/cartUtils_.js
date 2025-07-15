
import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";

export function renderCartCategory({
  cart,
  category,
  contentContainer,
  sectionTotals,
  updateGrandTotal,
  displayCheckout
}) {
  const items = cart[category];
  const section = createElement("div", { className: "cart-category" });

  section.appendChild(createElement("h3", {}, [`${capitalize(category)} (${items.length})`]));

  const table = createElement("table");
  const tbody = createElement("tbody");
  const subtotalDisplay = createElement("p");

  table.appendChild(createTableHeader(category));
  table.appendChild(tbody);

  const checkoutBtn = Button(`Checkout ${category}`, "chutbtn", {
    // click: () =>
    // apiFetch("/cart/checkout", "POST", JSON.stringify({ category, items }))
    //   .then(() => displayCheckout(contentContainer))
    //   .catch(e => console.error("Checkout failed:", e))
    click: () =>
      displayCheckout(contentContainer, items)

  });

  section.appendChild(table);
  section.appendChild(subtotalDisplay);
  section.appendChild(checkoutBtn);
  contentContainer.appendChild(section);

  renderItems();

  function renderItems() {
    tbody.innerHTML = "";

    if (items.length === 0) {
      section.remove();
      delete cart[category];
      delete sectionTotals[category];
      updateGrandTotal();
      return;
    }

    items.forEach((item, index) => {
      tbody.appendChild(createRow(item, index));
    });

    const subtotal = items.reduce((sum, x) => sum + x.price * x.quantity, 0);
    sectionTotals[category] = subtotal;
    updateGrandTotal();

    subtotalDisplay.replaceChildren(
      createElement("strong", {}, ["Subtotal:"]),
      ` ₹${subtotal}`
    );
  }

  // function createRow(it, i) {
  //   const row = createElement("tr");

  //   row.appendChild(createElement("td", {}, [it.item]));
  //   if (category === "crops") row.appendChild(createElement("td", {}, [it.farm || "-"]));

  //   const decBtn = Button("−", "rem-button", {
  //     click: () => updateQty(i, -1)
  //   });
  //   const incBtn = Button("+", "add-button", {
  //     click: () => updateQty(i, 1)
  //   });
  //   const qtySpan = createElement("span", { className: "quantity-value" }, [String(it.quantity)]);
  //   const qtyCell = createElement("td", {}, [
  //     createElement("div", { className: "quantity-control" }, [decBtn, qtySpan, incBtn])
  //   ]);

  //   row.appendChild(qtyCell);
  //   row.appendChild(createElement("td", {}, [`₹${it.price}`]));
  //   row.appendChild(createElement("td", {}, [`₹${it.price * it.quantity}`]));

  //   const rmBtn = Button("✕", "rem-button", {
  //     click: () => {
  //       items.splice(i, 1);
  //       syncCategory().then(renderItems);
  //     }
  //   });

  //   const dummyBtn = Button("♡ Save for Later", "wishlist-btn", {
  //     click: () => alert(`Saved "${it.item}" for later!`)
  //   });

  //   row.appendChild(createElement("td", {}, [rmBtn, dummyBtn]));
  //   return row;
  // }

  function createRow(it, i) {
    const row = createElement("tr");

    row.appendChild(createElement("td", {}, [it.item]));

    if (category === "crops") {
      row.appendChild(createElement("td", {}, [it.farm || "-"]));
      row.appendChild(createElement("td", {}, [it.farmId || "-"]));
    }

    const decBtn = Button("−", "rem-button", {
      click: () => updateQty(i, -1)
    });

    const incBtn = Button("+", "add-button", {
      click: () => updateQty(i, 1)
    });

    const qtySpan = createElement("span", { class: "quantity-value" }, [String(it.quantity)]);
    const qtyCell = createElement("td", {}, [
      createElement("div", { class: "quantity-control" }, [decBtn, qtySpan, incBtn])
    ]);

    row.appendChild(qtyCell);
    row.appendChild(createElement("td", {}, [`₹${it.price}`]));
    row.appendChild(createElement("td", {}, [`₹${it.price * it.quantity}`]));

    const rmBtn = Button("✕", "rem-button", {
      click: () => {
        items.splice(i, 1);
        syncCategory().then(renderItems);
      }
    });

    const dummyBtn = Button("♡ Save for Later", "wishlist-btn", {
      click: () => alert(`Saved "${it.item}" for later!`)
    });

    row.appendChild(createElement("td", {}, [rmBtn, dummyBtn]));
    return row;
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

// function createTableHeader(category) {
//   const thead = createElement("thead");
//   const row = createElement("tr");

//   const headers = ["Item", ...(category === "crops" ? ["Farm"] : []), "Qty", "Price", "Subtotal", "Actions"];
//   headers.forEach(text => row.appendChild(createElement("th", {}, [text])));
//   thead.appendChild(row);
//   return thead;
// }

function createTableHeader(category) {
  const thead = createElement("thead");
  const row = createElement("tr");

  const headers = ["Item"];
  if (category === "crops") headers.push("Farm", "Farm ID");
  headers.push("Qty", "Price", "Subtotal", "Actions");

  headers.forEach(text => row.appendChild(createElement("th", {}, [text])));
  thead.appendChild(row);
  return thead;
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}
