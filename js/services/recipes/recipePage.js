import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { addToCart } from "../cart/addToCart.js";
import { apiFetch } from "../../api/api.js";
import { getState } from "../../state/state.js";
import { editRecipe } from "./createOrEditRecipe.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Imagex from "../../components/base/Imagex.js";
import { createCommentsSection } from "../comments/comments.js";

// --- LocalStorage Helpers ---
function getStepKey(recipeId) { return `completedSteps:${recipeId}`; }
function getFavorites() { return JSON.parse(localStorage.getItem("favoriteRecipes") || "[]"); }
function saveFavorite(recipeId, value) {
  let fav = getFavorites();
  fav = value ? [...new Set([...fav, recipeId])] : fav.filter(id => id !== recipeId);
  localStorage.setItem("favoriteRecipes", JSON.stringify(fav));
}

// --- Inline Edit Helper ---
function makeInlineEditable(container, currentText, onSave) {
  const input = createElement("input", { type: "text", value: currentText });
  const saveBtn = Button("Save", "", {}, "tiny-button");
  const cancelBtn = Button("Cancel", "", {}, "tiny-button");

  container.replaceChildren(input, saveBtn, cancelBtn);

  saveBtn.addEventListener("click", () => {
    const newVal = input.value.trim();
    if (newVal) onSave(newVal);
  });

  cancelBtn.addEventListener("click", () => {
    container.replaceChildren(createElement("span", {}, [currentText]));
  });
}

// --- Section Renderers ---
function renderAuthor(recipe, currentUser) {
  if (currentUser?.id === recipe.userId) {
    return createElement("p", { class: "author-info" }, ["By You"]);
  }
  return createElement("p", { class: "author-info" }, [
    "By ",
    createElement("a", { href: `/user/${recipe.userId}` }, [recipe.userName || recipe.userId])
  ]);
}

function renderGallery(images, title) {
  let imgIndex = 0;
  const imageEl = Imagex({ 
    src: images.length ? resolveImagePath(EntityType.RECIPE, PictureType.PHOTO, images[0]) : "", 
    alt: title, 
    classes: "thumbnail" 
  });

  const prevBtn = Button("Prev", "prev-img", {}, "small-button");
  const nextBtn = Button("Next", "next-img", {}, "small-button");

  function updateImg() {
    if (images.length) imageEl.src = resolveImagePath(EntityType.RECIPE, PictureType.PHOTO, images[imgIndex]);
  }
  prevBtn.addEventListener("click", () => { imgIndex = (imgIndex - 1 + images.length) % images.length; updateImg(); });
  nextBtn.addEventListener("click", () => { imgIndex = (imgIndex + 1) % images.length; updateImg(); });

  let touchStartX = 0;
  imageEl.addEventListener("touchstart", e => touchStartX = e.changedTouches[0].screenX, { passive: true });
  imageEl.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (dx > 50) prevBtn.click();
    if (dx < -50) nextBtn.click();
  }, { passive: true });

  return createElement("div", { class: "image-gallery" }, [imageEl, prevBtn, nextBtn]);
}

function renderInfoBox(recipe) {
  const children = [
    createElement("p", {}, [recipe.description || ""]),
    createElement("p", {}, [`Cook Time: ${recipe.cookTime || "N/A"}`])
  ];
  if (recipe.cuisine) children.push(createElement("p", {}, [`Cuisine: ${recipe.cuisine}`]));
  if (recipe.portionSize) children.push(createElement("p", {}, [`Portion Size: ${recipe.portionSize}`]));
  if (recipe.season) children.push(createElement("p", {}, [`Season / Occasion: ${recipe.season}`]));
  if (Array.isArray(recipe.dietary) && recipe.dietary.length) {
    children.push(createElement("p", {}, [`Dietary: ${recipe.dietary.join(", ")}`]));
  }
  if (recipe.videoUrl) {
    children.push(createElement("p", {}, [
      createElement("a", { href: recipe.videoUrl, target: "_blank" }, ["Watch Video Tutorial"])
    ]));
  }
  if (recipe.notes) children.push(createElement("p", {}, [`Notes: ${recipe.notes}`]));

  return createElement("div", { class: "recipe-info-box" }, children);
}

function renderTags(tags) {
  return createElement("div", { class: "tags-section" }, [
    createElement("h3", {}, ["Tags"]),
    createElement("div", { class: "tags" }, (tags || []).map(tag => createElement("span", { class: "tag" }, [tag])))
  ]);
}

