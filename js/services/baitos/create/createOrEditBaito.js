import { createElement } from "../../../components/createElement.js";
import { navigate } from "../../../routes/index.js";
import { apiFetch } from "../../../api/api.js";
import { createFormGroup } from "../../../components/createFormGroup.js";
import Notify from "../../../components/ui/Notify.mjs";

export async function createOrEditBaito({ mode = "create", baito = {}, isLoggedIn = false, contentContainer = null }) {
  const container = contentContainer || document.querySelector("#content");
  container.innerHTML = "";

  if (mode === "create" && !isLoggedIn) {
    Notify("You must be logged in to post a job (baito).", { type: "warning", duration: 3000, dismissible: true });
    navigate("/login");
    return;
  }

  const section = createElement("div", { class: "create-section" });
  container.appendChild(section);

  const categoryMap = {
    Food: ["Waiter", "Cook", "Delivery", "Cleaning"],
    Health: ["Reception", "Cleaner", "Helper"],
    Retail: ["Cashier", "Stock", "Floor Staff"],
    Hospitality: ["Housekeeping", "Front Desk", "Server"],
    Other: ["Manual Labor", "Seasonal Work", "Event Help"]
  };

  const form = createElement("form", { enctype: "multipart/form-data" });

  // --- Category ---
  const categoryGroup = createFormGroup({
    label: "Job Category",
    type: "select",
    id: "category-main",
    required: true,
    placeholder: "Select category",
    options: Object.keys(categoryMap).map(key => ({ value: key, label: key })),
    value: baito.category || ""
  });
  form.appendChild(categoryGroup);

  const subcategoryGroup = createFormGroup({
    label: "Role Type",
    type: "select",
    id: "category-sub",
    required: true,
    placeholder: "Select role type",
    options: [],
    value: baito.subcategory || ""
  });
  form.appendChild(subcategoryGroup);

  // Populate subcategory if editing
  const subSelect = subcategoryGroup.querySelector("select");
  if (baito.category && categoryMap[baito.category]) {
    categoryMap[baito.category].forEach(subcat => {
      const option = createElement("option", { value: subcat }, [subcat]);
      subSelect.appendChild(option);
    });
    subSelect.value = baito.subcategory || "";
  }

  const descriptionCounter = createElement("small", { class: "char-count" });
  const reqCounter = createElement("small", { class: "char-count" });

  // --- Other fields ---
  const fields = [
    { label: "Job Title", type: "text", id: "baito-title", required: true, value: baito.title || "", placeholder: "Enter job title" },
    { label: "Working Hours", type: "text", id: "baito-workinghours", required: true, value: baito.workHours || "", placeholder: "e.g. 9:00-17:00" },
    { label: "Description", type: "textarea", id: "baito-description", required: true, value: baito.description || "", placeholder: "Job description", additionalNodes: [descriptionCounter] },
    { label: "Tags (comma separated)", type: "text", id: "baito-tags", value: (baito.tags || []).join(", "), placeholder: "e.g. part-time, weekend" },
    { label: "Location", type: "text", id: "baito-location", required: true, value: baito.location || "", placeholder: "Enter location" },
    { label: "Wage per Hour (in yen)", type: "number", id: "baito-wage", required: true, value: baito.wage || "", additionalProps: { min: 1 } },
    { label: "Phone Number", type: "text", id: "baito-phone", required: true, value: baito.phone || "", placeholder: "Enter phone number" },
    { label: "Banner Image", type: "file", id: "baito-banner", accept: "image/*", value: baito.banner ? `/uploads/${baito.banner}` : "" },
    { label: "Other Images", type: "file", id: "baito-images", accept: "image/*", multiple: true, value: (baito.images || []).map(img => `/uploads/${img}`) },
    { label: "Requirements", type: "textarea", id: "baito-requirements", required: true, value: baito.requirements || "", placeholder: "Requirements", additionalNodes: [reqCounter] }
  ];

  fields.forEach(f => form.appendChild(createFormGroup(f)));

  // --- Dynamic UI logic ---
  form.querySelector("#category-main").addEventListener("change", e => {
    const sub = form.querySelector("#category-sub");
    sub.innerHTML = "";
    const placeholderOpt = createElement("option", { value: "", disabled: true, selected: true }, ["Select role type"]);
    sub.appendChild(placeholderOpt);
    (categoryMap[e.target.value] || []).forEach(subcat => {
      const option = createElement("option", { value: subcat }, [subcat]);
      sub.appendChild(option);
    });
  });

  form.querySelector("#baito-description").addEventListener("input", e => {
    descriptionCounter.textContent = `${e.target.value.length} characters`;
  });
  form.querySelector("#baito-requirements").addEventListener("input", e => {
    reqCounter.textContent = `${e.target.value.length} characters`;
  });

  // --- Submit Button ---
  const submitBtn = createElement("button", { type: "submit", class: "btn btn-primary" },
    [mode === "edit" ? "Update Baito" : "Create Baito"]);

  form.addEventListener("submit", async e => {
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
      Notify("Please fill in all required fields.", { type: "warning", duration: 3000, dismissible: true });
      submitBtn.disabled = false;
      return;
    }

    if (Number(requiredFields.wage) <= 0) {
      Notify("Wage must be greater than 0.", { type: "warning", duration: 3000, dismissible: true });
      submitBtn.disabled = false;
      return;
    }

    const payload = new FormData();
    Object.entries(requiredFields).forEach(([k, v]) => payload.append(k, v));

    const tags = formData.get("baito-tags")?.trim();
    if (tags) payload.append("tags", tags);

    const bannerInput = form.querySelector("#baito-banner");
    if (bannerInput.files[0]) payload.append("banner", bannerInput.files[0]);

    const imagesInput = form.querySelector("#baito-images");
    Array.from(imagesInput.files).forEach(file => payload.append("images", file));

    try {
      if (mode === "edit") {
        Notify("Updating baito...", { type: "info", duration: 3000, dismissible: true });
        await apiFetch(`/baitos/baito/${baito.baitoid}`, "PUT", payload);
        Notify("Baito updated successfully!", { type: "success", duration: 3000, dismissible: true });
        navigate(`/baito/${baito.baitoid}`);
      } else {
        Notify("Creating baito...", { type: "info", duration: 3000, dismissible: true });
        const result = await apiFetch("/baitos/baito", "POST", payload);
        Notify("Baito created successfully!", { type: "success", duration: 3000, dismissible: true });
        navigate(`/baito/${result.baitoid}`);
      }
    } catch (err) {
      Notify(`Error: ${err.message || "Failed to save baito."}`, { type: "error", duration: 3000, dismissible: true });
    } finally {
      submitBtn.disabled = false;
    }
  });

  section.append(createElement("h2", {}, [mode === "edit" ? "Edit Baito" : "Create Baito"]), form);
}

