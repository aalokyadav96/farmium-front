import { SRC_URL, apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";
import { renderItemForm } from "./createOrEdit.js";
import { addToCart } from "../../cart/addToCart.js";

function renderItemCard(item, type, isLoggedIn, container, refresh) {
  let quantity = 1;

  const quantityDisplay = createElement("span", { class: "quantity-value" }, [String(quantity)]);

  const decrementBtn = Button("−", "", {
    click: () => {
      if (quantity > 1) {
        quantity--;
        quantityDisplay.textContent = String(quantity);
      }
    },
  });

  const incrementBtn = Button("+", "", {
    click: () => {
      quantity++;
      quantityDisplay.textContent = String(quantity);
    },
  });

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
        click: () => renderItemForm(container, "edit", item, type, refresh),
      },
      "secondary-button"
    ),
  ]);
}

async function renderCategoryChips(container, selectedCategory, onSelect, type = "product") {
  let categories = [];

  try {
    const query = new URLSearchParams({ type }).toString();
    categories = await apiFetch(`/farm/items/categories?${query}`);
  } catch (err) {
    console.warn("Failed to load categories", err);
  }

  const chipContainer = createElement("div", { class: "chip-container" });

  const allChip = Button(
    "All",
    "chip-all",
    { click: () => onSelect("") },
    selectedCategory ? "chip" : "chip selected"
  );
  chipContainer.appendChild(allChip);

  categories.forEach((category) => {
    const chip = Button(
      category,
      `chip-${category}`,
      { click: () => onSelect(category) },
      selectedCategory === category ? "chip selected" : "chip"
    );
    chipContainer.appendChild(chip);
  });

  container.appendChild(chipContainer);
}

