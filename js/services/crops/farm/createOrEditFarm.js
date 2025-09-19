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
  const descriptionField = createElement("textarea", { placeholder: "Description", rows: 3 }, [farm.description || ""]);
  const ownerField = createInputField("text", "Owner", farm.owner || "", true);
  const contactField = createInputField("text", "Contact", farm.contact || "", true);

  const practiceField = createElement("select", {}, [
    createElement("option", { value: "organic", selected: farm.practice === "organic" }, ["Organic"]),
    createElement("option", { value: "conventional", selected: farm.practice === "conventional" }, ["Conventional"]),
    createElement("option", { value: "hydroponic", selected: farm.practice === "hydroponic" }, ["Hydroponic"]),
    createElement("option", { value: "regenerative", selected: farm.practice === "regenerative" }, ["Regenerative"])
  ]);

  const socialField = createInputField("url", "Website / Social Link", farm.social || "");
  const availabilityField = createInputField("text", "Availability (e.g. Mon-Fri, 9am-5pm)", farm.availabilityTiming || "");

  const galleryField = createElement("input", { type: "file", accept: "image/*", multiple: true });

  const fields = [
    createLabeledField("Name", nameField),
    createLabeledField("Location", locationField),
    createLabeledField("Description", descriptionField),
    createLabeledField("Owner", ownerField),
    createLabeledField("Contact", contactField),
    createLabeledField("Farming Practice", practiceField),
    createLabeledField("Availability", availabilityField),
    createLabeledField("Social Link", socialField),
    createLabeledField("Gallery", galleryField),
  ];

  const form = createForm(fields, async () => {
    const formData = new FormData();
    formData.append("name", nameField.value.trim());
    formData.append("location", locationField.value.trim());
    formData.append("description", descriptionField.value.trim());
    formData.append("owner", ownerField.value.trim());
    formData.append("contact", contactField.value.trim());
    formData.append("practice", practiceField.value);
    formData.append("availabilityTiming", availabilityField.value.trim());
    formData.append("social", socialField.value.trim());

    if (galleryField.files.length > 0) {
      Array.from(galleryField.files).forEach(file => formData.append("gallery", file));
    }

    if (!isEdit) {
      formData.append("crops", JSON.stringify([]));
    }

    return await onSubmit(formData);
  }, isEdit ? "Update Farm" : "Create Farm");

  return form;
}

