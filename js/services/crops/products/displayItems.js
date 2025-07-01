// src/ui/pages/farms/items/displayItems.js
import { apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";
import { renderItemForm } from "./createOrEdit.js";
import { addToCart } from "../../../services/cart/addToCart.js";

let searchDebounceTimeout = null;

/**
 * Build and append the top‐bar (create, search, filter, sort, view cart).
 */
function renderTopBar(params, callbacks) {
  const { type, isLoggedIn, userRole } = callbacks;
  const { search, category, sort } = params;

  // Search input
  const searchInput = createElement("input", {
    type: "text",
    placeholder: `Search ${type}s…`,
    value: search,
    oninput: e => {
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(
        () => callbacks.onChange({ ...params, search: e.target.value, offset: 0 }),
        300
      );
    }
  });

  // Category filter
  const categorySelect = createElement(
    "select",
    {
      onchange: e => callbacks.onChange({ ...params, category: e.target.value, offset: 0 })
    },
    [
      ["", "All Categories"],
      ["vegetables", "Vegetables"],
      ["fruits", "Fruits"],
      ["dairy", "Dairy"],
      ["tools", "Tools"]
    ].map(([value, label]) =>
      createElement("option", { value, selected: value === category }, [label])
    )
  );

  // Sort select
  const sortSelect = createElement(
    "select",
    {
      onchange: e => callbacks.onChange({ ...params, sort: e.target.value, offset: 0 })
    },
    [
      ["", "Sort by…"],
      ["price-asc", "Price ↑"],
      ["price-desc", "Price ↓"],
      ["name", "Name A–Z"]
    ].map(([value, label]) =>
      createElement("option", { value, selected: value === sort }, [label])
    )
  );

  const elements = [];

  // Only farmers see the “Create” button
  if (isLoggedIn && userRole === "farmer") {
    elements.push(
      Button(`Create ${type}`, `create-${type}-btn`, {
        click: () => renderItemForm(
          callbacks.container,
          "create",
          null,
          type,
          () => callbacks.onChange(params)
        )
      }, "primary-button")
    );
  }

  elements.push(searchInput, categorySelect, sortSelect);
  elements.push(
    Button("View Cart", "view-cart-btn", { click: callbacks.onViewCart }, "secondary-button")
  );

  return createElement("div", { className: "items-topbar" }, elements);
}

/**
 * Render the grid of item cards.
 */
function renderGrid(items, params, callbacks) {
  const grid = createElement("div", { className: `${params.type}-grid` });

  items.forEach(item => {
    const defaultUnit = params.type === "tool" ? "unit" : "kg";
    const qtyInput = createElement("input", { type: "number", min: 1, value: 1, className: "qty-input" });
    const unitSelect = createElement(
      "select",
      {},
      ["unit", "piece", "kg"]
        .filter(u => params.type !== "tool" ? u !== "unit" : true)
        .map(u =>
          createElement("option", { value: u, selected: u === defaultUnit }, [u])
        )
    );
    unitSelect.value = defaultUnit;

    const actions = [
      Button("Quick View", "", { click: () => callbacks.onQuickView(item) }, "secondary-button"),
      qtyInput,
      unitSelect,
      Button("Add to Cart", "", {
        click: () => {
          addToCart({
            category: params.type,
            item: item.name,
            unit: unitSelect.value,
            farm: item.farm || "",
            quantity: parseInt(qtyInput.value, 10) || 1,
            price: item.price,
            isLoggedIn: callbacks.isLoggedIn
          });
          callbacks.onViewCart();
        }
      }, "primary-button")
    ];

    if (callbacks.userRole === "farmer") {
      actions.push(
        Button("Edit", "", {
          click: () => renderItemForm(
            callbacks.container,
            "edit",
            item,
            params.type,
            () => callbacks.onChange(params)
          )
        }, "secondary-button")
      );
    }

    const card = createElement("div", { className: `${params.type}-card` }, [
      createElement("img", { src: item.imageUrl, alt: item.name }),
      createElement("span", { className: "badge" }, [item.badge || "New"]),
      createElement("h3", {}, [item.name]),
      createElement("p", {}, [`Price: ₹${item.price.toFixed(2)}`]),
      createElement("p", {}, [`Stock: ${item.stock}`]),
      createElement("p", {}, [item.description]),
      createElement("div", { className: "card-actions" }, actions)
    ]);

    grid.appendChild(card);
  });

  return grid;
}

/**
 * Renders pagination controls.
 */
function renderPagination(total, params, callbacks) {
  const { limit, offset } = params;
  const pageCount = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return createElement("div", { className: "pagination" }, [
    Button("Prev", "", {
      disabled: offset === 0,
      click: () => callbacks.onChange({ ...params, offset: Math.max(0, offset - limit) })
    }, "secondary-button"),
    createElement("span", {}, [`Page ${currentPage} of ${pageCount}`]),
    Button("Next", "", {
      disabled: offset + limit >= total,
      click: () => callbacks.onChange({ ...params, offset: offset + limit })
    }, "secondary-button")
  ]);
}

/**
 * Main entry: fetches data and re‐renders the entire item list.
 */
export async function displayItems(
  type,
  container,
  isLoggedIn,
  userRole,
  {
    limit = 10,
    offset = 0,
    search = "",
    category = "",
    sort = ""
  } = {}
) {
  container.replaceChildren();

  if (!isLoggedIn) {
    container.appendChild(
      createElement("p", {}, ["Please log in to view items."])
    );
    return;
  }

  const params = { type, limit, offset, search, category, sort };

  // Top bar
  const topBar = renderTopBar(params, {
    container,
    isLoggedIn,
    userRole,
    onChange: newParams => displayItems(type, container, isLoggedIn, userRole, newParams),
    onViewCart: () => renderCartPreview(container),
    onQuickView: showQuickView
  });
  container.appendChild(topBar);

  // Fetch items
  let result;
  try {
    const qs = new URLSearchParams(params).toString();
    result = await apiFetch(`/farm/items?${qs}`, "GET");
  } catch {
    container.appendChild(
      createElement("p", {}, [`Failed to load ${type}s.`])
    );
    return;
  }

  const items = result.items || [];
  const total = result.total != null ? result.total : items.length;

  container.appendChild(
    createElement("h2", {}, [`${type.charAt(0).toUpperCase() + type.slice(1)}s (${total})`])
  );

  // Grid
  container.appendChild(renderGrid(items, params, {
    container,
    isLoggedIn,
    userRole,
    onQuickView: showQuickView,
    onViewCart: () => renderCartPreview(container),
    onChange: newParams => displayItems(type, container, isLoggedIn, userRole, newParams)
  }));

  // Pagination
  container.appendChild(renderPagination(total, params, {
    onChange: newParams => displayItems(type, container, isLoggedIn, userRole, newParams)
  }));
}

/**
 * Quick‐view modal helper.
 */
function showQuickView(item) {
  let modal = document.getElementById("quick-view-modal");
  if (!modal) {
    modal = createElement("div", { id: "quick-view-modal", className: "modal" });
    document.body.appendChild(modal);
  }
  modal.replaceChildren(
    createElement("div", { className: "modal-content" }, [
      createElement("span", {
        className: "close",
        onclick: () => (modal.style.display = "none")
      }, ["×"]),
      createElement("h2", {}, [item.name]),
      createElement("img", { src: item.imageUrl, alt: item.name, className: "modal-img" }),
      createElement("p", {}, [`Price: ₹${item.price.toFixed(2)}`]),
      createElement("p", {}, [`Stock: ${item.stock}`]),
      createElement("p", {}, [item.description])
    ])
  );
  modal.style.display = "block";
}

/**
 * Renders a small cart summary in a given container.
 */
async function renderCartPreview(container) {
  const cartDiv = container.querySelector("#cart") || createElement("div", { id: "cart" });
  container.appendChild(cartDiv);
  cartDiv.replaceChildren(createElement("p", {}, ["Loading cart…"]));

  try {
    const items = await apiFetch("/cart", "GET");
    cartDiv.replaceChildren();
    const list = createElement("ul", { className: "cart-list" });
    let total = 0;
    items.forEach(it => {
      total += it.price * it.quantity;
      list.appendChild(
        createElement("li", {}, [`${it.quantity} × ${it.item} (@₹${it.price})`])
      );
    });
    cartDiv.appendChild(list);
    cartDiv.appendChild(
      createElement("p", { className: "cart-total" }, [`Total: ₹${total.toFixed(2)}`])
    );
  } catch {
    cartDiv.replaceChildren(createElement("p", {}, ["Failed to load cart."]));
  }
}

// // src/ui/pages/farms/items/displayItems.js
// import { apiFetch } from "../../../api/api.js";
// import { createElement } from "../../../components/createElement.js";
// import Button from "../../../components/base/Button.js";
// import { renderItemForm } from "./createOrEdit.js";
// import { addToCart } from "../../../services/cart/addToCart.js";

// /**
//  * Renders a “Quick View” modal for an item.
//  */
// function showQuickView(item) {
//   let modal = document.getElementById("quick-view-modal");
//   if (!modal) {
//     modal = createElement("div", { id: "quick-view-modal", className: "modal" });
//     document.body.appendChild(modal);
//   }
//   modal.replaceChildren(
//     createElement("div", { className: "modal-content" }, [
//       createElement("span", {
//         className: "close",
//         onclick: () => (modal.style.display = "none")
//       }, ["×"]),
//       createElement("h2", {}, [item.name]),
//       createElement("img", { src: item.imageUrl, alt: item.name, className: "modal-img" }),
//       createElement("p", {}, [`Price: ₹${item.price.toFixed(2)}`]),
//       createElement("p", {}, [`Stock: ${item.stock}`]),
//       createElement("p", {}, [item.description])
//     ])
//   );
//   modal.style.display = "block";
// }

// async function renderCartPreview() {
//   const cartDiv = document.getElementById("cart");
//   if (!cartDiv) return;
//   cartDiv.replaceChildren(createElement("p", {}, ["Loading cart…"]));
//   try {
//     const items = await apiFetch("/cart", "GET");
//     cartDiv.replaceChildren();
//     const list = createElement("ul", { className: "cart-list" });
//     let total = 0;
//     items.forEach(it => {
//       total += it.price * it.quantity;
//       list.appendChild(
//         createElement("li", {}, [`${it.quantity} × ${it.item} (@₹${it.price})`])
//       );
//     });
//     cartDiv.appendChild(list);
//     cartDiv.appendChild(createElement("p", { className: "cart-total" }, [`Total: ₹${total.toFixed(2)}`]));
//   } catch {
//     cartDiv.replaceChildren(createElement("p", {}, ["Failed to load cart."]));
//   }
// }

// // Cache outside debounce
// let searchTimeout;

// export async function displayItems(
//   type,
//   container,
//   isLoggedIn,
//   userRole,
//   { limit = 10, offset = 0, search = "", category = "", sort = "" } = {}
// ) {
//   container.replaceChildren();

//   if (!isLoggedIn) {
//     container.appendChild(createElement("p", {}, ["Please log in to view items."]));
//     return;
//   }

//   // Top bar
//   const searchInput = createElement("input", {
//     type: "text",
//     placeholder: `Search ${type}s…`,
//     value: search,
//     oninput: e => {
//       clearTimeout(searchTimeout);
//       searchTimeout = setTimeout(() => {
//         displayItems(type, container, isLoggedIn, userRole, {
//           limit, offset: 0, search: e.target.value, category, sort
//         });
//       }, 300);
//     }
//   });

//   const sortSelect = createElement("select", {
//     onchange: e => displayItems(type, container, isLoggedIn, userRole, {
//       limit, offset: 0, search, category, sort: e.target.value
//     })
//   }, [
//     createElement("option", { value: "" }, ["Sort by…"]),
//     createElement("option", { value: "price-asc" }, ["Price ↑"]),
//     createElement("option", { value: "price-desc" }, ["Price ↓"]),
//     createElement("option", { value: "name" }, ["Name A–Z"])
//   ]);
//   sortSelect.value = sort;

//   const categorySelect = createElement("select", {
//     onchange: e => displayItems(type, container, isLoggedIn, userRole, {
//       limit, offset: 0, search, category: e.target.value, sort
//     })
//   }, [
//     createElement("option", { value: "" }, ["All Categories"]),
//     createElement("option", { value: "vegetables" }, ["Vegetables"]),
//     createElement("option", { value: "fruits" }, ["Fruits"]),
//     createElement("option", { value: "dairy" }, ["Dairy"]),
//     createElement("option", { value: "tools" }, ["Tools"])
//   ]);
//   categorySelect.value = category;

//   const topBar = createElement("div", { className: "items-topbar" }, [
//     Button(`Create ${type}`, `create-${type}-btn`, {
//       click: () => renderItemForm(container, "create", null, type, () =>
//         displayItems(type, container, isLoggedIn, userRole))
//     }, "primary-button"),
//     searchInput,
//     categorySelect,
//     sortSelect,
//     Button("View Cart", "view-cart-btn", { click: renderCartPreview }, "secondary-button")
//   ]);
//   container.appendChild(topBar);

//   // Fetch and display items
//   let result;
//   try {
//     const qs = new URLSearchParams({ type, limit, offset, search, category, sort });
//     result = await apiFetch(`/farm/items?${qs}`);
//   } catch {
//     return container.appendChild(createElement("p", {}, [`Failed to load ${type}s.`]));
//   }

//   const { items = [], total = items.length } = result;
//   container.appendChild(createElement("h2", {}, [`${type.charAt(0).toUpperCase() + type.slice(1)}s (${total})`]));

//   const grid = createElement("div", { className: `${type}-grid` });
//   items.forEach(item => {
//     const defaultUnit = type === "tool" ? "unit" : "kg";
//     const qtyInput = createElement("input", { type: "number", min: 1, value: 1, className: "qty-input" });
//     const unitSelect = createElement("select", {}, [
//       createElement("option", { value: defaultUnit }, [defaultUnit]),
//       createElement("option", { value: "piece" }, ["piece"]),
//       createElement("option", { value: "kg" }, ["kg"])
//     ]);
//     unitSelect.value = defaultUnit;

//     const card = createElement("div", { className: `${type}-card` }, [
//       createElement("img", { src: item.imageUrl, alt: item.name }),
//       createElement("span", { className: "badge" }, [item.badge || "New"]),
//       createElement("h3", {}, [item.name]),
//       createElement("p", {}, [`Price: ₹${item.price.toFixed(2)}`]),
//       createElement("p", {}, [`Stock: ${item.stock}`]),
//       createElement("p", {}, [item.description]),
//       createElement("div", { className: "card-actions" }, [
//         Button("Quick View", "", { click: () => showQuickView(item) }, "secondary-button"),
//         qtyInput,
//         unitSelect,
//         Button("Add to Cart", "", {
//           click: () => {
//             addToCart({
//               category: type,
//               item: item.name,
//               unit: unitSelect.value,
//               farm: item.farm || "",
//               quantity: parseInt(qtyInput.value, 10) || 1,
//               price: item.price,
//               isLoggedIn,
//               showToast: undefined
//             });
//             renderCartPreview();
//           }
//         }, "primary-button"),
//         ...(userRole === "farmer"
//           ? [Button("Edit", "", {
//               click: () => renderItemForm(container, "edit", item, type, () =>
//                 displayItems(type, container, isLoggedIn, userRole))
//             }, "secondary-button")]
//           : [])
//       ])
//     ]);
//     grid.appendChild(card);
//   });
//   container.appendChild(grid);

//   // Pagination
//   const pageCount = Math.ceil(total / limit);
//   const currentPage = Math.floor(offset / limit) + 1;
//   const pagination = createElement("div", { className: "pagination" }, [
//     Button("Prev", "", {
//       disabled: offset === 0,
//       click: () => displayItems(type, container, isLoggedIn, userRole, {
//         limit, offset: Math.max(0, offset - limit), search, category, sort
//       })
//     }, "secondary-button"),
//     createElement("span", {}, [`Page ${currentPage} of ${pageCount}`]),
//     Button("Next", "", {
//       disabled: offset + limit >= total,
//       click: () => displayItems(type, container, isLoggedIn, userRole, {
//         limit, offset: offset + limit, search, category, sort
//       })
//     }, "secondary-button")
//   ]);
//   container.appendChild(pagination);
// }


// // // src/ui/pages/farms/items/displayItems.js
// // import { apiFetch } from "../../../api/api.js";
// // import { createElement } from "../../../components/createElement.js";
// // import Button from "../../../components/base/Button.js";
// // import { renderItemForm } from "./createOrEdit.js";
// // import { addToCart } from "../../../services/cart/addToCart.js";

// // /**
// //  * Renders a “Quick View” modal for an item.
// //  */
// // function showQuickView(item) {
// //   let modal = document.getElementById("quick-view-modal");
// //   if (!modal) {
// //     modal = createElement("div", { id: "quick-view-modal", className: "modal" });
// //     document.body.appendChild(modal);
// //   }
// //   modal.replaceChildren(
// //     createElement("div", { className: "modal-content" }, [
// //       createElement("span", {
// //         className: "close",
// //         onclick: () => (modal.style.display = "none")
// //       }, ["×"]),
// //       createElement("h2", {}, [item.name]),
// //       createElement("img", { src: item.imageUrl, alt: item.name, className: "modal-img" }),
// //       createElement("p", {}, [`Price: ₹${item.price.toFixed(2)}`]),
// //       createElement("p", {}, [`Stock: ${item.stock}`]),
// //       createElement("p", {}, [item.description])
// //     ])
// //   );
// //   modal.style.display = "block";
// // }

// // /**
// //  * Updates the cart preview drawer inside div#cart
// //  */
// // async function renderCartPreview() {
// //   const cartDiv = document.getElementById("cart");
// //   if (!cartDiv) return;
// //   cartDiv.replaceChildren(createElement("p", {}, ["Loading cart…"]));
// //   try {
// //     const items = await apiFetch("/cart", "GET");
// //     cartDiv.replaceChildren();
// //     const list = createElement("ul", { className: "cart-list" });
// //     let total = 0;
// //     items.forEach(it => {
// //       total += it.price * it.quantity;
// //       list.appendChild(
// //         createElement("li", {}, [
// //           `${it.quantity} × ${it.item} (@₹${it.price})`
// //         ])
// //       );
// //     });
// //     cartDiv.appendChild(list);
// //     cartDiv.appendChild(createElement("p", { className: "cart-total" }, [`Total: ₹${total.toFixed(2)}`]));
// //   } catch {
// //     cartDiv.replaceChildren(createElement("p", {}, ["Failed to load cart."]));
// //   }
// // }

// // /**
// //  * Main listing function
// //  */
// // export async function displayItems(
// //   type,
// //   container,
// //   isLoggedIn,
// //   userRole,
// //   { limit = 10, offset = 0, search = "", category = "", sort = "" } = {}
// // ) {
// //   container.replaceChildren();

// //   if (!isLoggedIn) {
// //     container.appendChild(createElement("p", {}, ["Please log in to view items."]));
// //     return;
// //   }

// //   // Top bar: Create / Search / Filter / Sort / Cart Preview toggle
// //   const topBar = createElement("div", { className: "items-topbar" }, [
// //     Button(
// //       `Create ${type}`,
// //       `create-${type}-btn`,
// //       {
// //         click: () => renderItemForm(container, "create", null, type, () =>
// //           displayItems(type, container, isLoggedIn, userRole))
// //       },
// //       "primary-button"
// //     ),
// //     createElement("input", {
// //       type: "text",
// //       placeholder: `Search ${type}s…`,
// //       value: search,
// //       oninput: e => displayItems(type, container, isLoggedIn, userRole, {
// //         limit, offset: 0, search: e.target.value, category, sort
// //       })
// //     }),
// //     createElement("select", {
// //       onchange: e => displayItems(type, container, isLoggedIn, userRole, {
// //         limit, offset: 0, search, category, sort: e.target.value
// //       })
// //     }, [
// //       createElement("option", { value: "" }, ["Sort by…"]),
// //       createElement("option", { value: "price-asc" }, ["Price ↑"]),
// //       createElement("option", { value: "price-desc" }, ["Price ↓"]),
// //       createElement("option", { value: "name" }, ["Name A–Z"])
// //     ]),
// //     Button("View Cart", "view-cart-btn", { click: renderCartPreview }, "secondary-button")
// //   ]);
// //   container.appendChild(topBar);

// //   // Fetch items with filters
// //   let result;
// //   try {
// //     const qs = new URLSearchParams({ type, limit, offset, search, category, sort });
// //     result = await apiFetch(`/farm/items?${qs}`);
// //   } catch {
// //     return container.appendChild(createElement("p", {}, [`Failed to load ${type}s.`]));
// //   }

// //   const { items = [], total = items.length } = result;
// //   container.appendChild(
// //     createElement("h2", {}, [
// //       `${type.charAt(0).toUpperCase() + type.slice(1)}s (${total})`
// //     ])
// //   );

// //   // Build grid
// //   const grid = createElement("div", { className: `${type}-grid` });
// //   items.forEach(item => {
// //     // Autofill unit based on category
// //     const defaultUnit = type === "tool" ? "unit" : "kg";
// //     // Controls
// //     const qtyInput = createElement("input", {
// //       type: "number", min: 1, value: 1, className: "qty-input"
// //     });
// //     const unitSelect = createElement("select", {}, [
// //       createElement("option", { value: defaultUnit }, [defaultUnit]),
// //       createElement("option", { value: "piece" }, ["piece"]),
// //       createElement("option", { value: "kg" }, ["kg"])
// //     ]);
// //     unitSelect.value = defaultUnit;

// //     const card = createElement("div", { className: `${type}-card` }, [
// //       createElement("img", { src: item.imageUrl, alt: item.name }),
// //       createElement("span", { className: "badge" }, [item.badge || "New"]),
// //       createElement("h3", {}, [item.name]),
// //       createElement("p", {}, [`Price: ₹${item.price.toFixed(2)}`]),
// //       createElement("p", {}, [`Stock: ${item.stock}`]),
// //       createElement("p", {}, [item.description]),
// //       createElement("div", { className: "card-actions" }, [
// //         Button("Quick View", "", { click: () => showQuickView(item) }, "secondary-button"),
// //         qtyInput,
// //         unitSelect,
// //         Button("Add to Cart", "", {
// //           click: () => {
// //             addToCart({
// //               category: type,
// //               item: item.name,
// //               unit: unitSelect.value,
// //               farm: item.farm || "",
// //               quantity: parseInt(qtyInput.value, 10) || 1,
// //               price: item.price,
// //               isLoggedIn,
// //               showToast: undefined
// //             });
// //             renderCartPreview();
// //           }
// //         }, "primary-button"),
// //         ...(userRole === "farmer"
// //           ? [Button("Edit", "", {
// //               click: () => renderItemForm(container, "edit", item, type, () =>
// //                 displayItems(type, container, isLoggedIn, userRole))
// //             }, "secondary-button")]
// //           : [])
// //       ])
// //     ]);
// //     grid.appendChild(card);
// //   });
// //   container.appendChild(grid);

// //   // Pagination
// //   const pageCount = Math.ceil(total / limit);
// //   const currentPage = Math.floor(offset / limit) + 1;
// //   const pagination = createElement("div", { className: "pagination" }, [
// //     Button("Prev", "", {
// //       disabled: offset === 0,
// //       click: () => displayItems(type, container, isLoggedIn, userRole, {
// //         limit, offset: Math.max(0, offset - limit), search, category, sort
// //       })
// //     }, "secondary-button"),
// //     createElement("span", {}, [`Page ${currentPage} of ${pageCount}`]),
// //     Button("Next", "", {
// //       disabled: offset + limit >= total,
// //       click: () => displayItems(type, container, isLoggedIn, userRole, {
// //         limit, offset: offset + limit, search, category, sort
// //       })
// //     }, "secondary-button")
// //   ]);
// //   container.appendChild(pagination);
// // }

// // // // src/ui/pages/farms/items/displayItems.js
// // // import { apiFetch } from "../../../api/api.js";
// // // import { createElement } from "../../../components/createElement.js";
// // // import Button from "../../../components/base/Button.js";
// // // import { renderItemForm } from "./createOrEdit.js";
// // // import { addToCart } from "../../cart/addToCart.js";

// // // export async function displayItems(
// // //   type,
// // //   container,
// // //   isLoggedIn,
// // //   { limit = 10, offset = 0, search = "", category = "" } = {}
// // // ) {
// // //   container.replaceChildren();

// // //   // – If not logged in, prompt
// // //   if (!isLoggedIn) {
// // //     container.appendChild(
// // //       createElement("p", {}, ["Please log in to view items."])
// // //     );
// // //     return;
// // //   }

// // //   // --- Top Bar ---
// // //   const topBar = createElement(
// // //     "div",
// // //     { className: "items-topbar" },
// // //     [
// // //       Button(
// // //         `Create ${type}`,
// // //         `create-${type}-btn`,
// // //         {
// // //           click: () => {
// // //             renderItemForm(container, "create", null, type, () =>
// // //               displayItems(type, container, isLoggedIn, { limit, offset, search, category })
// // //             );
// // //           },
// // //         },
// // //         "primary-button"
// // //       ),
// // //       createElement("input", {
// // //         type: "text",
// // //         placeholder: `Search ${type}s…`,
// // //         value: search,
// // //         oninput: (e) =>
// // //           displayItems(type, container, isLoggedIn, {
// // //             limit,
// // //             offset: 0,
// // //             search: e.target.value,
// // //             category,
// // //           }),
// // //       }),
// // //       // (Optional) Category filter:
// // //       // createElement("select", { onchange: ... }, [...])
// // //     ]
// // //   );
// // //   container.appendChild(topBar);

// // //   // --- Fetch Data ---
// // //   let result;
// // //   try {
// // //     const qs = new URLSearchParams({ type, limit, offset, search, category });
// // //     result = await apiFetch(`/farm/items?${qs.toString()}`);
// // //   } catch (err) {
// // //     return container.appendChild(
// // //       createElement("p", {}, [`Failed to load ${type}s.`])
// // //     );
// // //   }

// // //   const { items = [], total = items.length } = result;

// // //   // --- Heading + Grid ---
// // //   container.appendChild(
// // //     createElement("h2", {}, [
// // //       `${type.charAt(0).toUpperCase() + type.slice(1)}s (${total})`,
// // //     ])
// // //   );

// // //   const grid = createElement("div", { className: `${type}-grid` });

// // //   // ...
// // //   items.forEach((item) => {
// // //     const qtyInput = createElement("input", {
// // //       type: "number",
// // //       min: 1,
// // //       value: 1,
// // //       className: "qty-input",
// // //       title: "Quantity",
// // //     });

// // //     const unitSelect = createElement("select", {}, [
// // //       createElement("option", { value: "unit" }, ["unit"]),
// // //       createElement("option", { value: "kg" }, ["kg"]),
// // //       createElement("option", { value: "piece" }, ["piece"]),
// // //       // Add more units as needed
// // //     ]);

// // //     const farmInput = createElement("input", {
// // //       type: "text",
// // //       placeholder: "Farm name",
// // //       className: "farm-input",
// // //     });

// // //     const card = createElement("div", { className: `${type}-card` }, [
// // //       createElement("img", { src: item.imageUrl, alt: item.name }),
// // //       createElement("h3", {}, [item.name]),
// // //       createElement("p", {}, [`₹${item.price.toFixed(2)}`]),
// // //       createElement("p", {}, [item.description]),
// // //       createElement("div", { className: "cart-controls" }, [
// // //         qtyInput,
// // //         unitSelect,
// // //         farmInput,
// // //         Button("Add to Cart", `cart-${item.id}`, {
// // //           click: () => {
// // //             const quantity = parseInt(qtyInput.value, 10) || 1;
// // //             const unit = unitSelect.value;
// // //             const farm = farmInput.value || "default-farm";

// // //             addToCart({
// // //               category: type,
// // //               item: item.name,
// // //               unit,
// // //               farm,
// // //               quantity,
// // //               price: item.price,
// // //               isLoggedIn,
// // //             });
// // //           },
// // //         }, "primary-button"),
// // //       ]),
// // //       Button("Edit", `edit-${type}-btn`, {
// // //         click: () => {
// // //           renderItemForm(container, "edit", item, type, () =>
// // //             displayItems(type, container, isLoggedIn, {
// // //               limit,
// // //               offset,
// // //               search,
// // //               category,
// // //             })
// // //           );
// // //         },
// // //       }, "secondary-button"),
// // //     ]);

// // //     grid.appendChild(card);
// // //   });

// // //   // items.forEach((item) => {
// // //   //   const card = createElement(
// // //   //     "div",
// // //   //     { className: `${type}-card` },
// // //   //     [
// // //   //       createElement("img", { src: item.imageUrl, alt: item.name }),
// // //   //       createElement("h3", {}, [item.name]),
// // //   //       createElement("p", {}, [`₹${item.price.toFixed(2)}`]),
// // //   //       createElement("p", {}, [item.description]),
// // //   //       Button(
// // //   //         "Edit",
// // //   //         `edit-${type}-btn`,
// // //   //         {
// // //   //           click: () => {
// // //   //             renderItemForm(container, "edit", item, type, () =>
// // //   //               displayItems(type, container, isLoggedIn, {
// // //   //                 limit,
// // //   //                 offset,
// // //   //                 search,
// // //   //                 category,
// // //   //               })
// // //   //             );
// // //   //           },
// // //   //         },
// // //   //         "secondary-button"
// // //   //       ),
// // //   //     ]
// // //   //   );
// // //   //   grid.appendChild(card);
// // //   // });
// // //   container.appendChild(grid);

// // //   // --- Pagination Controls ---
// // //   const pageCount = Math.ceil(total / limit);
// // //   const currentPage = Math.floor(offset / limit) + 1;

// // //   const pagination = createElement(
// // //     "div",
// // //     { className: "pagination" },
// // //     [
// // //       Button(
// // //         "Prev",
// // //         "page-prev-btn",
// // //         {
// // //           disabled: offset === 0,
// // //           click: () =>
// // //             displayItems(type, container, isLoggedIn, {
// // //               limit,
// // //               offset: Math.max(0, offset - limit),
// // //               search,
// // //               category,
// // //             }),
// // //         },
// // //         "secondary-button"
// // //       ),
// // //       createElement("span", {}, [
// // //         `Page ${currentPage} of ${pageCount}`,
// // //       ]),
// // //       Button(
// // //         "Next",
// // //         "page-next-btn",
// // //         {
// // //           disabled: offset + limit >= total,
// // //           click: () =>
// // //             displayItems(type, container, isLoggedIn, {
// // //               limit,
// // //               offset: offset + limit,
// // //               search,
// // //               category,
// // //             }),
// // //         },
// // //         "secondary-button"
// // //       ),
// // //     ]
// // //   );
// // //   container.appendChild(pagination);
// // // }
