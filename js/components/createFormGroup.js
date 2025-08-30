import { createElement } from "./createElement.js";

export function createFormGroup({
  type = "text",
  id = "",
  name = "",
  label = "",
  value = "",
  placeholder = "",
  required = false,
  accept = "",
  options = [],
  multiple = false,
  additionalProps = {}
}) {
  const group = createElement("div", { class: "form-group" });

  if (label) {
    const labelAttrs = {};
    if (id) labelAttrs.for = id;
    const labelElement = createElement("label", labelAttrs, [label]);
    group.appendChild(labelElement);
  }

  const inputName = name || id || "";
  let inputElement;

  if (type === "textarea") {
    inputElement = createElement("textarea", { id: id || undefined, name: inputName || undefined, placeholder: placeholder || undefined });
    if (value !== undefined && value !== null) inputElement.value = String(value);
  } else if (type === "select" || type === "multiselect") {
    inputElement = createElement("select", { id: id || undefined, name: inputName || undefined });
    if (type === "multiselect" || multiple) inputElement.multiple = true;

    // Add placeholder as disabled first option if defined
    if (placeholder) {
      const placeholderOption = createElement("option", { value: "", disabled: true, selected: !value }, [placeholder]);
      inputElement.appendChild(placeholderOption);
    }

    options.forEach(opt => {
      const { value: optValue, label: optLabel } =
        typeof opt === "string" ? { value: opt, label: opt } : opt;

      const optionAttrs = { value: optValue };
      if (optValue === "" && !placeholder) optionAttrs.disabled = true;

      const option = createElement("option", optionAttrs, [optLabel]);

      const valueLower = Array.isArray(value)
        ? value.map(v => String(v).toLowerCase())
        : String(value).toLowerCase();

      if (
        (Array.isArray(value) && valueLower.includes(String(optValue).toLowerCase())) ||
        (!Array.isArray(value) && String(optValue).toLowerCase() === String(value).toLowerCase())
      ) {
        option.selected = true;
      }

      inputElement.appendChild(option);
    });
  } else {
    const inputAttrs = {
      type,
      id: id || undefined,
      name: inputName || undefined,
      placeholder: placeholder || undefined
    };
    if (type !== "file" && value !== undefined && value !== null) inputAttrs.value = value;

    inputElement = createElement("input", inputAttrs);

    if (accept && typeof inputElement.accept !== "undefined") inputElement.accept = accept;
    if ((type === "file") && multiple) inputElement.multiple = true;
  }

  if (required) inputElement.required = true;

  Object.entries(additionalProps).forEach(([key, val]) => {
    try {
      if (key in inputElement) inputElement[key] = val;
      else inputElement.setAttribute(key, String(val));
    } catch {
      inputElement.setAttribute(key, String(val));
    }
  });

  group.appendChild(inputElement);

  // File preview logic (unchanged)
  if (type === "file") {
    const previewContainer = createElement("div", { style: "display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;" });
    group.appendChild(previewContainer);

    let createdUrls = [];
    const clearPreviews = () => {
      previewContainer.innerHTML = "";
      createdUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch {} });
      createdUrls = [];
    };

    if (value) {
      const img = createElement("img", { src: value, style: "max-width:150px;max-height:150px;object-fit:cover;border-radius:6px;" });
      previewContainer.appendChild(img);
    }

    inputElement.addEventListener("change", (e) => {
      clearPreviews();
      Array.from(e.target.files || []).forEach(file => {
        if (!(file instanceof File)) return;
        const url = URL.createObjectURL(file);
        createdUrls.push(url);
        const img = createElement("img", { src: url, style: "max-width:150px;max-height:150px;object-fit:cover;border-radius:6px;" });
        img.addEventListener("load", () => { try { URL.revokeObjectURL(url); } catch {} }, { once: true });
        previewContainer.appendChild(img);
      });
    });

    const observer = new MutationObserver(() => {
      if (!document.body.contains(group)) { clearPreviews(); observer.disconnect(); }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  return group;
}

// import { createElement } from "./createElement.js";

// export function createFormGroup({
//   type = "text",
//   id = "",
//   name = "",
//   label = "",
//   value = "",
//   placeholder = "",
//   required = false,
//   accept = "",
//   options = [],
//   multiple = false,
//   additionalProps = {}
// }) {
//   const group = createElement("div", { class: "form-group" });

//   if (label) {
//     const labelAttrs = {};
//     if (id) labelAttrs.for = id;
//     const labelElement = createElement("label", labelAttrs, [label]);
//     group.appendChild(labelElement);
//   }

//   const inputName = name || id || "";

//   let inputElement;

//   if (type === "textarea") {
//     inputElement = createElement("textarea", { id: id || undefined, name: inputName || undefined, placeholder: placeholder || undefined });
//     if (value !== undefined && value !== null) inputElement.value = String(value);
//   } else if (type === "select" || type === "multiselect") {
//     inputElement = createElement("select", { id: id || undefined, name: inputName || undefined });
//     if (type === "multiselect" || multiple) inputElement.multiple = true;

//     options.forEach(opt => {
//       const { value: optValue, label: optLabel } =
//         typeof opt === "string" ? { value: opt, label: opt } : opt;

//       const optionAttrs = { value: optValue };
//       if (optValue === "") optionAttrs.disabled = true;

//       const option = createElement("option", optionAttrs, [optLabel]);

//       const valueLower = Array.isArray(value)
//         ? value.map(v => String(v).toLowerCase())
//         : String(value).toLowerCase();

//       if (
//         (Array.isArray(value) && valueLower.includes(String(optValue).toLowerCase())) ||
//         (!Array.isArray(value) && String(optValue).toLowerCase() === String(value).toLowerCase())
//       ) {
//         option.selected = true;
//       }

//       inputElement.appendChild(option);
//     });
//   } else {
//     // Normal input (text, number, file, etc.)
//     const inputAttrs = {
//       type,
//       id: id || undefined,
//       name: inputName || undefined,
//       placeholder: placeholder || undefined
//     };

//     // For file inputs do not set value attribute
//     if (type !== "file" && value !== undefined && value !== null) inputAttrs.value = value;

//     inputElement = createElement("input", inputAttrs);

//     if (accept && typeof inputElement.accept !== "undefined") inputElement.accept = accept;
//     if ((type === "file") && multiple) inputElement.multiple = true;
//   }

//   if (required) inputElement.required = true;

//   // Apply additionalProps safely: prefer property assignment, fallback to setAttribute
//   Object.entries(additionalProps).forEach(([key, val]) => {
//     try {
//       // numeric attributes sometimes need string conversion
//       if (key in inputElement) inputElement[key] = val;
//       else inputElement.setAttribute(key, String(val));
//     } catch {
//       inputElement.setAttribute(key, String(val));
//     }
//   });

//   group.appendChild(inputElement);

//   // File preview handling with URL.revokeObjectURL to avoid leaks
//   if (type === "file") {
//     const previewContainer = createElement("div", {
//       style: "display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;"
//     });
//     group.appendChild(previewContainer);

//     let createdUrls = [];

//     const clearPreviews = () => {
//       previewContainer.innerHTML = "";
//       createdUrls.forEach(u => {
//         try { URL.revokeObjectURL(u); } catch (e) { /* ignore */ }
//       });
//       createdUrls = [];
//     };

//     if (value) {
//       // assume value is a URL string
//       const img = createElement("img", {
//         src: value,
//         style: "max-width:150px;max-height:150px;object-fit:cover;border-radius:6px;"
//       });
//       // if it's an external URL no need to revoke
//       previewContainer.appendChild(img);
//     }

//     inputElement.addEventListener("change", (e) => {
//       clearPreviews();
//       const files = Array.from(e.target.files || []);
//       files.forEach(file => {
//         if (!(file instanceof File)) return;
//         const url = URL.createObjectURL(file);
//         createdUrls.push(url);

//         const img = createElement("img", {
//           src: url,
//           style: "max-width:150px;max-height:150px;object-fit:cover;border-radius:6px;"
//         });

//         // revoke once loaded
//         img.addEventListener("load", () => {
//           try { URL.revokeObjectURL(url); } catch (err) { /* ignore */ }
//         }, { once: true });

//         previewContainer.appendChild(img);
//       });
//     });

//     // If group removed from DOM later, try to revoke any leftover URLs
//     const observer = new MutationObserver(() => {
//       if (!document.body.contains(group)) {
//         clearPreviews();
//         observer.disconnect();
//       }
//     });
//     observer.observe(document.documentElement, { childList: true, subtree: true });
//   }

//   return group;
// }
