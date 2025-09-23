import { apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import { createFormGroup } from "../../../components/createFormGroup.js";
import { createFileInputGroup } from "../../../components/createFileInputGroup.js";
import Button from "../../../components/base/Button.js";

/**
 * Renders a create/edit form for products or tools.
 */
export function renderItemForm(container, mode, itemData, type, onDone) {
  container.replaceChildren();

  const form = createElement("form", { class: "create-section" });

  // Utility: get category options based on type
  const getCategoryOptions = (type) => {
    if (type === "product") {
      return [
        { value: "", label: "Select category" },
        { value: "Spices", label: "Spices" },
        { value: "Pickles", label: "Pickles" },
        { value: "Flour", label: "Flour" },
        { value: "Oils", label: "Oils" },
        { value: "Honey", label: "Honey" },
        { value: "Tea & Coffee", label: "Tea & Coffee" },
        { value: "Dry Fruits", label: "Dry Fruits" },
        { value: "Natural Sweeteners", label: "Natural Sweeteners" }
      ];
    } else if (type === "tool") {
      return [
        { value: "", label: "Select category" },
        { value: "Cutting", label: "Cutting" },
        { value: "Irrigation", label: "Irrigation" },
        { value: "Harvesting", label: "Harvesting" },
        { value: "Hand Tools", label: "Hand Tools" },
        { value: "Protective Gear", label: "Protective Gear" },
        { value: "Fertilizer Applicators", label: "Fertilizer Applicators" }
      ];
    } else {
      return [];
    }
  };

  const nameGroup = createFormGroup({
    type: "text",
    id: "name",
    label: "Name",
    value: itemData?.name || "",
    placeholder: "Enter item name",
    required: true
  });

  const categoryGroup = createFormGroup({
    type: getCategoryOptions(type).length ? "select" : "text",
    id: "category",
    label: "Category",
    value: itemData?.category || "",
    placeholder: getCategoryOptions(type).length ? "" : "e.g., Fruit, Tool",
    required: true,
    options: getCategoryOptions(type)
  });

  const priceGroup = createFormGroup({
    type: "number",
    id: "price",
    label: "Price (₹)",
    value: itemData?.price ?? "",
    placeholder: "e.g., 49.99",
    required: true,
    additionalProps: { step: "0.01", min: "0" }
  });

  const quantityGroup = createFormGroup({
    type: "number",
    id: "quantity",
    label: "Quantity",
    value: itemData?.quantity ?? "",
    placeholder: "e.g., 100",
    required: true,
    additionalProps: { min: "0" }
  });

  const unitGroup = createFormGroup({
    type: "select",
    id: "unit",
    label: "Unit",
    value: itemData?.unit || "",
    required: true,
    options: [
      { value: "", label: "Select unit" },
      { value: "kg", label: "kg" },
      { value: "litre", label: "litre" },
      { value: "units", label: "units" }
    ]
  });

  const skuGroup = createFormGroup({
    type: "text",
    id: "sku",
    label: "SKU / Code",
    value: itemData?.sku || "",
    placeholder: "Optional code"
  });

  const availableFromGroup = createFormGroup({
    type: "date",
    id: "availableFrom",
    label: "Available From",
    value: itemData?.availableFrom?.slice(0, 10) || ""
  });

  const availableToGroup = createFormGroup({
    type: "date",
    id: "availableTo",
    label: "Available To",
    value: itemData?.availableTo?.slice(0, 10) || ""
  });

  const descriptionGroup = createFormGroup({
    type: "textarea",
    id: "description",
    label: "Description",
    value: itemData?.description || "",
    placeholder: "Detailed info",
    required: true
  });

  const imageGroup = createFileInputGroup({
    label: "Upload Images",
    inputId: "images",
    isRequired: mode === "create",
    multiple: true
  });

  const previewContainer = createElement("div", {
    style: "display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;"
  });
  imageGroup.appendChild(previewContainer);

  imageGroup.querySelector("input").addEventListener("change", (e) => {
    previewContainer.replaceChildren();
    Array.from(e.target.files).forEach(file => {
      const img = createElement("img", {
        src: URL.createObjectURL(file),
        style: "max-width: 150px; max-height: 150px; object-fit: cover; border-radius: 6px;"
      });
      previewContainer.appendChild(img);
    });
  });

  const featuredGroup = createFormGroup({
    type: "checkbox",
    id: "featured",
    label: "Featured?",
    additionalProps: { checked: itemData?.featured || false }
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
    imageGroup,
    featuredGroup
  );

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

  const actions = createElement("div", { class: "form-actions" }, [submitBtn, cancelBtn]);
  form.appendChild(actions);

  if (mode === "edit" && itemData?.productid) {
    const deleteBtn = Button(
      `Delete ${type}`,
      `delete-${type}-btn`,
      {
        click: async () => {
          if (!confirm(`Delete this ${type}?`)) return;
          try {
            await apiFetch(`/farm/${type}/${itemData.productid}`, "DELETE");
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

  // Submit logic
  form.onsubmit = async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;

    const formData = new FormData();
    formData.append("name", form.name.value.trim());
    formData.append("category", form.category.value.trim());
    formData.append("price", form.price.value);
    formData.append("quantity", form.quantity.value);
    formData.append("unit", form.unit.value);
    formData.append("sku", form.sku.value.trim());
    formData.append("availableFrom", form.availableFrom.value);
    formData.append("availableTo", form.availableTo.value);
    formData.append("description", form.description.value.trim());
    formData.append("featured", form.featured.checked);

    const fileInput = form.querySelector("#images");
    Array.from(fileInput.files).forEach((file, index) => formData.append(`images_${index + 1}`, file));

    const url = mode === "create" ? `/farm/${type}` : `/farm/${type}/${itemData.productid}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const res = await apiFetch(url, method, formData);
      if (!res.productid) throw new Error("Request failed");
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
