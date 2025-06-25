import { apiFetch } from "../../../api/api.js";
import { createFarmForm } from "./createOrEditFarm.js";
import { displayFarm } from "./farmDisplay.js";

export function editFarm(isLoggedIn, farm, container) {
    container.textContent = "";

    if (!isLoggedIn) {
        container.textContent = "Please log in to edit this farm.";
        return;
    }

    const form = createFarmForm({
        isEdit: true,
        farm,
        onSubmit: async (formData) => {
            const res = await apiFetch(`/farms/${farm.id}`, "PUT", formData, true);
            if (res.success) {
                displayFarm(isLoggedIn, farm.id, container);
            } else {
                container.textContent = "❌ Failed to update farm.";
            }
        }
    });

    container.appendChild(form);
}

// import { apiFetch } from "../../../api/api.js";
// import { createElement } from "../../../components/createElement.js";
// import { createInputField, createLabeledField, createForm } from "./farmHelpers.js";
// import { displayFarm } from "./farmDisplay.js";

// export function editFarm(isLoggedIn, farm, container) {
//     container.textContent = "";

//     if (!isLoggedIn) {
//         container.textContent = "Please log in to edit this farm.";
//         return;
//     }

//     const nameField = createInputField("text", "Farm Name", farm.name, true);
//     const locationField = createInputField("text", "Location", farm.location, true);
//     const descriptionField = createInputField("text", "Description", farm.description || "");
//     const ownerField = createInputField("text", "Owner", farm.owner, true);
//     const contactField = createInputField("text", "Contact", farm.contact, true);
//     const availabilityField = createInputField("text", "Availability", farm.availabilityTiming || "");

//     const imageInput = createElement("input", { type: "file", accept: "image/*" });
//     const imagePreview = createElement("img", {
//         style: "max-height:100px; margin-top:8px; display:none;"
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

//     if (farm.image) {
//         imagePreview.src = farm.image;
//         imagePreview.style.display = "block";
//     }

//     const form = createForm([
//         createLabeledField("Name", nameField),
//         createLabeledField("Location", locationField),
//         createLabeledField("Description", descriptionField),
//         createLabeledField("Owner", ownerField),
//         createLabeledField("Contact", contactField),
//         createLabeledField("Availability", availabilityField),
//         createLabeledField("Image", imageInput)
//     ], async () => {
//         const formData = new FormData();
//         formData.append("name", nameField.value);
//         formData.append("location", locationField.value);
//         formData.append("description", descriptionField.value);
//         formData.append("owner", ownerField.value);
//         formData.append("contact", contactField.value);
//         formData.append("availabilityTiming", availabilityField.value);

//         if (imageInput.files.length > 0) {
//             // formData.append("image", imageInput.files[0]);
//             formData.append("photo", imageInput.files[0]);
//         }

//         const res = await apiFetch(`/farms/${farm.id}`, "PUT", formData, true);
//         if (res.success) {
//             displayFarm(isLoggedIn, farm.id, container);
//         } else {
//             container.textContent = "❌ Failed to update farm.";
//         }
//     }, "Update Farm");

//     form.appendChild(imagePreview);
//     container.appendChild(form);
// }
