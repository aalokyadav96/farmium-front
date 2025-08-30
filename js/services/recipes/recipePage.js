import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { addToCart } from "../cart/addToCart.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import { getState } from "../../state/state.js";
import { editRecipe } from "./createOrEditRecipe.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Imagex from "../../components/base/Imagex.js";
import { createCommentsSection } from "../comments/comments.js";

function getStepKey(recipeId) { return `completedSteps:${recipeId}`; }
function getCommentsKey(recipeId) { return `comments:${recipeId}`; }
function getFavorites() { return JSON.parse(localStorage.getItem("favoriteRecipes") || "[]"); }
function saveFavorite(recipeId, value) {
  let fav = getFavorites();
  if (value && !fav.includes(recipeId)) fav.push(recipeId);
  else if (!value) fav = fav.filter(id => id !== recipeId);
  localStorage.setItem("favoriteRecipes", JSON.stringify(fav));
}
function loadComments(recipeId) { return JSON.parse(localStorage.getItem(getCommentsKey(recipeId)) || "[]"); }
function saveComments(recipeId, comments) { localStorage.setItem(getCommentsKey(recipeId), JSON.stringify(comments)); }

export async function displayRecipe(content, isLoggedIn, recipeId) {
  content.innerHTML = "";
  const contentContainer = createElement('div', { class: "recipepage" });
  content.appendChild(contentContainer);

  const currentUser = getState("user");

  let recipe;
  try {
    recipe = await apiFetch(`/recipes/recipe/${recipeId}`);
  } catch (err) {
    console.error("Error loading recipe:", err);
    contentContainer.replaceChildren(createElement("p", {}, ["Recipe not found or failed to load."]));
    return;
  }

  const completedSteps = new Set(JSON.parse(localStorage.getItem(getStepKey(recipeId)) || "[]"));
  let isFavorite = getFavorites().includes(recipeId);

  // --- Title & Metadata ---
  const titleEl = createElement("h2", {}, [recipe.title || "Untitled"]);
  const metaEls = [];
  if (recipe.version) metaEls.push(createElement("p", { class: "version-info" }, [`Version ${recipe.version}`]));
  if (recipe.lastUpdated) metaEls.push(createElement("p", { class: "version-info" }, [`Last updated: ${new Date(recipe.lastUpdated).toLocaleDateString()}`]));

  // --- Author Info ---
  const authorEl = createElement("p", { class: "author-info" });
  if (currentUser?.id === recipe.userId) {
    authorEl.textContent = "By You";
  } else {
    authorEl.textContent = "By ";
    const link = createElement("a", { href: `/user/${recipe.userId}` }, [recipe.userName || recipe.userId]);
    authorEl.appendChild(link);
  }

  // --- Image Carousel ---
  let imgIndex = 0;
  const images = Array.isArray(recipe.imageUrls) ? recipe.imageUrls : [];
  const getImageAtIndex = i => resolveImagePath(EntityType.RECIPE, PictureType.PHOTO, images[i]);
  const imageEl = Imagex({ src: getImageAtIndex(imgIndex) || "", alt: recipe.title, classes: "thumbnail" });

  const updateImg = () => { if(images.length) imageEl.src = getImageAtIndex(imgIndex); };
  const prevBtn = Button("Prev", "prev-img", {}, "small-button");
  const nextBtn = Button("Next", "next-img", {}, "small-button");
  prevBtn.addEventListener("click", () => { if(images.length){ imgIndex = (imgIndex - 1 + images.length) % images.length; updateImg(); } });
  nextBtn.addEventListener("click", () => { if(images.length){ imgIndex = (imgIndex + 1) % images.length; updateImg(); } });
  let touchStartX = 0;
  imageEl.addEventListener("touchstart", e => touchStartX = e.changedTouches[0].screenX, { passive: true });
  imageEl.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if(dx>50) prevBtn.click(); else if(dx<-50) nextBtn.click();
  }, { passive: true });
  const gallery = createElement("div", { class: "image-gallery" }, [imageEl, prevBtn, nextBtn]);

  // --- Info Box ---
  const infoBoxChildren = [
    createElement("p", {}, [recipe.description || ""]),
    createElement("p", {}, [`Cook Time: ${recipe.cookTime || "N/A"}`]),
  ];
  if (recipe.cuisine) infoBoxChildren.push(createElement("p", {}, [`Cuisine: ${recipe.cuisine}`]));
  if (recipe.portionSize) infoBoxChildren.push(createElement("p", {}, [`Portion Size: ${recipe.portionSize}`]));
  if (recipe.season) infoBoxChildren.push(createElement("p", {}, [`Season / Occasion: ${recipe.season}`]));
  if (Array.isArray(recipe.dietary) && recipe.dietary.length) infoBoxChildren.push(createElement("p", {}, [`Dietary: ${recipe.dietary.join(", ")}`]));
  if (recipe.videoUrl) {
    const videoLink = createElement("a", { href: recipe.videoUrl, target: "_blank" }, ["Watch Video Tutorial"]);
    infoBoxChildren.push(createElement("p", {}, [videoLink]));
  }
  if (recipe.notes) infoBoxChildren.push(createElement("p", {}, [`Notes: ${recipe.notes}`]));
  const infoBox = createElement("div", { class: "recipe-info-box" }, infoBoxChildren);

  // --- Tags Section (visible, separate) ---
  const tagsSection = createElement("div", { class: "tags-section" }, [
    createElement("h3", {}, ["Tags"]),
    createElement("div", { class: "tags" }, (Array.isArray(recipe.tags) ? recipe.tags : []).map(tag => createElement("span", { class: "tag" }, [tag])))
  ]);

  // --- Ingredients List ---
  const ingList = createElement("ul", { class: "ingredients-list" });
  (Array.isArray(recipe.ingredients) ? recipe.ingredients : []).forEach(ing => {
    const li = createElement("li", {}, [
      `${ing.quantity || ""} ${ing.unit || ""} ${ing.name || ""}`
    ]);

    if (!ing.itemId) li.appendChild(createElement("span", { class: "warning" }, ["Unavailable in store"]));

    if (isLoggedIn && ing.itemId) {
      const item = {
        category: ing.type || "unknown",
        item: ing.name || "Unknown Item",
        quantity: ing.quantity || 1,
        price: ing.price || 10,
        unit: ing.unit || ""
      };
      const btn = Button("Add to Cart", `add-${ing.itemId}`, {}, "small-button");
      btn.addEventListener("click", () => addToCart(item));
      li.appendChild(btn);
    }

    if (Array.isArray(ing.alternatives) && ing.alternatives.length) {
      const altHeader = createElement("p", { class: "alt-header" }, ["Try these alternatives:"]);
      li.appendChild(altHeader);

      const altUl = createElement("ul", {});
      ing.alternatives.forEach(alt => {
        const altLi = createElement("li", {}, [alt.name || "Unknown Alternative"]);

        if (isLoggedIn && alt.itemId) {
          const altItem = {
            category: alt.type || "unknown",
            item: alt.name || "Unknown Item",
            quantity: ing.quantity || 1,
            price: alt.price || 10,
            unit: ing.unit || ""
          };
          const altBtn = Button("Add to Cart", `add-${alt.itemId}`, {}, "small-button");
          altBtn.addEventListener("click", () => addToCart(altItem));
          altLi.appendChild(altBtn);
        }

        altUl.appendChild(altLi);
      });

      li.appendChild(altUl);
    }

    ingList.appendChild(li);
  });
  if (!ingList.childElementCount) ingList.appendChild(createElement("li", {}, ["No ingredients available."]));

  // --- Steps Section ---
  const stepsContainer = createElement("div", { class: "steps-section" });
  const progressBar = createElement("div", { class: "progress-bar" });
  const progressFill = createElement("div", { class: "progress-fill" });
  const progressText = createElement("span", { class: "progress-text" });
  progressBar.append(progressFill, progressText);

  function updateProgress() {
    const stepsCount = Array.isArray(recipe.steps) ? recipe.steps.length : 0;
    const pct = stepsCount ? Math.round((completedSteps.size / stepsCount) * 100) : 0;
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${pct}% done`;
  }
  updateProgress();

  const stepsOl = createElement("ol", {});
  (Array.isArray(recipe.steps) ? recipe.steps : []).forEach((stepObj, idx) => {
    const text = typeof stepObj === "object" ? stepObj.text : stepObj;
    const duration = typeof stepObj === "object" ? stepObj.duration : null;
    const li = createElement("li", {});
    const checkbox = createElement("input", { type: "checkbox" });
    checkbox.checked = completedSteps.has(idx);
    checkbox.addEventListener("change", e => {
      e.target.checked ? completedSteps.add(idx) : completedSteps.delete(idx);
      localStorage.setItem(getStepKey(recipeId), JSON.stringify([...completedSteps]));
      updateProgress();
    });
    li.append(checkbox, createElement("span", {}, [text]));

    const playBtn = Button("🔊", "", {}, "icon-button");
    playBtn.addEventListener("click", () => { speechSynthesis.speak(new SpeechSynthesisUtterance(text)); });
    li.appendChild(playBtn);

    if (duration) {
      const timerBtn = Button("Start Timer", "", {}, "small-button");
      const timerDisplay = createElement("span", { class: "timer-display" }, []);
      let timerId = null;
      timerBtn.addEventListener("click", () => {
        let remaining = duration;
        timerDisplay.textContent = formatTime(remaining);
        if (timerId) clearInterval(timerId);
        timerId = setInterval(() => {
          remaining -= 1;
          timerDisplay.textContent = formatTime(remaining);
          if (remaining <= 0) clearInterval(timerId);
        }, 1000);
      });
      li.append(timerBtn, timerDisplay);
    }

    stepsOl.appendChild(li);
  });

  // --- Comments Section ---
  const commentSection = createElement("div", { class: "comment-section" });
  const commentToggle = createElement("button", { class: "toggle-comments btn btn-link" }, ["💬 Show Comments"]);

  let commentsEl = null;
  let commentsVisible = false;
  commentToggle.addEventListener("click", () => {
    if (!commentsVisible) {
      commentsEl = createCommentsSection(
        recipe.recipeId,
        recipe.comments || [],
        "recipe",
        getState("user")
      );
      commentSection.appendChild(commentsEl);
      commentToggle.textContent = "💬 Hide Comments";
      commentsVisible = true;
    } else {
      if (commentsEl) commentsEl.remove();
      commentToggle.textContent = "💬 Show Comments";
      commentsVisible = false;
    }
  });

  const commentWrapper = createElement("div", { class: "post-comments" }, [
    createElement("h4", {}, ["Comments"]),
    commentToggle
  ]);
  commentSection.append(commentWrapper);

  // --- Actions ---
  const actions = createElement("div", { class: "recipe-actions" });
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

  let editBtn = null;
  if (currentUser?.id === recipe.userId) {
    editBtn = Button("Edit", "", {}, "secondary-button");
    editBtn.addEventListener("click", () => editRecipe(contentContainer, recipe));
  }

  const reportBtn = Button("Report", "", {}, "secondary-button");
  reportBtn.addEventListener("click", () => alert("Reported for review."));

  const backBtn = Button("Back to Recipes", "", {}, "secondary-button");
  backBtn.addEventListener("click", () => history.back());

  actions.append(favBtn, shareBtn, printBtn, ...(editBtn ? [editBtn] : []), reportBtn, backBtn);

  // --- Mount everything ---
  const toMount = [
    titleEl,
    ...metaEls,
    authorEl,
    gallery,
    infoBox,
    tagsSection,
    createElement("h3", {}, ["Ingredients"]),
    ingList,
    progressBar,
    createElement("h3", {}, ["Steps"]),
    stepsOl,
    actions,
    commentSection
  ];

  contentContainer.replaceChildren(...toMount);
}

// --- util ---
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2,"0")}`;
}
