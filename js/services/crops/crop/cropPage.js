import { createUserControls } from "../farm/displayFarmHelpers.js";
import NoLink from "../../../components/base/NoLink";
import { createElement } from "../../../components/createElement";
import { apiFetch } from "../../../api/api";
import { navigate } from "../../../routes";
import Imagex from "../../../components/base/Imagex";
import { resolveImagePath, PictureType, EntityType } from "../../../utils/imagePaths.js";
import Notify from "../../../components/ui/Notify.mjs";
import Button from "../../../components/base/Button.js";

export async function displayCrop(content, cropID, isLoggedIn) {
  const container = createElement("div", { class: "croppage" });
  content.replaceChildren(container);

  try {
    const resp = await apiFetch(`/crops/crop/${cropID}?page=1&limit=100`);
    if (!resp.success || !Array.isArray(resp.listings) || resp.listings.length === 0) {
      Notify("No listings found for this crop.", { type: "error", dismissible: true });
      return;
    }

    const listings = resp.listings;

    const header = createElement("header", { class: "crop-header" }, [
      NoLink(`${resp.name} (${resp.category})`, "", {
        click: () => navigate(`/aboutcrop/${cropID}`),
      }),
      createElement("p", { class: "crop-meta" }, [`Total Listings: ${resp.total}`]),
    ]);

    // Collapsible filter toggle button
    // const toggleFiltersBtn = createElement("button", { class: "toggle-filters-btn" }, ["🔍 Filters"]);
    const toggleFiltersBtn = Button("Filters", "button", {}, "toggle-filters-btn buttonx");

    // --- Filters state ---
    const filters = {
      location: "",
      breed: "",
      minPrice: "",
      maxPrice: "",
      minQty: "",
      maxQty: "",
      harvestDate: "",
    };

    const filterForm = createElement("form", { class: "filter-controls", "aria-label": "Filter crop listings" }, [
      createElement("fieldset", {}, [
        createElement("legend", {}, ["Filters"]),
        createElement("div", { class: "filter-row" }, [
          createElement("label", { for: "filter-location" }, ["Location"]),
          createElement("input", { type: "text", placeholder: "e.g. Nagoya", id: "filter-location" }),
        ]),
        createElement("div", { class: "filter-row" }, [
          createElement("label", { for: "filter-breed" }, ["Breed"]),
          createElement("input", { type: "text", placeholder: "e.g. Koshihikari", id: "filter-breed" }),
        ]),
        createElement("div", { class: "filter-row" }, [
          createElement("label", { for: "filter-min-price" }, ["Price Range (¥/kg)"]),
          createElement("input", { type: "number", placeholder: "Min", id: "filter-min-price", min: 0 }),
          createElement("input", { type: "number", placeholder: "Max", id: "filter-max-price", min: 0 }),
        ]),
        createElement("div", { class: "filter-row" }, [
          createElement("label", { for: "filter-min-qty" }, ["Available Quantity (Kg)"]),
          createElement("input", { type: "number", placeholder: "Min", id: "filter-min-qty", min: 0 }),
          createElement("input", { type: "number", placeholder: "Max", id: "filter-max-qty", min: 0 }),
        ]),
        createElement("div", { class: "filter-row" }, [
          createElement("label", { for: "filter-harvest" }, ["Harvest Date"]),
          createElement("input", { type: "date", id: "filter-harvest" }),
        ]),
      ]),
      createElement("div", { class: "filter-actions" }, [
        createElement("button", { type: "button", id: "apply-filters" }, ["Apply"]),
        createElement("button", { type: "button", id: "reset-filters" }, ["Reset"]),
      ]),
    ]);

    const listingsWrapper = createElement("section", { class: "crop-listings" });

    const renderListings = (data) => {
      listingsWrapper.replaceChildren();
      if (!data || data.length === 0) {
        listingsWrapper.appendChild(createElement("p", {}, ["No listings match the selected filters."]));
        return;
      }

      data.forEach((listing) => {
        const imageSrc = resolveImagePath(EntityType.CROP, PictureType.THUMB, listing.banner);
        const farmName = listing.farmName || "Unnamed Farm";

        const imageSection = createElement("div", { class: "listing-image" }, [
          Imagex({ src: imageSrc, alt: listing.breed || farmName, loading: "lazy" }),
        ]);

        const detailsSection = createElement("div", { class: "listing-details" }, [
          createElement("h3", { class: "farm-link" }, [
            createElement("a", { events: { click: () => navigate(`/farm/${listing.farmid}`) } }, [farmName]),
          ]),
          createElement("p", {}, [`Breed: ${listing.breed || "Not specified"}`]),
          createElement("p", {}, [`Location: ${listing.location || "Unknown"}`]),
          createElement("p", {}, [`Price per Kg: ₹${listing.pricePerKg ?? "N/A"}`]),
          createElement("p", {}, [`Available: ${listing.availableQtyKg ?? "N/A"} Kg`]),
          createElement("p", {}, [
            `Harvest Date: ${listing.harvestDate ? new Date(listing.harvestDate).toLocaleDateString() : "N/A"
            }`,
          ]),
        ]);

        const cropData = {
          name: resp.name,
          cropid: listing.cropid,
          pricePerKg: listing.pricePerKg,
          unit: "kg",
          breed: listing.breed,
        };

        const controls = createUserControls(
          cropData,
          farmName,
          listing.farmid,
          isLoggedIn,
          listing.availableQtyKg,
          listing.cropid
        );

        const controlsSection = createElement("div", { class: "listing-controls" }, controls);

        const card = createElement("div", { class: "listing-card" }, [
          imageSection,
          createElement("div", { class: "listing-content" }, [detailsSection, controlsSection]),
        ]);

        listingsWrapper.appendChild(card);
      });
    };

    renderListings(listings);

    const applyFilters = () => {
      filters.location = document.getElementById("filter-location").value.trim().toLowerCase();
      filters.breed = document.getElementById("filter-breed").value.trim().toLowerCase();
      filters.minPrice = parseFloat(document.getElementById("filter-min-price").value) || null;
      filters.maxPrice = parseFloat(document.getElementById("filter-max-price").value) || null;
      filters.minQty = parseFloat(document.getElementById("filter-min-qty").value) || null;
      filters.maxQty = parseFloat(document.getElementById("filter-max-qty").value) || null;
      filters.harvestDate = document.getElementById("filter-harvest").value || null;

      if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
        Notify("Invalid price range (min > max).", { type: "warning", dismissible: true });
        return;
      }
      if (filters.minQty && filters.maxQty && filters.minQty > filters.maxQty) {
        Notify("Invalid quantity range (min > max).", { type: "warning", dismissible: true });
        return;
      }

      const filtered = listings.filter((listing) => {
        const locationMatch = !filters.location || (listing.location || "").toLowerCase().includes(filters.location);
        const breedMatch = !filters.breed || (listing.breed || "").toLowerCase().includes(filters.breed);
        const priceMatch =
          (!filters.minPrice || listing.pricePerKg >= filters.minPrice) &&
          (!filters.maxPrice || listing.pricePerKg <= filters.maxPrice);
        const qtyMatch =
          (!filters.minQty || listing.availableQtyKg >= filters.minQty) &&
          (!filters.maxQty || listing.availableQtyKg <= filters.maxQty);
        const harvestMatch =
          !filters.harvestDate ||
          (listing.harvestDate &&
            new Date(listing.harvestDate).toISOString().split("T")[0] === filters.harvestDate);

        return locationMatch && breedMatch && priceMatch && qtyMatch && harvestMatch;
      });

      renderListings(filtered);
      if (window.innerWidth < 768) filterForm.classList.remove("open");
    };

    const resetFilters = () => {
      filterForm.reset();
      renderListings(listings);
      if (window.innerWidth < 768) filterForm.classList.remove("open");
    };

    toggleFiltersBtn.addEventListener("click", () => {
      filterForm.classList.toggle("open");
    });

    filterForm.querySelector("#apply-filters").addEventListener("click", applyFilters);
    filterForm.querySelector("#reset-filters").addEventListener("click", resetFilters);
    filterForm.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyFilters();
      }
    });

    container.append(header, toggleFiltersBtn, filterForm, listingsWrapper);
  } catch (err) {
    Notify(err.message || "Failed to load crop details.", { type: "error", dismissible: true });
  }
}

