// src/ui/pages/farms/items/createOrEdit.js
import { apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";
import { createFormGroup } from "../../../components/createFormGroup.js";

/**
 * Renders a create/edit form for products or tools.
 *
 * @param {HTMLElement} container   — where to render the form
 * @param {"create"|"edit"} mode    — “create” or “edit”
 * @param {Object|null} itemData    — existing item (for edit) or null
 * @param {"product"|"tool"} type   — which endpoint to hit
 * @param {Function} onDone         — callback to run after success or cancel
 */
export function renderItemForm(container, mode, itemData, type, onDone) {
  container.replaceChildren();

  const form = createElement("form", { className: "item-form" });

  // Fields using createFormGroup
  const nameGroup = createFormGroup({
    label: "Name",
    inputType: "text",
    inputId: "name",
    inputValue: itemData?.name || "",
    placeholder: "Enter item name",
    isRequired: true
  });

  const categoryGroup = createFormGroup({
    label: "Category",
    inputType: "text",
    inputId: "category",
    inputValue: itemData?.category || "",
    placeholder: "e.g., Fruit, Tool",
    isRequired: true
  });

  const priceGroup = createFormGroup({
    label: "Price (₹)",
    inputType: "number",
    inputId: "price",
    inputValue: itemData?.price ?? "",
    placeholder: "e.g., 49.99",
    isRequired: true,
    additionalProps: {
      step: "0.01",
      min: "0"
    }
  });

  const quantityGroup = createFormGroup({
    label: "Quantity",
    inputType: "number",
    inputId: "quantity",
    inputValue: itemData?.quantity ?? "",
    placeholder: "e.g., 100",
    isRequired: true,
    additionalProps: {
      min: "0"
    }
  });

  const unitGroup = createFormGroup({
    label: "Unit",
    inputType: "select",
    inputId: "unit",
    inputValue: itemData?.unit || "",
    isRequired: true,
    options: [
      { value: "", label: "Select unit" },
      { value: "kg", label: "kg" },
      { value: "litre", label: "litre" },
      { value: "units", label: "units" }
    ]
  });

  const skuGroup = createFormGroup({
    label: "SKU / Code",
    inputType: "text",
    inputId: "sku",
    inputValue: itemData?.sku || "",
    placeholder: "Optional code"
  });

  const availableFromGroup = createFormGroup({
    label: "Available From",
    inputType: "date",
    inputId: "availableFrom",
    inputValue: itemData?.availableFrom?.slice(0, 10) || ""
  });

  const availableToGroup = createFormGroup({
    label: "Available To",
    inputType: "date",
    inputId: "availableTo",
    inputValue: itemData?.availableTo?.slice(0, 10) || ""
  });

  const descriptionGroup = createFormGroup({
    label: "Description",
    inputType: "textarea",
    inputId: "description",
    inputValue: itemData?.description || "",
    placeholder: "Detailed info",
    isRequired: true
  });

  const imageUrlGroup = createFormGroup({
    label: "Image URL",
    inputType: "text",
    inputId: "imageUrl",
    inputValue: itemData?.imageUrl || "",
    placeholder: "/uploads/item.png",
    isRequired: true
  });

  const featuredGroup = createFormGroup({
    label: "Featured?",
    inputType: "checkbox",
    inputId: "featured",
    inputValue: "",
    additionalProps: {
      checked: itemData?.featured || false
    }
  });

  form.append(
    nameGroup,
    categoryGroup,
    priceGroup,
    quantityGroup,
    unitGroup,
    skuGroup,
    availableFromGroup,
    availableToGroup,
    descriptionGroup,
    imageUrlGroup,
    featuredGroup
  );

  // Action buttons
  const submitBtn = Button(
    mode === "create" ? `Create ${type}` : `Update ${type}`,
    `submit-${type}-btn`,
    {},
    "primary-button"
  );

  const cancelBtn = Button(
    "Cancel",
    `cancel-${type}-btn`,
    { click: () => onDone() },
    "secondary-button"
  );

  const actions = createElement("div", { class: "form-actions" }, [
    submitBtn,
    cancelBtn
  ]);

  form.appendChild(actions);

  // Optional delete button
  if (mode === "edit" && itemData?.id) {
    const deleteBtn = Button(
      `Delete ${type}`,
      `delete-${type}-btn`,
      {
        click: async () => {
          if (!confirm(`Delete this ${type}?`)) return;
          try {
            await apiFetch(`/farm/${type}/${itemData.id}`, "DELETE");
            onDone();
          } catch (err) {
            alert("Delete failed");
            console.error(err);
          }
        }
      },
      "danger-button"
    );
    form.appendChild(deleteBtn);
  }

  // Form submission logic
  form.onsubmit = async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;

    const payload = {
      name: form.name.value.trim(),
      category: form.category.value.trim(),
      price: parseFloat(form.price.value),
      quantity: parseFloat(form.quantity.value),
      unit: form.unit.value,
      sku: form.sku.value.trim(),
      availableFrom: form.availableFrom.value || null,
      availableTo: form.availableTo.value || null,
      description: form.description.value.trim(),
      imageUrl: form.imageUrl.value.trim(),
      featured: form.featured.checked
    };

    const url =
      mode === "create"
        ? `/farm/${type}`
        : `/farm/${type}/${itemData.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      await apiFetch(url, method, JSON.stringify(payload));
      onDone();
    } catch (err) {
      alert(`${mode === "create" ? "Create" : "Update"} failed`);
      console.error(err);
    } finally {
      submitBtn.disabled = false;
    }
  };

  container.appendChild(form);
}

// // src/ui/pages/farms/items/createOrEdit.js
// import { apiFetch } from "../../../api/api.js";
// import { createElement } from "../../../components/createElement.js";
// import Button from "../../../components/base/Button.js";

// /**
//  * Renders a create/edit form for products or tools.
//  *
//  * @param {HTMLElement} container   — where to render the form
//  * @param {"create"|"edit"} mode    — “create” or “edit”
//  * @param {Object|null} itemData    — existing item (for edit) or null
//  * @param {"product"|"tool"} type   — which endpoint to hit
//  * @param {Function} onDone         — callback to run after success or cancel
//  */
// export function renderItemForm(container, mode, itemData, type, onDone) {
//   container.replaceChildren();

//   // Build form
//   const form = createElement("form", { className: "item-form" });

//   // Name
//   const nameInput = createElement("input", {
//     type: "text",
//     placeholder: "Name",
//     required: true,
//     value: itemData?.name || ""
//   });
//   form.appendChild(
//     createElement("label", {}, ["Name: ", nameInput])
//   );

//   // Category
//   const categoryInput = createElement("input", {
//     type: "text",
//     placeholder: "Category",
//     required: true,
//     value: itemData?.category || ""
//   });
//   form.appendChild(
//     createElement("label", {}, ["Category: ", categoryInput])
//   );

//   // Price
//   const priceInput = createElement("input", {
//     type: "number",
//     step: "0.01",
//     min: "0",
//     placeholder: "Price (₹)",
//     required: true,
//     value: itemData?.price != null ? String(itemData.price) : ""
//   });
//   form.appendChild(
//     createElement("label", {}, ["Price: ", priceInput])
//   );

//   // Description
//   const descInput = createElement("textarea", {
//     placeholder: "Description",
//     required: true
//   }, [itemData?.description || ""]);
//   form.appendChild(
//     createElement("label", {}, ["Description: ", descInput])
//   );

//   // Image URL
//   const imgInput = createElement("input", {
//     type: "text",
//     placeholder: "Image URL",
//     required: true,
//     value: itemData?.imageUrl || ""
//   });
//   form.appendChild(
//     createElement("label", {}, ["Image URL: ", imgInput])
//   );

//   // Action buttons
//   const submitBtn = Button(
//     mode === "create" ? `Create ${type}` : `Update ${type}`,
//     `submit-${type}-btn`,
//     {},
//     "primary-button"
//   );
//   const cancelBtn = Button(
//     "Cancel",
//     `cancel-${type}-btn`,
//     { click: () => onDone() },
//     "secondary-button"
//   );

//   form.appendChild(
//     createElement("div", { className: "form-actions" }, [
//       submitBtn,
//       cancelBtn
//     ])
//   );

//   // In edit mode, add a Delete button
//   if (mode === "edit" && itemData?.id) {
//     const deleteBtn = Button(
//       `Delete ${type}`,
//       `delete-${type}-btn`,
//       {
//         click: async () => {
//           if (!confirm(`Delete this ${type}?`)) return;
//           try {
//             await apiFetch(
//               `/farm/${type}/${itemData.id}`,
//               "DELETE"
//             );
//             onDone();
//           } catch (err) {
//             alert("Delete failed");
//             console.error(err);
//           }
//         }
//       },
//       "danger-button"
//     );
//     form.appendChild(deleteBtn);
//   }

//   // Handle submit
//   form.onsubmit = async (e) => {
//     e.preventDefault();
//     submitBtn.disabled = true;
//     const payload = {
//       name: nameInput.value.trim(),
//       category: categoryInput.value.trim(),
//       price: parseFloat(priceInput.value),
//       description: descInput.value.trim(),
//       imageUrl: imgInput.value.trim()
//     };

//     const url =
//       mode === "create"
//         ? `/farm/${type}`
//         : `/farm/${type}/${itemData.id}`;
//     const method = mode === "create" ? "POST" : "PUT";

//     try {
//       await apiFetch(url, method, JSON.stringify(payload));
//       onDone();
//     } catch (err) {
//       alert(`${mode === "create" ? "Create" : "Update"} failed`);
//       console.error(err);
//     } finally {
//       submitBtn.disabled = false;
//     }
//   };

//   // Render
//   container.appendChild(form);
// }
