import { showLoading, showError } from "../customTabs2";
import { apiFetch } from "../../../api/api.js";


// // ─── Products (Shop) ───────────────────────────────────────────────────────────

// // export async function displayPlaceProducts(container, placeId, isCreator, isLoggedIn) {
// //     container.innerHTML = "";
// //     showLoading(container);

// //     try {
// //       const products = await apiFetch(`/place/${placeId}/products`);
// //       container.innerHTML = "";

// //       container.appendChild(createElement("h3", {}, ["Products"]));
// //       const productSection = createElement("div", { class: "product-section" }, []);

// //       products.forEach((item) => {
// //         const itemDiv = createElement("div", { class: "product-item" }, [
// //           createElement("h4", {}, [item.name]),
// //           createElement("p", {}, [`Price: ${item.price}`])
// //         ]);

// //         if (isLoggedIn) {
// //           const buyBtn = Button("Buy", `buy-${item._id}`, {
// //             click: () => {
// //               // Example: Add to cart or direct purchase
// //               apiFetch(`/place/${placeId}/products/${item._id}/buy`, {
// //                 method: "POST"
// //               })
// //                 .then(() => alert(`Purchased ${item.name}`))
// //                 .catch((e) => alert(`Purchase failed: ${e.message}`));
// //             }
// //           });
// //           itemDiv.appendChild(buyBtn);
// //         }

// //         if (isCreator) {
// //           const editBtn = Button("Edit", `edit-product-${item._id}`, {
// //             click: () => {
// //               const formFields = [
// //                 { name: "name", placeholder: "Name", value: item.name },
// //                 { name: "price", placeholder: "Price", value: item.price }
// //               ];
// //               const editForm = createInlineForm(
// //                 formFields,
// //                 async (data, formEl) => {
// //                   try {
// //                     await apiFetch(`/place/${placeId}/products/${item._id}`, {
// //                       method: "PUT",
// //                       body: JSON.stringify(data)
// //                     });
// //                     displayPlaceProducts(container, placeId, isCreator, isLoggedIn);
// //                   } catch (e) {
// //                     alert(`Update failed: ${e.message}`);
// //                   }
// //                 },
// //                 (formEl) => itemDiv.replaceChild(itemDivClone, formEl)
// //               );
// //               const itemDivClone = itemDiv.cloneNode(true);
// //               itemDiv.replaceChildren(editForm);
// //             }
// //           });

// //           const deleteBtn = Button("Delete", `delete-product-${item._id}`, {
// //             click: async () => {
// //               if (!confirm(`Delete product "${item.name}"?`)) return;
// //               try {
// //                 await apiFetch(`/place/${placeId}/products/${item._id}`, {
// //                   method: "DELETE"
// //                 });
// //                 displayPlaceProducts(container, placeId, isCreator, isLoggedIn);
// //               } catch (e) {
// //                 alert(`Delete failed: ${e.message}`);
// //               }
// //             }
// //           });

// //           itemDiv.appendChild(editBtn);
// //           itemDiv.appendChild(deleteBtn);
// //         }

// //         productSection.appendChild(itemDiv);
// //       });

// //       container.appendChild(productSection);

// //       if (isCreator) {
// //         const addBtn = Button("Add New Product", "add-product", {
// //           click: () => {
// //             const formFields = [
// //               { name: "name", placeholder: "Name" },
// //               { name: "price", placeholder: "Price" }
// //             ];
// //             const addForm = createInlineForm(
// //               formFields,
// //               async (data, formEl) => {
// //                 try {
// //                   await apiFetch(`/place/${placeId}/products`, {
// //                     method: "POST",
// //                     body: JSON.stringify(data)
// //                   });
// //                   displayPlaceProducts(container, placeId, isCreator, isLoggedIn);
// //                 } catch (e) {
// //                   alert(`Creation failed: ${e.message}`);
// //                 }
// //               },
// //               (formEl) => container.removeChild(formEl)
// //             );
// //             container.appendChild(addForm);
// //             addBtn.disabled = true;
// //           }
// //         });
// //         container.appendChild(addBtn);
// //       }
// //     } catch (err) {
// //       container.innerHTML = "";
// //       showError(container, "Products unavailable.");
// //     }
// //   }

// export async function displayPlaceProducts(container, placeId, isCreator, isLoggedIn) {
//     container.textContent = "";
//     showLoading(container);

//     try {
//         const products = await apiFetch(`/place/${placeId}/products`);
//         container.textContent = "";

//         const title = createElement("h3", {}, ["Products"]);
//         container.appendChild(title);

//         const productSection = createElement("div", { class: "product-section" });

