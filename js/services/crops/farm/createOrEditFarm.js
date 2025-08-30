import { createElement } from "../../../components/createElement.js";

export function createInputField(type, placeholder, value = "", required = false) {
  return createElement("input", {
    type,
    placeholder,
    value,
    required,
  });
}

export function createLabeledField(labelText, inputElement) {
  return createElement("div", { class: "form-group" }, [
    createElement("label", {}, [labelText]),
    inputElement
  ]);
}

export function createForm(fields, onSubmit, submitText = "Submit") {
  const form = createElement("form", { class: "create-section" });
  fields.forEach(field => form.appendChild(field));
  const submitBtn = createElement("button", { type: "submit" }, [submitText]);
  form.appendChild(submitBtn);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const result = await onSubmit(form);
    if (result === true || result?.success) {
      form.reset();
      const preview = form.querySelector("img.preview");
      if (preview) preview.style.display = "none";
    }
  });

  return form;
}

export function createFarmForm({ isEdit = false, farm = {}, onSubmit }) {
  const nameField = createInputField("text", "Farm Name", farm.name || "", true);
  const locationField = createInputField("text", "Location", farm.location || "", true);
  const descriptionField = createInputField("text", "Description", farm.description || "");
  const ownerField = createInputField("text", "Owner", farm.owner || "", true);
  const contactField = createInputField("text", "Contact", farm.contact || "", true);
  const availabilityField = createInputField("text", "Availability", farm.availabilityTiming || "");

  // const imageInput = createElement("input", { type: "file", accept: "image/*" });
  // const imagePreview = createElement("img", {
  //   class: "preview",
  //   style: "max-height:100px; margin-top:8px; display:none;"
  // });

  // if (farm.image) {
  //   imagePreview.src = farm.image;
  //   imagePreview.style.display = "block";
  // }

  // imageInput.addEventListener("change", () => {
  //   const file = imageInput.files[0];
  //   if (file) {
  //     imagePreview.src = URL.createObjectURL(file);
  //     imagePreview.style.display = "block";
  //   } else {
  //     imagePreview.style.display = "none";
  //   }
  // });

  const fields = [
    createLabeledField("Name", nameField),
    createLabeledField("Location", locationField),
    createLabeledField("Description", descriptionField),
    createLabeledField("Owner", ownerField),
    createLabeledField("Contact", contactField),
    createLabeledField("Availability", availabilityField),
    // createLabeledField("Photo", imageInput)
  ];

  const form = createForm(fields, async () => {
    const formData = new FormData();
    formData.append("name", nameField.value.trim());
    formData.append("location", locationField.value.trim());
    formData.append("description", descriptionField.value.trim());
    formData.append("owner", ownerField.value.trim());
    formData.append("contact", contactField.value.trim());
    formData.append("availabilityTiming", availabilityField.value.trim());

    // if (imageInput.files.length > 0) {
    //   formData.append("photo", imageInput.files[0]);
    // }

    if (!isEdit) {
      formData.append("crops", JSON.stringify([])); // required by create API
    }

    return await onSubmit(formData); // must return true or { success: true }
  }, isEdit ? "Update Farm" : "Create Farm");

  // form.appendChild(imagePreview);
  return form;
}
