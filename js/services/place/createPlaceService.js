import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { createPlace } from "./placeService.js";
import { createFormGroup } from "./editPlace.js";
import Notify from "../../components/ui/Notify.mjs";

async function createPlaceForm(isLoggedIn, createSection) {
    createSection.innerHTML = "";

    if (!isLoggedIn) {
        Notify("You must be logged in to create a place.", {type: "warning", duration: 3000, dismissible: true});
        navigate('/login');
        return;
    }

    const categoryMap = {
        Food: ["Restaurant", "Cafe", "Bakery", "Hotel"],
        Health: ["Hospital", "Clinic", "Gym", "Yoga Center"],
        Entertainment: ["Theater", "Stadium", "Arena", "Park", "Museum"],
        Services: ["Business", "Shop", "Toilet", "Petrol Pump", "Other"]
    };

    const form = document.createElement('form');

    // Main category
    form.appendChild(createFormGroup({
        label: "Main Category",
        inputType: "select",
        inputId: "category-main",
        isRequired: true,
        options: [{ value: "", label: "Select main category" }, ...Object.keys(categoryMap).map(key => ({ value: key, label: key }))]
    }));

    // Sub category
    form.appendChild(createFormGroup({
        label: "Sub Category",
        inputType: "select",
        inputId: "category-sub",
        isRequired: true,
        options: [{ value: "", label: "Select sub category" }]
    }));

    // Remaining fields
    const fields = [
        { label: "Place Name", inputType: "text", inputId: "place-name", placeholder: "Place Name", isRequired: true },
        { label: "Address", inputType: "text", inputId: "place-address", placeholder: "Address", isRequired: true },
        { label: "City", inputType: "text", inputId: "place-city", placeholder: "City", isRequired: true },
        { label: "Country", inputType: "text", inputId: "place-country", placeholder: "Country", isRequired: true },
        { label: "Zip Code", inputType: "text", inputId: "place-zipcode", placeholder: "Zip Code", isRequired: true },
        { label: "Description", inputType: "textarea", inputId: "place-description", placeholder: "Description", isRequired: true },
        { label: "Capacity", inputType: "number", inputId: "capacity", placeholder: "Capacity", isRequired: true, additionalProps: { min: 1 } },
        { label: "Phone Number", inputType: "text", inputId: "phone", placeholder: "Phone Number" },
        { label: "Place Banner", inputType: "file", inputId: "place-banner-add", additionalProps: { accept: 'image/*' } },
    ];

    fields.forEach(field => form.appendChild(createFormGroup(field)));

    // TAGS FIELD
    const tagWrapper = createElement("div", { class: "form-group" }, [
        createElement("label", {}, ["Tags"]),
        createElement("div", { style: "display:flex; gap:8px;" }, [
            createElement("input", { type: "text", id: "tag-input", placeholder: "Add a tag" }),
            createElement("button", { type: "button", id: "add-tag-btn" }, ["Add"])
        ]),
        createElement("div", { id: "tag-list", style: "margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;" }, [])
    ]);
    form.appendChild(tagWrapper);

    let tags = [];
    const tagInput = tagWrapper.querySelector("#tag-input");
    const tagList = tagWrapper.querySelector("#tag-list");

    function renderTags() {
        tagList.innerHTML = "";
        tags.forEach((tag, index) => {
            const chip = createElement("span", { style: "padding:4px 8px; background:var(--color-space); border-radius:var(--radius-sm); display:inline-flex; align-items:center; gap:4px;" }, [
                tag,
                createElement("button", { type: "button", style: "border:none; background:none; cursor:pointer; color:red;", onclick: () => { tags.splice(index, 1); renderTags(); } }, ["×"])
            ]);
            tagList.appendChild(chip);
        });
    }

    tagWrapper.querySelector("#add-tag-btn").addEventListener("click", () => {
        const val = tagInput.value.trim();
        if (val && !tags.includes(val)) {
            tags.push(val);
            tagInput.value = "";
            renderTags();
        }
    });

    // Handle subcategory options
    form.querySelector("#category-main").addEventListener('change', (e) => {
        const sub = form.querySelector("#category-sub");
        sub.innerHTML = '<option value="">Select sub category</option>';
        const selected = categoryMap[e.target.value] || [];
        selected.forEach(subcat => {
            const option = document.createElement("option");
            option.value = subcat;
            option.textContent = subcat;
            sub.appendChild(option);
        });
    });

    // Submit handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        formData.append("tags", JSON.stringify(tags));

        try {
            await createPlace(formData);
            Notify("Place created successfully!", {duration:3000});
        } catch (err) {
            Notify("Failed to create place. Try again.", {duration:3000});
            console.error("Error creating place:", err);
        }
    });

    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Create Place';
    submitButton.classList.add('btn', 'btn-primary');
    
    form.appendChild(submitButton);
    
    createSection.appendChild(createElement('h2', {}, ["Create Place"]));
    createSection.appendChild(form);
}

export { createPlaceForm };