// import { createUserControls } from "../farm/displayFarmHelpers.js";
// import NoLink from "../../../components/base/NoLink";
// import { createElement } from "../../../components/createElement";
// import { apiFetch } from "../../../api/api";
// import { navigate } from "../../../routes";
// import Imagex from "../../../components/base/Imagex";
// import { resolveImagePath, PictureType, EntityType } from "../../../utils/imagePaths.js";
// import Notify from "../../../components/ui/Notify.mjs";

// /**
//  * Displays detailed crop listings with filter controls.
//  *
//  * @param {HTMLElement} content
//  * @param {string} cropID
//  * @param {boolean} isLoggedIn
//  */
// export async function displayCrop(content, cropID, isLoggedIn) {
//   const container = createElement("div", { class: "croppage" });
//   content.replaceChildren(container);

//   try {
//     const resp = await apiFetch(`/crops/crop/${cropID}?page=1&limit=100`);

//     if (!resp.success || !Array.isArray(resp.listings) || resp.listings.length === 0) {
//       Notify("No listings found for this crop.", { type: "error", dismissible: true });
//       return;
//     }

//     const listings = resp.listings;

//     // Header
//     const header = createElement("header", { class: "crop-header" }, [
//       NoLink(`${resp.name} (${resp.category})`, "", {
//         click: () => navigate(`/aboutcrop/${cropID}`),
//       }),
//       createElement("p", { class: "crop-meta" }, [`Total Listings: ${resp.total}`]),
//     ]);

