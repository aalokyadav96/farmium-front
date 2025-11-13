import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { Button } from "../../components/base/Button.js";
import { adspace } from "../home/homeHelpers.js";
import { LIST_CONFIG } from "./configList.js";

// ---- Utility: Distance between coordinates (Haversine) ----
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---- Filtering & Sorting ----
function applyFilters({ items, keyword, category, location, userCoords, sortBy, type }) {
  const cfg = LIST_CONFIG[type] || LIST_CONFIG.default;
  const kw = (keyword || "").toLowerCase();

  let filtered = items.filter(item => {
    const text = cfg.searchable(item);
    const matchesKeyword = kw ? text.includes(kw) : true;
    const matchesCategory = category ? item.category === category || item.type === category : true;

    let matchesLocation = true;
    if (location && location !== "current") {
      matchesLocation =
        item.location?.city === location || item.location?.region === location;
    }

    return matchesKeyword && matchesCategory && matchesLocation;
  });

  // proximity filter when using "current location"
  if (userCoords && location === "current") {
    const radius = cfg.radius || 10;
    filtered = filtered.filter(item => {
      const { lat, lng } = item.location || {};
      if (typeof lat === "number" && typeof lng === "number") {
        const dist = distanceKm(userCoords.lat, userCoords.lng, lat, lng);
        return dist <= radius;
      }
      return false;
    });
  }

  const sorter = cfg.sorters[sortBy] || cfg.sorters.date || (() => 0);
  return filtered.sort(sorter);
}

// ---- UI Filter Controls ----
function createFilterControls({ type, items, onRender }) {
  const cfg = LIST_CONFIG[type] || LIST_CONFIG.default;
  const wrapper = createElement("div", { class: `${type}-controls` });

  const searchInput = createElement("input", {
    type: "text",
    name: `search-${Date.now()}`,
    placeholder: `Search ${type}...`
  });

  const sortSelect = createElement(
    "select",
    { name: `sort-${Date.now()}` },
    Object.entries(cfg.sorters).map(([key]) =>
      createElement("option", { value: key }, [key[0].toUpperCase() + key.slice(1)])
    )
  );

  const categories = cfg.categories(items);
  const locations = cfg.locations ? cfg.locations(items) : [];

  // category chips
  const chipConContainer = createElement("div", { class: "chipscon" }, []);
  const chipContainer = createElement("div", { class: "category-chips" }, []);
  chipConContainer.appendChild(chipContainer);

  let selectedCategory = null;
  let selectedLocation = null;
  let userCoords = null;

  categories.forEach(cat => {
    const chipper = createElement("span", { class: "chipper" }, [cat]);
    const chip = createElement("div", { class: "category-chip" }, [chipper]);
    chip.addEventListener("click", () => {
      selectedCategory = selectedCategory === cat ? null : cat;
      renderFiltered();
    });
    chipContainer.appendChild(chip);
  });

  // location selector (with "current location")
  const locationOptions = [
    createElement("option", { value: "" }, ["All Locations"]),
    createElement("option", { value: "current" }, ["📍 Current Location"])
  ].concat(
    locations.map(loc => createElement("option", { value: loc }, [loc]))
  );

  const locationSelect = createElement("select", { name: `location-${Date.now()}` }, locationOptions);

  wrapper.append(searchInput, sortSelect);
  wrapper.appendChild(locationSelect);

  locationSelect.addEventListener("change", () => {
    const value = locationSelect.value;
    if (value === "current" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          renderFiltered();
        },
        () => {
          userCoords = null;
          alert("Location access denied or unavailable.");
          renderFiltered();
        }
      );
    } else {
      userCoords = null;
      renderFiltered();
    }
  });

  // // get user's geolocation (if allowed)
  // if (navigator.geolocation) {
  //   navigator.geolocation.getCurrentPosition(
  //     pos => {
  //       userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  //       if (locationSelect && locationSelect.value === "current") renderFiltered();
  //     },
  //     () => {} // silent fail
  //   );
  // }

  function renderFiltered() {
    const filtered = applyFilters({
      items,
      keyword: searchInput.value,
      category: selectedCategory,
      location: locationSelect ? locationSelect.value : null,
      userCoords,
      sortBy: sortSelect.value,
      type
    });
    onRender(filtered);
  }

  searchInput.addEventListener("input", renderFiltered);
  sortSelect.addEventListener("change", renderFiltered);
  locationSelect.addEventListener("change", renderFiltered);

  renderFiltered();

  return {
    controls: wrapper,
    chipConContainer,
    reset: () => {
      searchInput.value = "";
      selectedCategory = null;
      if (locationSelect) locationSelect.value = "";
      renderFiltered();
    }
  };
}

// ---- Pagination ----
function paginate(items, page, size) {
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}

// ---- Listing Page ----
export async function displayListingPage(container, {
  title = "",
  apiEndpoint,
  cardBuilder,
  type = "generic",
  pageSize = 10,
  sidebarActions
}) {
  container.replaceChildren();
  const layout = createElement("div", { class: `${type}-page` });
  const aside = createElement("aside", { class: `${type}-aside` });
  const main = createElement("div", { class: `${type}-main` });
  layout.append(main, aside);
  container.appendChild(layout);

  if (sidebarActions) sidebarActions(aside);
  if (title) main.appendChild(createElement("h1", {}, [title]));

  const listSection = createElement("div", { class: `${type}-list` });
  aside.appendChild(adspace("aside"));
  main.appendChild(adspace("inbody"));
  main.appendChild(listSection);

  let items = [];
  let currentPage = 1;

  const data = await apiFetch(apiEndpoint);
  items = Array.isArray(data) ? data : data?.data || data?.[type] || [];

  const filterControls = createFilterControls({
    type,
    items,
    onRender: filtered => {
      currentPage = 1;
      renderPage(filtered);
    }
  });

  const filterToggle = createElement(
    "details",
    { open: false, class: `listing-filter-toggle ${type}-filter-toggle` },
    [createElement("summary", {}, ["🔍 Filters"]), filterControls.controls]
  );

  filterControls.controls.classList.add("listing-controls");
  filterControls.controls.classList.add(`${type}-controls`);

  main.insertBefore(filterToggle, listSection);
  main.insertBefore(filterControls.chipConContainer, listSection);

  function renderPage(filtered) {
    listSection.replaceChildren();
    const paged = paginate(filtered, currentPage, pageSize);

    if (!paged.length) {
      listSection.appendChild(
        createElement("div", { class: "empty-state" }, [
          createElement("p", {}, [`No ${type} found.`]),
          Button("Clear Filters", "", { click: () => filterControls.reset() }, "buttonx btn-secondary")
        ])
      );
      return;
    }

    const adInterval = 5;
    paged.forEach((item, index) => {
      console.log("paged:", item);
      listSection.appendChild(cardBuilder(item));
      if ((index + 1) % adInterval === 0 && index + 1 < paged.length) {
        listSection.appendChild(adspace("inlist"));
      }
    });
  }

  renderPage(items);
}
