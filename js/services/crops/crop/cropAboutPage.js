// import { createElement } from "../../../components/createElement.js";
// import { apiFetch } from "../../../api/api.js";
// import Imagex from "../../../components/base/Imagex.js";
// import Notify from "../../../components/ui/Notify.mjs";

// export async function displayAboutCrop(contentContainer, cropID, isLoggedIn) {
//   contentContainer.textContent = "";

//   try {
//     const resp = await apiFetch(`/crops/wiki/${cropID}`);

//     if (!resp.success || !resp.crop) {
//       Notify("Crop information not found.", { type: "error" });
//       return;
//     }

//     const crop = resp.crop;

//     const wrapper = createElement("div", { class: "crop-wiki-wrapper" }, [
//       createHeaderSection(crop.commonName, crop.scientificName),
//       createImageSection(crop.image, crop.commonName)
//     ]);

//     // Render each section dynamically
//     crop.sections.forEach(section => {
//       wrapper.appendChild(createWikiSection(section, isLoggedIn, cropID));
//     });

//     if (isLoggedIn) {
//       wrapper.appendChild(createAddSectionControl(cropID));
//     }

//     contentContainer.appendChild(wrapper);
//   } catch (err) {
//     Notify(err.message || "Failed to load crop wiki.", { type: "error" });
//   }
// }

// function createHeaderSection(common, scientific) {
//   return createElement("section", { class: "crop-header" }, [
//     createElement("h1", {}, [common]),
//     createElement("h3", { class: "crop-scientific" }, [scientific])
//   ]);
// }

// function createImageSection(src, alt) {
//   const img = Imagex({ src, alt, classes: "crop-main-image", loading: "lazy" });
//   return createElement("section", { class: "crop-image-section" }, [img]);
// }

// function createWikiSection(section, isLoggedIn, cropID) {
//   const sectionEl = createElement("section", { class: "crop-section", id: `sec-${section.id}` }, [
//     createElement("h2", {}, [section.title]),
//     createElement("div", { class: "wiki-content" }, [section.content])
//   ]);

//   if (isLoggedIn) {
//     const editBtn = createElement("button", { class: "wiki-edit-btn" }, ["Edit"]);
//     editBtn.addEventListener("click", () => openEditMode(sectionEl, section, cropID));
//     sectionEl.appendChild(editBtn);
//   }

//   return sectionEl;
// }

// function openEditMode(sectionEl, section, cropID) {
//   const contentDiv = sectionEl.querySelector(".wiki-content");
//   const textarea = createElement("textarea", { class: "wiki-editor" }, [contentDiv.textContent]);
//   const saveBtn = createElement("button", { class: "wiki-save-btn" }, ["Save"]);
//   const cancelBtn = createElement("button", { class: "wiki-cancel-btn" }, ["Cancel"]);

//   sectionEl.replaceChildren(
//     createElement("h2", {}, [section.title]),
//     textarea,
//     createElement("div", { class: "wiki-controls" }, [saveBtn, cancelBtn])
//   );

//   cancelBtn.addEventListener("click", () => {
//     sectionEl.replaceChildren(createElement("h2", {}, [section.title]), contentDiv);
//   });

//   saveBtn.addEventListener("click", async () => {
//     const newText = textarea.value.trim();
//     if (!newText) return Notify("Content cannot be empty.", { type: "error" });

//     try {
//       const res = await apiFetch(`/crops/wiki/${cropID}/section/${section.id}`, "PATCH", { content: newText });
//       if (res.success) {
//         sectionEl.replaceChildren(
//           createElement("h2", {}, [section.title]),
//           createElement("div", { class: "wiki-content" }, [newText])
//         );
//         Notify("Section updated successfully.", { type: "success" });
//       } else {
//         Notify("Failed to update section.", { type: "error" });
//       }
//     } catch (err) {
//       Notify(err.message, { type: "error" });
//     }
//   });
// }

// function createAddSectionControl(cropID) {
//   const btn = createElement("button", { class: "wiki-add-section" }, ["Add Section"]);
//   btn.addEventListener("click", () => openAddSectionForm(cropID));
//   return btn;
// }

// function openAddSectionForm(cropID) {
//   const overlay = createElement("div", { class: "wiki-overlay" });
//   const titleInput = createElement("input", { type: "text", placeholder: "Section Title" });
//   const contentArea = createElement("textarea", { placeholder: "Section Content" });
//   const saveBtn = createElement("button", {}, ["Save"]);
//   const cancelBtn = createElement("button", {}, ["Cancel"]);

//   const form = createElement("div", { class: "wiki-form" }, [
//     createElement("h3", {}, ["New Section"]),
//     titleInput,
//     contentArea,
//     createElement("div", { class: "wiki-form-actions" }, [saveBtn, cancelBtn])
//   ]);

//   overlay.appendChild(form);
//   document.body.appendChild(overlay);

//   cancelBtn.addEventListener("click", () => overlay.remove());
//   saveBtn.addEventListener("click", async () => {
//     const title = titleInput.value.trim();
//     const content = contentArea.value.trim();
//     if (!title || !content) {
//       Notify("All fields required.", { type: "error" });
//       return;
//     }

