// src/ui/pages/recipes/displayRecipes.js
import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { createRecipe } from "./createOrEditRecipe.js";
import { navigate } from "../../routes/index.js";
import { SRC_URL, apiFetch } from "../../api/api.js";

const PAGE_LIMIT = 2;

let offset = 0;
let currentSearch = "";
let currentIngredient = "";
let currentTags = new Set();
let currentSort = "newest";

export async function displayRecipes(content, isLoggedIn) {
  let contentContainer = createElement('div', { "class": "recipespage" }, []);

  content.innerHTML = "";
  content.appendChild(contentContainer);
  offset = 0;
  currentTags.clear();
  contentContainer.replaceChildren();

  const header = createElement("div", { class: "recipes-header" }, [
    createElement("h2", {}, ["Recipes"]),
    isLoggedIn
      ? Button(
        "Create New Recipe",
        "create-recipe-btn",
        { click: () => createRecipe(contentContainer) },
        "primary-button"
      )
      : null,
  ]);

  const searchInput = createElement("input", {
    type: "text",
    placeholder: "Search recipes by title...",
    value: currentSearch,
  });

  const ingredientInput = createElement("input", {
    type: "text",
    placeholder: "Search by ingredient...",
    value: currentIngredient,
  });

  const sortSelect = createElement("select");
  const sortOptions = [
    ["newest", "Newest"],
    ["views", "Most Viewed"],
    ["prepTime", "Shortest Prep Time"],
  ];
  sortOptions.forEach(([value, text]) => {
    const option = createElement("option", { value }, [text]);
    if (value === currentSort) option.selected = true;
    sortSelect.appendChild(option);
  });

  const tagCheckboxesContainer = createElement("div", { class: "tag-checkboxes" });
  const tags = await fetchAllTags();

  tags.forEach((tag) => {
    const checkbox = createElement("input", {
      type: "checkbox",
      value: tag,
      checked: currentTags.has(tag),
    });

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) currentTags.add(tag);
      else currentTags.delete(tag);
      offset = 0;
      renderRecipeGrid(container, isLoggedIn, true);
    });

    const label = createElement("label", {}, [
      checkbox,
      createElement("span", {}, [tag]),
    ]);
    tagCheckboxesContainer.appendChild(label);
  });

  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value.trim();
    offset = 0;
    renderRecipeGrid(container, isLoggedIn, true);
  });

  ingredientInput.addEventListener("input", (e) => {
    currentIngredient = e.target.value.trim();
    offset = 0;
    renderRecipeGrid(container, isLoggedIn, true);
  });

  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    offset = 0;
    renderRecipeGrid(container, isLoggedIn, true);
  });

  const controls = createElement("div", { class: "recipe-controls" }, [
    searchInput,
    ingredientInput,
    sortSelect,
    tagCheckboxesContainer,
  ]);

  const container = createElement("div", { class: "recipe-grid-container" });

  contentContainer.appendChild(header);
  contentContainer.appendChild(controls);
  contentContainer.appendChild(container);

  await renderRecipeGrid(container, isLoggedIn, true);

  const observerTarget = createElement("div", { id: "infinite-scroll-trigger" });
  container.appendChild(observerTarget);

  const observer = new IntersectionObserver(async ([entry]) => {
    if (entry.isIntersecting) {
      await renderRecipeGrid(container, isLoggedIn);
    }
  }, { threshold: 1.0 });

  observer.observe(observerTarget);
}

async function fetchAllTags() {
  try {
    const res = await apiFetch("/recipes/tags");
    // const data = await res.json();
    const data = await res;
    return data.tags || [];
  } catch (err) {
    console.error("Failed to load tags", err);
    return [];
  }
}

async function renderRecipeGrid(container, isLoggedIn, reset = false) {
  const params = new URLSearchParams({
    offset,
    limit: PAGE_LIMIT,
    search: currentSearch,
    ingredient: currentIngredient,
    sort: currentSort,
  });

  if (currentTags.size) {
    params.set("tags", Array.from(currentTags).join(","));
  }

  try {
    const data = await apiFetch(`/recipes?${params.toString()}`);
    const recipes = Array.isArray(data) ? data : (data.recipes || []);
    const hasMore = Array.isArray(data) ? data.length === PAGE_LIMIT : data.hasMore;

    const grid =
      container.querySelector(".recipe-grid") ||
      createElement("div", { class: "recipe-grid responsive-grid" });

    if (!container.contains(grid)) {
      container.insertBefore(grid, container.querySelector("#infinite-scroll-trigger"));
    }

    if (reset || offset === 0) {
      grid.replaceChildren();
    }

    await delay(100); // Optional loading delay

    for (const recipe of recipes) {
      const card = createElement("div", { class: "recipe-card" }, [
        createElement("img", {
          src: recipe.imageUrls?.[0]
            ? `${SRC_URL}/uploads/${recipe.imageUrls[0]}`
            : `/static/images/placeholder.jpg`,
          alt: recipe.title,
          class: "thumbnail",
        }),
        createElement("h3", {}, [recipe.title]),
        createElement("p", {}, [recipe.description]),
        createElement("p", {}, [`Prep Time: ${recipe.prepTime || "N/A"}`]),
        renderBadges(recipe),
        createElement(
          "div",
          { class: "tags" },
          recipe.tags?.map((tag) =>
            createElement("span", { class: "tag" }, [tag])
          ) || []
        ),
        Button("View Recipe", `view-${recipe.id}`, {
          click: () => navigate(`/recipe/${recipe.id}`),
        }),
      ]);

      grid.appendChild(card);
    }

    offset += PAGE_LIMIT;

    if (!hasMore) {
      const trigger = container.querySelector("#infinite-scroll-trigger");
      if (trigger) trigger.remove();
    }
  } catch (err) {
    console.error("Error loading recipes:", err);
  }
}


function renderBadges(recipe) {
  const badges = [];

  const age = Date.now() - recipe.createdAt * 1000;
  if (age < 1000 * 60 * 60 * 24 * 7) {
    badges.push(createElement("span", { class: "badge new-badge" }, ["New"]));
  }

  if (recipe.views > 200) {
    badges.push(
      createElement("span", { class: "badge trending-badge" }, ["Trending"])
    );
  }

  return createElement("div", { class: "badges" }, badges);
}


function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
