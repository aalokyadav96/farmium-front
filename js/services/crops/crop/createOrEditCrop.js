import { createElement } from "../../../components/createElement.js";

export const cropCategoryMap = {
    Vegetables: ["Tomato", "Potato", "Brinjal", "Spinach"],
    Fruits: ["Mango", "Banana", "Guava", "Papaya"],
    Grains: ["Wheat", "Rice", "Corn", "Barley"],
    Legumes: ["Chickpea", "Lentil", "Pea"]
};

export function createCommonCropForm({
    crop = {},
    currentFarmName = "",
    isEdit = false,
    onSubmit
}) {
    const form = createElement("form", { class: isEdit ? "crop-edit-form" : "crop-create-form" });

    const createField = (labelText, inputElement) => {
        const group = createElement("div", { class: "form-group" });
        const label = createElement("label", {}, [labelText]);
        label.appendChild(inputElement);
        group.appendChild(label);
        return group;
    };

    let preCategory = "";
    if (crop.name) {
        for (const [cat, crops] of Object.entries(cropCategoryMap)) {
            if (crops.includes(crop.name)) {
                preCategory = cat;
                break;
            }
        }
    }

    const categorySelect = createElement("select", { name: "crop-category", required: true }, [
        createElement("option", { value: "" }, ["Select Category"]),
        ...Object.keys(cropCategoryMap).map(category =>
            createElement("option", {
                value: category,
                selected: category === preCategory
            }, [category])
        )
    ]);

    const cropSelect = createElement("select", { name: "name", required: true }, [
        createElement("option", { value: "" }, ["Select Crop"])
    ]);

    function populateCrops(category) {
        cropSelect.innerHTML = '<option value="">Select Crop</option>';
        const crops = cropCategoryMap[category];
        if (!crops) {
            cropSelect.disabled = true;
            return;
        }
        crops.forEach(c => {
            cropSelect.appendChild(createElement("option", {
                value: c,
                selected: c === crop.name
            }, [c]));
        });
        cropSelect.disabled = false;
    }

    populateCrops(preCategory);
    categorySelect.addEventListener("change", e => populateCrops(e.target.value));

    const priceInput = createElement("input", {
        type: "number", step: "0.01", name: "price",
        value: crop.price || "", required: true
    });
    const quantityInput = createElement("input", {
        type: "number", name: "quantity",
        value: crop.quantity || "", required: true
    });

    const unitSelect = createElement("select", { name: "unit", required: true });
    ["kg", "liters", "dozen", "units"].forEach(unit => {
        unitSelect.appendChild(createElement("option", {
            value: unit,
            selected: unit === crop.unit
        }, [unit]));
    });

    const notesInput = createElement("textarea", { name: "notes" }, [crop.notes || ""]);
    const harvestDateInput = createElement("input", {
        type: "date", name: "harvestDate",
        value: crop.harvestDate?.split("T")[0] || ""
    });
    const expiryDateInput = createElement("input", {
        type: "date", name: "expiryDate",
        value: crop.expiryDate?.split("T")[0] || ""
    });

    const featuredCheckbox = createElement("input", {
        type: "checkbox", name: "featured",
        checked: crop.featured || false
    });
    const outOfStockCheckbox = createElement("input", {
        type: "checkbox", name: "outOfStock",
        // checked: crop.outOfStock || false
    });

    const imageInput = createElement("input", {
        type: "file", accept: "image/*", name: "image"
    });

    const imagePreview = createElement("img", {
        class: "preview-img",
        src: crop.imageUrl || "",
        style: "max-height: 100px; margin-top: 8px;" +
            (crop.imageUrl ? "" : "display: none;")
    });

    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];
        if (file) {
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = "block";
        }
    });

    const fields = [
        createField("Category", categorySelect),
        createField("Crop", cropSelect),
        createField("Price", priceInput),
        createField("Quantity", quantityInput),
        createField("Unit", unitSelect),
        createField("Notes", notesInput),
        createField("Harvest Date", harvestDateInput),
        createField("Expiry Date", expiryDateInput),
        createField("Featured", featuredCheckbox),
        createField("Out of Stock", outOfStockCheckbox),
        createField("Image", imageInput)
    ];

    if (!isEdit && currentFarmName) {
        const farmNameInput = createElement("input", {
            type: "hidden", name: "farmName", value: currentFarmName
        });
        fields.push(farmNameInput);
    }

    fields.forEach(f => form.appendChild(f));
    form.appendChild(imagePreview);

    const submitBtn = createElement("button", { type: "submit" }, [
        isEdit ? "Save Changes" : "Add Crop"
    ]);
    form.appendChild(submitBtn);

    form.addEventListener("submit", e => {
        e.preventDefault();

        if (harvestDateInput.value && expiryDateInput.value) {
            const h = new Date(harvestDateInput.value);
            const x = new Date(expiryDateInput.value);
            if (h > x) {
                form.parentElement.textContent = "❌ Expiry date must be after harvest date.";
                return;
            }
        }

        const formData = new FormData();
        formData.append("name", cropSelect.value);
        formData.append("category", categorySelect.value);
        formData.append("price", priceInput.value);
        formData.append("quantity", quantityInput.value);
        formData.append("unit", unitSelect.value);
        formData.append("notes", notesInput.value.trim());
        formData.append("harvestDate", harvestDateInput.value);
        formData.append("expiryDate", expiryDateInput.value);
        formData.append("featured", featuredCheckbox.checked.toString());
        formData.append("outOfStock", outOfStockCheckbox.checked.toString());
        if (imageInput.files.length > 0) {
            formData.append("image", imageInput.files[0]);
        }
        if (!isEdit && currentFarmName) {
            formData.append("farmName", currentFarmName);
        }

        onSubmit(formData, submitBtn);
    });

    return form;
}
