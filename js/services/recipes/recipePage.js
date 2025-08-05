import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { addToCart } from "../cart/addToCart.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import { getState } from "../../state/state.js";
import { editRecipe } from "./createOrEditRecipe.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";


function getStepKey(recipeId) {
  return `completedSteps:${recipeId}`;
}
function getCommentsKey(recipeId) {
  return `comments:${recipeId}`;
}
function getFavorites() {
  return JSON.parse(localStorage.getItem("favoriteRecipes") || "[]");
}
function saveFavorite(recipeId, value) {
  let fav = getFavorites();
  if (value && !fav.includes(recipeId)) fav.push(recipeId);
  else if (!value) fav = fav.filter((id) => id !== recipeId);
  localStorage.setItem("favoriteRecipes", JSON.stringify(fav));
}
function loadComments(recipeId) {
  return JSON.parse(localStorage.getItem(getCommentsKey(recipeId)) || "[]");
}
function saveComments(recipeId, comments) {
  localStorage.setItem(getCommentsKey(recipeId), JSON.stringify(comments));
}

export async function displayRecipe(content, isLoggedIn, recipeId, currentUser = null) {
  let contentContainer = createElement('div',{"class":"recipepage"},[]);

  content.innerHTML = "";
  content.appendChild(contentContainer);
  currentUser = getState("user");
  
  // 🧑‍🍳 FETCH recipe from backend
  let recipe;
  try {
    recipe = await apiFetch(`/recipes/recipe/${recipeId}`);
  } catch (err) {
    console.error("Error loading recipe:", err);
    contentContainer.replaceChildren(
      createElement("p", {}, ["Recipe not found or failed to load."])
    );
    return;
  }


  // --- State from localStorage ---
  const completedSteps = new Set(JSON.parse(localStorage.getItem(getStepKey(recipeId)) || "[]"));
  let isFavorite = getFavorites().includes(recipeId);
  let comments = loadComments(recipeId);

  // --- Title & Version/Date ---
  const titleEl = createElement("h2", {}, [recipe.title]);
  const metaEls = [];
  if (recipe.version) {
    metaEls.push(createElement("p", { class: "version-info" }, [`Version ${recipe.version}`]));
  }
  if (recipe.lastUpdated) {
    const date = new Date(recipe.lastUpdated).toLocaleDateString();
    metaEls.push(createElement("p", { class: "version-info" }, [`Last updated: ${date}`]));
  }

  // --- Author Info ---
  const authorEl = createElement("p", { class: "author-info" });
  if (currentUser && currentUser.id === recipe.userId) {
    authorEl.textContent = "By You";
  } else {
    authorEl.textContent = "By ";
    const link = createElement("a", { href: `/user/${recipe.userId}` }, [recipe.userName || recipe.userId]);
    authorEl.appendChild(link);
  }

  // --- Image Carousel with swipe support ---
  let imgIndex = 0;
  const getImageAtIndex = (i) =>
    resolveImagePath(EntityType.RECIPE, PictureType.PHOTO, recipe.imageUrls?.[i]);
  
  const imageEl = createElement("img", {
    src: getImageAtIndex(imgIndex),
    alt: recipe.title,
    class: "thumbnail",
  });
  
  const updateImg = () => {
    imageEl.src = getImageAtIndex(imgIndex);
  };
  
  const prevBtn = Button("Prev", "prev-img", {}, "small-button");
  const nextBtn = Button("Next", "next-img", {}, "small-button");
  
  prevBtn.addEventListener("click", () => {
    imgIndex = (imgIndex - 1 + recipe.imageUrls.length) % recipe.imageUrls.length;
    updateImg();
  });
  
  nextBtn.addEventListener("click", () => {
    imgIndex = (imgIndex + 1) % recipe.imageUrls.length;
    updateImg();
  });
  
  // Swipe support
  let touchStartX = 0;
  imageEl.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  imageEl.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (dx > 50) prevBtn.click();
    else if (dx < -50) nextBtn.click();
  }, { passive: true });
  
  const gallery = createElement("div", { class: "image-gallery" }, [
    imageEl, prevBtn, nextBtn
  ]);
  

  // --- Info Box & Nutrition ---
  const infoBox = createElement("div", { class: "recipe-info-box" }, [
    createElement("p", {}, [recipe.description]),
    createElement("p", {}, [`Prep Time: ${recipe.prepTime || "N/A"}`]),
    createElement("div", { class: "tags" }, recipe.tags.map(tag =>
      createElement("span", { class: "tag" }, [tag])
    )),
  ]);
  if (recipe.nutrition) {
    const nut = recipe.nutrition;
    const nutEl = createElement("div", { class: "nutrition-info" }, [
      createElement("h4", {}, ["Nutrition"]),
      createElement("p", {}, [`Calories: ${nut.calories}`]),
      createElement("p", {}, [`Protein: ${nut.protein}`]),
      createElement("p", {}, [`Fat: ${nut.fat}`]),
      createElement("p", {}, [`Carbs: ${nut.carbs}`]),
    ]);
    infoBox.appendChild(nutEl);
  }

  // --- Ingredients List ---
  const ingList = createElement("ul", { class: "ingredients-list" });

  if (Array.isArray(recipe.ingredients)) {
    recipe.ingredients.forEach(ing => {
      const li = createElement("li", {}, [
        `${ing.quantity} ${ing.unit} ${ing.name}`
      ]);
  
      if (!ing.itemId) {
        li.appendChild(createElement("span", { class: "warning" }, ["Unavailable in store"]));
      }
  
      if (isLoggedIn && ing.itemId) {
        const item = {
          category: ing.type,
          item: ing.name,
          quantity: ing.quantity,
          price: ing.price || 10,
          unit: ing.unit,
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
          const altLi = createElement("li", {}, [alt.name]);
          if (isLoggedIn && alt.itemId) {
            const altBtn = Button("Add to Cart", `add-${alt.itemId}`, {}, "small-button");
            altBtn.addEventListener("click", () => addToCart({
              category: alt.type,
              item: alt.name,
              quantity: ing.quantity,
              price: alt.price || 10,
              unit: ing.unit
            }));
            altLi.appendChild(altBtn);
          }
          altUl.appendChild(altLi);
        });
        li.appendChild(altUl);
      }
  
      ingList.appendChild(li);
    });
  } else {
    ingList.appendChild(createElement("li", {}, ["No ingredients available."]));
  }
  

  // --- Estimated Cost & Buy All ---
  let totalCost = 0;
  if (Array.isArray(recipe.ingredients)) {
    recipe.ingredients.forEach(i => {
      if (i.itemId) totalCost += (i.quantity * (i.price || 10));
    });
  }
  
  const costEl = isLoggedIn && totalCost
    ? createElement("p", { class: "estimated-cost" }, [`Estimated Cost: ₹${totalCost}`])
    : null;
  const buyAllBtn = isLoggedIn && totalCost
    ? Button("Buy All Ingredients", "buy-all", {}, "primary-button")
    : null;
    if (buyAllBtn) buyAllBtn.addEventListener("click", () => {
      if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(i => {
          if (i.itemId) addToCart({
            category: i.type,
            item: i.name,
            quantity: i.quantity,
            price: i.price || 10,
            unit: i.unit
          });
        });
      }
    });
    

  // --- Steps, Progress & Audio & Timer ---
  const stepsContainer = createElement("div", { class: "steps-section" });
  const progressBar = createElement("div", { class: "progress-bar" });
  const progressFill = createElement("div", { class: "progress-fill" });
  const progressText = createElement("span", { class: "progress-text" });
  progressBar.append(progressFill, progressText);

  function updateProgress() {
    const pct = Math.round((completedSteps.size / recipe.steps.length) * 100);
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${pct}% done`;
  }
  updateProgress();

  const stepsOl = createElement("ol", {});
  recipe.steps.forEach((stepObj, idx) => {
    // support object or string
    const text = typeof stepObj === "object" ? stepObj.text : stepObj;
    const duration = typeof stepObj === "object" ? stepObj.duration : null;

    const li = createElement("li", {});
    const checkbox = createElement("input", { type: "checkbox" });
    checkbox.checked = completedSteps.has(idx);
    checkbox.addEventListener("change", e => {
      if (e.target.checked) completedSteps.add(idx);
      else completedSteps.delete(idx);
      localStorage.setItem(getStepKey(recipeId), JSON.stringify([...completedSteps]));
      updateProgress();
    });

    li.append(checkbox, createElement("span", {}, [text]));

    // audio play
    const playBtn = Button("🔊", `play-${idx}`, {}, "icon-button");
    playBtn.addEventListener("click", () => {
      const u = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(u);
    });
    li.appendChild(playBtn);

    // timer
    if (duration) {
      const timerBtn = Button("Start Timer", `timer-${idx}`, {}, "small-button");
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
  const commentList = createElement("ul", { class: "comment-list" });
  function renderComments() {
    commentList.replaceChildren();
    comments.forEach(c => {
      const time = new Date(c.ts).toLocaleString();
      const item = createElement("li", {}, [
        createElement("p", {}, [c.text]),
        createElement("small", {}, [`— ${time}`])
      ]);
      commentList.appendChild(item);
    });
  }
  renderComments();
  const commentInput = createElement("textarea", { placeholder: "Leave a comment" });
  const commentBtn = Button("Post Comment", "post-comment", {}, "primary-button");
  commentBtn.addEventListener("click", () => {
    const txt = commentInput.value.trim();
    if (!txt) return;
    const entry = { text: txt, ts: Date.now() };
    comments.push(entry);
    saveComments(recipeId, comments);
    renderComments();
    commentInput.value = "";
  });
  commentSection.append(createElement("h3", {}, ["Comments"]), commentList, commentInput, commentBtn);

  // --- Share, Print, Favorite, Edit, Report, Back ---
  const actions = createElement("div", { class: "recipe-actions" });
  // favorite toggle
  const favBtn = Button(isFavorite ? "Unsave" : "Save Recipe", "fav-btn", {}, "secondary-button");
  favBtn.addEventListener("click", () => {
    isFavorite = !isFavorite;
    saveFavorite(recipeId, isFavorite);
    favBtn.textContent = isFavorite ? "Unsave" : "Save Recipe";
  });
  // share / copy link
  const shareBtn = Button("Copy Link", "share-btn", {}, "secondary-button");
  shareBtn.addEventListener("click", () => navigator.clipboard.writeText(window.location.href));
  const printBtn = Button("Print", "print-btn", {}, "secondary-button");
  printBtn.addEventListener("click", () => window.print());
  // edit if author
  let editBtn = "";
  if (currentUser === recipe.userId) {
    editBtn = Button("Edit", "edit-btn", {}, "secondary-button");
    // editBtn.addEventListener("click", () => alert("Edit form coming soon."));
    editBtn.addEventListener("click", () => editRecipe(contentContainer,recipe));
  }
  const reportBtn = Button("Report", "report-btn", {}, "secondary-button");
  reportBtn.addEventListener("click", () => alert("Reported for review."));
  const backBtn = Button("Back to Recipes", "back-btn", {}, "secondary-button");
  backBtn.addEventListener("click", () => history.back());

  actions.append(favBtn, shareBtn, printBtn, editBtn, reportBtn, backBtn
  );

  // --- Mount everything ---
  const toMount = [
    titleEl,
    ...metaEls,
    authorEl,
    gallery,
    infoBox,
    costEl,
    buyAllBtn,
    createElement("h3", {}, ["Ingredients"]),
    ingList,
    progressBar,
    createElement("h3", {}, ["Steps"]),
    stepsOl,
    actions,
    commentSection
  ].filter(Boolean);

  contentContainer.replaceChildren(...toMount);
}

// util
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
