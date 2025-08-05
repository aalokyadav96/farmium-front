import { createElement } from "../../components/createElement.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { navigate } from "../../routes/index.js";
import { createPlace } from "./placeService.js";
import { createFormGroup } from "./editPlace.js";

import { uploadPlaceBanner } from "../mediaup/uploadService"; // You’ll define this
let uploadedBannerUrl = "";

export async function createPlaceForm(isLoggedIn, createSection) {
    createSection.innerHTML = "";

    if (!isLoggedIn) {
        Snackbar("You must be logged in to create a place.", 3000);
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

    form.appendChild(createFormGroup({
        label: "Main Category",
        inputType: "select",
        inputId: "category-main",
        isRequired: true,
        options: [{ value: "", label: "Select main category" }, ...Object.keys(categoryMap).map(key => ({ value: key, label: key }))]
    }));

    form.appendChild(createFormGroup({
        label: "Sub Category",
        inputType: "select",
        inputId: "category-sub",
        isRequired: true,
        options: [{ value: "", label: "Select sub category" }]
    }));

    const fields = [
        { label: "Place Name", inputType: "text", inputId: "place-name", placeholder: "Place Name", isRequired: true },
        { label: "Address", inputType: "text", inputId: "place-address", placeholder: "Address", isRequired: true },
        { label: "City", inputType: "text", inputId: "place-city", placeholder: "City", isRequired: true },
        { label: "Country", inputType: "text", inputId: "place-country", placeholder: "Country", isRequired: true },
        { label: "Zip Code", inputType: "text", inputId: "place-zipcode", placeholder: "Zip Code", isRequired: true },
        { label: "Description", inputType: "textarea", inputId: "place-description", placeholder: "Description", isRequired: true },
        { label: "Capacity", inputType: "number", inputId: "capacity", placeholder: "Capacity", isRequired: true, additionalProps: { min: 1 } },
        { label: "Phone Number", inputType: "text", inputId: "phone", placeholder: "Phone Number" },
    ];

    fields.forEach(field => form.appendChild(createFormGroup(field)));

    // Add hidden input for banner URL
    const bannerHiddenInput = createElement("input", {
        type: "hidden",
        id: "place-banner-url",
        name: "bannerUrl"
    });
    form.appendChild(bannerHiddenInput);

    // Handle subcategory population
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

    // Separate file input for banner
    const bannerInputGroup = createFormGroup({
        label: "Upload Banner",
        inputType: "file",
        inputId: "upload-banner",
        additionalProps: { accept: 'image/*' }
    });

    const bannerInput = bannerInputGroup.querySelector("input");
    bannerInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const bannerUrl = await uploadPlaceBanner(file);
            uploadedBannerUrl = bannerUrl;
            bannerHiddenInput.value = bannerUrl;
            Snackbar("Banner uploaded successfully!", 2000);
        } catch (err) {
            console.error("Banner upload failed:", err);
            Snackbar("Banner upload failed.", 3000);
        }
    });

    createSection.appendChild(createElement('h2', {}, ["Create Place"]));
    createSection.appendChild(bannerInputGroup);
    createSection.appendChild(form);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        try {
            await createPlace(formData);
            Snackbar("Place created successfully!", 3000);
            // navigate(`/place/${resp.placeid}`);
        } catch (err) {
            Snackbar("Failed to create place. Try again.", 3000);
            console.error("Error creating place:", err);
        }
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Create Place';
    submitButton.classList.add('btn', 'btn-primary');
    form.appendChild(submitButton);
}


// import { createElement } from "../../components/createElement.js";
// import Snackbar from '../../components/ui/Snackbar.mjs';
// import { navigate } from "../../routes/index.js";
// import { createPlace } from "./placeService.js";
// import { createFormGroup } from "./editPlace.js";

// async function createPlaceForm(isLoggedIn, createSection) {
//     createSection.innerHTML = "";

//     if (!isLoggedIn) {
//         Snackbar("You must be logged in to create a place.", 3000);
//         navigate('/login');
//         return;
//     }

//     const categoryMap = {
//         Food: ["Restaurant", "Cafe", "Bakery", "Hotel"],
//         Health: ["Hospital", "Clinic", "Gym", "Yoga Center"],
//         Entertainment: ["Theater", "Stadium", "Arena", "Park", "Museum"],
//         Services: ["Business", "Shop", "Toilet", "Petrol Pump", "Other"]
//     };

//     const form = document.createElement('form');

//     // Main category
//     form.appendChild(createFormGroup({
//         label: "Main Category",
//         inputType: "select",
//         inputId: "category-main",
//         isRequired: true,
//         options: [{ value: "", label: "Select main category" }, ...Object.keys(categoryMap).map(key => ({ value: key, label: key }))]
//     }));

//     // Sub category
//     form.appendChild(createFormGroup({
//         label: "Sub Category",
//         inputType: "select",
//         inputId: "category-sub",
//         isRequired: true,
//         options: [{ value: "", label: "Select sub category" }]
//     }));

//     // Remaining fields
//     const fields = [
//         { label: "Place Name", inputType: "text", inputId: "place-name", placeholder: "Place Name", isRequired: true },
//         { label: "Address", inputType: "text", inputId: "place-address", placeholder: "Address", isRequired: true },
//         { label: "City", inputType: "text", inputId: "place-city", placeholder: "City", isRequired: true },
//         { label: "Country", inputType: "text", inputId: "place-country", placeholder: "Country", isRequired: true },
//         { label: "Zip Code", inputType: "text", inputId: "place-zipcode", placeholder: "Zip Code", isRequired: true },
//         { label: "Description", inputType: "textarea", inputId: "place-description", placeholder: "Description", isRequired: true },
//         { label: "Capacity", inputType: "number", inputId: "capacity", placeholder: "Capacity", isRequired: true, additionalProps: { min: 1 } },
//         { label: "Phone Number", inputType: "text", inputId: "phone", placeholder: "Phone Number" },
//         { label: "Place Banner", inputType: "file", inputId: "place-banner-add", additionalProps: { accept: 'image/*' } },
//     ];

//     fields.forEach(field => form.appendChild(createFormGroup(field)));

//     // Handle subcategory options
//     form.querySelector("#category-main").addEventListener('change', (e) => {
//         const sub = form.querySelector("#category-sub");
//         sub.innerHTML = '<option value="">Select sub category</option>';
//         const selected = categoryMap[e.target.value] || [];
//         selected.forEach(subcat => {
//             const option = document.createElement("option");
//             option.value = subcat;
//             option.textContent = subcat;
//             sub.appendChild(option);
//         });
//     });

//     form.addEventListener('submit', async (e) => {
//         e.preventDefault();
//         const formData = new FormData(form);
//         try {
//             await createPlace(formData);
//             // const resp = await createPlace(formData);
//             Snackbar("Place created successfully!", 3000);
//             // navigate(`/place/${resp.placeid}`);
//         } catch (err) {
//             Snackbar("Failed to create place. Try again.", 3000);
//             console.error("Error creating place:", err);
//         }
//     });

//     const submitButton = document.createElement('button');
//     submitButton.type = 'submit';
//     submitButton.textContent = 'Create Place';
//     submitButton.classList.add('btn', 'btn-primary'); // optional: styling class
    
//     form.appendChild(submitButton);
    
//     createSection.appendChild(createElement('h2', {}, ["Create Place"]));
//     createSection.appendChild(form);
// }


// export { createPlaceForm };

