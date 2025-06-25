import { apiFetch } from "../../../api/api.js";
import { createFarmForm } from "./createOrEditFarm.js";
import { displayFarms } from "./FarmsHome.js";

export function createFarm(isLoggedIn, container) {
    container.textContent = "";

    if (!isLoggedIn) {
        container.textContent = "Please log in to create a farm.";
        return;
    }

    const form = createFarmForm({
        isEdit: false,
        onSubmit: async (formData) => {
            const res = await apiFetch("/farms", "POST", formData, true);
            if (res.success) {
                displayFarms(container, isLoggedIn);
            } else {
                container.textContent = "❌ Failed to create farm. Please try again.";
            }
        }
    });

    container.appendChild(form);
}

// import { apiFetch } from "../../../api/api.js";
// import { createElement } from "../../../components/createElement.js";
// import { createInputField, createLabeledField, createForm } from "./farmHelpers.js";
// import { displayFarms } from "./FarmsHome.js";

// export function createFarm(isLoggedIn, container) {
//     container.textContent = "";

//     if (!isLoggedIn) {
//         container.textContent = "Please log in to create a farm.";
//         return;
//     }

//     const nameField = createInputField("text", "Farm Name", "", true);
//     const locationField = createInputField("text", "Location", "", true);
//     const descriptionField = createInputField("text", "Description");
//     const ownerField = createInputField("text", "Owner", "", true);
//     const contactField = createInputField("text", "Contact", "", true);
//     const availabilityField = createInputField("text", "Availability (e.g., 9am - 6pm)");
//     const photoField = createInputField("file", "Farm Photo (optional)");

//     const form = createForm([
//         createLabeledField("Name", nameField),
//         createLabeledField("Location", locationField),
//         createLabeledField("Description", descriptionField),
//         createLabeledField("Owner", ownerField),
//         createLabeledField("Contact", contactField),
//         createLabeledField("Availability", availabilityField),
//         createLabeledField("Photo", photoField)
//     ], async () => {
//         const formData = new FormData();
//         formData.append("name", nameField.value.trim());
//         formData.append("location", locationField.value.trim());
//         formData.append("description", descriptionField.value.trim());
//         formData.append("owner", ownerField.value.trim());
//         formData.append("contact", contactField.value.trim());
//         formData.append("availabilityTiming", availabilityField.value.trim());
//         formData.append("crops", JSON.stringify([])); // Keep consistent with your backend model

//         if (photoField.files.length > 0) {
//             formData.append("photo", photoField.files[0]);
//         }

//         const res = await apiFetch("/farms", "POST", formData, true); // true = multipart
//         if (res.success) {
//             displayFarms(container, isLoggedIn);
//         } else {
//             container.textContent = "❌ Failed to create farm. Please try again.";
//         }
//     }, "Create Farm");

//     container.appendChild(form);
// }
