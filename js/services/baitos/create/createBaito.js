import { createElement } from "../../../components/createElement.js";
import Snackbar from '../../../components/ui/Snackbar.mjs';
import { navigate } from "../../../routes/index.js";
import { apiFetch } from "../../../api/api.js";
import { createFormGroup } from "../../../components/createFormGroup.js";
import Notify from "../../../components/ui/Notify.mjs";

async function createBaito(isLoggedIn, contentContainer) {
    const createSection = createElement('div', { class: "create-section" });
    contentContainer.innerHTML = "";
    contentContainer.appendChild(createSection);

    if (!isLoggedIn) {
        Snackbar("You must be logged in to post a job (baito).", 3000);
        navigate('/login');
        return;
    }

    const categoryMap = {
        Food: ["Waiter", "Cook", "Delivery", "Cleaning"],
        Health: ["Reception", "Cleaner", "Helper"],
        Retail: ["Cashier", "Stock", "Floor Staff"],
        Hospitality: ["Housekeeping", "Front Desk", "Server"],
        Other: ["Manual Labor", "Seasonal Work", "Event Help"]
    };

    const form = document.createElement('form');
    form.setAttribute('enctype', 'multipart/form-data');

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

    // Character counters
    const descriptionCounter = createElement("small", { class: "char-count" });
    const reqCounter = createElement("small", { class: "char-count" });

    // Baito fields
    const fields = [
        { label: "Job Title", inputType: "text", inputId: "baito-title", isRequired: true, placeholder: "e.g. Kitchen Helper" },
        { label: "Working Hours", inputType: "text", inputId: "baito-workinghours", isRequired: true, placeholder: "e.g. 10am–6pm, 3 shifts/week" },
        { label: "Description", inputType: "textarea", inputId: "baito-description", isRequired: true, placeholder: "Responsibilities, shift timings, etc.", additionalNodes: [descriptionCounter] },
        { label: "Tags (comma separated)", inputType: "text", inputId: "baito-tags", placeholder: "e.g. weekends, student-friendly" },
        { label: "Location", inputType: "text", inputId: "baito-location", isRequired: true, placeholder: "e.g. Shibuya, Tokyo" },
        { label: "Wage per Hour (in yen)", inputType: "number", inputId: "baito-wage", isRequired: true, placeholder: "e.g. 1200", additionalProps: { min: 1 } },
        { label: "Phone Number", inputType: "text", inputId: "baito-phone", isRequired: true, placeholder: "e.g. 080-1234-5678" },
        { label: "Banner Image", inputType: "file", inputId: "baito-banner", additionalProps: { accept: 'image/*' } },
        { label: "Requirements", inputType: "textarea", inputId: "baito-requirements", isRequired: true, placeholder: "Qualifications, language, etc.", additionalNodes: [reqCounter] },
    ];

    fields.forEach(f => form.appendChild(createFormGroup(f)));

    // Subcategory update
    form.querySelector("#category-main").addEventListener('change', (e) => {
        const sub = form.querySelector("#category-sub");
        sub.innerHTML = '<option value="">Select role type</option>';
        (categoryMap[e.target.value] || []).forEach(subcat => {
            const option = createElement("option", { value: subcat }, [subcat]);
            sub.appendChild(option);
        });
    });

    // Live char counter
    form.querySelector("#baito-description").addEventListener("input", e => {
        descriptionCounter.textContent = `${e.target.value.length} characters`;
    });
    form.querySelector("#baito-requirements").addEventListener("input", e => {
        reqCounter.textContent = `${e.target.value.length} characters`;
    });

    // Banner preview with overwrite
    const bannerInput = form.querySelector("#baito-banner");
    bannerInput.addEventListener("change", () => {
        const file = bannerInput.files?.[0];
        const previewContainer = bannerInput.closest(".form-group");

        const existingPreview = previewContainer.querySelector(".banner-preview");
        if (existingPreview) existingPreview.remove();

        if (file) {
            const preview = createElement("img", {
                src: URL.createObjectURL(file),
                class: "banner-preview"
            });
            previewContainer.appendChild(preview);
        }
    });

    // Submit handler
    const submitBtn = createElement('button', {
        type: 'submit',
        class: 'btn btn-primary'
    }, ["Create Baito"]);

    form.addEventListener('submit', async (e) => {
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

        // Optional: append tags if backend supports it
        const tags = formData.get("baito-tags")?.trim();
        if (tags) payload.append("tags", tags);

        const bannerFile = bannerInput?.files?.[0];
        if (bannerFile) payload.append("banner", bannerFile);

        try {
            Snackbar("Creating baito...", 2000);
            const result = await apiFetch("/baitos/baito", "POST", payload);
            Snackbar("Baito created successfully!", 3000);
            navigate(`/baito/${result.baitoid}`);
        } catch (err) {
            Snackbar(`Error: ${err.message || "Failed to create baito."}`, 3000);
        } finally {
            submitBtn.disabled = false;
        }
    });

    form.appendChild(submitBtn);
    createSection.append(createElement('h2', {}, ["Create Baito"]), form);
}