function renderIngredients(ingredients, isLoggedIn, recipe) {
  const ingList = createElement("ul", { class: "ingredients-list" });
  if (!Array.isArray(ingredients) || !ingredients.length) {
    return createElement("ul", { class: "ingredients-list" }, [createElement("li", {}, ["No ingredients available."])]);
  }

  function makeAddBtn(item, qty, unit) {
    const btn = Button("Add to Cart", `add-${item.itemId}`, {}, "small-button");
    btn.addEventListener("click", () => addToCart({
      category: item.type || "unknown",
      itemName: item.name || "Unknown Item",
      itemId: item.itemId,
      entityName: item.storeName || "",
      entityType: "store",
      entityId: item.storeId || "",
      quantity: qty || 1,
      price: item.price || 10,
      unit: unit || "",
      isLoggedIn
    }));
    return btn;
  }

  ingredients.forEach((ing, idx) => {
    const li = createElement("li", {});
    const textContainer = createElement("span", {}, [`${ing.quantity || ""} ${ing.unit || ""} ${ing.name || ""}`]);
    li.appendChild(textContainer);

    if (!ing.itemId) li.appendChild(createElement("span", { class: "warning" }, ["Unavailable in store"]));
    if (isLoggedIn && ing.itemId) li.appendChild(makeAddBtn(ing, ing.quantity, ing.unit));

    // Edit/Delete (only author)
    if (getState("user")?.id === recipe.userId) {
      const editBtn = Button("Edit", "", {}, "tiny-button");
      const delBtn = Button("Delete", "", {}, "tiny-button");

      editBtn.addEventListener("click", () => {
        makeInlineEditable(textContainer, ing.name, newVal => {
          ing.name = newVal;
          textContainer.replaceChildren(`${ing.quantity || ""} ${ing.unit || ""} ${newVal}`);
          // TODO: apiFetch to persist
        });
      });

      delBtn.addEventListener("click", () => {
        if (confirm("Delete this ingredient?")) {
          li.remove();
          // TODO: apiFetch to persist
        }
      });

      li.append(editBtn, delBtn);
    }

    if (Array.isArray(ing.alternatives) && ing.alternatives.length) {
      const altUl = createElement("ul", {});
      ing.alternatives.forEach(alt => {
        const altLi = createElement("li", {}, [alt.name || "Unknown Alternative"]);
        if (isLoggedIn && alt.itemId) altLi.appendChild(makeAddBtn(alt, ing.quantity, ing.unit));
        altUl.appendChild(altLi);
      });
      li.append(createElement("p", { class: "alt-header" }, ["Try these alternatives:"]), altUl);
    }

    ingList.appendChild(li);
  });

  return ingList;
}

