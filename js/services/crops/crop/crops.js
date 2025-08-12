// displayCrops.js
import { createElement } from "../../../components/createElement";
import { apiFetch } from "../../../api/api";
import { guessCategoryFromName } from "./displayCrops.helpers";
import { renderCropInterface } from "./displayCropsUI";

export async function displayCrops(content, isLoggedIn) {
  const contentContainer = createElement("div", { class: "cropspage" });

  content.replaceChildren(contentContainer);

  let categorized = {};

  try {
    const { cropTypes = [] } = await apiFetch("/crops/types");

    cropTypes.forEach(crop => {
      const category = guessCategoryFromName(crop.name);
      if (!categorized[category]) categorized[category] = [];
      categorized[category].push({
        ...crop,
        imageUrl: crop.imageUrl || "placeholder.jpg",
        category,
        tags: crop.tags || [],
        seasonMonths: crop.seasonMonths || []
      });
    });
  } catch (err) {
    contentContainer.replaceChildren(
      createElement("p", {}, [`Failed to load crops: ${err.message}`])
    );
    return;
  }

  if (!Object.keys(categorized).length) {
    contentContainer.appendChild(
      createElement("p", {}, ["No crops available."])
    );
    return;
  }

  renderCropInterface(contentContainer, categorized);
}

