import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { createRecipe } from "./createOrEditRecipe.js";
import { navigate } from "../../routes/index.js";
import { apiFetch } from "../../api/api.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

const PAGE_LIMIT = 2;

let offset = 0;
let currentSearch = "";
let currentIngredient = "";
let currentTags = new Set();
let currentSort = "newest";
let isLoading = false;
let hasMore = true;

export async function displayRecipes(content, isLoggedIn) {
  let contentContainer = createElement('div', { class: "recipespage" });
  content.innerHTML = "";
  content.appendChild(contentContainer);

  offset = 0;
  currentTags.clear();
  hasMore = true;
  contentContainer.replaceChildren();

  const wrapper = createElement("div", { class: "recipes-wrapper" });
  const aside = createElement("aside", { class: "recipes-aside" });
  const main = createElement("div", { class: "recipes-main" });

  const header = createElement("div", { class: "recipes-header" }, [
    createElement("h2", {}, ["Recipes"])
  ]);
  main.appendChild(header);

  aside.appendChild(createElement("h3", {}, ["Actions"]));
  if (isLoggedIn) {
    const createBtn = Button("Create New Recipe", "create-recipe-btn", { click: () => createRecipe(contentContainer) }, "primary-button");
    aside.appendChild(createBtn);
  }

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
    ["oldest", "Oldest"],
    ["views", "Most Viewed"],
    ["prepTime", "Shortest Prep Time"]
  ];
  sortOptions.forEach(([value, text]) => {
    const option = createElement("option", { value }, [text]);
    if (value === currentSort) option.selected = true;
    sortSelect.appendChild(option);
  });

  const tagCheckboxesContainer = createElement("div", { class: "tag-checkboxes" });
  const tags = await fetchAllTags();

  const container = createElement("div", { class: "recipe-grid-container" });

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
      hasMore = true;
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
    hasMore = true;
    renderRecipeGrid(container, isLoggedIn, true);
  });

  ingredientInput.addEventListener("input", (e) => {
    currentIngredient = e.target.value.trim();
    offset = 0;
    hasMore = true;
    renderRecipeGrid(container, isLoggedIn, true);
  });

  sortSelect.addEventListener("change", (e) => {
    currentSort = e.target.value;
    offset = 0;
    hasMore = true;
    renderRecipeGrid(container, isLoggedIn, true);
  });

  const controls = createElement("div", { class: "recipe-controls" }, [
    searchInput,
    ingredientInput,
    sortSelect,
    tagCheckboxesContainer,
  ]);

  contentContainer.appendChild(wrapper);
  wrapper.appendChild(main);
  wrapper.appendChild(aside);

  main.appendChild(controls);
  main.appendChild(container);

  await renderRecipeGrid(container, isLoggedIn, true);

  const observerTarget = createElement("div", { id: "infinite-scroll-trigger" });
  container.appendChild(observerTarget);

  const observer = new IntersectionObserver(async ([entry]) => {
    if (entry.isIntersecting && !isLoading && hasMore) {
      await renderRecipeGrid(container, isLoggedIn);
    }
  }, { threshold: 1.0 });

  observer.observe(observerTarget);
}

async function fetchAllTags() {
  try {
    const data = await apiFetch("/recipes/tags");
    return data.tags || [];
  } catch (err) {
    console.error("Failed to load tags", err);
    return [];
  }
}