//         products.forEach((item) => {
//             const itemDiv = createElement("div", { class: "product-item" }, [
//                 createElement("h4", {}, [item.name]),
//                 createElement("p", {}, [`Price: ₹${item.price}`])
//             ]);

//             // Buy button
//             if (isLoggedIn) {
//                 const buyBtn = Button("Buy", `buy-${item._id}`, {
//                     click: async () => {
//                         try {
//                             await apiFetch(`/place/${placeId}/products/${item._id}/buy`, "POST");
//                             alert(`Purchased ${item.name}`);
//                         } catch (e) {
//                             alert(`Purchase failed: ${e.message}`);
//                         }
//                     }
//                 });
//                 itemDiv.appendChild(buyBtn);
//             }

//             // Creator options
//             if (isCreator) {
//                 const editBtn = Button("Edit", `edit-${item._id}`, {
//                     click: () => {
//                         const formFields = [
//                             { name: "name", placeholder: "Name", value: item.name },
//                             { name: "price", placeholder: "Price", value: item.price }
//                         ];

//                         const itemClone = itemDiv.cloneNode(true);

//                         const editForm = createInlineForm(
//                             formFields,
//                             async (data, formEl) => {
//                                 try {
//                                     await apiFetch(`/place/${placeId}/products/${item._id}`, "PUT", JSON.stringify(data));
//                                     displayPlaceProducts(container, placeId, isCreator, isLoggedIn);
//                                 } catch (e) {
//                                     alert(`Update failed: ${e.message}`);
//                                 }
//                             },
//                             () => {
//                                 itemDiv.replaceChildren(...itemClone.childNodes);
//                             }
//                         );

//                         itemDiv.replaceChildren(editForm);
//                     }
//                 });

//                 const deleteBtn = Button("Delete", `delete-${item._id}`, {
//                     click: async () => {
//                         if (!confirm(`Delete product "${item.name}"?`)) return;
//                         try {
//                             await apiFetch(`/place/${placeId}/products/${item._id}`, "DELETE");
//                             displayPlaceProducts(container, placeId, isCreator, isLoggedIn);
//                         } catch (e) {
//                             alert(`Delete failed: ${e.message}`);
//                         }
//                     }
//                 });

//                 itemDiv.appendChild(editBtn);
//                 itemDiv.appendChild(deleteBtn);
//             }

//             productSection.appendChild(itemDiv);
//         });

//         container.appendChild(productSection);

//         if (isCreator) {
//             const addBtn = Button("Add Product", "add-product", {
//                 click: () => {
//                     const formFields = [
//                         { name: "name", placeholder: "Name" },
//                         { name: "price", placeholder: "Price" }
//                     ];

//                     const addForm = createInlineForm(
//                         formFields,
//                         async (data, formEl) => {
//                             try {
//                                 await apiFetch(`/place/${placeId}/products`, "POST", JSON.stringify(data));
//                                 displayPlaceProducts(container, placeId, isCreator, isLoggedIn);
//                             } catch (e) {
//                                 alert(`Creation failed: ${e.message}`);
//                             }
//                         },
//                         (formEl) => {
//                             container.removeChild(formEl);
//                             addBtn.disabled = false;
//                         }
//                     );

//                     container.appendChild(addForm);
//                     addBtn.disabled = true;
//                 }
//             });

//             container.appendChild(addBtn);
//         }

//     } catch (err) {
//         container.textContent = "";
//         showError(container, "Products unavailable.");
//     }
// }

// function Button(label, id, { click }) {
//     const btn = document.createElement("button");
//     btn.textContent = label;
//     btn.id = id;
//     btn.type = "button";
//     btn.addEventListener("click", click);
//     return btn;
// }
// function createElement(tag, attrs = {}, children = []) {
//     const el = document.createElement(tag);
//     for (const [key, val] of Object.entries(attrs)) {
//         el.setAttribute(key, val);
//     }
//     for (const child of children) {
//         if (typeof child === "string") {
//             el.appendChild(document.createTextNode(child));
//         } else {
//             el.appendChild(child);
//         }
//     }
//     return el;
// }
// function createInlineForm(fields, onSubmit, onCancel) {
//     const form = document.createElement("form");
//     form.classList.add("inline-form");

//     fields.forEach(({ name, placeholder, value = "" }) => {
//         const input = document.createElement("input");
//         input.name = name;
//         input.placeholder = placeholder;
//         input.value = value;
//         input.required = true;
//         form.appendChild(input);
//     });

//     const saveBtn = document.createElement("button");
//     saveBtn.type = "submit";
//     saveBtn.textContent = "Save";
//     form.appendChild(saveBtn);

