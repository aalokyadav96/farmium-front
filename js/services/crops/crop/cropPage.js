// displayCrop.js
import { createElement } from "../../../components/createElement";
import { apiFetch } from "../../../api/api";
import { clearElement, createOption } from "./helpers";
import {
  createUIElements,
  buildFilters,
  buildTagChips,
  buildViewToggle,
  renderListings,
  renderPagination,
  renderError,
  renderLoading
} from "./displayCropUI";

export async function displayCrop(contentContainer, cropID, isLoggedIn) {
  const state = {
    cropDetails: null,
    listings: [],
    allBreeds: new Set(),
    allTags: new Set(),
    currentPage: 1,
    limit: 5,
    selectedBreed: "",
    sortBy: "",
    sortOrder: "",
    keyword: "",
    minPrice: 0,
    maxPrice: 0,
    viewMode: "grid",
    activeTags: new Set(),
    favorites: new Set(JSON.parse(localStorage.getItem("favoriteListings") || "[]"))
  };

  const elements = createUIElements();

  function saveFavorites() {
    localStorage.setItem(
      "favoriteListings",
      JSON.stringify(Array.from(state.favorites))
    );
  }

  function setView(mode) {
    state.viewMode = mode;
    elements.listingsContainer.className = `listings-container ${mode}`;
    buildViewToggle(elements, state, setView, fetchAndRender);
  }

  async function fetchAndRender() {
    renderLoading(elements);
    const qs = new URLSearchParams({
      page: state.currentPage,
      limit: state.limit
    });
    try {
      const resp = await apiFetch(`/crops/crop/${cropID}?${qs}`);
      state.cropDetails = resp;
      state.listings = resp.listings || [];
      state.allBreeds = new Set(state.listings.map(l => l.breed));
      state.allTags = new Set(state.listings.flatMap(l => l.tags || []));
    } catch (err) {
      renderError(contentContainer, err.message, fetchAndRender);
      return;
    }

    clearElement(contentContainer);
    contentContainer.append(
      elements.title,
      elements.filterSection,
      elements.viewToggle,
      elements.listingsContainer,
      elements.pagination
    );

    elements.title.textContent = `${state.cropDetails.name} (${state.cropDetails.category})`;

    buildFilters(elements, state, fetchAndRender);
    buildTagChips(elements, state, fetchAndRender);
    buildViewToggle(elements, state, setView, fetchAndRender);
    renderListings(elements, state, isLoggedIn, saveFavorites);
    renderPagination(elements, state, fetchAndRender);
  }

  // Search, Sort, Filter Inputs
  elements.searchInput.oninput = () => {
    clearTimeout(elements.debounceTimer);
    elements.debounceTimer = setTimeout(() => {
      state.keyword = elements.searchInput.value.trim();
      state.currentPage = 1;
      fetchAndRender();
    }, 300);
  };
  elements.breedFilter.onchange = () => {
    state.selectedBreed = elements.breedFilter.value;
    state.currentPage = 1;
    fetchAndRender();
  };
  elements.sortFilter.onchange = () => {
    const [field, order] = elements.sortFilter.value.split("-");
    state.sortBy = field;
    state.sortOrder = order;
    state.currentPage = 1;
    fetchAndRender();
  };
  [elements.priceMinInput, elements.priceMaxInput].forEach(input => {
    input.oninput = () => {
      state.minPrice = parseFloat(elements.priceMinInput.value) || 0;
      state.maxPrice = parseFloat(elements.priceMaxInput.value) || 0;
      if (state.minPrice && state.maxPrice && state.minPrice > state.maxPrice) {
        alert("Min price cannot exceed Max price.");
        return;
      }
      state.currentPage = 1;
      fetchAndRender();
    };
  });

  // Assemble Filter UI
  elements.filterSection.append(
    elements.searchInput,
    createElement("span", {}, [" Breed: "]),
    elements.breedFilter,
    createElement("span", { style: "margin-left:16px" }, [" Sort: "]),
    elements.sortFilter,
    createElement("span", { style: "margin-left:16px" }, [" ₹ Price: "]),
    elements.priceMinInput,
    elements.priceMaxInput,
    createElement("span", { style: "margin-left:16px" }, [" Tags: "]),
    elements.tagChips
  );

  fetchAndRender();
}
