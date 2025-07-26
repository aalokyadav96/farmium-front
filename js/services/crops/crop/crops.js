// import { createElement } from "../../../components/createElement";
// import { apiFetch } from "../../../api/api";
// import { guessCategoryFromName, createPromoLink } from "./displayCrops.helpers";
// import { renderCropInterface } from "./displayCropsUI";

// export async function displayCrops(content, isLoggedIn) {
//   content.textContent = "";

//   const layout = createElement("div", { class: "cropspage" });
//   content.appendChild(layout);

//   const aside = createElement("div", { class: "cropsaside" }, []);
//   const main = createElement("div", { class: "cropsmain" }, []);
//   layout.appendChild(aside);
//   layout.appendChild(main);

//   const categorized = {};

//   try {
//     const { cropTypes = [] } = await apiFetch("/crops/types");

//     cropTypes.forEach(crop => {
//       const category = guessCategoryFromName(crop.name);
//       if (!categorized[category]) categorized[category] = [];

//       categorized[category].push({
//         ...crop,
//         image: crop.imageUrl || "placeholder.jpg",
//         category,
//         tags: crop.tags || [],
//         seasonMonths: crop.seasonMonths || []
//       });
//     });
//   } catch (err) {
//     main.appendChild(
//       createElement("p", { class: "error-msg" }, [`⚠️ Failed to load crops: ${err.message}`])
//     );
//     console.error(err);
//     return;
//   }

//   if (!Object.keys(categorized).length) {
//     main.appendChild(
//       createElement("p", {}, ["No crops available."])
//     );
//     return;
//   }

//   renderCropInterface(main, categorized);
// }

// displayCrops.js
import { createElement } from "../../../components/createElement";
import { apiFetch } from "../../../api/api";
import { guessCategoryFromName, createPromoLink } from "./displayCrops.helpers";
import { renderCropInterface } from "./displayCropsUI";

export async function displayCrops(content, isLoggedIn) {
  let contentContainer = createElement('div', { "class": "cropspage" }, []);

  content.innerHTML = "";
  content.appendChild(contentContainer);
  // const tagFilters = ["Organic", "Imported", "Local", "Bestseller"];
  let categorized = {};

  // Fetch and group by category
  try {
    const { cropTypes = [] } = await apiFetch("/crops/types");
    cropTypes.forEach(crop => {
      const category = guessCategoryFromName(crop.name);
      if (!categorized[category]) categorized[category] = [];
      categorized[category].push({
        ...crop,
        image: crop.imageUrl || "placeholder.jpg",
        category,
        tags: crop.tags || [],
        seasonMonths: crop.seasonMonths || []
      });
    });
  } catch (err) {
    contentContainer.innerHTML = "";
    contentContainer.appendChild(
      createElement("p", {}, [`Failed to load crops: ${err.message}`])
    );
    return;
  }

  if (!Object.keys(categorized).length) {
    // contentContainer.innerHTML = "";
    contentContainer.appendChild(
      createElement("p", {}, ["No crops available."])
    );
    return;
  }

  // Render full UI
  // renderCropInterface(contentContainer, categorized, tagFilters);
  renderCropInterface(contentContainer, categorized);
}
