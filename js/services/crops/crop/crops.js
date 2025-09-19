import { createElement } from "../../../components/createElement";
import { apiFetch } from "../../../api/api"; // fixed import
import { guessCategoryFromName } from "./displayCropshelpers";
import { renderCropInterface } from "./displayCropsUI";

export async function displayCrops(content, isLoggedIn) {
  const contentContainer = createElement("div", { class: "cropspage" });
  content.replaceChildren(contentContainer);

  // Always show heading
  contentContainer.appendChild(createElement("h2", {}, ["All Crops"]));

  let categorized = {};

  try {
    const response = await apiFetch("/crops/types");

    if (!response || typeof response !== "object") {
      throw new Error("Invalid response from server");
    }

    const { cropTypes } = response;
    if (!Array.isArray(cropTypes)) {
      throw new Error("`cropTypes` is not an array");
    }

    // Categorize crops
    cropTypes.forEach(crop => {
      if (!crop.name) return;
      const category = guessCategoryFromName(crop.name);
      if (!categorized[category]) categorized[category] = [];
      categorized[category].push({
        ...crop,
        imageUrl: crop.imageUrl || "placeholder.jpg",
        category,
        tags: Array.isArray(crop.tags) ? crop.tags : [],
        seasonMonths: Array.isArray(crop.seasonMonths) ? crop.seasonMonths : []
      });
    });

  } catch (err) {
    console.error("Error fetching crops:", err);
    categorized["Error"] = [];
  }

  // Render interface even if some categories are empty
  renderCropInterface(contentContainer, categorized);
}
