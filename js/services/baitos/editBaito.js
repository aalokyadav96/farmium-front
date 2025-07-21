import { createElement } from "../../components/createElement.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { navigate } from "../../routes/index.js";
import { apiFetch } from "../../api/api.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import { SRC_URL } from "../../api/api.js";

export function editBaito(baito) {
    const container = document.querySelector("#content"); // replace with your actual content container
    container.innerHTML = "";

    const section = createElement("div", { class: "edit-section" });
    container.appendChild(section);

    const categoryMap = {
        Food: ["Waiter", "Cook", "Delivery", "Cleaning"],
        Health: ["Reception", "Cleaner", "Helper"],
        Retail: ["Cashier", "Stock", "Floor Staff"],
        Hospitality: ["Housekeeping", "Front Desk", "Server"],
        Other: ["Manual Labor", "Seasonal Work", "Event Help"]
    };

    const form = document.createElement("form");
    form.setAttribute("enctype", "multipart/form-data");

    // Category fields
    form.appendChild(createFormGroup({
        label: "Job Category",
        inputType: "select",
        inputId: "category-main",
        isRequired: true,
        options: [{ value: "", label: "Select category" }, ...Object.keys(categoryMap).map(key => ({ value: key, label: key }))]
    }));

    form.appendChild(createFormGroup({
        label: "Role Type",
        inputType: "select",
        inputId: "category-sub",
        isRequired: true,
        options: [{ value: "", label: "Select role type" }]
    }));

    const descriptionCounter = createElement("small", { class: "char-count" });
    const reqCounter = createElement("small", { class: "char-count" });

    const fields = [
        { label: "Job Title", inputType: "text", inputId: "baito-title", isRequired: true },
        { label: "Working Hours", inputType: "text", inputId: "baito-workinghours", isRequired: true },
        { label: "Description", inputType: "textarea", inputId: "baito-description", isRequired: true, additionalNodes: [descriptionCounter] },
        { label: "Tags (comma separated)", inputType: "text", inputId: "baito-tags" },
        { label: "Location", inputType: "text", inputId: "baito-location", isRequired: true },
        { label: "Wage per Hour (in yen)", inputType: "number", inputId: "baito-wage", isRequired: true, additionalProps: { min: 1 } },
        { label: "Phone Number", inputType: "text", inputId: "baito-phone", isRequired: true },
        { label: "Banner Image", inputType: "file", inputId: "baito-banner", additionalProps: { accept: "image/*" } },
        { label: "Requirements", inputType: "textarea", inputId: "baito-requirements", isRequired: true, additionalNodes: [reqCounter] }
    ];

    fields.forEach(f => form.appendChild(createFormGroup(f)));

    // Prefill values
    form.querySelector("#baito-title").value = baito.title || "";
    form.querySelector("#baito-workinghours").value = baito.workHours || "";
    form.querySelector("#baito-description").value = baito.description || "";
    form.querySelector("#baito-tags").value = (baito.tags || []).join(", ");
    form.querySelector("#baito-location").value = baito.location || "";
    form.querySelector("#baito-wage").value = baito.wage || "";
    form.querySelector("#baito-phone").value = baito.phone || "";
    form.querySelector("#baito-requirements").value = baito.requirements || "";
    form.querySelector("#category-main").value = baito.category || "";

    // Populate subcategory options
    const sub = form.querySelector("#category-sub");
    sub.innerHTML = '<option value="">Select role type</option>';
    (categoryMap[baito.category] || []).forEach(subcat => {
        const option = createElement("option", { value: subcat }, [subcat]);
        sub.appendChild(option);
    });
    sub.value = baito.subcategory || "";

    // Show banner preview if exists
    const bannerInput = form.querySelector("#baito-banner");
    const bannerPreviewContainer = bannerInput.closest(".form-group");
    if (baito.banner) {
        const bannerPreview = createElement("img", {
            src: `${SRC_URL}/uploads/baitos/${baito.banner}`,
            class: "banner-preview"
        });
        bannerPreviewContainer.appendChild(bannerPreview);
    }

    bannerInput.addEventListener("change", () => {
        const file = bannerInput.files?.[0];
        const existingPreview = bannerPreviewContainer.querySelector(".banner-preview");
        if (existingPreview) existingPreview.remove();

        if (file) {
            const preview = createElement("img", {
                src: URL.createObjectURL(file),
                class: "banner-preview"
            });
            bannerPreviewContainer.appendChild(preview);
        }
    });

    // Live counters
    form.querySelector("#baito-description").addEventListener("input", e => {
        descriptionCounter.textContent = `${e.target.value.length} characters`;
    });
    form.querySelector("#baito-requirements").addEventListener("input", e => {
        reqCounter.textContent = `${e.target.value.length} characters`;
    });

    // Category change triggers sub update
    form.querySelector("#category-main").addEventListener("change", (e) => {
        sub.innerHTML = '<option value="">Select role type</option>';
        (categoryMap[e.target.value] || []).forEach(subcat => {
            const option = createElement("option", { value: subcat }, [subcat]);
            sub.appendChild(option);
        });
    });

    // Submit
    const submitBtn = createElement("button", { type: "submit", class: "btn btn-primary" }, ["Update Baito"]);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const requiredFields = {
            title: formData.get("baito-title")?.trim(),
            workHours: formData.get("baito-workinghours")?.trim(),
            description: formData.get("baito-description")?.trim(),
            requirements: formData.get("baito-requirements")?.trim(),
            location: formData.get("baito-location")?.trim(),
            wage: formData.get("baito-wage"),
            phone: formData.get("baito-phone")?.trim(),
            category: formData.get("category-main"),
            subcategory: formData.get("category-sub")
        };

        if (Object.values(requiredFields).some(v => !v)) {
            Snackbar("Please fill in all required fields.", 3000);
            submitBtn.disabled = false;
            return;
        }

        if (Number(requiredFields.wage) <= 0) {
            Snackbar("Wage must be greater than 0.", 3000);
            submitBtn.disabled = false;
            return;
        }

        const payload = new FormData();
        Object.entries(requiredFields).forEach(([key, value]) => payload.append(key, value));

        const tags = formData.get("baito-tags")?.trim();
        if (tags) payload.append("tags", tags);

        const bannerFile = bannerInput?.files?.[0];
        if (bannerFile) payload.append("banner", bannerFile);

        try {
            Snackbar("Updating baito...", 2000);
            const result = await apiFetch(`/baitos/baito/${baito._id}`, "PATCH", payload);
            Snackbar("Baito updated successfully!", 3000);
            navigate(`/baito/${baito._id}`);
        } catch (err) {
            Snackbar(`Error: ${err.message || "Failed to update baito."}`, 3000);
        } finally {
            submitBtn.disabled = false;
        }
    });

    form.appendChild(submitBtn);
    section.append(createElement("h2", {}, ["Edit Baito"]), form);
}