export { createBaito };

// import { createElement } from "../../components/createElement.js";
// import Snackbar from '../../components/ui/Snackbar.mjs';
// import { navigate } from "../../routes/index.js";
// import { apiFetch } from "../../api/api.js";
// import { createFormGroup } from "../../components/createFormGroup.js";

// async function createBaito(isLoggedIn, contentContainer) {
//     const createSection = createElement('div', { class: "create-section" });
//     contentContainer.innerHTML = "";
//     contentContainer.appendChild(createSection);

//     if (!isLoggedIn) {
//         Snackbar("You must be logged in to post a job (baito).", 3000);
//         navigate('/login');
//         return;
//     }

//     const categoryMap = {
//         Food: ["Waiter", "Cook", "Delivery", "Cleaning"],
//         Health: ["Reception", "Cleaner", "Helper"],
//         Retail: ["Cashier", "Stock", "Floor Staff"],
//         Hospitality: ["Housekeeping", "Front Desk", "Server"],
//         Other: ["Manual Labor", "Seasonal Work", "Event Help"]
//     };

//     const form = document.createElement('form');

//     // Category fields
//     form.appendChild(createFormGroup({
//         label: "Job Category",
//         inputType: "select",
//         inputId: "category-main",
//         isRequired: true,
//         options: [{ value: "", label: "Select category" }, ...Object.keys(categoryMap).map(key => ({ value: key, label: key }))]
//     }));

//     form.appendChild(createFormGroup({
//         label: "Role Type",
//         inputType: "select",
//         inputId: "category-sub",
//         isRequired: true,
//         options: [{ value: "", label: "Select role type" }]
//     }));

//     // Character counters
//     const descriptionCounter = createElement("small", { class: "char-count" });
//     const reqCounter = createElement("small", { class: "char-count" });

//     // Baito fields
//     const fields = [
//         { label: "Job Title", inputType: "text", inputId: "baito-title", isRequired: true, placeholder: "e.g. Kitchen Helper" },
//         { label: "Job Type", inputType: "select", inputId: "baito-jobtype", isRequired: true, options: [
//             { value: "", label: "Select job type" },
//             { value: "Full-Time", label: "Full-Time" },
//             { value: "Part-Time", label: "Part-Time" },
//             { value: "Temporary", label: "Temporary" },
//             { value: "Internship", label: "Internship" }
//         ]},
//         { label: "Working Hours", inputType: "text", inputId: "baito-workinghours", isRequired: true, placeholder: "e.g. 10am–6pm, 3 shifts/week" },
//         { label: "Description", inputType: "textarea", inputId: "baito-description", isRequired: true, placeholder: "Responsibilities, shift timings, etc.", additionalNodes: [descriptionCounter] },
//         { label: "Tags (comma separated)", inputType: "text", inputId: "baito-tags", placeholder: "e.g. weekends, student-friendly" },
//         { label: "Location", inputType: "text", inputId: "baito-location", isRequired: true, placeholder: "e.g. Shibuya, Tokyo" },
//         { label: "Wage per Hour (in yen)", inputType: "number", inputId: "baito-wage", isRequired: true, placeholder: "e.g. 1200", additionalProps: { min: 1 } },
//         { label: "Phone Number", inputType: "text", inputId: "baito-phone", isRequired: true, placeholder: "e.g. 080-1234-5678" },
//         { label: "Banner Image", inputType: "file", inputId: "baito-banner", additionalProps: { accept: 'image/*' } },
//         { label: "Requirements", inputType: "textarea", inputId: "baito-requirements", isRequired: true, placeholder: "Qualifications, language, etc.", additionalNodes: [reqCounter] },
//     ];

