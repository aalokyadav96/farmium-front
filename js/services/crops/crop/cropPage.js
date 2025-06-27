import { createElement } from "../../../components/createElement";
import { apiFetch } from "../../../api/api";
import { renderListingCard } from "./renderListingCard";
import { clearElement, createOption } from "./helpers";

export async function displayCrop(contentContainer, cropID, isLoggedIn) {
  // ──────────── State ────────────
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
    viewMode: "grid", // or "list"
    activeTags: new Set(),
    favorites: new Set(JSON.parse(localStorage.getItem("favoriteListings") || "[]"))
  };

  // ──────────── Elements ────────────
  const elements = {
    title: createElement("h2"),
    filterSection: createElement("div", { class: "filter-section" }),
    listingsContainer: createElement("div", { class: "listings-container grid" }),
    pagination: createElement("div", { class: "pagination" }),
    // Inputs
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
    loadingIndicator: createElement("p", { class: "loading-indicator" }, ["Loading…"])
  };

  // ──────────── Utility Functions ────────────
  function saveFavorites() {
    localStorage.setItem(
      "favoriteListings",
      JSON.stringify(Array.from(state.favorites))
    );
  }

  function showLoading() {
    clearElement(elements.listingsContainer);
    elements.listingsContainer.appendChild(elements.loadingIndicator);
  }

  function showError(message) {
    clearElement(contentContainer);
    const errDiv = createElement("div", { class: "error-box" }, [
      createElement("p", {}, [message]),
      createElement("button", { onclick: fetchAndRender }, ["Retry"])
    ]);
    contentContainer.appendChild(errDiv);
  }

  // ──────────── Build Filter Controls ────────────
  function buildFilters() {
    // Breed
    clearElement(elements.breedFilter);
    elements.breedFilter.appendChild(createOption("", "All breeds"));
    [...state.allBreeds].forEach(b =>
      elements.breedFilter.appendChild(createOption(b, b))
    );
    // Sort
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

  function buildTagChips() {
    clearElement(elements.tagChips);
    state.allTags.forEach(tag => {
      const chip = createElement("button", { class: "tag-chip" }, [tag]);
      chip.classList.toggle("active", state.activeTags.has(tag));
      chip.onclick = () => {
        state.activeTags.has(tag) ? state.activeTags.delete(tag) : state.activeTags.add(tag);
        state.currentPage = 1;
        updateChipsUI();
        fetchAndRender();
      };
      elements.tagChips.appendChild(chip);
    });
  }

  function updateChipsUI() {
    Array.from(elements.tagChips.children).forEach(btn =>
      btn.classList.toggle("active", state.activeTags.has(btn.textContent))
    );
  }

  function buildViewToggle() {
    clearElement(elements.viewToggle);
    const gridBtn = createElement("button", {}, ["🔳 Grid"]);
    const listBtn = createElement("button", {}, ["📋 List"]);
    gridBtn.onclick = () => setView("grid");
    listBtn.onclick = () => setView("list");
    if (state.viewMode === "grid") gridBtn.classList.add("active");
    else listBtn.classList.add("active");
    elements.viewToggle.append(gridBtn, listBtn);
  }

  function setView(mode) {
    state.viewMode = mode;
    elements.listingsContainer.className = `listings-container ${mode}`;
    buildViewToggle();
  }

  // ──────────── Rendering ────────────
  function renderListings() {
    clearElement(elements.listingsContainer);
    let items = state.listings;

    // filter keyword
    if (state.keyword) {
      const kw = state.keyword.toLowerCase();
      items = items.filter(l => l.title.toLowerCase().includes(kw));
    }
    // breed
    if (state.selectedBreed) {
      items = items.filter(l => l.breed === state.selectedBreed);
    }
    // tags
    if (state.activeTags.size) {
      items = items.filter(l =>
        [...state.activeTags].every(tag => l.tags?.includes(tag))
      );
    }
    // price
    if (state.minPrice || state.maxPrice) {
      items = items.filter(l =>
        (!state.minPrice || l.price >= state.minPrice) &&
        (!state.maxPrice || l.price <= state.maxPrice)
      );
    }
    // sort
    if (state.sortBy) {
      items.sort((a, b) => {
        let res = 0;
        if (state.sortBy === "price") res = a.price - b.price;
        else if (state.sortBy === "breed") res = a.breed.localeCompare(b.breed);
        return state.sortOrder === "desc" ? -res : res;
      });
    }

    if (!items.length) {
      elements.listingsContainer.appendChild(
        createElement("p", {}, ["No listings found."])
      );
      return;
    }

    items.forEach(listing => {
      const card = renderListingCard(listing, state.cropDetails.name, isLoggedIn);

      // tags
      if (listing.tags?.length) {
        const tagWrap = createElement("div", { class: "listing-tags" });
        listing.tags.forEach(t =>
          tagWrap.appendChild(createElement("span", { class: "listing-tag" }, [t]))
        );
        card.appendChild(tagWrap);
      }

      // favorite toggle
      const favBtn = createElement(
        "button",
        { class: "fav-btn" },
        [state.favorites.has(listing.id) ? "💖" : "🤍"]
      );
      favBtn.onclick = () => {
        if (state.favorites.has(listing.id)) state.favorites.delete(listing.id);
        else state.favorites.add(listing.id);
        saveFavorites();
        favBtn.textContent = state.favorites.has(listing.id) ? "💖" : "🤍";
      };
      card.appendChild(favBtn);

      elements.listingsContainer.appendChild(card);
    });
  }

  function renderPagination() {
    clearElement(elements.pagination);
    const total = state.cropDetails.total || 0;
    const pageCount = Math.ceil(total / state.limit);

    if (state.currentPage > 1) {
      const prev = createElement("button", {}, ["« Prev"]);
      prev.onclick = () => { state.currentPage--; fetchAndRender(); };
      elements.pagination.appendChild(prev);
    }

    for (let i = 1; i <= pageCount; i++) {
      const btn = createElement("button", {}, [i]);
      if (i === state.currentPage) btn.classList.add("active");
      btn.onclick = () => { state.currentPage = i; fetchAndRender(); };
      elements.pagination.appendChild(btn);
    }

    if (state.currentPage < pageCount) {
      const next = createElement("button", {}, ["Next »"]);
      next.onclick = () => { state.currentPage++; fetchAndRender(); };
      elements.pagination.appendChild(next);
    }
  }

  // ──────────── Data Fetch & Kick-off ────────────
  let debounceTimer;
  elements.searchInput.oninput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
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

  async function fetchAndRender() {
    // show loading
    showLoading();

    const qs = new URLSearchParams({
      page: state.currentPage,
      limit: state.limit
    });
    try {
      const resp = await apiFetch(`/crops/crop/${cropID}?${qs}`);
      state.cropDetails = resp;
      state.listings = resp.listings || [];
      state.allBreeds = new Set(state.listings.map(l => l.breed));
      state.allTags = new Set((state.listings.flatMap(l => l.tags)) || []);
    } catch (err) {
      showError(`Error fetching crop: ${err.message}`);
      return;
    }

    // render UI
    clearElement(contentContainer);
    contentContainer.append(
      elements.title,
      elements.filterSection,
      elements.viewToggle,
      elements.listingsContainer,
      elements.pagination
    );

    elements.title.textContent = `${state.cropDetails.name} (${state.cropDetails.category})`;

    buildFilters();
    buildTagChips();
    buildViewToggle();
    renderListings();
    renderPagination();
  }

  // initial assemble filter section
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

  // kick off
  fetchAndRender();
}