// export async function createOrEditBaito({ mode = "create", baito = null, isLoggedIn = false, contentContainer = null }) {
//   const container = contentContainer || document.querySelector("#content");
//   container.innerHTML = "";

//   if (mode === "create" && !isLoggedIn) {
//     Notify("You must be logged in to post a job (baito).", { type: "warning", duration: 3000, dismissible: true });
//     navigate("/login");
//     return;
//   }

//   const section = createElement("div", { class: "create-section" });
//   container.appendChild(section);

//   const categoryMap = {
//     Food: ["Waiter", "Cook", "Delivery", "Cleaning"],
//     Health: ["Reception", "Cleaner", "Helper"],
//     Retail: ["Cashier", "Stock", "Floor Staff"],
//     Hospitality: ["Housekeeping", "Front Desk", "Server"],
//     Other: ["Manual Labor", "Seasonal Work", "Event Help"]
//   };

//   const form = document.createElement("form");
//   form.setAttribute("enctype", "multipart/form-data");

//   // --- Category ---
//   const categoryGroup = createFormGroup({
//     label: "Job Category",
//     type: "select",
//     id: "category-main",
//     required: true,
//     options: [{ value: "", label: "Select category" }, ...Object.keys(categoryMap).map(key => ({ value: key, label: key }))],
//     value: baito?.category || ""
//   });
//   form.appendChild(categoryGroup);

//   const subcategoryGroup = createFormGroup({
//     label: "Role Type",
//     type: "select",
//     id: "category-sub",
//     required: true,
//     options: [{ value: "", label: "Select role type" }],
//     value: baito?.subcategory || ""
//   });
//   form.appendChild(subcategoryGroup);

//   // Populate subcategory options if editing
//   const subSelect = subcategoryGroup.querySelector("select");
//   if (baito?.category && categoryMap[baito.category]) {
//     categoryMap[baito.category].forEach(subcat => {
//       const option = createElement("option", { value: subcat }, [subcat]);
//       subSelect.appendChild(option);
//     });
//     subSelect.value = baito.subcategory || "";
//   }

//   const descriptionCounter = createElement("small", { class: "char-count" });
//   const reqCounter = createElement("small", { class: "char-count" });

