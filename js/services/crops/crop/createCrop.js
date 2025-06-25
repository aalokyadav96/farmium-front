import { createCommonCropForm } from "./createOrEditCrop.js";
import { apiFetch } from "../../../api/api.js";

// export default function createCropPage({ farmName }) {
export async function createCrop(farmName, container) {
    // const container = document.createElement("div");

    const form = createCommonCropForm({
        currentFarmName: farmName,
        isEdit: false,
        onSubmit: async (formData, submitBtn) => {
            submitBtn.disabled = true;
            try {
                const res = await apiFetch(`/farms/${farmName}/crops`, "POST", formData);
                container.textContent = "✅ Crop created successfully.";
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

// export function createCrop(isLoggedIn, farmId, container, currentFarmName = "") {
//     container.textContent = "";

//     if (!isLoggedIn) {
//         container.textContent = "Please log in to add crops.";
//         return;
//     }

//     const form = createElement("form", { class: "crop-create-form" });

//     const createField = (labelText, inputElement) => {
//         const group = createElement("div", { class: "form-group" });
//         const label = createElement("label", {}, [labelText]);
//         label.appendChild(inputElement);
//         group.appendChild(label);
//         return group;
//     };

//     const categorySelect = createElement("select", { name: "crop-category", required: true }, [
//         createElement("option", { value: "" }, ["Select Category"]),
//         ...Object.keys(cropCategoryMap).map(category =>
//             createElement("option", { value: category }, [category])
//         )
//     ]);

//     const cropSelect = createElement("select", { name: "name", required: true, disabled: true }, [
//         createElement("option", { value: "" }, ["Select Crop"])
//     ]);

//     function populateCrops(category) {
//         cropSelect.innerHTML = '<option value="">Select Crop</option>';
//         const crops = cropCategoryMap[category];
//         if (!crops) {
//             cropSelect.disabled = true;
//             return;
//         }
//         crops.forEach(crop => {
//             cropSelect.appendChild(createElement("option", { value: crop }, [crop]));
//         });
//         cropSelect.disabled = false;
//     }

//     categorySelect.addEventListener("change", (e) => {
//         populateCrops(e.target.value);
//     });

//     const priceInput = createElement("input", { type: "number", step: "0.01", name: "price", required: true });
//     const quantityInput = createElement("input", { type: "number", name: "quantity", required: true });
//     const unitSelect = createElement("select", { name: "unit", required: true });
//     ["kg", "liters", "dozen", "units"].forEach(unit =>
//         unitSelect.appendChild(createElement("option", { value: unit }, [unit]))
//     );

//     const notesInput = createElement("textarea", { name: "notes" });
//     const harvestDateInput = createElement("input", { type: "date", name: "harvestDate" });
//     const expiryDateInput = createElement("input", { type: "date", name: "expiryDate" });
//     const featuredCheckbox = createElement("input", { type: "checkbox", name: "featured" });
//     const outOfStockCheckbox = createElement("input", { type: "checkbox", name: "outOfStock" });
//     const imageInput = createElement("input", { type: "file", accept: "image/*", name: "image" });

//     const imagePreview = createElement("img", {
//         class: "preview-img",
//         style: "max-height: 100px; margin-top: 8px; display: none;"
//     });

//     imageInput.addEventListener("change", () => {
//         const file = imageInput.files[0];
//         if (file) {
//             imagePreview.src = URL.createObjectURL(file);
//             imagePreview.style.display = "block";
//         } else {
//             imagePreview.style.display = "none";
//         }
//     });

//     const farmNameInput = createElement("input", {
//         type: "hidden",
//         name: "farmName",
//         value: currentFarmName
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
//         createField("Image", imageInput),
//         farmNameInput
//     ].forEach(field => form.appendChild(field));

//     form.appendChild(imagePreview);
//     const submitBtn = createElement("button", { type: "submit" }, ["Add Crop"]);
//     form.appendChild(submitBtn);
//     container.appendChild(form);

//     form.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         if (!cropSelect.value || !priceInput.value || !quantityInput.value || !unitSelect.value) {
//             container.textContent = "❌ Please fill in all required fields.";
//             return;
//         }

//         if (harvestDateInput.value && expiryDateInput.value) {
//             const h = new Date(harvestDateInput.value);
//             const x = new Date(expiryDateInput.value);
//             if (h > x) {
//                 container.textContent = "❌ Expiry date should be after harvest date.";
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
//         if (currentFarmName) formData.append("farmName", currentFarmName);

//         if (imageInput.files.length > 0) {
//             formData.append("image", imageInput.files[0]);
//         }

//         submitBtn.disabled = true;
//         submitBtn.textContent = "Adding...";

//         try {
//             const res = await apiFetch(`/farms/${farmId}/crops`, "POST", formData);
//             if (res.success) {
//                 container.textContent = "✅ Crop created successfully.";
//                 form.reset();
//                 cropSelect.disabled = true;
//                 imagePreview.style.display = "none";
//             } else {
//                 container.textContent = "❌ Failed to create crop.";
//             }
//         } catch (err) {
//             console.error(err);
//             container.textContent = "❌ An error occurred while creating the crop.";
//         } finally {
//             submitBtn.disabled = false;
//             submitBtn.textContent = "Add Crop";
//         }
//     });
// }
