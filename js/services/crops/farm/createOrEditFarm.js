import { createElement } from "../../../components/createElement.js";
import { createInputField, createLabeledField, createForm } from "./farmHelpers.js";

export function createFarmForm({ isEdit = false, farm = {}, onSubmit }) {
    const nameField = createInputField("text", "Farm Name", farm.name || "", true);
    const locationField = createInputField("text", "Location", farm.location || "", true);
    const descriptionField = createInputField("text", "Description", farm.description || "");
    const ownerField = createInputField("text", "Owner", farm.owner || "", true);
    const contactField = createInputField("text", "Contact", farm.contact || "", true);
    const availabilityField = createInputField("text", "Availability", farm.availabilityTiming || "");

    const imageInput = createElement("input", { type: "file", accept: "image/*" });
    const imagePreview = createElement("img", {
        style: "max-height:100px; margin-top:8px; display:none;"
    });

    if (farm.image) {
        imagePreview.src = farm.image;
        imagePreview.style.display = "block";
    }

    imageInput.addEventListener("change", () => {
        const file = imageInput.files[0];
        if (file) {
            imagePreview.src = URL.createObjectURL(file);
            imagePreview.style.display = "block";
        } else {
            imagePreview.style.display = "none";
        }
    });

    const fields = [
        createLabeledField("Name", nameField),
        createLabeledField("Location", locationField),
        createLabeledField("Description", descriptionField),
        createLabeledField("Owner", ownerField),
        createLabeledField("Contact", contactField),
        createLabeledField("Availability", availabilityField),
        createLabeledField("Photo", imageInput)
    ];

    const form = createForm(fields, () => {
        const formData = new FormData();
        formData.append("name", nameField.value.trim());
        formData.append("location", locationField.value.trim());
        formData.append("description", descriptionField.value.trim());
        formData.append("owner", ownerField.value.trim());
        formData.append("contact", contactField.value.trim());
        formData.append("availabilityTiming", availabilityField.value.trim());

        if (imageInput.files.length > 0) {
            formData.append("photo", imageInput.files[0]);
        }

        if (!isEdit) {
            formData.append("crops", JSON.stringify([])); // required by create API
        }

        return onSubmit(formData);
    }, isEdit ? "Update Farm" : "Create Farm");

    form.appendChild(imagePreview);
    return form;
}
