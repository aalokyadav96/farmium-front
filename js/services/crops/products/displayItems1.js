// src/ui/pages/farms/items/displayItems.js
import { SRC_URL, apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";
import { renderItemForm } from "./createOrEdit.js";
import { addToCart } from "../../cart/addToCart.js";

// Render individual item card
function renderItemCard(item, type, isLoggedIn, container, refresh) {
  let quantity = 1;

  const quantityDisplay = createElement("span", { class: "quantity-value" }, [quantity]);

  const decrementBtn = createElement("button", {}, ["−"]);
  const incrementBtn = createElement("button", {}, ["+"]);

  decrementBtn.onclick = () => {
    if (quantity > 1) {
      quantity--;
      quantityDisplay.textContent = quantity;
    }
  };

  incrementBtn.onclick = () => {
    quantity++;
    quantityDisplay.textContent = quantity;
  };

  const quantityControl = createElement("div", { class: "quantity-control" }, [
    decrementBtn,
    quantityDisplay,
    incrementBtn,
  ]);

  const handleAdd = () => {
    addToCart({
      category: type,
      item: item.name,
      quantity,
      price: item.price,
      unit: item.unit || "unit",
      isLoggedIn,
    });
  };

  const imageGallery = item.imageUrls?.length
    ? createElement(
        "div",
        { class: "image-gallery" },
        item.imageUrls.map((url) =>
          createElement("img", {
            src: `${SRC_URL}/uploads/${url}`,
            alt: item.name,
            class: "thumbnail",
          })
        )
      )
    : createElement("div", { class: "no-image" }, ["No Image"]);

  return createElement("div", { class: `${type}-card` }, [
    imageGallery,
    createElement("h3", {}, [item.name]),
    createElement("p", {}, [`₹${item.price.toFixed(2)}`]),
    createElement("p", {}, [item.description]),
    createElement("label", {}, ["Quantity:"]),
    quantityControl,
    Button("Add to Cart", `add-to-cart-${item.id}`, { click: handleAdd }, "secondary-button"),
    Button(
      "Edit",
      `edit-${type}-${item.id}`,
      {
        click: () => {
          renderItemForm(container, "edit", item, type, refresh);
        },
      },
      "secondary-button"
    ),
  ]);
}

// Render category chips at the top
async function renderCategoryChips(container, selectedCategory, onSelect, type = "product") {
  let categories = [];

  try {
    const query = new URLSearchParams({ type }).toString();
    categories = await apiFetch(`/farm/items/categories?${query}`);
  } catch (err) {
    console.warn("Failed to load categories", err);
  }

  const chipContainer = createElement("div", { class: "chip-container" });

  const allChip = createElement(
    "button",
    {
      class: selectedCategory ? "chip" : "chip selected",
      onclick: () => onSelect(""),
    },
    ["All"]
  );
  chipContainer.appendChild(allChip);

  categories.forEach((category) => {
    const chip = createElement(
      "button",
      {
        class: selectedCategory === category ? "chip selected" : "chip",
        onclick: () => onSelect(category),
      },
      [category]
    );
    chipContainer.appendChild(chip);
  });

  container.appendChild(chipContainer);
}


// Main display function
export async function displayItems(
  type,
  container,
  isLoggedIn,
  { limit = 10, offset = 0, search = "", category = "" } = {}
) {
  container.replaceChildren();

  if (!isLoggedIn) {
    container.appendChild(
      createElement("p", {}, ["Please log in to view items."])
    );
    return;
  }

  const refresh = () =>
    displayItems(type, container, isLoggedIn, {
      limit,
      offset,
      search,
      category,
    });

  container.appendChild(
    createElement("h2", {}, [
      `${type.charAt(0).toUpperCase() + type.slice(1)}s`,
    ])
  );

  // Render category filter chips
  await renderCategoryChips(container, category, (newCategory) => {
    displayItems(type, container, isLoggedIn, {
      limit,
      offset: 0,
      search,
      category: newCategory,
    });
  }, type);
  

  // Top bar with create + search
  const topBar = createElement("div", { class: "items-topbar" }, [
    Button(
      `Create ${type}`,
      `create-${type}-btn`,
      { click: () => renderItemForm(container, "create", null, type, refresh) },
      "primary-button"
    ),
    createElement("input", {
      type: "text",
      placeholder: `Search ${type}s…`,
      value: search,
      oninput: (e) =>
        displayItems(type, container, isLoggedIn, {
          limit,
          offset: 0,
          search: e.target.value,
          category,
        }),
    }),
  ]);
  container.appendChild(topBar);

  // Fetch items
  let result;
  try {
    const qs = new URLSearchParams({ type, limit, offset, search, category });
    result = await apiFetch(`/farm/items?${qs.toString()}`);
  } catch (err) {
    container.appendChild(createElement("p", {}, [`Failed to load ${type}s.`]));
    return;
  }

  const { items = [], total = items.length } = result;

  const grid = createElement("div", { class: `${type}-grid` });

  items.forEach((item) => {
    grid.appendChild(renderItemCard(item, type, isLoggedIn, container, refresh));
  });

  container.appendChild(grid);

  // Pagination
  const pageCount = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const pagination = createElement("div", { class: "pagination" }, [
    Button(
      "Prev",
      "page-prev-btn",
      {
        disabled: offset === 0,
        click: () =>
          displayItems(type, container, isLoggedIn, {
            limit,
            offset: Math.max(0, offset - limit),
            search,
            category,
          }),
      },
      "secondary-button"
    ),
    createElement("span", {}, [`Page ${currentPage} of ${pageCount}`]),
    Button(
      "Next",
      "page-next-btn",
      {
        disabled: offset + limit >= total,
        click: () =>
          displayItems(type, container, isLoggedIn, {
            limit,
            offset: offset + limit,
            search,
            category,
          }),
      },
      "secondary-button"
    ),
  ]);

  container.appendChild(pagination);
}

// // src/ui/pages/farms/items/displayItems.js
// import { SRC_URL, apiFetch } from "../../../api/api.js";
// import { createElement } from "../../../components/createElement.js";
// import Button from "../../../components/base/Button.js";
// import { renderItemForm } from "./createOrEdit.js";
// import { addToCart } from "../../cart/addToCart.js";

// function renderItemCard(item, type, isLoggedIn, container, refresh) {
//   let quantity = 1;

//   const quantityDisplay = createElement("span", { class: "quantity-value" }, [quantity]);

//   const decrementBtn = createElement("button", {}, ["−"]);
//   const incrementBtn = createElement("button", {}, ["+"]);

//   decrementBtn.onclick = () => {
//     if (quantity > 1) {
//       quantity--;
//       quantityDisplay.textContent = quantity;
//     }
//   };

//   incrementBtn.onclick = () => {
//     quantity++;
//     quantityDisplay.textContent = quantity;
//   };

//   const quantityControl = createElement("div", { class: "quantity-control" }, [
//     decrementBtn,
//     quantityDisplay,
//     incrementBtn,
//   ]);

//   const handleAdd = () => {
//     addToCart({
//       category: type,
//       item: item.name,
//       quantity,
//       price: item.price,
//       unit: item.unit || "unit",
//       isLoggedIn,
//     });
//   };

//   const imageGallery = item.imageUrls?.length
//     ? createElement(
//         "div",
//         { class: "image-gallery" },
//         item.imageUrls.map((url) =>
//           createElement("img", {
//             src: `${SRC_URL}/uploads/${url}`,
//             alt: item.name,
//             class: "thumbnail",
//           })
//         )
//       )
//     : createElement("div", { class: "no-image" }, ["No Image"]);

//   return createElement("div", { class: `${type}-card` }, [
//     imageGallery,
//     createElement("h3", {}, [item.name]),
//     createElement("p", {}, [`₹${item.price.toFixed(2)}`]),
//     createElement("p", {}, [item.description]),
//     createElement("label", {}, ["Quantity:"]),
//     quantityControl,
//     Button("Add to Cart", `add-to-cart-${item.id}`, { click: handleAdd }, "secondary-button"),
//     Button(
//       "Edit",
//       `edit-${type}-${item.id}`,
//       {
//         click: () => {
//           renderItemForm(container, "edit", item, type, refresh);
//         },
//       },
//       "secondary-button"
//     ),
//   ]);
// }

// export async function displayItems(
//   type,
//   container,
//   isLoggedIn,
//   { limit = 10, offset = 0, search = "", category = "" } = {}
// ) {
//   container.replaceChildren();

//   if (!isLoggedIn) {
//     container.appendChild(
//       createElement("p", {}, ["Please log in to view items."])
//     );
//     return;
//   }

//   const refresh = () =>
//     displayItems(type, container, isLoggedIn, {
//       limit,
//       offset,
//       search,
//       category,
//     });

//   // Top bar
//   const topBar = createElement("div", { class: "items-topbar" }, [
//     Button(
//       `Create ${type}`,
//       `create-${type}-btn`,
//       { click: () => renderItemForm(container, "create", null, type, refresh) },
//       "primary-button"
//     ),
//     createElement("input", {
//       type: "text",
//       placeholder: `Search ${type}s…`,
//       value: search,
//       oninput: (e) =>
//         displayItems(type, container, isLoggedIn, {
//           limit,
//           offset: 0,
//           search: e.target.value,
//           category,
//         }),
//     }),
//   ]);
//   container.appendChild(topBar);

//   // Fetch items
//   let result;
//   try {
//     const qs = new URLSearchParams({ type, limit, offset, search, category });
//     result = await apiFetch(`/farm/items?${qs.toString()}`);
//   } catch (err) {
//     container.appendChild(createElement("p", {}, [`Failed to load ${type}s.`]));
//     return;
//   }

//   const { items = [], total = items.length } = result;

//   container.appendChild(
//     createElement("h2", {}, [
//       `${type.charAt(0).toUpperCase() + type.slice(1)}s (${total})`,
//     ])
//   );

//   const grid = createElement("div", { class: `${type}-grid` });

//   items.forEach((item) => {
//     grid.appendChild(renderItemCard(item, type, isLoggedIn, container, refresh));
//   });

//   container.appendChild(grid);

//   // Pagination
//   const pageCount = Math.ceil(total / limit);
//   const currentPage = Math.floor(offset / limit) + 1;

//   const pagination = createElement("div", { class: "pagination" }, [
//     Button(
//       "Prev",
//       "page-prev-btn",
//       {
//         disabled: offset === 0,
//         click: () =>
//           displayItems(type, container, isLoggedIn, {
//             limit,
//             offset: Math.max(0, offset - limit),
//             search,
//             category,
//           }),
//       },
//       "secondary-button"
//     ),
//     createElement("span", {}, [`Page ${currentPage} of ${pageCount}`]),
//     Button(
//       "Next",
//       "page-next-btn",
//       {
//         disabled: offset + limit >= total,
//         click: () =>
//           displayItems(type, container, isLoggedIn, {
//             limit,
//             offset: offset + limit,
//             search,
//             category,
//           }),
//       },
//       "secondary-button"
//     ),
//   ]);

//   container.appendChild(pagination);
// }

// // // src/ui/pages/farms/items/displayItems.js
// // import { apiFetch } from "../../../api/api.js";
// // import { createElement } from "../../../components/createElement.js";
// // import Button from "../../../components/base/Button.js";
// // import { renderItemForm } from "./createOrEdit.js";
// // import { addToCart } from "../../cart/addToCart.js";

// // export async function displayItems(
// //   type,
// //   container,
// //   isLoggedIn,
// //   { limit = 10, offset = 0, search = "", category = "" } = {}
// // ) {
// //   container.replaceChildren();

// //   if (!isLoggedIn) {
// //     container.appendChild(
// //       createElement("p", {}, ["Please log in to view items."])
// //     );
// //     return;
// //   }

// //   // Top bar: Create + Search
// //   const topBar = createElement(
// //     "div",
// //     { className: "items-topbar" },
// //     [
// //       Button(
// //         `Create ${type}`,
// //         `create-${type}-btn`,
// //         {
// //           click: () => {
// //             renderItemForm(container, "create", null, type, () =>
// //               displayItems(type, container, isLoggedIn, { limit, offset, search, category })
// //             );
// //           },
// //         },
// //         "primary-button"
// //       ),
// //       createElement("input", {
// //         type: "text",
// //         placeholder: `Search ${type}s…`,
// //         value: search,
// //         oninput: (e) =>
// //           displayItems(type, container, isLoggedIn, {
// //             limit,
// //             offset: 0,
// //             search: e.target.value,
// //             category,
// //           }),
// //       }),
// //     ]
// //   );
// //   container.appendChild(topBar);

// //   // Fetch items
// //   let result;
// //   try {
// //     const qs = new URLSearchParams({ type, limit, offset, search, category });
// //     result = await apiFetch(`/farm/items?${qs.toString()}`);
// //   } catch (err) {
// //     container.appendChild(
// //       createElement("p", {}, [`Failed to load ${type}s.`])
// //     );
// //     return;
// //   }

// //   const { items = [], total = items.length } = result;

// //   // Heading + grid container
// //   container.appendChild(
// //     createElement("h2", {}, [
// //       `${type.charAt(0).toUpperCase() + type.slice(1)}s (${total})`,
// //     ])
// //   );

// //   const grid = createElement("div", { className: `${type}-grid` });

// //   items.forEach((item) => {
// //     // Quantity control
// //     let quantity = 1;
// //     const quantityDisplay = createElement("span", { className: "quantity-value" }, [quantity]);
// //     const decrementBtn = createElement("button", {}, ["−"]);
// //     const incrementBtn = createElement("button", {}, ["+"]);

// //     decrementBtn.onclick = () => {
// //       if (quantity > 1) {
// //         quantity--;
// //         quantityDisplay.textContent = quantity;
// //       }
// //     };
// //     incrementBtn.onclick = () => {
// //       quantity++;
// //       quantityDisplay.textContent = quantity;
// //     };

// //     const quantityControl = createElement("div", { className: "quantity-control" }, [
// //       decrementBtn,
// //       quantityDisplay,
// //       incrementBtn,
// //     ]);

// //     // Add-to-cart handler
// //     const handleAdd = () => {
// //       addToCart({
// //         category: type,
// //         item: item.name,
// //         quantity,
// //         price: item.price,
// //         unit: item.unit || "unit",
// //         isLoggedIn,
// //       });
// //     };

// //     // Build card
// //     const card = createElement(
// //       "div",
// //       { className: `${type}-card` },
// //       [
// //         createElement(
// //           "div",
// //           { className: "image-gallery" },
// //           item.imageUrls?.map((url) =>
// //             createElement("img", { src: url, alt: item.name, className: "thumbnail" })
// //           ) || []
// //         ),
        
// //         createElement("h3", {}, [item.name]),
// //         createElement("p", {}, [`₹${item.price.toFixed(2)}`]),
// //         createElement("p", {}, [item.description]),
// //         // quantity controls + add to cart
// //         createElement("label", {}, ["Quantity:"]),
// //         quantityControl,
// //         Button("Add to Cart", `add-to-cart-${item.id}`, { click: handleAdd }, "secondary-button"),
// //         // edit button
// //         Button(
// //           "Edit",
// //           `edit-${type}-${item.id}`,
// //           {
// //             click: () => {
// //               renderItemForm(container, "edit", item, type, () =>
// //                 displayItems(type, container, isLoggedIn, {
// //                   limit,
// //                   offset,
// //                   search,
// //                   category,
// //                 })
// //               );
// //             },
// //           },
// //           "secondary-button"
// //         ),
// //       ]
// //     );

// //     grid.appendChild(card);
// //   });

// //   container.appendChild(grid);

// //   // Pagination
// //   const pageCount = Math.ceil(total / limit);
// //   const currentPage = Math.floor(offset / limit) + 1;

// //   const pagination = createElement(
// //     "div",
// //     { className: "pagination" },
// //     [
// //       Button(
// //         "Prev",
// //         "page-prev-btn",
// //         {
// //           disabled: offset === 0,
// //           click: () =>
// //             displayItems(type, container, isLoggedIn, {
// //               limit,
// //               offset: Math.max(0, offset - limit),
// //               search,
// //               category,
// //             }),
// //         },
// //         "secondary-button"
// //       ),
// //       createElement("span", {}, [`Page ${currentPage} of ${pageCount}`]),
// //       Button(
// //         "Next",
// //         "page-next-btn",
// //         {
// //           disabled: offset + limit >= total,
// //           click: () =>
// //             displayItems(type, container, isLoggedIn, {
// //               limit,
// //               offset: offset + limit,
// //               search,
// //               category,
// //             }),
// //         },
// //         "secondary-button"
// //       ),
// //     ]
// //   );

// //   container.appendChild(pagination);
// // }