function renderSteps(recipeId, steps, recipe) {
  const completedSteps = new Set(JSON.parse(localStorage.getItem(getStepKey(recipeId)) || "[]"));
  const progressFill = createElement("div", { class: "progress-fill" });
  const progressText = createElement("span", { class: "progress-text" });

  function updateProgress() {
    const pct = steps.length ? Math.round((completedSteps.size / steps.length) * 100) : 0;
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${pct}% done`;
  }
  updateProgress();

  const stepsOl = createElement("ol", {});
  steps.forEach((s, idx) => {
    const text = typeof s === "object" ? s.text : s;
    const duration = typeof s === "object" ? s.duration : null;
    const li = createElement("li", {});
    const checkbox = createElement("input", { type: "checkbox" });
    checkbox.checked = completedSteps.has(idx);

    checkbox.addEventListener("change", e => {
      e.target.checked ? completedSteps.add(idx) : completedSteps.delete(idx);
      localStorage.setItem(getStepKey(recipeId), JSON.stringify([...completedSteps]));
      updateProgress();
    });

    const textContainer = createElement("span", {}, [text]);
    const playBtn = Button("🔊", "", {}, "icon-button");
    playBtn.addEventListener("click", () => speechSynthesis.speak(new SpeechSynthesisUtterance(text)));

    li.append(checkbox, textContainer, playBtn);

    if (duration) {
      const timerBtn = Button("Start Timer", "", {}, "small-button");
      const timerDisplay = createElement("span", { class: "timer-display" });
      let timerId = null;

      timerBtn.addEventListener("click", () => {
        let remaining = duration;
        timerDisplay.textContent = formatTime(remaining);
        clearInterval(timerId);
        timerId = setInterval(() => {
          remaining -= 1;
          timerDisplay.textContent = formatTime(remaining);
          if (remaining <= 0) clearInterval(timerId);
        }, 1000);
      });
      li.append(timerBtn, timerDisplay);
    }

    // Edit/Delete (only author)
    if (getState("user")?.id === recipe.userId) {
      const editBtn = Button("Edit", "", {}, "tiny-button");
      const delBtn = Button("Delete", "", {}, "tiny-button");

      editBtn.addEventListener("click", () => {
        makeInlineEditable(textContainer, text, newVal => {
          steps[idx] = { ...s, text: newVal };
          textContainer.replaceChildren(newVal);
          // TODO: apiFetch to persist
        });
      });

      delBtn.addEventListener("click", () => {
        if (confirm("Delete this step?")) {
          li.remove();
          steps.splice(idx, 1);
          updateProgress();
          // TODO: apiFetch to persist
        }
      });

      li.append(editBtn, delBtn);
    }

    stepsOl.appendChild(li);
  });

  const progressBar = createElement("div", { class: "progress-bar" }, [progressFill, progressText]);
  return createElement("div", { class: "steps-section" }, [progressBar, stepsOl]);
}

function renderComments(recipe) {
  const wrapper = createElement("div", { class: "comment-section" });
  const toggle = createElement("button", { class: "toggle-comments btn btn-link" }, ["💬 Show Comments"]);
  let commentsEl = null;
  let visible = false;

  toggle.addEventListener("click", () => {
    if (!visible) {
      commentsEl = createCommentsSection(recipe.recipeId, recipe.comments || [], "recipe", getState("user"));

      // Add edit/delete inside each comment (inline)
      const currentUser = getState("user");
      commentsEl.querySelectorAll(".comment").forEach((commentEl, idx) => {
        const comment = recipe.comments[idx];
        if (currentUser?.id === comment.userId) {
          const textEl = commentEl.querySelector(".comment-text");
          const editBtn = Button("Edit", "", {}, "tiny-button");
          const delBtn = Button("Delete", "", {}, "tiny-button");

          editBtn.addEventListener("click", () => {
            makeInlineEditable(textEl, comment.text, newVal => {
              comment.text = newVal;
              textEl.replaceChildren(newVal);
              // TODO: apiFetch to persist
            });
          });

          delBtn.addEventListener("click", () => {
            if (confirm("Delete this comment?")) {
              commentEl.remove();
              // TODO: apiFetch to persist
            }
          });

          commentEl.append(editBtn, delBtn);
        }
      });

      wrapper.appendChild(commentsEl);
      toggle.textContent = "💬 Hide Comments";
    } else {
      if (commentsEl) commentsEl.remove();
      toggle.textContent = "💬 Show Comments";
    }
    visible = !visible;
  });

  wrapper.append(createElement("h4", {}, ["Comments"]), toggle);
  return wrapper;
}

function renderActions(recipe, currentUser, contentContainer, isFavorite, recipeId) {
  const favBtn = Button(isFavorite ? "Unsave" : "Save Recipe", "", {}, "secondary-button");
  favBtn.addEventListener("click", () => {
    isFavorite = !isFavorite;
    saveFavorite(recipeId, isFavorite);
    favBtn.textContent = isFavorite ? "Unsave" : "Save Recipe";
  });

  const shareBtn = Button("Copy Link", "", {}, "secondary-button");
  shareBtn.addEventListener("click", () => navigator.clipboard.writeText(window.location.href));

  const printBtn = Button("Print", "", {}, "secondary-button");
  printBtn.addEventListener("click", () => window.print());

  const actions = [favBtn, shareBtn, printBtn];

  if (currentUser === recipe.userId) {
    const editBtn = Button("Edit", "", {}, "secondary-button");
    editBtn.addEventListener("click", () => editRecipe(contentContainer, recipe));
    actions.push(editBtn);
  }

  const reportBtn = Button("Report", "", {}, "secondary-button");
  reportBtn.addEventListener("click", () => alert("Reported for review."));

  const backBtn = Button("Back to Recipes", "", {}, "secondary-button");
  backBtn.addEventListener("click", () => history.back());

  actions.push(reportBtn, backBtn);
  return createElement("div", { class: "recipe-actions" }, actions);
}

// --- Main Export ---
export async function displayRecipe(content, isLoggedIn, recipeId) {
  content.replaceChildren();
  const container = createElement("div", { class: "recipepage" });
  content.appendChild(container);

  const currentUser = getState("user");

  let recipe;
  try {
    recipe = await apiFetch(`/recipes/recipe/${recipeId}`);
  } catch (err) {
    console.error("Error loading recipe:", err);
    container.replaceChildren(createElement("p", {}, ["Recipe not found or failed to load."]));
    return;
  }

  const isFavorite = getFavorites().includes(recipeId);

  container.replaceChildren(
    createElement("h2", {}, [recipe.title || "Untitled"]),
    ...(recipe.version ? [createElement("p", { class: "version-info" }, [`Version ${recipe.version}`])] : []),
    ...(recipe.lastUpdated ? [createElement("p", { class: "version-info" }, [`Last updated: ${new Date(recipe.lastUpdated).toLocaleDateString()}`])] : []),
    renderAuthor(recipe, currentUser),
    renderGallery(Array.isArray(recipe.imageUrls) ? recipe.imageUrls : [], recipe.title),
    renderInfoBox(recipe),
    renderTags(recipe.tags),
    createElement("h3", {}, ["Ingredients"]),
    renderIngredients(recipe.ingredients, isLoggedIn, recipe),
    createElement("h3", {}, ["Steps"]),
    renderSteps(recipeId, recipe.steps || [], recipe),
    renderActions(recipe, currentUser, container, isFavorite, recipeId),
    renderComments(recipe)
  );
}

// --- Utils ---
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
