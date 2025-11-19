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

// ---- Debounce ----
function debounce(fn, delay = 300) {
  let timeout = null;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// ---- Server-side Filter Request ----
async function requestFilteredData(apiEndpoint, filters) {
  const query = new URLSearchParams();

  if (filters.keyword) query.set("q", filters.keyword);
  if (filters.category) query.set("category", filters.category);
  if (filters.location) query.set("location", filters.location);
  if (filters.sortBy) query.set("sort", filters.sortBy);

  if (filters.userCoords) {
    query.set("lat", filters.userCoords.lat);
    query.set("lng", filters.userCoords.lng);
  }

  const fullEndpoint = `${apiEndpoint}?${query.toString()}`;
  const result = await apiFetch(fullEndpoint);

  if (Array.isArray(result)) return result;
  return result?.data || [];
}

// ---- Pagination ----
function paginate(items, page, size) {
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}

// ---- URL SYNC ----
function readURLState() {
  const params = new URLSearchParams(location.search);
  return {
    keyword: params.get("q") || "",
    category: params.get("c") || "",
    location: params.get("loc") || "",
    sortBy: params.get("s") || ""
  };
}

function writeURLState(filters) {
  const params = new URLSearchParams();

  if (filters.keyword) params.set("q", filters.keyword);
  if (filters.category) params.set("c", filters.category);
  if (filters.location) params.set("loc", filters.location);
  if (filters.sortBy) params.set("s", filters.sortBy);

  const qs = params.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

// ---- UI Filter Controls ----
function createFilterControls({ type, items, onRender, initial }) {
  const cfg = LIST_CONFIG[type] || LIST_CONFIG.default;
  const wrapper = createElement("div", { class: `${type}-controls` });

  const searchInput = createElement("input", {
    type: "text",
    name: `search-${Date.now()}`,
    placeholder: `Search ${type}...`,
    value: initial.keyword || ""
  });

  const sortSelect = createElement(
    "select",
    { name: `sort-${Date.now()}` },
    Object.entries(cfg.sorters).map(([key]) =>
      createElement("option", { value: key, selected: initial.sortBy === key }, [
        key[0].toUpperCase() + key.slice(1)
      ])
    )
  );

  const categories = cfg.categories(items);
  const locations = cfg.locations ? cfg.locations(items) : [];

  const chipConContainer = createElement("div", { class: "chipscon" });
  const chipContainer = createElement("div", { class: "category-chips" });
  chipConContainer.append(chipContainer);

  let selectedCategory = initial.category || null;
  let selectedLocation = initial.location || "";
  let userCoords = null;

  categories.forEach(cat => {
    const chipper = createElement("span", { class: "chipper" }, [cat]);
    const chip = createElement("div", {
      class: `category-chip${selectedCategory === cat ? " active" : ""}`
    }, [chipper]);

    chip.addEventListener("click", () => {
      selectedCategory = selectedCategory === cat ? null : cat;
      triggerRender();
    });

    chipContainer.append(chip);
  });

  const locationOptions = [
    createElement("option", { value: "" }, ["All Locations"]),
    createElement("option", { value: "current" }, ["📍 Current Location"])
  ].concat(
    locations.map(loc =>
      createElement("option", { value: loc }, [loc])
    )
  );

  const locationSelect = createElement(
    "select",
    { name: `location-${Date.now()}` },
    locationOptions
  );

  locationSelect.value = selectedLocation || "";

  wrapper.append(searchInput, sortSelect, locationSelect);

  async function triggerRender() {
    const filters = {
      keyword: searchInput.value,
      category: selectedCategory,
      location: locationSelect.value,
      userCoords,
      sortBy: sortSelect.value
    };

    writeURLState(filters);

    const filtered = await requestFilteredData(cfg.apiEndpoint, filters);
    onRender(filtered);
  }

  const debouncedSearch = debounce(triggerRender, 350);

  searchInput.addEventListener("input", debouncedSearch);
  sortSelect.addEventListener("change", triggerRender);

  locationSelect.addEventListener("change", () => {
    if (locationSelect.value === "current" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          userCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          triggerRender();
        },
        () => {
          userCoords = null;
          alert("Location access denied or unavailable.");
          triggerRender();
        }
      );
      return;
    }

    userCoords = null;
    triggerRender();
  });

  triggerRender();

  return {
    controls: wrapper,
    chipConContainer,
    reset: () => {
      searchInput.value = "";
      selectedCategory = null;
      userCoords = null;
      locationSelect.value = "";
      triggerRender();
    }
  };
}

// ---- Listing Page ----
export async function displayListingPage(
  container,
  { title = "", apiEndpoint, cardBuilder, type = "generic", pageSize = 10, sidebarActions }
) {
  container.replaceChildren();

  const layout = createElement("div", { class: `${type}-page` });
  const aside = createElement("aside", { class: `${type}-aside` });
  const main = createElement("div", { class: `${type}-main` });

  layout.append(main, aside);
  container.append(layout);

  if (sidebarActions) sidebarActions(aside);
  if (title) main.append(createElement("h1", {}, [title]));

  const listSection = createElement("div", { class: `${type}-list` });

  aside.append(adspace("aside"));
  main.append(adspace("inbody"), listSection);

  const cfg = LIST_CONFIG[type] || LIST_CONFIG.default;
  cfg.apiEndpoint = apiEndpoint;

  const raw = await apiFetch(apiEndpoint);
  const items = Array.isArray(raw) ? raw : raw?.data || [];

  const initial = readURLState();
  let currentPage = 1;

  const filterControls = createFilterControls({
    type,
    items,
    initial,
    onRender: filtered => {
      currentPage = 1;
      renderFilteredPage(filtered);
    }
  });

  const filterToggle = createElement(
    "details",
    { open: false, class: `listing-filter-toggle ${type}-filter-toggle` },
    [createElement("summary", {}, ["🔍 Filters"]), filterControls.controls]
  );

  filterControls.controls.classList.add("listing-controls", `${type}-controls`);

  main.insertBefore(filterToggle, listSection);
  main.insertBefore(filterControls.chipConContainer, listSection);

  function renderFilteredPage(filtered) {
    listSection.replaceChildren();

    const paged = paginate(filtered, currentPage, pageSize);

    if (!paged.length) {
      listSection.append(
        createElement("div", { class: "empty-state" }, [
          createElement("p", {}, [`No ${type} found.`]),
          Button(
            "Clear Filters",
            "",
            { click: () => filterControls.reset() },
            "buttonx btn-secondary"
          )
        ])
      );
      return;
    }

    const adInterval = 5;

    paged.forEach((item, index) => {
      listSection.append(cardBuilder(item));
      if ((index + 1) % adInterval === 0 && index + 1 < paged.length) {
        listSection.append(adspace("inlist"));
      }
    });
  }

  renderFilteredPage(items);
}