//     // --- FILTERS ---
//     const filters = {
//       location: "",
//       breed: "",
//       minPrice: "",
//       maxPrice: "",
//       minQty: "",
//       maxQty: "",
//       harvestDate: "",
//     };

//     // Create filter form
//     const filterForm = createElement("form", { class: "filter-controls", "aria-label": "Filter crop listings" }, [
//       createElement("fieldset", {}, [
//         createElement("legend", {}, ["Filters"]),
//         createElement("div", { class: "filter-row" }, [
//           createElement("label", { for: "filter-location" }, ["Location"]),
//           createElement("input", { type: "text", placeholder: "e.g. Nagoya", id: "filter-location" }),
//         ]),
//         createElement("div", { class: "filter-row" }, [
//           createElement("label", { for: "filter-breed" }, ["Breed"]),
//           createElement("input", { type: "text", placeholder: "e.g. Koshihikari", id: "filter-breed" }),
//         ]),
//         createElement("div", { class: "filter-row" }, [
//           createElement("label", { for: "filter-min-price" }, ["Price Range (¥/kg)"]),
//           createElement("input", { type: "number", placeholder: "Min", id: "filter-min-price", min: 0 }),
//           createElement("input", { type: "number", placeholder: "Max", id: "filter-max-price", min: 0 }),
//         ]),
//         createElement("div", { class: "filter-row" }, [
//           createElement("label", { for: "filter-min-qty" }, ["Available Quantity (Kg)"]),
//           createElement("input", { type: "number", placeholder: "Min", id: "filter-min-qty", min: 0 }),
//           createElement("input", { type: "number", placeholder: "Max", id: "filter-max-qty", min: 0 }),
//         ]),
//         createElement("div", { class: "filter-row" }, [
//           createElement("label", { for: "filter-harvest" }, ["Harvest Date"]),
//           createElement("input", { type: "date", id: "filter-harvest" }),
//         ]),
//       ]),
//       createElement("div", { class: "filter-actions" }, [
//         createElement("button", { type: "button", id: "apply-filters" }, ["Apply"]),
//         createElement("button", { type: "button", id: "reset-filters" }, ["Reset"]),
//       ]),
//     ]);

//     // --- LISTINGS WRAPPER ---
//     const listingsWrapper = createElement("section", { class: "crop-listings" });

