import { createElement } from "../../../components/createElement";
import { apiFetch } from "../../../api/api";
import { renderListingCard } from "./renderListingCard";
import { clearElement, createOption } from "./helpers";

export async function displayCrop(contentContainer, cropID, isLoggedIn) {
  clearElement(contentContainer);

  let cropDetails;
  let listings = [];
  let allBreeds = new Set();
  let currentPage = 1;
  const limit = 5;
  let selectedBreed = "";
  let sortBy = "";
  let sortOrder = "";
  let keyword = "";
  let minPrice = 0;
  let maxPrice = 0;

  // UI Elements
  const title = createElement("h2");
  const searchInput = createElement("input", {
    type: "text",
    placeholder: "🔍 Search listings…",
    class: "crop-search-input"
  });

  const breedFilter = createElement("select");
  const sortFilter = createElement("select");
  const priceMinInput = createElement("input", { type: "number", min: 0, placeholder: "Min ₹" });
  const priceMaxInput = createElement("input", { type: "number", min: 0, placeholder: "Max ₹" });

  const filterSection = createElement("div", { class: "filter-section" });
  const listingsContainer = createElement("div", { class: "listings-container" });
  const pagination = createElement("div", { class: "pagination" });

  // Event Listeners
  searchInput.oninput = () => {
    keyword = searchInput.value.trim();
    currentPage = 1;
    fetchAndRender();
  };

  breedFilter.onchange = () => {
    selectedBreed = breedFilter.value;
    currentPage = 1;
    fetchAndRender();
  };

  sortFilter.onchange = () => {
    const [field, order] = sortFilter.value.split("-");
    sortBy = field || "";
    sortOrder = order || "";
    currentPage = 1;
    fetchAndRender();
  };

  [priceMinInput, priceMaxInput].forEach(input =>
    input.oninput = () => {
      minPrice = parseFloat(priceMinInput.value) || 0;
      maxPrice = parseFloat(priceMaxInput.value) || 0;
      currentPage = 1;
      fetchAndRender();
    }
  );

  // UI Building Functions
  function buildFilters() {
    clearElement(breedFilter);
    breedFilter.appendChild(createOption("", "All breeds"));
    [...allBreeds].forEach(breed =>
      breedFilter.appendChild(createOption(breed, breed))
    );

    clearElement(sortFilter);
    sortFilter.appendChild(createOption("", "Sort by..."));
    sortFilter.appendChild(createOption("price-asc", "Price (Low to High)"));
    sortFilter.appendChild(createOption("price-desc", "Price (High to Low)"));
    sortFilter.appendChild(createOption("breed-asc", "Breed (A → Z)"));
    sortFilter.appendChild(createOption("breed-desc", "Breed (Z → A)"));
  }

  function renderListings() {
    clearElement(listingsContainer);
    if (!listings.length) {
      listingsContainer.appendChild(createElement("p", {}, ["No listings found."]));
      return;
    }

    listings.forEach(listing => {
      const card = renderListingCard(listing, cropDetails.name, isLoggedIn);

      // Add Tags: e.g., Organic, Local
      if (listing.tags && listing.tags.length) {
        const tagContainer = createElement("div", { class: "listing-tags" });
        listing.tags.forEach(tag => {
          tagContainer.appendChild(createElement("span", { class: "listing-tag" }, [tag]));
        });
        card.appendChild(tagContainer);
      }

      listingsContainer.appendChild(card);
    });
  }

  function renderPagination() {
    clearElement(pagination);
    const total = cropDetails.total || 0;
    const pageCount = Math.ceil(total / limit);

    for (let i = 1; i <= pageCount; i++) {
      const btn = createElement("button", {}, [i]);
      if (i === currentPage) btn.classList.add("active");
      btn.onclick = () => {
        currentPage = i;
        fetchAndRender();
      };
      pagination.appendChild(btn);
    }
  }

  async function fetchAndRender() {
    const query = new URLSearchParams({
      page: currentPage,
      limit,
      breed: selectedBreed,
      sortBy,
      sortOrder,
      search: keyword,
      minPrice: minPrice || "",
      maxPrice: maxPrice || ""
    });

    try {
      const response = await apiFetch(`/crops/crop/${cropID}?${query}`);
      cropDetails = response;
      listings = cropDetails.listings || [];
      allBreeds = new Set(listings.map(l => l.breed));
    } catch (err) {
      clearElement(contentContainer);
      contentContainer.appendChild(createElement("p", {}, [`Error fetching crop: ${err.message}`]));
      return;
    }

    title.textContent = `${cropDetails.name} (${cropDetails.category})`;
    buildFilters();
    renderListings();
    renderPagination();
  }

  // Assemble Filter Section
  filterSection.appendChild(searchInput);
  filterSection.appendChild(createElement("span", {}, [" Filter by breed: "]));
  filterSection.appendChild(breedFilter);
  filterSection.appendChild(createElement("span", { style: "margin-left: 16px;" }, [" Sort: "]));
  filterSection.appendChild(sortFilter);
  filterSection.appendChild(createElement("span", { style: "margin-left: 16px;" }, [" ₹ Price: "]));
  filterSection.appendChild(priceMinInput);
  filterSection.appendChild(priceMaxInput);

  contentContainer.append(title, filterSection, listingsContainer, pagination);
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

//   const title = createElement("h2");
//   const breedFilter = createElement("select");
//   const sortFilter = createElement("select");
//   const filterSection = createElement("div", { class: "filter-section" });
//   const listingsContainer = createElement("div", { class: "listings-container" });
//   const pagination = createElement("div", { class: "pagination" });

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

//     listings.forEach(listing =>
//       listingsContainer.appendChild(renderListingCard(listing, cropDetails.name, isLoggedIn))
//     );
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
//     const query = new URLSearchParams({ page: currentPage, limit, breed: selectedBreed, sortBy, sortOrder });

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

//   filterSection.appendChild(createElement("span", {}, ["Filter by breed: "]));
//   filterSection.appendChild(breedFilter);
//   filterSection.appendChild(createElement("span", { style: "margin-left: 16px;" }, ["Sort: "]));
//   filterSection.appendChild(sortFilter);

//   contentContainer.append(title, filterSection, listingsContainer, pagination);
//   fetchAndRender();
// }
