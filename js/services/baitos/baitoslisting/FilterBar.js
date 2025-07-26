import { categoryMap } from "./utils.js";
import Button from "../../../components/base/Button.js";
import { createElement } from "../../../components/createElement.js";

export function buildFilterBar(onFilterChange) {
  const categorySelect = createElement("select", {});
  const subcategorySelect = createElement("select", {});
  const locationInput = createElement("input", { type: "text", placeholder: "📍 Location (comma separated)" });
  const keywordInput = createElement("input", { type: "text", placeholder: "🔍 Keywords" });
  const wageInput = createElement("input", { type: "number", placeholder: "Min Wage (¥)", min: 0 });
  const sortSelect = createElement("select", {});

  categorySelect.append(
    createElement("option", { value: "" }, ["All Categories"]),
    ...Object.keys(categoryMap).map(cat => createElement("option", { value: cat }, [cat]))
  );
  subcategorySelect.append(createElement("option", { value: "" }, ["All Roles"]));
  sortSelect.append(
    createElement("option", { value: "date" }, ["Sort: Newest"]),
    createElement("option", { value: "wage" }, ["Sort: Wage (high → low)"])
  );

  categorySelect.addEventListener("change", () => {
    while (subcategorySelect.firstChild) subcategorySelect.removeChild(subcategorySelect.firstChild);
    subcategorySelect.append(
      createElement("option", { value: "" }, ["All Roles"]),
      ...(categoryMap[categorySelect.value] || []).map(sub => createElement("option", { value: sub }, [sub]))
    );
    onFilterChange();
  });

  [keywordInput, subcategorySelect, locationInput, wageInput, sortSelect].forEach(el =>
    el.addEventListener("input", onFilterChange)
  );

  const clearBtn = Button("Clear Filters", "clear-filters", {
    click: () => {
      categorySelect.value = "";
      subcategorySelect.value = "";
      locationInput.value = "";
      keywordInput.value = "";
      wageInput.value = "";
      sortSelect.value = "date";
      onFilterChange();
    }
  }, "btn btn-secondary");

  const filterBar = createElement("div", { class: "baito-filter-bar" }, [
    categorySelect, subcategorySelect, locationInput, keywordInput, wageInput, sortSelect, clearBtn
  ]);

  return {
    filterBar,
    getValues: () => ({
      category: categorySelect.value,
      subcategory: subcategorySelect.value,
      locations: locationInput.value.toLowerCase().split(",").map(s => s.trim()).filter(Boolean),
      keyword: keywordInput.value.toLowerCase(),
      minWage: parseInt(wageInput.value || "0", 10),
      sort: sortSelect.value
    }),
    resetPage: () => onFilterChange()
  };
}