//     // Render listings dynamically
//     const renderListings = (data) => {
//       listingsWrapper.replaceChildren();

//       if (!data || data.length === 0) {
//         listingsWrapper.appendChild(createElement("p", {}, ["No listings match the selected filters."]));
//         return;
//       }

//       data.forEach((listing) => {
//         const imageSrc = resolveImagePath(EntityType.CROP, PictureType.THUMB, listing.banner);
//         const farmName = listing.farmName || "Unnamed Farm";

//         const imageSection = createElement("div", { class: "listing-image" }, [
//           Imagex({ src: imageSrc, alt: listing.breed || farmName, loading: "lazy" }),
//         ]);

//         const detailsSection = createElement("div", { class: "listing-details" }, [
//           createElement("h3", { class: "farm-link" }, [
//             createElement("a", { events: { click: () => navigate(`/farm/${listing.farmid}`) } }, [farmName]),
//           ]),
//           createElement("p", {}, [`Breed: ${listing.breed || "Not specified"}`]),
//           createElement("p", {}, [`Location: ${listing.location || "Unknown"}`]),
//           createElement("p", {}, [`Price per Kg: ₹${listing.pricePerKg ?? "N/A"}`]),
//           createElement("p", {}, [`Available: ${listing.availableQtyKg ?? "N/A"} Kg`]),
//           createElement("p", {}, [
//             `Harvest Date: ${
//               listing.harvestDate ? new Date(listing.harvestDate).toLocaleDateString() : "N/A"
//             }`,
//           ]),
//         ]);

//         const cropData = {
//           name: resp.name,
//           cropid: listing.cropid,
//           pricePerKg: listing.pricePerKg,
//           unit: "kg",
//           breed: listing.breed,
//         };

//         const controls = createUserControls(
//           cropData,
//           farmName,
//           listing.farmid,
//           isLoggedIn,
//           listing.availableQtyKg,
//           listing.cropid
//         );

//         const controlsSection = createElement("div", { class: "listing-controls" }, controls);

//         const card = createElement("div", { class: "listing-card", id: `farm-${listing.farmid}-${listing.cropid}` }, [
//           imageSection,
//           createElement("div", { class: "listing-content" }, [detailsSection, controlsSection]),
//         ]);

//         listingsWrapper.appendChild(card);
//       });
//     };

//     // Initial render
//     renderListings(listings);

//     // --- Filter Logic ---
//     const applyFilters = () => {
//       filters.location = document.getElementById("filter-location").value.trim().toLowerCase();
//       filters.breed = document.getElementById("filter-breed").value.trim().toLowerCase();
//       filters.minPrice = parseFloat(document.getElementById("filter-min-price").value) || null;
//       filters.maxPrice = parseFloat(document.getElementById("filter-max-price").value) || null;
//       filters.minQty = parseFloat(document.getElementById("filter-min-qty").value) || null;
//       filters.maxQty = parseFloat(document.getElementById("filter-max-qty").value) || null;
//       filters.harvestDate = document.getElementById("filter-harvest").value || null;

//       // validate range inputs
//       if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
//         Notify("Invalid price range (min > max).", { type: "warning", dismissible: true });
//         return;
//       }
//       if (filters.minQty && filters.maxQty && filters.minQty > filters.maxQty) {
//         Notify("Invalid quantity range (min > max).", { type: "warning", dismissible: true });
//         return;
//       }

//       const filtered = listings.filter((listing) => {
//         const locationMatch = !filters.location || (listing.location || "").toLowerCase().includes(filters.location);
//         const breedMatch = !filters.breed || (listing.breed || "").toLowerCase().includes(filters.breed);
//         const priceMatch =
//           (!filters.minPrice || listing.pricePerKg >= filters.minPrice) &&
//           (!filters.maxPrice || listing.pricePerKg <= filters.maxPrice);
//         const qtyMatch =
//           (!filters.minQty || listing.availableQtyKg >= filters.minQty) &&
//           (!filters.maxQty || listing.availableQtyKg <= filters.maxQty);
//         const harvestMatch =
//           !filters.harvestDate ||
//           (listing.harvestDate &&
//             new Date(listing.harvestDate).toISOString().split("T")[0] === filters.harvestDate);

