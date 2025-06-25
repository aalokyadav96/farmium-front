import { createCommonCropForm } from "./createOrEditCrop.js";
import { apiFetch } from "../../../api/api.js";

// export default function editCropPage({ farmName, crop }) {
export async function editCrop({ farmName, crop }) {
    const container = document.createElement("div");

    const form = createCommonCropForm({
        crop,
        currentFarmName: farmName,
        isEdit: true,
        onSubmit: async (formData, submitBtn) => {
            submitBtn.disabled = true;
            try {
                const res = await apiFetch(`/farms/${farmName}/crops/${crop.name}`, {
                    method: "PUT",
                    body: formData
                });
                container.textContent = "✅ Crop updated successfully.";
            } catch (err) {
                container.textContent = `❌ ${err.message}`;
            } finally {
                submitBtn.disabled = false;
            }
        }
    });

    container.appendChild(form);
    return container;
}

// import { apiFetch } from "../../../api/api.js";
// import { createElement } from "../../../components/createElement.js";

// const cropCategoryMap = {
//     Vegetables: ["Tomato", "Potato", "Brinjal", "Spinach"],
//     Fruits: ["Mango", "Banana", "Guava", "Papaya"],
//     Grains: ["Wheat", "Rice", "Corn", "Barley"],
//     Legumes: ["Chickpea", "Lentil", "Pea"]
// };

// export function editCrop(isLoggedIn, farmId, crop, container) {
//     container.textContent = "";

//     if (!isLoggedIn) {
//         container.textContent = "Please log in to edit crops.";
//         return;
//     }

//     const form = createElement("form", { class: "crop-edit-form" });

//     const createField = (labelText, inputElement) => {
//         const group = createElement("div", { class: "form-group" });
//         const label = createElement("label", {}, [labelText]);
//         label.appendChild(inputElement);
//         group.appendChild(label);
//         return group;
//     };

//     // Determine category from crop name
//     let preCategory = "";
//     for (const [cat, crops] of Object.entries(cropCategoryMap)) {
//         if (crops.includes(crop.name)) {
//             preCategory = cat;
//             break;
//         }
//     }

//     const categorySelect = createElement("select", { name: "crop-category", required: true }, [
//         createElement("option", { value: "" }, ["Select Category"]),
//         ...Object.keys(cropCategoryMap).map(category =>
//             createElement("option", {
//                 value: category,
//                 selected: category === preCategory
//             }, [category])
//         )
//     ]);

//     const cropSelect = createElement("select", { name: "name", required: true }, [
//         createElement("option", { value: "" }, ["Select Crop"])
//     ]);

//     function populateCrops(category) {
//         cropSelect.innerHTML = '<option value="">Select Crop</option>';
//         const crops = cropCategoryMap[category];
//         if (!crops) {
//             cropSelect.disabled = true;
//             return;
//         }
//         crops.forEach(c => {
//             cropSelect.appendChild(createElement("option", {
//                 value: c,
//                 selected: c === crop.name
//             }, [c]));
//         });
//         cropSelect.disabled = false;
//     }

//     populateCrops(preCategory);
//     categorySelect.addEventListener("change", e => populateCrops(e.target.value));

//     const priceInput = createElement("input", { type: "number", step: "0.01", name: "price", value: crop.price || 0, required: true });
//     const quantityInput = createElement("input", { type: "number", name: "quantity", value: crop.quantity || 0, required: true });

//     const unitSelect = createElement("select", { name: "unit", required: true });
//     ["kg", "liters", "dozen", "units"].forEach(unit =>
//         unitSelect.appendChild(createElement("option", {
//             value: unit,
//             selected: unit === crop.unit
//         }, [unit]))
//     );

//     const notesInput = createElement("textarea", { name: "notes" }, [crop.notes || ""]);
//     const harvestDateInput = createElement("input", {
//         type: "date",
//         name: "harvestDate",
//         value: crop.harvestDate?.split("T")[0] || ""
//     });
//     const expiryDateInput = createElement("input", {
//         type: "date",
//         name: "expiryDate",
//         value: crop.expiryDate?.split("T")[0] || ""
//     });

//     const featuredCheckbox = createElement("input", { type: "checkbox", name: "featured", checked: crop.featured || false });
//     const outOfStockCheckbox = createElement("input", { type: "checkbox", name: "outOfStock", checked: crop.outOfStock || false });

//     const imageInput = createElement("input", { type: "file", accept: "image/*", name: "image" });
//     const imagePreview = createElement("img", {
//         src: crop.imageUrl || "",
//         class: "preview-img",
//         style: "max-height: 100px; margin-top: 8px;"
//     });

//     imageInput.addEventListener("change", () => {
//         const file = imageInput.files[0];
//         if (file) imagePreview.src = URL.createObjectURL(file);
//     });

//     [
//         createField("Category", categorySelect),
//         createField("Crop", cropSelect),
//         createField("Price", priceInput),
//         createField("Quantity", quantityInput),
//         createField("Unit", unitSelect),
//         createField("Notes", notesInput),
//         createField("Harvest Date", harvestDateInput),
//         createField("Expiry Date", expiryDateInput),
//         createField("Featured", featuredCheckbox),
//         createField("Out of Stock", outOfStockCheckbox),
//         createField("Image", imageInput)
//     ].forEach(field => form.appendChild(field));

//     form.appendChild(imagePreview);
//     form.appendChild(createElement("button", { type: "submit" }, ["Save Changes"]));
//     container.appendChild(form);

//     form.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         // Client-side validation
//         if (harvestDateInput.value && expiryDateInput.value) {
//             const h = new Date(harvestDateInput.value);
//             const x = new Date(expiryDateInput.value);
//             if (h > x) {
//                 container.textContent = "❌ Expiry date must be after harvest date.";
//                 return;
//             }
//         }

//         const formData = new FormData();
//         formData.append("name", cropSelect.value);
//         formData.append("category", categorySelect.value);
//         formData.append("price", priceInput.value);
//         formData.append("quantity", quantityInput.value);
//         formData.append("unit", unitSelect.value);
//         formData.append("notes", notesInput.value.trim());
//         formData.append("harvestDate", harvestDateInput.value);
//         formData.append("expiryDate", expiryDateInput.value);
//         formData.append("featured", featuredCheckbox.checked.toString());
//         formData.append("outOfStock", outOfStockCheckbox.checked.toString());

//         if (imageInput.files[0]) {
//             formData.append("image", imageInput.files[0]);
//         }

//         const res = await apiFetch(`/farms/${farmId}/crops/${crop.id}`, "PUT", formData);
//         container.textContent = res.success ? "✅ Crop updated." : "❌ Failed to update crop.";
//     });
// }