export async function displayItems(
  type,
  content,
  isLoggedIn,
  { limit = 10, offset = 0, search = "", category = "", sort = "" } = {}
) {
  const container = createElement("div", { class: "protoolspage" }, []);
  content.innerHTML = "";
  content.appendChild(container);

  // if (!isLoggedIn) {
  //   container.appendChild(createElement("p", {}, ["Please log in to view items."]));
  //   return;
  // }

  const refresh = () =>
    displayItems(type, content, isLoggedIn, {
      limit,
      offset,
      search,
      category,
      sort,
    });

  container.appendChild(
    createElement("h2", {}, [`${type.charAt(0).toUpperCase() + type.slice(1)}s`])
  );

  await renderCategoryChips(container, category, (newCategory) => {
    displayItems(type, content, isLoggedIn, {
      limit,
      offset: 0,
      search,
      category: newCategory,
      sort,
    });
  }, type);

  const sortOptions = [
    { value: "", label: "Sort by" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "name_asc", label: "Name: A to Z" },
    { value: "name_desc", label: "Name: Z to A" },
  ];

  const sortSelect = createElement(
    "select",
    {
      events: {
        change: (e) => {
          displayItems(type, content, isLoggedIn, {
            limit,
            offset: 0,
            search,
            category,
            sort: e.target.value,
          });
        },
      },
    },
    sortOptions.map((opt) =>
      createElement(
        "option",
        {
          value: opt.value,
          ...(opt.value === sort ? { selected: true } : {}),
        },
        [opt.label]
      )
    )
  );

  const searchInput = createElement("input", {
    type: "text",
    placeholder: `Search ${type}s…`,
    value: search,
    events: {
      input: (e) => {
        displayItems(type, content, isLoggedIn, {
          limit,
          offset: 0,
          search: e.target.value,
          category,
          sort,
        });
      },
    },
  });

  if (isLoggedIn) {
  const topBar = createElement("div", { class: "items-topbar" }, [
    Button(
      `Create ${type}`,
      `create-${type}-btn`,
      { click: () => renderItemForm(container, "create", null, type, refresh) },
      "primary-button"
    ),
    searchInput,
    sortSelect,
  ]);
  container.appendChild(topBar);
  }

  // Fetch data
  let result;
  try {
    const qs = new URLSearchParams({ type, limit, offset, search, category });
    result = await apiFetch(`/farm/items?${qs.toString()}`);
  } catch (err) {
    container.appendChild(createElement("p", {}, [`Failed to load ${type}s.`]));
    return;
  }

  let { items = [], total = items.length } = result;

  // Manual sorting
  if (sort === "price_asc") items.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") items.sort((a, b) => b.price - a.price);
  else if (sort === "name_asc") items.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "name_desc") items.sort((a, b) => b.name.localeCompare(a.name));

  const grid = createElement("div", { class: `${type}-grid` });
  items.forEach((item) => {
    grid.appendChild(renderItemCard(item, type, isLoggedIn, container, refresh));
  });

  container.appendChild(grid);

  const pageCount = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const pagination = createElement("div", { class: "pagination" }, [
    Button(
      "Prev",
      "page-prev-btn",
      {
        disabled: offset === 0,
        click: () =>
          displayItems(type, content, isLoggedIn, {
            limit,
            offset: Math.max(0, offset - limit),
            search,
            category,
            sort,
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
          displayItems(type, content, isLoggedIn, {
            limit,
            offset: offset + limit,
            search,
            category,
            sort,
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

//   const quantityDisplay = createElement("span", { class: "quantity-value" }, [String(quantity)]);

//   const decrementBtn = Button("−", "", {
//     click: () => {
//       if (quantity > 1) {
//         quantity--;
//         quantityDisplay.textContent = String(quantity);
//       }
//     },
//   });

//   const incrementBtn = Button("+", "", {
//     click: () => {
//       quantity++;
//       quantityDisplay.textContent = String(quantity);
//     },
//   });

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
//         click: () => renderItemForm(container, "edit", item, type, refresh),
//       },
//       "secondary-button"
//     ),
//   ]);
// }

// async function renderCategoryChips(container, selectedCategory, onSelect, type = "product") {
//   let categories = [];

//   try {
//     const query = new URLSearchParams({ type }).toString();
//     categories = await apiFetch(`/farm/items/categories?${query}`);
//   } catch (err) {
//     console.warn("Failed to load categories", err);
//   }

//   const chipContainer = createElement("div", { class: "chip-container" });

//   const allChip = Button(
//     "All",
//     "chip-all",
//     { click: () => onSelect("") },
//     selectedCategory ? "chip" : "chip selected"
//   );
//   chipContainer.appendChild(allChip);

//   categories.forEach((category) => {
//     const chip = Button(
//       category,
//       `chip-${category}`,
//       { click: () => onSelect(category) },
//       selectedCategory === category ? "chip selected" : "chip"
//     );
//     chipContainer.appendChild(chip);
//   });

//   container.appendChild(chipContainer);
// }

// export async function displayItems(
//   type,
//   content,
//   isLoggedIn,
//   { limit = 10, offset = 0, search = "", category = "", sort = "" } = {}
// ) {
//   const container = createElement("div", { class: "protoolspage" }, []);
//   content.innerHTML = "";
//   content.appendChild(container);

//   if (!isLoggedIn) {
//     container.appendChild(
//       createElement("p", {}, ["Please log in to view items."])
//     );
//     return;
//   }

//   const refresh = () =>
//     displayItems(type, content, isLoggedIn, {
//       limit,
//       offset,
//       search,
//       category,
//       sort,
//     });

//   container.appendChild(
//     createElement("h2", {}, [`${type.charAt(0).toUpperCase() + type.slice(1)}s`])
//   );

//   // Render category filter chips
//   await renderCategoryChips(container, category, (newCategory) => {
//     displayItems(type, content, isLoggedIn, {
//       limit,
//       offset: 0,
//       search,
//       category: newCategory,
//       sort,
//     });
//   }, type);

//   // Sorting select
//   const sortOptions = [
//     { value: "", label: "Sort by" },
//     { value: "price_asc", label: "Price: Low to High" },
//     { value: "price_desc", label: "Price: High to Low" },
//     { value: "name_asc", label: "Name: A to Z" },
//     { value: "name_desc", label: "Name: Z to A" },
//   ];

//   const sortSelect = createElement("select", {
//     onchange: (e) => {
//       displayItems(type, content, isLoggedIn, {
//         limit,
//         offset: 0,
//         search,
//         category,
//         sort: e.target.value,
//       });
//     },
//   }, sortOptions.map(opt =>
//     createElement("option", {
//       value: opt.value,
//       ...(opt.value === sort ? { selected: true } : {}),
//     }, [opt.label])
//   ));
  

//   const searchInput = createElement("input", {
//     type: "text",
//     placeholder: `Search ${type}s…`,
//     value: search,
//     events: {
//       input: (e) => {
//         displayItems(type, content, isLoggedIn, {
//           limit,
//           offset: 0,
//           search: e.target.value,
//           category,
//           sort,
//         });
//       },
//     },
//   });
  

//   const topBar = createElement("div", { class: "items-topbar" }, [
//     Button(
//       `Create ${type}`,
//       `create-${type}-btn`,
//       { click: () => renderItemForm(container, "create", null, type, refresh) },
//       "primary-button"
//     ),
//     searchInput,
//     sortSelect,
//   ]);
//   container.appendChild(topBar);

//   // Fetch data
//   let result;
//   try {
//     const qs = new URLSearchParams({ type, limit, offset, search, category, sort });
//     result = await apiFetch(`/farm/items?${qs.toString()}`);
//   } catch (err) {
//     container.appendChild(createElement("p", {}, [`Failed to load ${type}s.`]));
//     return;
//   }

//   const { items = [], total = items.length } = result;
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
//           displayItems(type, content, isLoggedIn, {
//             limit,
//             offset: Math.max(0, offset - limit),
//             search,
//             category,
//             sort,
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
//           displayItems(type, content, isLoggedIn, {
//             limit,
//             offset: offset + limit,
//             search,
//             category,
//             sort,
//           }),
//       },
//       "secondary-button"
//     ),
//   ]);

//   container.appendChild(pagination);
// }

// // // src/ui/pages/farms/items/displayItems.js
// // import { SRC_URL, apiFetch } from "../../../api/api.js";
// // import { createElement } from "../../../components/createElement.js";
// // import Button from "../../../components/base/Button.js";
// // import { renderItemForm } from "./createOrEdit.js";
// // import { addToCart } from "../../cart/addToCart.js";

// // // Render individual item card
// // function renderItemCard(item, type, isLoggedIn, container, refresh) {
// //   let quantity = 1;

// //   const quantityDisplay = createElement("span", { class: "quantity-value" }, [quantity]);

// //   const decrementBtn = Button("−", "", {
// //     click : () => {
// //     if (quantity > 1) {
// //       quantity--;
// //       quantityDisplay.textContent = quantity;
// //     }
// //   }
// //   });

// //   const incrementBtn = Button("+", "", {
// // click : () => {
// //     quantity++;
// //     quantityDisplay.textContent = quantity;
// //   }
// //   });

// //   const quantityControl = createElement("div", { class: "quantity-control" }, [
// //     decrementBtn,
// //     quantityDisplay,
// //     incrementBtn,
// //   ]);

// //   const handleAdd = () => {
// //     addToCart({
// //       category: type,
// //       item: item.name,
// //       quantity,
// //       price: item.price,
// //       unit: item.unit || "unit",
// //       isLoggedIn,
// //     });
// //   };

// //   const imageGallery = item.imageUrls?.length
// //     ? createElement(
// //         "div",
// //         { class: "image-gallery" },
// //         item.imageUrls.map((url) =>
// //           createElement("img", {
// //             src: `${SRC_URL}/uploads/${url}`,
// //             alt: item.name,
// //             class: "thumbnail",
// //           })
// //         )
// //       )
// //     : createElement("div", { class: "no-image" }, ["No Image"]);

// //   return createElement("div", { class: `${type}-card` }, [
// //     imageGallery,
// //     createElement("h3", {}, [item.name]),
// //     createElement("p", {}, [`₹${item.price.toFixed(2)}`]),
// //     createElement("p", {}, [item.description]),
// //     createElement("label", {}, ["Quantity:"]),
// //     quantityControl,
// //     Button("Add to Cart", `add-to-cart-${item.id}`, { click: handleAdd }, "secondary-button"),
// //     Button(
// //       "Edit",
// //       `edit-${type}-${item.id}`,
// //       {
// //         click: () => {
// //           renderItemForm(container, "edit", item, type, refresh);
// //         },
// //       },
// //       "secondary-button"
// //     ),
// //   ]);
// // }

// // // Render category chips at the top
// // async function renderCategoryChips(container, selectedCategory, onSelect, type = "product") {
// //   let categories = [];

// //   try {
// //     const query = new URLSearchParams({ type }).toString();
// //     categories = await apiFetch(`/farm/items/categories?${query}`);
// //   } catch (err) {
// //     console.warn("Failed to load categories", err);
// //   }

// //   const chipContainer = createElement("div", { class: "chip-container" });

// //   const allChip = Button( "All", "buttonallchip", {
// //     click: () => onSelect(""),
// //   },selectedCategory ? "chip" : "chip selected" );
// //   chipContainer.appendChild(allChip);

// //   categories.forEach((category) => {
// //     const chip = Button(category, "", {
// //         click: () => onSelect(category),
// //       },selectedCategory === category ? "chip selected" : "chip");
// //     chipContainer.appendChild(chip);
// //   });

// //   container.appendChild(chipContainer);
// // }

// // // Main display function
// // export async function displayItems(
// //   type,
// //   content,
// //   isLoggedIn,
// //   { limit = 10, offset = 0, search = "", category = "", sort = "" } = {}
// // ) {
// //   let container = createElement("div", { class: "protoolspage" }, []);
// //   content.innerHTML = "";
// //   content.appendChild(container);

// //   if (!isLoggedIn) {
// //     container.appendChild(
// //       createElement("p", {}, ["Please log in to view items."])
// //     );
// //     return;
// //   }

// //   const refresh = () =>
// //     displayItems(type, content, isLoggedIn, {
// //       limit,
// //       offset,
// //       search,
// //       category,
// //       sort
// //     });

// //   container.appendChild(
// //     createElement("h2", {}, [
// //       `${type.charAt(0).toUpperCase() + type.slice(1)}s`,
// //     ])
// //   );

// //   // Render category filter chips
// //   await renderCategoryChips(container, category, (newCategory) => {
// //     displayItems(type, content, isLoggedIn, {
// //       limit,
// //       offset: 0,
// //       search,
// //       category: newCategory,
// //       sort
// //     });
// //   }, type);

// //   // Sorting options
// //   const sortOptions = [
// //     { value: "", label: "Sort by" },
// //     { value: "price_asc", label: "Price: Low to High" },
// //     { value: "price_desc", label: "Price: High to Low" },
// //     { value: "name_asc", label: "Name: A to Z" },
// //     { value: "name_desc", label: "Name: Z to A" },
// //   ];

// //   const sortSelect = createElement("select", {
// //     onchange: (e) => {
// //       displayItems(type, content, isLoggedIn, {
// //         limit,
// //         offset: 0,
// //         search,
// //         category,
// //         sort: e.target.value,
// //       });
// //     }
// //   }, sortOptions.map(opt =>
// //     createElement("option", {
// //       value: opt.value,
// //       ...(opt.value === sort ? { selected: true } : {})
// //     }, [opt.label])
// //   ));

// //   // Top bar with create + search + sort
// //   const topBar = createElement("div", { class: "items-topbar" }, [
// //     Button(
// //       `Create ${type}`,
// //       `create-${type}-btn`,
// //       { click: () => renderItemForm(container, "create", null, type, refresh) },
// //       "primary-button"
// //     ),
// //     createElement("input", {
// //       type: "text",
// //       placeholder: `Search ${type}s…`,
// //       value: search,
// //       oninput: (e) =>
// //         displayItems(type, content, isLoggedIn, {
// //           limit,
// //           offset: 0,
// //           search: e.target.value,
// //           category,
// //           sort
// //         }),
// //     }),
// //     sortSelect
// //   ]);
// //   container.appendChild(topBar);

// //   // Fetch items
// //   let result;
// //   try {
// //     const qs = new URLSearchParams({ type, limit, offset, search, category, sort });
// //     result = await apiFetch(`/farm/items?${qs.toString()}`);
// //   } catch (err) {
// //     container.appendChild(createElement("p", {}, [`Failed to load ${type}s.`]));
// //     return;
// //   }

// //   const { items = [], total = items.length } = result;

// //   const grid = createElement("div", { class: `${type}-grid` });

// //   items.forEach((item) => {
// //     grid.appendChild(renderItemCard(item, type, isLoggedIn, container, refresh));
// //   });

// //   container.appendChild(grid);

// //   // Pagination
// //   const pageCount = Math.ceil(total / limit);
// //   const currentPage = Math.floor(offset / limit) + 1;

// //   const pagination = createElement("div", { class: "pagination" }, [
// //     Button(
// //       "Prev",
// //       "page-prev-btn",
// //       {
// //         disabled: offset === 0,
// //         click: () =>
// //           displayItems(type, content, isLoggedIn, {
// //             limit,
// //             offset: Math.max(0, offset - limit),
// //             search,
// //             category,
// //             sort
// //           }),
// //       },
// //       "secondary-button"
// //     ),
// //     createElement("span", {}, [`Page ${currentPage} of ${pageCount}`]),
// //     Button(
// //       "Next",
// //       "page-next-btn",
// //       {
// //         disabled: offset + limit >= total,
// //         click: () =>
// //           displayItems(type, content, isLoggedIn, {
// //             limit,
// //             offset: offset + limit,
// //             search,
// //             category,
// //             sort
// //           }),
// //       },
// //       "secondary-button"
// //     ),
// //   ]);

// //   container.appendChild(pagination);
// // }

// // // // src/ui/pages/farms/items/displayItems.js
// // // import { SRC_URL, apiFetch } from "../../../api/api.js";
// // // import { createElement } from "../../../components/createElement.js";
// // // import Button from "../../../components/base/Button.js";
// // // import { renderItemForm } from "./createOrEdit.js";
// // // import { addToCart } from "../../cart/addToCart.js";

// // // // Render individual item card
// // // function renderItemCard(item, type, isLoggedIn, container, refresh) {
// // //   let quantity = 1;

// // //   const quantityDisplay = createElement("span", { class: "quantity-value" }, [quantity]);

// // //   const decrementBtn = createElement("button", {}, ["−"]);
// // //   const incrementBtn = createElement("button", {}, ["+"]);

// // //   decrementBtn.onclick = () => {
// // //     if (quantity > 1) {
// // //       quantity--;
// // //       quantityDisplay.textContent = quantity;
// // //     }
// // //   };

// // //   incrementBtn.onclick = () => {
// // //     quantity++;
// // //     quantityDisplay.textContent = quantity;
// // //   };

// // //   const quantityControl = createElement("div", { class: "quantity-control" }, [
// // //     decrementBtn,
// // //     quantityDisplay,
// // //     incrementBtn,
// // //   ]);

// // //   const handleAdd = () => {
// // //     addToCart({
// // //       category: type,
// // //       item: item.name,
// // //       quantity,
// // //       price: item.price,
// // //       unit: item.unit || "unit",
// // //       isLoggedIn,
// // //     });
// // //   };

// // //   const imageGallery = item.imageUrls?.length
// // //     ? createElement(
// // //         "div",
// // //         { class: "image-gallery" },
// // //         item.imageUrls.map((url) =>
// // //           createElement("img", {
// // //             src: `${SRC_URL}/uploads/${url}`,
// // //             alt: item.name,
// // //             class: "thumbnail",
// // //           })
// // //         )
// // //       )
// // //     : createElement("div", { class: "no-image" }, ["No Image"]);

// // //   return createElement("div", { class: `${type}-card` }, [
// // //     imageGallery,
// // //     createElement("h3", {}, [item.name]),
// // //     createElement("p", {}, [`₹${item.price.toFixed(2)}`]),
// // //     createElement("p", {}, [item.description]),
// // //     createElement("label", {}, ["Quantity:"]),
// // //     quantityControl,
// // //     Button("Add to Cart", `add-to-cart-${item.id}`, { click: handleAdd }, "secondary-button"),
// // //     Button(
// // //       "Edit",
// // //       `edit-${type}-${item.id}`,
// // //       {
// // //         click: () => {
// // //           renderItemForm(container, "edit", item, type, refresh);
// // //         },
// // //       },
// // //       "secondary-button"
// // //     ),
// // //   ]);
// // // }

// // // // Render category chips at the top
// // // async function renderCategoryChips(container, selectedCategory, onSelect, type = "product") {
// // //   let categories = [];

// // //   try {
// // //     const query = new URLSearchParams({ type }).toString();
// // //     categories = await apiFetch(`/farm/items/categories?${query}`);
// // //   } catch (err) {
// // //     console.warn("Failed to load categories", err);
// // //   }

// // //   const chipContainer = createElement("div", { class: "chip-container" });

// // //   const allChip = createElement(
// // //     "button",
// // //     {
// // //       class: selectedCategory ? "chip" : "chip selected",
// // //       onclick: () => onSelect(""),
// // //     },
// // //     ["All"]
// // //   );
// // //   chipContainer.appendChild(allChip);

// // //   categories.forEach((category) => {
// // //     const chip = createElement(
// // //       "button",
// // //       {
// // //         class: selectedCategory === category ? "chip selected" : "chip",
// // //         onclick: () => onSelect(category),
// // //       },
// // //       [category]
// // //     );
// // //     chipContainer.appendChild(chip);
// // //   });

// // //   container.appendChild(chipContainer);
// // // }


// // // // Main display function
// // // export async function displayItems(
// // //   type,
// // //   content,
// // //   isLoggedIn,
// // //   { limit = 10, offset = 0, search = "", category = "" } = {}
// // // ) {
// // //   // container.replaceChildren();
// // //   let container = createElement('div', { "class": "protoolspage" }, []);

// // //   content.innerHTML = "";
// // //   content.appendChild(container);

// // //   if (!isLoggedIn) {
// // //     container.appendChild(
// // //       createElement("p", {}, ["Please log in to view items."])
// // //     );
// // //     return;
// // //   }

// // //   const refresh = () =>
// // //     displayItems(type, container, isLoggedIn, {
// // //       limit,
// // //       offset,
// // //       search,
// // //       category,
// // //     });

// // //   container.appendChild(
// // //     createElement("h2", {}, [
// // //       `${type.charAt(0).toUpperCase() + type.slice(1)}s`,
// // //     ])
// // //   );

// // //   // Render category filter chips
// // //   await renderCategoryChips(container, category, (newCategory) => {
// // //     displayItems(type, container, isLoggedIn, {
// // //       limit,
// // //       offset: 0,
// // //       search,
// // //       category: newCategory,
// // //     });
// // //   }, type);
  

// // //   // Top bar with create + search
// // //   const topBar = createElement("div", { class: "items-topbar" }, [
// // //     Button(
// // //       `Create ${type}`,
// // //       `create-${type}-btn`,
// // //       { click: () => renderItemForm(container, "create", null, type, refresh) },
// // //       "primary-button"
// // //     ),
// // //     createElement("input", {
// // //       type: "text",
// // //       placeholder: `Search ${type}s…`,
// // //       value: search,
// // //       oninput: (e) =>
// // //         displayItems(type, container, isLoggedIn, {
// // //           limit,
// // //           offset: 0,
// // //           search: e.target.value,
// // //           category,
// // //         }),
// // //     }),
// // //   ]);
// // //   container.appendChild(topBar);

// // //   // Fetch items
// // //   let result;
// // //   try {
// // //     const qs = new URLSearchParams({ type, limit, offset, search, category });
// // //     result = await apiFetch(`/farm/items?${qs.toString()}`);
// // //   } catch (err) {
// // //     container.appendChild(createElement("p", {}, [`Failed to load ${type}s.`]));
// // //     return;
// // //   }

// // //   const { items = [], total = items.length } = result;

// // //   const grid = createElement("div", { class: `${type}-grid` });

// // //   items.forEach((item) => {
// // //     grid.appendChild(renderItemCard(item, type, isLoggedIn, container, refresh));
// // //   });

// // //   container.appendChild(grid);

// // //   // Pagination
// // //   const pageCount = Math.ceil(total / limit);
// // //   const currentPage = Math.floor(offset / limit) + 1;

// // //   const pagination = createElement("div", { class: "pagination" }, [
// // //     Button(
// // //       "Prev",
// // //       "page-prev-btn",
// // //       {
// // //         disabled: offset === 0,
// // //         click: () =>
// // //           displayItems(type, container, isLoggedIn, {
// // //             limit,
// // //             offset: Math.max(0, offset - limit),
// // //             search,
// // //             category,
// // //           }),
// // //       },
// // //       "secondary-button"
// // //     ),
// // //     createElement("span", {}, [`Page ${currentPage} of ${pageCount}`]),
// // //     Button(
// // //       "Next",
// // //       "page-next-btn",
// // //       {
// // //         disabled: offset + limit >= total,
// // //         click: () =>
// // //           displayItems(type, container, isLoggedIn, {
// // //             limit,
// // //             offset: offset + limit,
// // //             search,
// // //             category,
// // //           }),
// // //       },
// // //       "secondary-button"
// // //     ),
// // //   ]);

// // //   container.appendChild(pagination);
// // // }