//         return locationMatch && breedMatch && priceMatch && qtyMatch && harvestMatch;
//       });

//       renderListings(filtered);
//     };

//     // --- Reset Filters ---
//     const resetFilters = () => {
//       filterForm.reset();
//       renderListings(listings);
//     };

//     // --- Event Listeners ---
//     filterForm.querySelector("#apply-filters").addEventListener("click", applyFilters);
//     filterForm.querySelector("#reset-filters").addEventListener("click", resetFilters);
//     filterForm.addEventListener("keypress", (e) => {
//       if (e.key === "Enter") {
//         e.preventDefault();
//         applyFilters();
//       }
//     });

//     container.append(header, filterForm, listingsWrapper);
//   } catch (err) {
//     Notify(err.message || "Failed to load crop details.", { type: "error", dismissible: true });
//   }
// }

// // import { createUserControls } from "../farm/displayFarmHelpers.js";
// // import NoLink from "../../../components/base/NoLink";
// // import { createElement } from "../../../components/createElement";
// // import { apiFetch } from "../../../api/api";
// // import { navigate } from "../../../routes";
// // import Imagex from "../../../components/base/Imagex";
// // import { resolveImagePath, PictureType, EntityType } from "../../../utils/imagePaths.js";
// // import Notify from "../../../components/ui/Notify.mjs";

// // /**
// //  * Displays detailed crop listings with filter controls.
// //  *
// //  * @param {HTMLElement} content
// //  * @param {string} cropID
// //  * @param {boolean} isLoggedIn
// //  */
// // export async function displayCrop(content, cropID, isLoggedIn) {
// //   const container = createElement('div', { class: "croppage" });
// //   content.replaceChildren(container);

// //   try {
// //     const resp = await apiFetch(`/crops/crop/${cropID}?page=1&limit=100`);

// //     if (!resp.success || !Array.isArray(resp.listings) || resp.listings.length === 0) {
// //       Notify('No listings found for this crop.', { type: 'error', dismissible: true });
// //       return;
// //     }

// //     const listings = resp.listings;
// //     const header = createElement('header', { class: 'crop-header' }, [
// //       NoLink(`${resp.name} (${resp.category})`, "", {
// //         click: () => navigate(`/aboutcrop/${cropID}`)
// //       }),
// //       createElement('p', { class: 'crop-meta' }, [`Total Listings: ${resp.total}`])
// //     ]);

// //     // Filter section
// //     const filters = {
// //       location: "",
// //       breed: "",
// //       minPrice: "",
// //       maxPrice: "",
// //       minQty: "",
// //       maxQty: "",
// //       harvestDate: ""
// //     };

// //     const filterSection = createElement('section', { class: 'filter-controls' }, [
// //       createElement('input', { type: 'text', placeholder: 'Location', id: 'filter-location' }),
// //       createElement('input', { type: 'text', placeholder: 'Breed', id: 'filter-breed' }),
// //       createElement('input', { type: 'number', placeholder: 'Min Price', id: 'filter-min-price' }),
// //       createElement('input', { type: 'number', placeholder: 'Max Price', id: 'filter-max-price' }),
// //       createElement('input', { type: 'number', placeholder: 'Min Available (Kg)', id: 'filter-min-qty' }),
// //       createElement('input', { type: 'number', placeholder: 'Max Available (Kg)', id: 'filter-max-qty' }),
// //       createElement('input', { type: 'date', id: 'filter-harvest' }),
// //       createElement('button', { id: 'apply-filters' }, ['Apply Filters'])
// //     ]);

// //     const listingsWrapper = createElement('section', { class: 'crop-listings' });

// //     const renderListings = (data) => {
// //       listingsWrapper.replaceChildren();

// //       if (data.length === 0) {
// //         listingsWrapper.appendChild(createElement('p', {}, ['No listings match the selected filters.']));
// //         return;
// //       }

