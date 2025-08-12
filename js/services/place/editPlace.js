import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import displayPlace from "./displayPlace.js";
import Notify from "../../components/ui/Notify.mjs";

const categoryMap = {
    "Food & Beverage": ["Restaurant", "Cafe", "Bakery"],
    "Health & Wellness": ["Hospital", "Clinic", "Gym", "Yoga Center"],
    "Entertainment": ["Theater", "Stadium", "Museum", "Arena"],
    "Services": ["Saloon", "Studio", "Petrol Pump", "Shop"],
    "Public Facilities": ["Toilet", "Park"],
    "Business": ["Business", "Hotel", "Other"]
};

export function createFormGroup({
    label = "",
    inputType = "text",
    inputId = "",
    inputValue = "",
    placeholder = "",
    isRequired = false,
    additionalProps = {},
    options = []
  }) {
    const group = createElement("div", { class: "form-group" });
  
    if (label) {
      const labelElement = createElement("label", { for: inputId }, [label]);
      group.appendChild(labelElement);
    }
  
    let inputElement;
  
    if (inputType === "textarea") {
      inputElement = createElement("textarea", { id: inputId, placeholder });
      if (inputValue) inputElement.textContent = inputValue;
    } else if (inputType === "select") {
      inputElement = createElement("select", { id: inputId, name: inputId });
      options.forEach(({ value, label: optionLabel }) => {
        const option = createElement("option", { value }, [optionLabel]);
        if (value === inputValue) option.selected = true;
        inputElement.appendChild(option);
      });
    } else {
      // Default input
      inputElement = createElement("input", { type: inputType, id: inputId, placeholder, value: inputValue });
    }
  
    if (isRequired) inputElement.setAttribute("required", "");
  
    // Apply additionalProps as attributes or properties
    Object.entries(additionalProps).forEach(([key, val]) => {
      // Prefer setting as attribute if key starts with aria- or data-
      if (/^(aria-|data-)/.test(key)) {
        inputElement.setAttribute(key, val);
      } else {
        // Otherwise try property, fallback to attribute
        try {
          inputElement[key] = val;
        } catch {
          inputElement.setAttribute(key, val);
        }
      }
    });
  
    group.appendChild(inputElement);
  
    // Handle file input preview
    if (inputType === "file") {
      const previewContainer = createElement("div", {
        style: "display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;"
      });
      group.appendChild(previewContainer);
  
      inputElement.addEventListener("change", (e) => {
        previewContainer.innerHTML = "";
        const files = Array.from(e.target.files);
        files.forEach(file => {
          const img = createElement("img", {
            src: URL.createObjectURL(file),
            style: "max-width:150px;max-height:150px;object-fit:cover;border-radius:6px;"
          });
          previewContainer.appendChild(img);
        });
      });
    }
  
    return group;
  }
  
// export function createFormGroup({ label, inputType, inputId, inputValue = '', placeholder = '', isRequired = false, additionalProps = {}, options }) {
//     const group = document.createElement('div');
//     group.classList.add('form-group');

//     const labelElement = document.createElement('label');
//     labelElement.setAttribute('for', inputId);
//     labelElement.textContent = label;

//     let inputElement;
//     if (inputType === 'textarea') {
//         inputElement = document.createElement('textarea');
//         inputElement.textContent = inputValue;
//     } else if (inputType === 'select') {
//         inputElement = document.createElement('select');
//         inputElement.id = inputId;
//         inputElement.name = inputId;
//         if (isRequired) inputElement.required = true;
//         (options || []).forEach(option => {
//             const opt = document.createElement('option');
//             opt.value = option.value;
//             opt.textContent = option.label;
//             if (option.value === inputValue) opt.selected = true;
//             inputElement.appendChild(opt);
//         });
//     } else {
//         inputElement = document.createElement('input');
//         inputElement.type = inputType;
//         inputElement.value = inputValue;

//         if (inputType === 'file') {
//             const previewContainer = createElement("div", {
//                 style: "display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;"
//             });
//             group.appendChild(previewContainer);
//             inputElement.addEventListener("change", (e) => {
//                 previewContainer.innerHTML = "";
//                 const files = Array.from(e.target.files);
//                 files.forEach((file) => {
//                     const img = createElement("img", {
//                         src: URL.createObjectURL(file),
//                         style: "max-width:150px;max-height:150px;object-fit:cover;border-radius:6px;"
//                     });
//                     previewContainer.appendChild(img);
//                 });
//             });
//         }
//     }

//     inputElement.id = inputId;
//     if (placeholder) inputElement.placeholder = placeholder;
//     if (isRequired) inputElement.required = true;
//     Object.entries(additionalProps).forEach(([key, value]) => {
//         inputElement[key] = value;
//     });

//     group.appendChild(labelElement);
//     group.appendChild(inputElement);
//     return group;
// }