//     try {
//       const res = await apiFetch(`/crops/wiki/${cropID}/section`, "POST", { title, content });
//       if (res.success) {
//         Notify("Section added for review.", { type: "success" });
//         overlay.remove();
//       } else {
//         Notify("Failed to add section.", { type: "error" });
//       }
//     } catch (err) {
//       Notify(err.message, { type: "error" });
//     }
//   });
// }

import Imagex from "../../../components/base/Imagex.js";
import { createElement } from "../../../components/createElement.js";

export async function displayAboutCrop(contentContainer, cropID, isLoggedIn) {
    contentContainer.textContent = "";

    const wrapper = createElement("div", { class: "crop-about-wrapper" }, [
        createHeaderSection("Tomato", "Solanum lycopersicum"),
        createImageSection("/static/images/tomato.jpg", "A ripe tomato on vine"),
        createDescriptionSection(),
        createNutritionalSection(),
        createGrowingConditionsSection(),
        createPlantingHarvestingSection(),
        createCareSection(),
        createVarietiesSection(),
        createUsageSection(),
        createFunFactsSection()
    ]);

    contentContainer.appendChild(wrapper);
}

function createHeaderSection(common, scientific) {
    return createElement("section", { class: "crop-header" }, [
        createElement("h1", {}, [common]),
        createElement("h3", { class: "crop-scientific" }, [scientific])
    ]);
}

function createImageSection(src, alt) {
    const img = Imagex( {
        src,
        alt,
        clasess: "crop-main-image",
        loading: "lazy"
    });
    return createElement("section", { class: "crop-image-section" }, [img]);
}

function createDescriptionSection() {
    return createElement("section", { class: "crop-section" }, [
        createElement("h2", {}, ["Description"]),
        createElement("p", {}, [
            "Tomatoes are warm-season annuals native to western South America. They are grown for their edible fruits, which are rich in vitamin C and antioxidants. Tomatoes grow on vines and come in a variety of colors including red, yellow, and purple."
        ])
    ]);
}

function createNutritionalSection() {
    const list = createElement("ul", {}, [
        createElement("li", {}, ["Calories: 18 kcal"]),
        createElement("li", {}, ["Water: 95%"]),
        createElement("li", {}, ["Vitamin C: 13.7 mg"]),
        createElement("li", {}, ["Potassium: 237 mg"]),
        createElement("li", {}, ["Lycopene: High"])
    ]);
    return createElement("section", { class: "crop-section" }, [
        createElement("h2", {}, ["Nutritional Value (per 100g)"]),
        list
    ]);
}

function createGrowingConditionsSection() {
    const table = createElement("table", { class: "crop-table" }, [
        createElement("tr", {}, [
            createElement("th", {}, ["Soil"]),
            createElement("td", {}, ["Well-drained, loamy"])
        ]),
        createElement("tr", {}, [
            createElement("th", {}, ["Sunlight"]),
            createElement("td", {}, ["Full sun (6–8 hrs)"])
        ]),
        createElement("tr", {}, [
            createElement("th", {}, ["Water"]),
            createElement("td", {}, ["Moderate, consistent"])
        ]),
        createElement("tr", {}, [
            createElement("th", {}, ["Temperature"]),
            createElement("td", {}, ["20°C – 30°C"])
        ])
    ]);
    return createElement("section", { class: "crop-section" }, [
        createElement("h2", {}, ["Ideal Growing Conditions"]),
        table
    ]);
}

function createPlantingHarvestingSection() {
    return createElement("section", { class: "crop-section" }, [
        createElement("h2", {}, ["Planting & Harvesting"]),
        createElement("p", {}, [
            "Plant tomato seeds indoors 6–8 weeks before the last frost. Transplant outdoors when seedlings are 15cm tall. Harvest typically begins 60–85 days after planting, when fruits are fully colored and slightly soft to touch."
        ])
    ]);
}

function createCareSection() {
    return createElement("section", { class: "crop-section" }, [
        createElement("h2", {}, ["Care & Maintenance"]),
        createElement("ul", {}, [
            createElement("li", {}, ["Use compost-rich soil for optimal growth."]),
            createElement("li", {}, ["Stake or cage the plants to support vines."]),
            createElement("li", {}, ["Watch for blight and aphids."]),
            createElement("li", {}, ["Rotate crops yearly to prevent disease."])
        ])
    ]);
}

function createVarietiesSection() {
    return createElement("section", { class: "crop-section" }, [
        createElement("h2", {}, ["Varieties"]),
        createElement("ul", {}, [
            createElement("li", {}, ["Roma"]),
            createElement("li", {}, ["Cherry"]),
            createElement("li", {}, ["Beefsteak"]),
            createElement("li", {}, ["Heirloom"])
        ])
    ]);
}

function createUsageSection() {
    return createElement("section", { class: "crop-section" }, [
        createElement("h2", {}, ["Usage"]),
        createElement("p", {}, [
            "Tomatoes are used in sauces, salads, soups, juices, and condiments. They are also processed into ketchup, puree, and sun-dried forms. Medicinally, they are known for antioxidant properties."
        ])
    ]);
}

function createFunFactsSection() {
    return createElement("section", { class: "crop-section" }, [
        createElement("h2", {}, ["Fun Facts"]),
        createElement("ul", {}, [
            createElement("li", {}, ["Tomatoes were once thought to be poisonous."]),
            createElement("li", {}, ["China is the world's largest tomato producer."]),
            createElement("li", {}, ["Tomatoes are technically berries."])
        ])
    ]);
}