// import { createElement } from "../../../components/createElement";
// import { apiFetch } from "../../../api/api";
// import { renderListingCard } from "./renderListingCard";
// import { clearElement, createOption } from "./helpers";

// export async function displayCrop(contentContainer, cropID, isLoggedIn) {
//   clearElement(contentContainer);

//   let cropDetails;
//   let listings = [];
//   let allBreeds = new Set();
//   let currentPage = 1;
//   const limit = 5;
//   let selectedBreed = "";
//   let sortBy = "";
//   let sortOrder = "";
//   let keyword = "";
//   let minPrice = 0;
//   let maxPrice = 0;

//   // UI Elements
//   const title = createElement("h2");
//   const searchInput = createElement("input", {
//     type: "text",
//     placeholder: "🔍 Search listings…",
//     class: "crop-search-input"
//   });

//   const breedFilter = createElement("select");
//   const sortFilter = createElement("select");
//   const priceMinInput = createElement("input", { type: "number", min: 0, placeholder: "Min ₹" });
//   const priceMaxInput = createElement("input", { type: "number", min: 0, placeholder: "Max ₹" });

//   const filterSection = createElement("div", { class: "filter-section" });
//   const listingsContainer = createElement("div", { class: "listings-container" });
//   const pagination = createElement("div", { class: "pagination" });