//     fields.forEach(f => form.appendChild(createFormGroup(f)));

//     // Subcategory update
//     form.querySelector("#category-main").addEventListener('change', (e) => {
//         const sub = form.querySelector("#category-sub");
//         sub.innerHTML = '<option value="">Select role type</option>';
//         (categoryMap[e.target.value] || []).forEach(subcat => {
//             const option = createElement("option", { value: subcat }, [subcat]);
//             sub.appendChild(option);
//         });
//     });

//     // Live char counter
//     form.querySelector("#baito-description").addEventListener("input", e => {
//         descriptionCounter.textContent = `${e.target.value.length} characters`;
//     });
//     form.querySelector("#baito-requirements").addEventListener("input", e => {
//         reqCounter.textContent = `${e.target.value.length} characters`;
//     });

//     // Banner preview
//     const bannerInput = form.querySelector("#baito-banner");
//     bannerInput.addEventListener("change", () => {
//         const file = bannerInput.files?.[0];
//         if (file) {
//             const preview = createElement("img", { src: URL.createObjectURL(file), class: "banner-preview" });
//             bannerInput.closest(".form-group").appendChild(preview);
//         }
//     });

//     // Submit handler
//     const submitBtn = createElement('button', {
//         type: 'submit',
//         class: 'btn btn-primary'
//     }, ["Create Baito"]);

//     form.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         submitBtn.disabled = true;

//         const formData = new FormData(form);

//         const requiredFields = {
//             title: formData.get("baito-title")?.trim(),
//             jobType: formData.get("baito-jobtype"),
//             workHours: formData.get("baito-workinghours")?.trim(),
//             description: formData.get("baito-description")?.trim(),
//             requirements: formData.get("baito-requirements")?.trim(),
//             location: formData.get("baito-location")?.trim(),
//             wage: formData.get("baito-wage"),
//             phone: formData.get("baito-phone")?.trim(),
//             category: formData.get("category-main"),
//             subcategory: formData.get("category-sub")
//         };

//         if (Object.values(requiredFields).some(v => !v)) {
//             Snackbar("Please fill in all required fields.", 3000);
//             submitBtn.disabled = false;
//             return;
//         }

//         if (Number(requiredFields.wage) <= 0) {
//             Snackbar("Wage must be greater than 0.", 3000);
//             submitBtn.disabled = false;
//             return;
//         }

//         const payload = new FormData();
//         Object.entries(requiredFields).forEach(([key, value]) => payload.append(key, value));

//         const tags = formData.get("baito-tags")?.trim();
//         if (tags) payload.append("tags", tags);

//         const bannerFile = bannerInput?.files?.[0];
//         if (bannerFile) payload.append("banner", bannerFile);

//         try {
//             Snackbar("Creating baito...", 2000);
//             const result = await apiFetch("/baitos/baito", "POST", payload);
//             Snackbar("Baito created successfully!", 3000);
//             navigate(`/baito/${result.baitoid}`);
//         } catch (err) {
//             Snackbar(`Error: ${err.message || "Failed to create baito."}`, 3000);
//         } finally {
//             submitBtn.disabled = false;
//         }
//     });

//     form.appendChild(submitBtn);
//     createSection.append(createElement('h2', {}, ["Create Baito"]), form);
// }

// export { createBaito };
