import Button from "../../../components/base/Button";
import { createElement } from "../../../components/createElement";
import { apigFetch } from "../../../api/api.js";

export async function renderCategoryChips(container, selectedCategory, onSelect, type = "product") {
    let categories = [];
  
    try {
      const query = new URLSearchParams({ type }).toString();
      categories = await apigFetch(`/farm/items/categories?${query}`);
    } catch (err) {
      console.warn("Failed to load categories", err);
    }
  
    const chipContainer = createElement("div", { class: "chip-container" });
  
    const allChip = Button(
      "All",
      "chip-all",
      { click: () => onSelect("") },
      selectedCategory ? "chip" : "chip selected"
    );
    chipContainer.appendChild(allChip);
  
    categories.forEach((category) => {
      const chip = Button(
        category,
        `chip-${category}`,
        { click: () => onSelect(category) },
        selectedCategory === category ? "chip selected" : "chip"
      );
      chipContainer.appendChild(chip);
    });
  
    container.appendChild(chipContainer);
  }