async function renderRecipeGrid(container, isLoggedIn, reset = false) {
  if (isLoading || !hasMore && !reset) return;

  isLoading = true;

  if (reset) {
    offset = 0;
    hasMore = true;
  }

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
    hasMore = Array.isArray(data) ? data.length === PAGE_LIMIT : data.hasMore;

    const grid =
      container.querySelector(".recipe-grid") ||
      createElement("div", { class: "recipe-grid responsive-grid" });

    if (!container.contains(grid)) {
      container.insertBefore(grid, container.querySelector("#infinite-scroll-trigger"));
    }

    if (reset) {
      grid.replaceChildren();
    }

    // Optional small delay to improve UX if needed
    await delay(100);

    for (const recipe of recipes) {
      const imageUrl = resolveImagePath(
        EntityType.RECIPE,
        PictureType.THUMB,
        recipe.imageUrls?.[0]
      );

      const card = createElement("div", { class: "recipe-card" }, [
        createElement("img", {
          src: imageUrl,
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
        Button("View Recipe", `view-${recipe.recipeid}`, {
          click: () => navigate(`/recipe/${recipe.recipeid}`),
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
  } finally {
    isLoading = false;
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

// // src/ui/pages/recipes/displayRecipes.js
// import { createElement } from "../../components/createElement.js";
// import Button from "../../components/base/Button.js";
// import { createRecipe } from "./createOrEditRecipe.js";
// import { navigate } from "../../routes/index.js";
// import { SRC_URL, apiFetch } from "../../api/api.js";
// import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

// const PAGE_LIMIT = 2;

// let offset = 0;
// let currentSearch = "";
// let currentIngredient = "";
// let currentTags = new Set();
// let currentSort = "newest";

// export async function displayRecipes(content, isLoggedIn) {
//   let contentContainer = createElement('div', { class: "recipespage" }, []);
//   content.innerHTML = "";
//   content.appendChild(contentContainer);

//   offset = 0;
//   currentTags.clear();
//   contentContainer.replaceChildren();

//   const wrapper = createElement("div", { class: "recipes-wrapper" });
//   const aside = createElement("aside", { class: "recipes-aside" });
//   const main = createElement("div", { class: "recipes-main" });

//   const header = createElement("div", { class: "recipes-header" }, [
//     createElement("h2", {}, ["Recipes"])
//   ]);
//   main.appendChild(header);

//   aside.appendChild(createElement("h3", {}, ["Actions"]));
//   if (isLoggedIn) {
//     const createBtn = Button("Create New Recipe", "create-recipe-btn", { click: () => createRecipe(contentContainer) }, "primary-button");
//     aside.appendChild(createBtn);
//   }

//   const searchInput = createElement("input", {
//     type: "text",
//     placeholder: "Search recipes by title...",
//     value: currentSearch,
//   });

//   const ingredientInput = createElement("input", {
//     type: "text",
//     placeholder: "Search by ingredient...",
//     value: currentIngredient,
//   });

//   const sortSelect = createElement("select");
//   const sortOptions = [
//     ["newest", "Newest"],             // createdAt desc
//     ["oldest", "Oldest"],              // createdAt asc
//     ["views", "Most Viewed"],          // views desc
//     ["prepTime", "Shortest Prep Time"] // prepTime asc
//   ];
//   sortOptions.forEach(([value, text]) => {
//     const option = createElement("option", { value }, [text]);
//     if (value === currentSort) option.selected = true;
//     sortSelect.appendChild(option);
//   });
  

//   const tagCheckboxesContainer = createElement("div", { class: "tag-checkboxes" });
//   const tags = await fetchAllTags();

//   const container = createElement("div", { class: "recipe-grid-container" }); // Moved up

//   tags.forEach((tag) => {
//     const checkbox = createElement("input", {
//       type: "checkbox",
//       value: tag,
//       checked: currentTags.has(tag),
//     });

//     checkbox.addEventListener("change", () => {
//       if (checkbox.checked) currentTags.add(tag);
//       else currentTags.delete(tag);
//       offset = 0;
//       renderRecipeGrid(container, isLoggedIn, true);
//     });

//     const label = createElement("label", {}, [
//       checkbox,
//       createElement("span", {}, [tag]),
//     ]);
//     tagCheckboxesContainer.appendChild(label);
//   });

//   searchInput.addEventListener("input", (e) => {
//     currentSearch = e.target.value.trim();
//     offset = 0;
//     renderRecipeGrid(container, isLoggedIn, true);
//   });

//   ingredientInput.addEventListener("input", (e) => {
//     currentIngredient = e.target.value.trim();
//     offset = 0;
//     renderRecipeGrid(container, isLoggedIn, true);
//   });

//   sortSelect.addEventListener("change", (e) => {
//     currentSort = e.target.value;
//     offset = 0;
//     renderRecipeGrid(container, isLoggedIn, true);
//   });

//   const controls = createElement("div", { class: "recipe-controls" }, [
//     searchInput,
//     ingredientInput,
//     sortSelect,
//     tagCheckboxesContainer,
//   ]);

//   contentContainer.appendChild(wrapper);
//   wrapper.appendChild(main);
//   wrapper.appendChild(aside);

//   main.appendChild(controls);
//   main.appendChild(container);

//   await renderRecipeGrid(container, isLoggedIn, true);

//   const observerTarget = createElement("div", { id: "infinite-scroll-trigger" });
//   container.appendChild(observerTarget);

//   const observer = new IntersectionObserver(async ([entry]) => {
//     if (entry.isIntersecting) {
//       await renderRecipeGrid(container, isLoggedIn);
//     }
//   }, { threshold: 1.0 });

//   observer.observe(observerTarget);
// }



// async function fetchAllTags() {
//   try {
//     const res = await apiFetch("/recipes/tags");
//     // const data = await res.json();
//     const data = await res;
//     return data.tags || [];
//   } catch (err) {
//     console.error("Failed to load tags", err);
//     return [];
//   }
// }

// async function renderRecipeGrid(container, isLoggedIn, reset = false) {
//   const params = new URLSearchParams({
//     offset,
//     limit: PAGE_LIMIT,
//     search: currentSearch,
//     ingredient: currentIngredient,
//     sort: currentSort,
//   });

//   if (currentTags.size) {
//     params.set("tags", Array.from(currentTags).join(","));
//   }

//   try {
//     const data = await apiFetch(`/recipes?${params.toString()}`);
//     const recipes = Array.isArray(data) ? data : (data.recipes || []);
//     const hasMore = Array.isArray(data) ? data.length === PAGE_LIMIT : data.hasMore;

//     const grid =
//       container.querySelector(".recipe-grid") ||
//       createElement("div", { class: "recipe-grid responsive-grid" });

//     if (!container.contains(grid)) {
//       container.insertBefore(grid, container.querySelector("#infinite-scroll-trigger"));
//     }

//     if (reset || offset === 0) {
//       grid.replaceChildren();
//     }

//     await delay(100); // Optional loading delay

//     for (const recipe of recipes) {
//       const imageUrl = resolveImagePath(
//         EntityType.RECIPE,
//         PictureType.THUMB,
//         recipe.imageUrls?.[0]
//       );
    
//       const card = createElement("div", { class: "recipe-card" }, [
//         createElement("img", {
//           src: imageUrl,
//           alt: recipe.title,
//           class: "thumbnail",
//         }),
//         createElement("h3", {}, [recipe.title]),
//         createElement("p", {}, [recipe.description]),
//         createElement("p", {}, [`Prep Time: ${recipe.prepTime || "N/A"}`]),
//         renderBadges(recipe),
//         createElement(
//           "div",
//           { class: "tags" },
//           recipe.tags?.map((tag) =>
//             createElement("span", { class: "tag" }, [tag])
//           ) || []
//         ),
//         Button("View Recipe", `view-${recipe.recipeid}`, {
//           click: () => navigate(`/recipe/${recipe.recipeid}`),
//         }),
//       ]);
    
//       grid.appendChild(card);
//     }
    

//     offset += PAGE_LIMIT;

//     if (!hasMore) {
//       const trigger = container.querySelector("#infinite-scroll-trigger");
//       if (trigger) trigger.remove();
//     }
//   } catch (err) {
//     console.error("Error loading recipes:", err);
//   }
// }


// function renderBadges(recipe) {
//   const badges = [];

//   const age = Date.now() - recipe.createdAt * 1000;
//   if (age < 1000 * 60 * 60 * 24 * 7) {
//     badges.push(createElement("span", { class: "badge new-badge" }, ["New"]));
//   }

//   if (recipe.views > 200) {
//     badges.push(
//       createElement("span", { class: "badge trending-badge" }, ["Trending"])
//     );
//   }

//   return createElement("div", { class: "badges" }, badges);
// }


// function delay(ms) {
//   return new Promise((res) => setTimeout(res, ms));
// }
