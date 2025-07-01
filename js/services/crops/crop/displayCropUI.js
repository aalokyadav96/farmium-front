// displayCropUI.js
import { createElement } from "../../../components/createElement";
import { clearElement, createOption } from "./helpers";
import { renderListingCard } from "./renderListingCard";

export function createUIElements() {
  return {
    title: createElement("h2"),
    filterSection: createElement("div", { class: "filter-section" }),
    listingsContainer: createElement("div", { class: "listings-container grid" }),
    pagination: createElement("div", { class: "pagination" }),
    searchInput: createElement("input", {
      type: "text",
      placeholder: "🔍 Search listings…",
      class: "crop-search-input"
    }),
    breedFilter: createElement("select"),
    sortFilter: createElement("select"),
    priceMinInput: createElement("input", { type: "number", min: 0, placeholder: "Min ₹" }),
    priceMaxInput: createElement("input", { type: "number", min: 0, placeholder: "Max ₹" }),
    tagChips: createElement("div", { class: "tag-chips" }),
    viewToggle: createElement("div", { class: "view-toggle" }),
    loadingIndicator: createElement("p", { class: "loading-indicator" }, ["Loading…"]),
    debounceTimer: null
  };
}

export function buildFilters(elements, state, fetch) {
  clearElement(elements.breedFilter);
  elements.breedFilter.appendChild(createOption("", "All breeds"));
  [...state.allBreeds].forEach(b =>
    elements.breedFilter.appendChild(createOption(b, b))
  );

  clearElement(elements.sortFilter);
  [
    ["", "Sort by…"],
    ["price-asc", "Price ↑"],
    ["price-desc", "Price ↓"],
    ["breed-asc", "Breed A→Z"],
    ["breed-desc", "Breed Z→A"]
  ].forEach(([val, label]) =>
    elements.sortFilter.appendChild(createOption(val, label))
  );
}

export function buildTagChips(elements, state, fetch) {
  clearElement(elements.tagChips);
  state.allTags.forEach(tag => {
    const chip = createElement("button", { class: "tag-chip" }, [tag]);
    chip.classList.toggle("active", state.activeTags.has(tag));
    chip.onclick = () => {
      state.activeTags.has(tag) ? state.activeTags.delete(tag) : state.activeTags.add(tag);
      state.currentPage = 1;
      buildTagChips(elements, state, fetch);
      fetch();
    };
    elements.tagChips.appendChild(chip);
  });
}

export function buildViewToggle(elements, state, setView, fetch) {
  clearElement(elements.viewToggle);
  const gridBtn = createElement("button", {}, ["🔳 Grid"]);
  const listBtn = createElement("button", {}, ["📋 List"]);

  gridBtn.onclick = () => setView("grid");
  listBtn.onclick = () => setView("list");

  (state.viewMode === "grid" ? gridBtn : listBtn).classList.add("active");

  elements.viewToggle.append(gridBtn, listBtn);
}

export function renderListings(elements, state, isLoggedIn, saveFavorites) {
  clearElement(elements.listingsContainer);
  let items = state.listings.filter(l => {
    if (state.keyword && !l.title.toLowerCase().includes(state.keyword.toLowerCase()))
      return false;
    if (state.selectedBreed && l.breed !== state.selectedBreed)
      return false;
    if (state.activeTags.size && ![...state.activeTags].every(tag => l.tags?.includes(tag)))
      return false;
    if ((state.minPrice && l.price < state.minPrice) || (state.maxPrice && l.price > state.maxPrice))
      return false;
    return true;
  });

  if (state.sortBy) {
    items.sort((a, b) => {
      let res = 0;
      if (state.sortBy === "price") res = a.price - b.price;
      else if (state.sortBy === "breed") res = a.breed.localeCompare(b.breed);
      return state.sortOrder === "desc" ? -res : res;
    });
  }

  if (!items.length) {
    elements.listingsContainer.appendChild(createElement("p", {}, ["No listings found."]));
    return;
  }

  items.forEach(listing => {
    const card = renderListingCard(listing, state.cropDetails.name, isLoggedIn);

    if (listing.tags?.length) {
// Continued from inside renderListings…
const tagWrap = createElement("div", { class: "listing-tags" });
listing.tags.forEach(t =>
  tagWrap.appendChild(createElement("span", { class: "listing-tag" }, [t]))
);
card.appendChild(tagWrap);
}

const favBtn = createElement(
"button",
{ class: "fav-btn" },
[state.favorites.has(listing.id) ? "💖" : "🤍"]
);
favBtn.onclick = () => {
if (state.favorites.has(listing.id)) {
  state.favorites.delete(listing.id);
} else {
  state.favorites.add(listing.id);
}
saveFavorites();
favBtn.textContent = state.favorites.has(listing.id) ? "💖" : "🤍";
};
card.appendChild(favBtn);

elements.listingsContainer.appendChild(card);
});
}

export function renderPagination(elements, state, fetch) {
clearElement(elements.pagination);
const total = state.cropDetails.total || 0;
const pageCount = Math.ceil(total / state.limit);

if (pageCount <= 1) return;

if (state.currentPage > 1) {
const prevBtn = createElement("button", {}, ["« Prev"]);
prevBtn.onclick = () => {
state.currentPage--;
fetch();
};
elements.pagination.appendChild(prevBtn);
}

for (let i = 1; i <= pageCount; i++) {
const btn = createElement("button", {}, [i]);
if (i === state.currentPage) btn.classList.add("active");
btn.onclick = () => {
state.currentPage = i;
fetch();
};
elements.pagination.appendChild(btn);
}

if (state.currentPage < pageCount) {
const nextBtn = createElement("button", {}, ["Next »"]);
nextBtn.onclick = () => {
state.currentPage++;
fetch();
};
elements.pagination.appendChild(nextBtn);
}
}

export function renderLoading(elements) {
clearElement(elements.listingsContainer);
elements.listingsContainer.appendChild(elements.loadingIndicator);
}

export function renderError(container, message, onRetry) {
clearElement(container);
const errorBox = createElement("div", { class: "error-box" }, [
createElement("p", {}, [`⚠️ ${message}`]),
createElement("button", { onclick: onRetry }, ["🔁 Retry"])
]);
container.appendChild(errorBox);
}