// //       data.forEach(listing => {
// //         const imageSrc = resolveImagePath(EntityType.CROP, PictureType.THUMB, listing.banner);
// //         const farmName = listing.farmName || "Unnamed Farm";

// //         const imageSection = createElement('div', { class: 'listing-image' }, [
// //           Imagex({ src: imageSrc, alt: listing.breed || farmName, loading: "lazy" })
// //         ]);

// //         const detailsSection = createElement('div', { class: 'listing-details' }, [
// //           createElement('h3', { class: 'farm-link' }, [
// //             createElement('a', { events: { click: () => navigate(`/farm/${listing.farmid}`) } }, [farmName])
// //           ]),
// //           createElement('p', {}, [`Breed: ${listing.breed || 'Not specified'}`]),
// //           createElement('p', {}, [`Location: ${listing.location || 'Unknown'}`]),
// //           createElement('p', {}, [`Price per Kg: ₹${listing.pricePerKg ?? 'N/A'}`]),
// //           createElement('p', {}, [`Available: ${listing.availableQtyKg ?? 'N/A'} Kg`]),
// //           createElement('p', {}, [`Harvest Date: ${listing.harvestDate ? new Date(listing.harvestDate).toLocaleDateString() : 'N/A'}`])
// //         ]);

// //         const cropData = {
// //           name: resp.name,
// //           cropid: listing.cropid,
// //           pricePerKg: listing.pricePerKg,
// //           unit: "kg",
// //           breed: listing.breed,
// //         };

// //         const controls = createUserControls(
// //           cropData,
// //           farmName,
// //           listing.farmid,
// //           isLoggedIn,
// //           listing.availableQtyKg,
// //           listing.cropid
// //         );

// //         const controlsSection = createElement('div', { class: 'listing-controls' }, controls);

// //         const card = createElement('div', { class: 'listing-card', id: `farm-${listing.farmid}-${listing.cropid}` }, [
// //           imageSection,
// //           createElement('div', { class: 'listing-content' }, [
// //             detailsSection,
// //             controlsSection
// //           ])
// //         ]);

// //         listingsWrapper.appendChild(card);
// //       });
// //     };

// //     renderListings(listings);

// //     // Filter function
// //     const applyFilters = () => {
// //       filters.location = document.getElementById('filter-location').value.trim().toLowerCase();
// //       filters.breed = document.getElementById('filter-breed').value.trim().toLowerCase();
// //       filters.minPrice = parseFloat(document.getElementById('filter-min-price').value) || null;
// //       filters.maxPrice = parseFloat(document.getElementById('filter-max-price').value) || null;
// //       filters.minQty = parseFloat(document.getElementById('filter-min-qty').value) || null;
// //       filters.maxQty = parseFloat(document.getElementById('filter-max-qty').value) || null;
// //       filters.harvestDate = document.getElementById('filter-harvest').value || null;

// //       const filtered = listings.filter(listing => {
// //         const locationMatch = !filters.location || (listing.location || '').toLowerCase().includes(filters.location);
// //         const breedMatch = !filters.breed || (listing.breed || '').toLowerCase().includes(filters.breed);
// //         const priceMatch =
// //           (!filters.minPrice || listing.pricePerKg >= filters.minPrice) &&
// //           (!filters.maxPrice || listing.pricePerKg <= filters.maxPrice);
// //         const qtyMatch =
// //           (!filters.minQty || listing.availableQtyKg >= filters.minQty) &&
// //           (!filters.maxQty || listing.availableQtyKg <= filters.maxQty);
// //         const harvestMatch =
// //           !filters.harvestDate ||
// //           (listing.harvestDate && new Date(listing.harvestDate).toISOString().split('T')[0] === filters.harvestDate);

// //         return locationMatch && breedMatch && priceMatch && qtyMatch && harvestMatch;
// //       });

// //       renderListings(filtered);
// //     };

// //     filterSection.querySelector('#apply-filters').addEventListener('click', applyFilters);

// //     container.append(header, filterSection, listingsWrapper);

// //   } catch (err) {
// //     Notify(err.message || "Failed to load crop details.", { type: 'error', dismissible: true });
// //   }
// // }