//   // Event Listeners
//   searchInput.oninput = () => {
//     keyword = searchInput.value.trim();
//     currentPage = 1;
//     fetchAndRender();
//   };

//   breedFilter.onchange = () => {
//     selectedBreed = breedFilter.value;
//     currentPage = 1;
//     fetchAndRender();
//   };

//   sortFilter.onchange = () => {
//     const [field, order] = sortFilter.value.split("-");
//     sortBy = field || "";
//     sortOrder = order || "";
//     currentPage = 1;
//     fetchAndRender();
//   };

//   [priceMinInput, priceMaxInput].forEach(input =>
//     input.oninput = () => {
//       minPrice = parseFloat(priceMinInput.value) || 0;
//       maxPrice = parseFloat(priceMaxInput.value) || 0;
//       currentPage = 1;
//       fetchAndRender();
//     }
//   );

//   // UI Building Functions
//   function buildFilters() {
//     clearElement(breedFilter);
//     breedFilter.appendChild(createOption("", "All breeds"));
//     [...allBreeds].forEach(breed =>
//       breedFilter.appendChild(createOption(breed, breed))
//     );

//     clearElement(sortFilter);
//     sortFilter.appendChild(createOption("", "Sort by..."));
//     sortFilter.appendChild(createOption("price-asc", "Price (Low to High)"));
//     sortFilter.appendChild(createOption("price-desc", "Price (High to Low)"));
//     sortFilter.appendChild(createOption("breed-asc", "Breed (A → Z)"));
//     sortFilter.appendChild(createOption("breed-desc", "Breed (Z → A)"));
//   }

//   function renderListings() {
//     clearElement(listingsContainer);
//     if (!listings.length) {
//       listingsContainer.appendChild(createElement("p", {}, ["No listings found."]));
//       return;
//     }

//     listings.forEach(listing => {
//       const card = renderListingCard(listing, cropDetails.name, isLoggedIn);

//       // Add Tags: e.g., Organic, Local
//       if (listing.tags && listing.tags.length) {
//         const tagContainer = createElement("div", { class: "listing-tags" });
//         listing.tags.forEach(tag => {
//           tagContainer.appendChild(createElement("span", { class: "listing-tag" }, [tag]));
//         });
//         card.appendChild(tagContainer);
//       }

//       listingsContainer.appendChild(card);
//     });
//   }

//   function renderPagination() {
//     clearElement(pagination);
//     const total = cropDetails.total || 0;
//     const pageCount = Math.ceil(total / limit);

//     for (let i = 1; i <= pageCount; i++) {
//       const btn = createElement("button", {}, [i]);
//       if (i === currentPage) btn.classList.add("active");
//       btn.onclick = () => {
//         currentPage = i;
//         fetchAndRender();
//       };
//       pagination.appendChild(btn);
//     }
//   }

//   async function fetchAndRender() {
//     const query = new URLSearchParams({
//       page: currentPage,
//       limit,
//       breed: selectedBreed,
//       sortBy,
//       sortOrder,
//       search: keyword,
//       minPrice: minPrice || "",
//       maxPrice: maxPrice || ""
//     });

//     try {
//       const response = await apiFetch(`/crops/crop/${cropID}?${query}`);
//       cropDetails = response;
//       listings = cropDetails.listings || [];
//       allBreeds = new Set(listings.map(l => l.breed));
//     } catch (err) {
//       clearElement(contentContainer);
//       contentContainer.appendChild(createElement("p", {}, [`Error fetching crop: ${err.message}`]));
//       return;
//     }

//     title.textContent = `${cropDetails.name} (${cropDetails.category})`;
//     buildFilters();
//     renderListings();
//     renderPagination();
//   }

//   // Assemble Filter Section
//   filterSection.appendChild(searchInput);
//   filterSection.appendChild(createElement("span", {}, [" Filter by breed: "]));
//   filterSection.appendChild(breedFilter);
//   filterSection.appendChild(createElement("span", { style: "margin-left: 16px;" }, [" Sort: "]));
//   filterSection.appendChild(sortFilter);
//   filterSection.appendChild(createElement("span", { style: "margin-left: 16px;" }, [" ₹ Price: "]));
//   filterSection.appendChild(priceMinInput);
//   filterSection.appendChild(priceMaxInput);

//   contentContainer.append(title, filterSection, listingsContainer, pagination);
//   fetchAndRender();
// }
