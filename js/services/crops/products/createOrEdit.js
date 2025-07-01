// src/ui/pages/farms/items/createOrEdit.js
import { apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";

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

  // Build form
  const form = createElement("form", { className: "item-form" });

  // Name
  const nameInput = createElement("input", {
    type: "text",
    placeholder: "Name",
    required: true,
    value: itemData?.name || ""
  });
  form.appendChild(
    createElement("label", {}, ["Name: ", nameInput])
  );

  // Category
  const categoryInput = createElement("input", {
    type: "text",
    placeholder: "Category",
    required: true,
    value: itemData?.category || ""
  });
  form.appendChild(
    createElement("label", {}, ["Category: ", categoryInput])
  );

  // Price
  const priceInput = createElement("input", {
    type: "number",
    step: "0.01",
    min: "0",
    placeholder: "Price (₹)",
    required: true,
    value: itemData?.price != null ? String(itemData.price) : ""
  });
  form.appendChild(
    createElement("label", {}, ["Price: ", priceInput])
  );

  // Description
  const descInput = createElement("textarea", {
    placeholder: "Description",
    required: true
  }, [itemData?.description || ""]);
  form.appendChild(
    createElement("label", {}, ["Description: ", descInput])
  );

  // Image URL
  const imgInput = createElement("input", {
    type: "text",
    placeholder: "Image URL",
    required: true,
    value: itemData?.imageUrl || ""
  });
  form.appendChild(
    createElement("label", {}, ["Image URL: ", imgInput])
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

  form.appendChild(
    createElement("div", { className: "form-actions" }, [
      submitBtn,
      cancelBtn
    ])
  );

  // In edit mode, add a Delete button
  if (mode === "edit" && itemData?.id) {
    const deleteBtn = Button(
      `Delete ${type}`,
      `delete-${type}-btn`,
      {
        click: async () => {
          if (!confirm(`Delete this ${type}?`)) return;
          try {
            await apiFetch(
              `/farm/${type}/${itemData.id}`,
              "DELETE"
            );
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

  // Handle submit
  form.onsubmit = async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    const payload = {
      name: nameInput.value.trim(),
      category: categoryInput.value.trim(),
      price: parseFloat(priceInput.value),
      description: descInput.value.trim(),
      imageUrl: imgInput.value.trim()
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

  // Render
  container.appendChild(form);
}