//     const cancelBtn = document.createElement("button");
//     cancelBtn.type = "button";
//     cancelBtn.textContent = "Cancel";
//     cancelBtn.addEventListener("click", () => {
//         if (onCancel) onCancel(form);
//     });
//     form.appendChild(cancelBtn);

//     form.addEventListener("submit", (e) => {
//         e.preventDefault();
//         const data = {};
//         fields.forEach(({ name }) => {
//             data[name] = form.elements[name].value;
//         });
//         onSubmit(data, form);
//     });

//     return form;
// }

export async function displayPlaceProducts(container, placeId, isCreator, isLoggedIn) {
    container.textContent = "";
    showLoading(container);

    try {
        const products = await apiFetch(`/place/${placeId}/products`);
        container.textContent = "";
        container.appendChild(createElement("h3", {}, ["Products"]));

        const section = createElement("div", { class: "product-section" });
        products.forEach(product => section.appendChild(renderProduct(product, placeId, isCreator, isLoggedIn, container)));
        container.appendChild(section);

        if (isCreator) {
            const addBtn = createButton("Add Product", async function () {
                const form = createProductForm(
                    [
                        { name: "name", placeholder: "Name", type : "text" },
                        { name: "price", placeholder: "Price", type: "number" }
                    ],
                    async (data, formEl) => {
                        await apiFetch(`/place/${placeId}/products`, "POST", JSON.stringify(data), {
                            headers: { "Content-Type": "application/json" }
                        });
                        displayPlaceProducts(container, placeId, isCreator, isLoggedIn);
                    },
                    () => {
                        container.removeChild(form);
                        addBtn.disabled = false;
                    }
                );
                container.appendChild(form);
                addBtn.disabled = true;
            });
            container.appendChild(addBtn);
        }

    } catch (err) {
        container.textContent = "";
        showError(container, "Products unavailable.");
    }
}

function renderProduct(item, placeId, isCreator, isLoggedIn, container) {
    const itemDiv = createElement("div", { class: "product-item" }, [
        createElement("h4", {}, [item.name]),
        createElement("p", {}, [`Price: ₹${item.price}`])
    ]);

    if (isLoggedIn) {
        itemDiv.appendChild(createButton("Buy", async () => {
            try {
                await apiFetch(`/place/${placeId}/products/${item._id}/buy`, "POST");
                alert(`Purchased ${item.name}`);
            } catch (e) {
                alert(`Purchase failed: ${e.message}`);
            }
        }));
    }

    if (isCreator) {
        const originalClone = itemDiv.cloneNode(true);

        const editBtn = createButton("Edit", () => {
            const form = createProductForm(
                [
                    { name: "name", placeholder: "Name", value: item.name },
                    { name: "price", placeholder: "Price", value: item.price }
                ],
                async (data, formEl) => {
                    await apiFetch(`/place/${placeId}/products/${item._id}`, "PUT", JSON.stringify(data), {
                        headers: { "Content-Type": "application/json" }
                    });
                    displayPlaceProducts(container, placeId, isCreator, isLoggedIn);
                },
                () => {
                    itemDiv.replaceChildren(...originalClone.childNodes);
                }
            );
            itemDiv.replaceChildren(form);
        });

        const deleteBtn = createButton("Delete", async () => {
            if (!confirm(`Delete product "${item.name}"?`)) return;
            try {
                await apiFetch(`/place/${placeId}/products/${item._id}`, "DELETE");
                displayPlaceProducts(container, placeId, isCreator, isLoggedIn);
            } catch (e) {
                alert(`Delete failed: ${e.message}`);
            }
        });

        itemDiv.appendChild(editBtn);
        itemDiv.appendChild(deleteBtn);
    }

    return itemDiv;
}

function createButton(label, onClick) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.type = "button";
    btn.addEventListener("click", onClick);
    return btn;
}

function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
        el.setAttribute(key, val);
    }
    for (const child of children) {
        el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return el;
}

function createProductForm(fields, onSubmit, onCancel) {
    const form = document.createElement("form");
    form.className = "inline-form";

    fields.forEach(({ name, placeholder, value = "", type }) => {
        const input = document.createElement("input");
        input.name = name;
        input.type = type;
        input.placeholder = placeholder;
        input.value = value;
        input.required = true;
        form.appendChild(input);
    });

    form.appendChild(createButton("Save", (e) => {
        e.preventDefault();
        const data = Object.fromEntries(fields.map(({ name }) => [name, form.elements[name].value]));
        onSubmit(data, form);
    }));

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => onCancel?.(form));
    form.appendChild(cancelBtn);

    return form;
}
