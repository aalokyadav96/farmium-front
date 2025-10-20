import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import Imagex from "../../components/base/Imagex.js";
import { navigate } from "../../routes/index.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { displayListingPage } from "../../utils/displayListingPage.js";
import { apiFetch } from "../../api/api.js";
import { createRecipe } from "./createOrEditRecipe.js";

export async function displayRecipes(container, isLoggedIn) {
  container.replaceChildren();

  // Fetch tags for filter controls
  let allTags = [];
  try {
    const tagsResp = await apiFetch("/recipes/tags");
    allTags = Array.isArray(tagsResp) ? tagsResp : tagsResp.tags || [];
  } catch (err) {
    console.error("Failed to load tags", err);
  }

  displayListingPage(container, {
    title: "Recipes",
    apiEndpoint: "/recipes?offset=0&limit=10",
    type: "recipes",
    pageSize: 10,
    cardBuilder: recipe => createRecipeCard(recipe, isLoggedIn),
    sidebarActions: aside => {
      aside.appendChild(createElement("h3", {}, ["Actions"]));

      if (isLoggedIn) {
        aside.appendChild(Button("Create New Recipe", "create-recipe-btn", { click: () => createRecipe(container) }, "buttonx primary"));
      }

      // if (allTags.length) {
      //   aside.appendChild(createElement("h4", {}, ["Filter by Tags"]));
      //   allTags.forEach(tag => {
      //     const chip = Button(tag, `tag-${tag}`, {
      //       click: () => toggleTagFilter(tag)
      //     }, "buttonx tag-chip");
      //     aside.appendChild(chip);
      //   });
      // }
    }
  });

  // Local state for selected tags
  const selectedTags = new Set();

  function toggleTagFilter(tag) {
    if (selectedTags.has(tag)) selectedTags.delete(tag);
    else selectedTags.add(tag);

    // Re-render the listing page with filtered API endpoint
    const tagQuery = selectedTags.size ? `&tags=${Array.from(selectedTags).join(",")}` : "";
    displayListingPage(container, {
      title: "Recipes",
      apiEndpoint: `/recipes?offset=0&limit=10${tagQuery}`,
      type: "recipes",
      pageSize: 10,
      cardBuilder: recipe => createRecipeCard(recipe, isLoggedIn),
      sidebarActions: aside => {}
    });
  }
}

// Card builder
function createRecipeCard(recipe, isLoggedIn) {
  // const imageUrl = resolveImagePath(EntityType.RECIPE, PictureType.THUMB, recipe.imageUrls?.[0]);
  const imageUrl = resolveImagePath(EntityType.RECIPE, PictureType.THUMB, recipe.banner);
  return createElement("div", { class: "recipe-card" }, [
    Imagex({ src: imageUrl, alt: recipe.title, classes: "thumbnail" }),
    createElement("h3", {}, [recipe.title]),
    createElement("p", {}, [recipe.description]),
    createElement("p", {}, [`Prep Time: ${recipe.prepTime || "N/A"}`]),
    createElement("div", { class: "tags" }, (recipe.tags || []).map(tag =>
      createElement("span", { class: "tag" }, [tag])
    )),
    Button("View Recipe", `view-${recipe.recipeid}`, { click: () => navigate(`/recipe/${recipe.recipeid}`) }, "buttonx primary")
  ]);
}