async function editPlaceForm(isLoggedIn, placeId, content) {
    if (!isLoggedIn) {
        navigate('/login');
        return;
    }

    try {
        const place = await apiFetch(`/places/place/${placeId}`);
        content.innerHTML = '';

        const formContainer = document.createElement('div');
        formContainer.classList.add('form-container');

        const formHeading = document.createElement('h2');
        formHeading.textContent = 'Edit Place';

        const form = document.createElement('form');
        form.id = 'edit-place-form';

        // Detect main category
        let detectedMainCategory = Object.entries(categoryMap).find(([_, subs]) =>
            subs.includes(place.category)
        )?.[0] || "";

        // Main category
        form.appendChild(createFormGroup({
            label: "Place Type",
            inputType: "select",
            inputId: "main-category",
            inputValue: detectedMainCategory,
            isRequired: true,
            options: Object.keys(categoryMap).map(cat => ({ value: cat, label: cat }))
        }));

        // Subcategory
        form.appendChild(createFormGroup({
            label: "Category",
            inputType: "select",
            inputId: "category",
            inputValue: place.category,
            isRequired: true,
            options: (categoryMap[detectedMainCategory] || []).map(sub => ({ value: sub, label: sub }))
        }));

        // Other fields
        const formGroups = [
            { label: 'Name', inputType: 'text', inputId: 'place-name', inputValue: place.name, placeholder: 'Place Name', isRequired: true },
            { label: 'Description', inputType: 'textarea', inputId: 'place-description', inputValue: place.description, placeholder: 'Description', isRequired: true },
            { label: 'Address', inputType: 'text', inputId: 'place-address', inputValue: place.address, placeholder: 'Location', isRequired: true },
            { label: 'Capacity', inputType: 'number', inputId: 'capacity', inputValue: place.capacity, placeholder: 'Capacity', isRequired: true },
            { label: 'Place Banner', inputType: 'file', inputId: 'banner', additionalProps: { accept: 'image/*' } }
        ];
        formGroups.forEach(group => form.appendChild(createFormGroup(group)));

        // TAGS FIELD
        const tagWrapper = createElement("div", { class: "form-group" }, [
            createElement("label", {}, ["Tags"]),
            createElement("div", { style: "display:flex;gap:8px;" }, [
                createElement("input", { type: "text", id: "tag-input", placeholder: "Add a tag" }),
                createElement("button", { type: "button", id: "add-tag-btn" }, ["Add"])
            ]),
            createElement("div", { id: "tag-list", style: "margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;" }, [])
        ]);
        form.appendChild(tagWrapper);

        let tags = Array.isArray(place.tags) ? [...place.tags] : [];
        const tagInput = tagWrapper.querySelector("#tag-input");
        const tagList = tagWrapper.querySelector("#tag-list");

        function renderTags() {
            tagList.innerHTML = "";
            tags.forEach((tag, index) => {
                const chip = createElement("span", {
                    style: "padding:4px 8px;background:var(--color-space);border-radius:var(--radius-sm);display:inline-flex;align-items:center;gap:4px;"
                }, [
                    tag,
                    createElement("button", {
                        type: "button",
                        style: "border:none;background:none;cursor:pointer;color:red;",
                        onclick: () => { tags.splice(index, 1); renderTags(); }
                    }, ["×"])
                ]);
                tagList.appendChild(chip);
            });
        }
        renderTags();

        tagWrapper.querySelector("#add-tag-btn").addEventListener("click", () => {
            const val = tagInput.value.trim();
            if (val && !tags.includes(val)) {
                tags.push(val);
                tagInput.value = "";
                renderTags();
            }
        });

        // Subcategory update
        form.querySelector('#main-category').addEventListener('change', (e) => {
            const selected = e.target.value;
            const subSelect = form.querySelector('#category');
            subSelect.innerHTML = '';
            (categoryMap[selected] || []).forEach(sub => {
                const opt = document.createElement('option');
                opt.value = sub;
                opt.textContent = sub;
                subSelect.appendChild(opt);
            });
        });

        // Submit
        const updateButton = document.createElement('button');
        updateButton.type = 'submit';
        updateButton.textContent = 'Update Place';
        form.appendChild(updateButton);

        formContainer.appendChild(formHeading);
        formContainer.appendChild(form);
        content.appendChild(formContainer);

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await updatePlace(isLoggedIn, placeId, tags);
        });

    } catch (error) {
        Notify(`Error loading place: ${error.message}`, { type: "warning", duration: 3000, dismissible: true });
    }
}

async function updatePlace(isLoggedIn, placeId, tags = []) {
    if (!isLoggedIn) {
        Notify("Please log in to update place.", { type: "warning", duration: 3000, dismissible: true });
        return;
    }

    const name = document.getElementById("place-name").value.trim();
    const capacity = document.getElementById("capacity").value;
    const category = document.getElementById("category").value;
    const address = document.getElementById("place-address").value.trim();
    const description = document.getElementById("place-description").value.trim();
    const bannerInput = document.getElementById("banner");
    const bannerFile = bannerInput?.files[0] || null;

    if (!name || !capacity || !category || !address || !description) {
        Notify("Please fill in all required fields.", { type: "warning", duration: 3000, dismissible: true });
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('capacity', capacity);
    formData.append('category', category);
    formData.append('address', address);
    formData.append('description', description);
    formData.append('tags', JSON.stringify(tags));
    if (bannerFile) formData.append('banner', bannerFile);

    try {
        const result = await apiFetch(`/places/place/${placeId}`, 'PUT', formData);
        Notify(`Place updated successfully: ${result.name}`, { type: "success", duration: 3000, dismissible: true });
        displayPlace(isLoggedIn, placeId);
    } catch (error) {
        Notify(`Error updating place: ${error.message}`, { type: "warning", duration: 3000, dismissible: true });
    }
}

async function deletePlace(isLoggedIn, placeId) {
    if (!isLoggedIn) {
        Notify("Please log in to delete your place.", { type: "warning", duration: 3000, dismissible: true });
        return;
    }
    if (confirm("Are you sure you want to delete this place?")) {
        try {
            await apiFetch(`/places/place/${placeId}`, 'DELETE');
            Notify("Place deleted successfully.", { type: "success", duration: 3000, dismissible: true });
            navigate('/places');
        } catch (error) {
            Notify(`Error deleting place: ${error.message || 'Unknown error'}`, { type: "warning", duration: 3000, dismissible: true });
        }
    }
}

export { editPlaceForm, updatePlace, deletePlace };