//   // --- Other fields ---
//   const fields = [
//     { label: "Job Title", type: "text", id: "baito-title", required: true, value: baito?.title || "" },
//     { label: "Working Hours", type: "text", id: "baito-workinghours", required: true, value: baito?.workHours || "" },
//     { label: "Description", type: "textarea", id: "baito-description", required: true, value: baito?.description || "", additionalNodes: [descriptionCounter] },
//     { label: "Tags (comma separated)", type: "text", id: "baito-tags", value: baito?.tags?.join(", ") || "" },
//     { label: "Location", type: "text", id: "baito-location", required: true, value: baito?.location || "" },
//     { label: "Wage per Hour (in yen)", type: "number", id: "baito-wage", required: true, value: baito?.wage || "", additionalProps: { min: 1 } },
//     { label: "Phone Number", type: "text", id: "baito-phone", required: true, value: baito?.phone || "" },
//     { label: "Banner Image", type: "file", id: "baito-banner", accept: "image/*", value: baito?.banner ? `/uploads/${baito.banner}` : "" },
//     { label: "Other Images", type: "file", id: "baito-images", accept: "image/*", multiple: true, value: (baito?.images || []).map(img => `/uploads/${img}`) },
//     { label: "Requirements", type: "textarea", id: "baito-requirements", required: true, value: baito?.requirements || "", additionalNodes: [reqCounter] }
//   ];

//   fields.forEach(f => form.appendChild(createFormGroup(f)));

//   // --- Dynamic UI logic ---
//   form.querySelector("#category-main").addEventListener("change", (e) => {
//     const sub = form.querySelector("#category-sub");
//     sub.innerHTML = '<option value="">Select role type</option>';
//     (categoryMap[e.target.value] || []).forEach(subcat => {
//       const option = createElement("option", { value: subcat }, [subcat]);
//       sub.appendChild(option);
//     });
//   });

//   form.querySelector("#baito-description").addEventListener("input", e => {
//     descriptionCounter.textContent = `${e.target.value.length} characters`;
//   });
//   form.querySelector("#baito-requirements").addEventListener("input", e => {
//     reqCounter.textContent = `${e.target.value.length} characters`;
//   });

//   // --- Submit Button ---
//   const submitBtn = createElement("button", { type: "submit", class: "btn btn-primary" },
//     [mode === "edit" ? "Update Baito" : "Create Baito"]);

//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();
//     submitBtn.disabled = true;

//     const formData = new FormData(form);

//     const requiredFields = {
//       title: formData.get("baito-title")?.trim(),
//       workHours: formData.get("baito-workinghours")?.trim(),
//       description: formData.get("baito-description")?.trim(),
//       requirements: formData.get("baito-requirements")?.trim(),
//       location: formData.get("baito-location")?.trim(),
//       wage: formData.get("baito-wage"),
//       phone: formData.get("baito-phone")?.trim(),
//       category: formData.get("category-main"),
//       subcategory: formData.get("category-sub")
//     };

//     if (Object.values(requiredFields).some(v => !v)) {
//       Notify("Please fill in all required fields.", { type: "warning", duration: 3000, dismissible: true });
//       submitBtn.disabled = false;
//       return;
//     }

//     if (Number(requiredFields.wage) <= 0) {
//       Notify("Wage must be greater than 0.", { type: "warning", duration: 3000, dismissible: true });
//       submitBtn.disabled = false;
//       return;
//     }

//     const payload = new FormData();
//     Object.entries(requiredFields).forEach(([k, v]) => payload.append(k, v));

//     const tags = formData.get("baito-tags")?.trim();
//     if (tags) payload.append("tags", tags);

//     const bannerInput = form.querySelector("#baito-banner");
//     if (bannerInput.files[0]) payload.append("banner", bannerInput.files[0]);

//     const imagesInput = form.querySelector("#baito-images");
//     Array.from(imagesInput.files).forEach(file => {
//       payload.append("images", file);
//     });

//     try {
//       if (mode === "edit") {
//         Notify("Updating baito...", { type: "info", duration: 3000, dismissible: true });
//         await apiFetch(`/baitos/baito/${baito.baitoid}`, "PUT", payload);
//         Notify("Baito updated successfully!", { type: "success", duration: 3000, dismissible: true });
//         navigate(`/baito/${baito.baitoid}`);
//       } else {
//         Notify("Creating baito...", { type: "info", duration: 3000, dismissible: true });
//         const result = await apiFetch("/baitos/baito", "POST", payload);
//         Notify("Baito created successfully!", { type: "success", duration: 3000, dismissible: true });
//         navigate(`/baito/${result.baitoid}`);
//       }
//     } catch (err) {
//       Notify(`Error: ${err.message || "Failed to save baito."}`, { type: "error", duration: 3000, dismissible: true });
//     } finally {
//       submitBtn.disabled = false;
//     }
//   });

//   form.appendChild(submitBtn);
//   section.append(createElement("h2", {}, [mode === "edit" ? "Edit Baito" : "Create Baito"]), form);
// }
