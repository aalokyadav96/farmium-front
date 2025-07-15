import { apiFetch } from "../../api/api.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { createElement } from "../../components/createElement.js";
import { SRC_URL } from "../../state/state.js";

// Global state
let allEvents = [];
let activeCategory = "All";
let searchTerm = "";
let sortOption = "date-asc";
let priceMax = Infinity;
let debounceTimer;

/**
 * Fetch events from backend and extract the array.
 */
async function fetchEvents() {
  try {
    const resp = await apiFetch("/events/events?page=1&limit=1000"); // adjust pagination as needed
    // backend returns { events: [...], eventCount, page, limit }
    return Array.isArray(resp.events) ? resp.events : [];
  } catch (err) {
    console.error("fetchEvents error:", err);
    throw err;
  }
}

/**
 * Display main event list
 */
async function displayEvents(isLoggedIn, contentContainer) {
  contentContainer.innerHTML = "";

  const heading = createElement("h3", {}, ["Events"]);
  contentContainer.appendChild(heading);

  const controlPanel = createElement("div", {
    id: "event-controls",
    class: "filter-controls"
  });
  contentContainer.appendChild(controlPanel);

  const filterBar = createElement("div", {
    id: "event-category-filter",
    class: "filter-bar"
  });
  contentContainer.appendChild(filterBar);

  const content = createElement("div", {
    id: "events",
    class: "hvflex"
  });
  contentContainer.appendChild(content);

  try {
    parseURLFilters();
    allEvents = await fetchEvents();

    if (allEvents.length === 0) {
      content.appendChild(createElement("p", {}, ["No events available."]));
      return;
    }

    renderSearchSortAndPriceControls(controlPanel, allEvents);
    renderEventCategoryFilters(filterBar, allEvents);
    renderEventCards(content, allEvents);
  } catch (err) {
    content.appendChild(
      createElement("p", { class: "error-text" }, ["Error fetching events. Please try again later."])
    );
    Snackbar("Unexpected error loading events.", 3000);
  }
}

/**
 * Search, sort, price, reset controls
 */
function renderSearchSortAndPriceControls(container, events) {
  container.innerHTML = "";

  const searchInput = createElement("input", {
    type: "text",
    placeholder: "Search by title or location...",
    value: searchTerm
  });
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchTerm = e.target.value.trim().toLowerCase();
      updateEventCards();
    }, 300);
  });

  const sortSelect = createElement("select", {});
  [
    { value: "date-asc", label: "Date ↑" },
    { value: "date-desc", label: "Date ↓" },
    { value: "price-asc", label: "Price ↑" },
    { value: "price-desc", label: "Price ↓" }
  ].forEach(({ value, label }) => {
    const opt = createElement("option", { value }, [label]);
    if (value === sortOption) opt.selected = true;
    sortSelect.appendChild(opt);
  });
  sortSelect.addEventListener("change", (e) => {
    sortOption = e.target.value;
    updateEventCards();
  });

  // // derive max price from backend-supplied prices array
  // const allPrices = events.flatMap(e => Array.isArray(e.prices) ? e.prices : []);
  // const max = allPrices.length ? Math.max(...allPrices) : 0;
  // if (!Number.isFinite(priceMax)) priceMax = max;

  // const priceLabel = createElement("label", {}, [`Max Price: $${priceMax}`]);
  // const priceSlider = createElement("input", {
  //   type: "range",
  //   min: 0,
  //   max,
  //   step: 1,
  //   value: priceMax
  // });
  // priceSlider.addEventListener("input", (e) => {
  //   priceMax = parseInt(e.target.value, 10);
  //   priceLabel.innerHTML = `Max Price: $${priceMax}`;
  //   updateEventCards();
  // });

  // const resetBtn = createElement("button", {}, ["Reset Filters"]);
  // resetBtn.addEventListener("click", () => {
  //   activeCategory = "All";
  //   searchTerm = "";
  //   sortOption = "date-asc";
  //   priceMax = max;
  //   history.replaceState(null, "", window.location.pathname);
  //   displayEvents(false, document.querySelector("#main-content"));
  // });

  // derive min/max price from either `prices` array or from each ticket.price
  const allPrices = events.flatMap(e => {
    if (Array.isArray(e.prices) && e.prices.length) {
      return e.prices;
    }
    if (Array.isArray(e.tickets) && e.tickets.length) {
      return e.tickets.map(t => t.price);
    }
    // no tickets/prices → treat as free
    return [0];
  });

  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);

  // initialize priceMax to the computed max on first render
  if (!Number.isFinite(priceMax) || priceMax > maxPrice) {
    priceMax = maxPrice;
  }

  const priceLabel = createElement("label", {}, [`Price up to: $${priceMax}`]);
  const priceSlider = createElement("input", {
    type: "range",
    min: minPrice,
    max: maxPrice,
    step: 1,
    value: priceMax
  });

  priceSlider.addEventListener("input", (e) => {
    priceMax = parseInt(e.target.value, 10);
    priceLabel.innerHTML = `Price up to: $${priceMax}`;
    updateEventCards();
  });

  const resetBtn = createElement("button", {}, ["Reset Filters"]);
  resetBtn.addEventListener("click", () => {
    activeCategory = "All";
    searchTerm = "";
    sortOption = "date-asc";
    priceMax = maxPrice;
    history.replaceState(null, "", window.location.pathname);
    displayEvents(false, document.querySelector("#main-content"));
  });

  container.appendChild(searchInput);
  container.appendChild(sortSelect);
  container.appendChild(priceLabel);
  container.appendChild(priceSlider);
  container.appendChild(resetBtn);
}

/**
 * Category buttons
 */
function renderEventCategoryFilters(container, events) {
  container.innerHTML = "";
  const categories = Array.from(
    new Set(events.map(e => e.category).filter(Boolean))
  );
  categories.unshift("All");

  if (categories.length < 2) {
    container.style.display = "none";
    return;
  }
  container.style.display = "";

  categories.forEach(category => {
    const btn = createElement("button", {
      "data-cat": category,
      class: category === activeCategory ? "active" : ""
    }, [category]);

    btn.addEventListener("click", () => {
      activeCategory = category;
      container
        .querySelectorAll("button")
        .forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      updateEventCards();
    });

    container.appendChild(btn);
  });
}

/**
 * Render matching cards
 */
function renderEventCards(container, events) {
  container.innerHTML = "";

  let filtered = events.slice();

  if (activeCategory !== "All") {
    filtered = filtered.filter(e => e.category === activeCategory);
  }

  if (searchTerm) {
    filtered = filtered.filter(e =>
      (e.title || "").toLowerCase().includes(searchTerm) ||
      (e.placename || "").toLowerCase().includes(searchTerm)
    );
  }

  filtered = filtered.filter(e => {
    const prices = Array.isArray(e.prices) ? e.prices : [0];
    const minPrice = Math.min(...prices);
    return minPrice <= priceMax;
  });

  switch (sortOption) {
    case "date-asc":
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case "date-desc":
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
    case "price-asc":
      filtered.sort((a, b) => {
        const aMin = Math.min(...(Array.isArray(a.prices) ? a.prices : [0]));
        const bMin = Math.min(...(Array.isArray(b.prices) ? b.prices : [0]));
        return aMin - bMin;
      });
      break;
    case "price-desc":
      filtered.sort((a, b) => {
        const aMax = Math.max(...(Array.isArray(a.prices) ? a.prices : [0]));
        const bMax = Math.max(...(Array.isArray(b.prices) ? b.prices : [0]));
        return bMax - aMax;
      });
      break;
  }

  updateURLFilters();

  if (filtered.length === 0) {
    container.appendChild(
      createElement("p", {}, ["No events match the current filters."])
    );
    return;
  }

  filtered.forEach(ev => {
    container.appendChild(createEventCard(ev));
  });
}

/**
 * Sync filters to URL
 */
function updateURLFilters() {
  const params = new URLSearchParams();
  if (activeCategory !== "All") params.set("category", activeCategory);
  if (searchTerm) params.set("search", searchTerm);
  if (sortOption !== "date-asc") params.set("sort", sortOption);
  if (Number.isFinite(priceMax)) params.set("priceMax", priceMax);
  history.replaceState(null, "", `${window.location.pathname}?${params}`);
}

/**
 * Read filters from URL
 */
function parseURLFilters() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("category")) activeCategory = params.get("category");
  if (params.has("search")) searchTerm = params.get("search");
  if (params.has("sort")) sortOption = params.get("sort");
  if (params.has("priceMax")) priceMax = parseFloat(params.get("priceMax"));
}

/**
 * Build a single event card
 */
function createEventCard(ev) {
  const prices = Array.isArray(ev.prices) ? ev.prices : [0];
  const minPrice = Math.min(...prices);
  const currency = ev.currency || "USD";

  return createElement("div", { class: "event-card" }, [
    createElement("a", { href: `/event/${ev.eventid}`, class: "event-link" }, [
      createElement("img", {
        class: "event-img",
        src: `${SRC_URL}/eventpic/banner/thumb/${ev.eventid}.jpg`,
        alt: `${ev.title} Banner`,
        loading: "lazy",
        style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
      }),
      createElement("div", { class: "event-info" }, [
        createElement("h2", { class: "event-title" }, [ev.title]),
        createElement("p", {}, [
          createElement("strong", {}, ["Date: "]),
          new Date(ev.date).toLocaleString()
        ]),
        createElement("p", {}, [
          createElement("strong", {}, ["Place: "]),
          ev.placename
        ]),
        createElement("p", {}, [
          createElement("strong", {}, ["Category: "]),
          ev.category
        ]),
        createElement("p", {}, [
          createElement("strong", {}, ["Price: "]),
          minPrice > 0 ? `${currency} ${minPrice}` : "Free"
        ])
      ])
    ])
  ]);
}

/**
 * Re-render cards in-place
 */
function updateEventCards() {
  const contentDiv = document.getElementById("events");
  if (!contentDiv) return;
  renderEventCards(contentDiv, allEvents);
}

export { displayEvents, createEventCard };

// import { apiFetch } from "../../api/api.js";
// import Snackbar from '../../components/ui/Snackbar.mjs';
// import { createElement } from "../../components/createElement.js";
// import { SRC_URL } from "../../state/state.js";

// // Global state
// let allEvents = [];
// let activeCategory = "All";
// let searchTerm = "";
// let sortOption = "date-asc";
// let priceMin = 0;
// let priceMax = Infinity;
// let debounceTimer;

// /**
//  * Fetch events from backend
//  */
// async function fetchEvents() {
//   try {
//     return await apiFetch("/events/events");
//   } catch (err) {
//     console.error("fetchEvents error:", err);
//     throw err;
//   }
// }

// /**
//  * Display main event list
//  */
// async function displayEvents(isLoggedIn, contentContainer) {
//   contentContainer.innerHTML = "";

//   const heading = createElement("h3", {}, ["Events"]);
//   contentContainer.appendChild(heading);

//   const controlPanel = createElement("div", {
//     id: "event-controls",
//     class: "filter-controls"
//   });
//   contentContainer.appendChild(controlPanel);

//   const filterBar = createElement("div", {
//     id: "event-category-filter",
//     class: "filter-bar"
//   });
//   contentContainer.appendChild(filterBar);

//   const content = createElement("div", {
//     id: "events",
//     class: "hvflex"
//   });
//   contentContainer.appendChild(content);

//   try {
//     parseURLFilters();
//     allEvents = await fetchEvents();

//     if (!Array.isArray(allEvents) || allEvents.length === 0) {
//       content.appendChild(createElement("p", {}, ["No events available."]));
//       return;
//     }

//     renderSearchSortAndPriceControls(controlPanel, allEvents);
//     renderEventCategoryFilters(filterBar, allEvents);
//     renderEventCards(content, allEvents);
//   } catch (err) {
//     content.appendChild(
//       createElement("p", { class: "error-text" }, ["Error fetching events. Please try again later."])
//     );
//     Snackbar("Unexpected error loading events.", 3000);
//   }
// }

// /**
//  * Search, sort, price range, reset
//  */
// function renderSearchSortAndPriceControls(container, events) {
//   container.innerHTML = "";

//   const searchInput = createElement("input", {
//     type: "text",
//     placeholder: "Search by title or location...",
//     value: searchTerm
//   });
//   searchInput.addEventListener("input", (e) => {
//     clearTimeout(debounceTimer);
//     debounceTimer = setTimeout(() => {
//       searchTerm = e.target.value.trim().toLowerCase();
//       updateEventCards();
//     }, 300);
//   });

//   const sortSelect = createElement("select", {});
//   [
//     { value: "date-asc", label: "Date ↑" },
//     { value: "date-desc", label: "Date ↓" },
//     { value: "price-asc", label: "Price ↑" },
//     { value: "price-desc", label: "Price ↓" }
//   ].forEach(({ value, label }) => {
//     const opt = createElement("option", { value }, [label]);
//     if (value === sortOption) opt.selected = true;
//     sortSelect.appendChild(opt);
//   });
//   sortSelect.addEventListener("change", (e) => {
//     sortOption = e.target.value;
//     updateEventCards();
//   });

//   const allPrices = events.flatMap(e => e.prices || []);
//   const min = Math.min(...allPrices, 0);
//   const max = Math.max(...allPrices, 0);

//   if (!Number.isFinite(priceMin)) priceMin = min;
//   if (!Number.isFinite(priceMax)) priceMax = max;

//   const priceLabel = createElement("label", {}, [`Max Price: $${priceMax}`]);
//   const priceSlider = createElement("input", {
//     type: "range",
//     min,
//     max,
//     step: 1,
//     value: priceMax
//   });
//   priceSlider.addEventListener("input", (e) => {
//     priceMax = parseInt(e.target.value, 10);
//     priceLabel.innerHTML = `Max Price: $${priceMax}`;
//     updateEventCards();
//   });

//   const resetBtn = createElement("button", {}, ["Reset Filters"]);
//   resetBtn.addEventListener("click", () => {
//     activeCategory = "All";
//     searchTerm = "";
//     sortOption = "date-asc";
//     priceMin = min;
//     priceMax = max;
//     displayEvents(false, document.querySelector("#main-content"));
//   });

//   container.appendChild(searchInput);
//   container.appendChild(sortSelect);
//   container.appendChild(priceLabel);
//   container.appendChild(priceSlider);
//   container.appendChild(resetBtn);
// }

// /**
//  * Category buttons
//  */
// function renderEventCategoryFilters(container, events) {
//   container.innerHTML = "";
//   const categories = Array.from(new Set(events.map((e) => e.category).filter(Boolean)));
//   categories.unshift("All");

//   if (categories.length < 2) {
//     container.style.display = "none";
//     return;
//   }

//   container.style.display = "";

//   categories.forEach((category) => {
//     const btn = createElement("button", {
//       "data-cat": category,
//       class: category === activeCategory ? "active" : ""
//     }, [category]);

//     btn.addEventListener("click", () => {
//       activeCategory = category;
//       container.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
//       btn.classList.add("active");
//       updateEventCards();
//     });

//     container.appendChild(btn);
//   });
// }

// /**
//  * Render matching cards
//  */
// function renderEventCards(container, events) {
//   container.innerHTML = "";

//   let filtered = [...events];

//   if (activeCategory !== "All") {
//     filtered = filtered.filter(e => e.category === activeCategory);
//   }

//   if (searchTerm) {
//     filtered = filtered.filter(e =>
//       (e.title || "").toLowerCase().includes(searchTerm) ||
//       (e.placename || "").toLowerCase().includes(searchTerm)
//     );
//   }

//   filtered = filtered.filter((e) => {
//     const prices = e.prices || [0];
//     const eventMin = Math.min(...prices);
//     return eventMin <= priceMax;
//   });

//   switch (sortOption) {
//     case "date-asc":
//       filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
//       break;
//     case "date-desc":
//       filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
//       break;
//     case "price-asc":
//       filtered.sort((a, b) => (Math.min(...(a.prices || [0])) - Math.min(...(b.prices || [0]))));
//       break;
//     case "price-desc":
//       filtered.sort((a, b) => (Math.max(...(b.prices || [0])) - Math.max(...(a.prices || [0]))));
//       break;
//   }

//   updateURLFilters();

//   if (filtered.length === 0) {
//     container.appendChild(createElement("p", {}, ["No events match the current filters."]));
//     return;
//   }

//   filtered.forEach((event) => {
//     container.appendChild(createEventCard(event));
//   });
// }

// /**
//  * Sync filters to URL
//  */
// function updateURLFilters() {
//   const params = new URLSearchParams();
//   if (activeCategory !== "All") params.set("category", activeCategory);
//   if (searchTerm) params.set("search", searchTerm);
//   if (sortOption !== "date-asc") params.set("sort", sortOption);
//   if (Number.isFinite(priceMax)) params.set("priceMax", priceMax);
//   history.replaceState(null, "", "?" + params.toString());
// }

// /**
//  * Read filters from URL
//  */
// function parseURLFilters() {
//   const params = new URLSearchParams(window.location.search);
//   if (params.has("category")) activeCategory = params.get("category");
//   if (params.has("search")) searchTerm = params.get("search");
//   if (params.has("sort")) sortOption = params.get("sort");
//   if (params.has("priceMax")) priceMax = parseFloat(params.get("priceMax"));
// }

// /**
//  * Event card builder
//  */
// function createEventCard(event) {
//   const minPrice = Math.min(...(event.prices || [0]));
//   const currency = event.currency || "USD";

//   return createElement("div", { class: "event-card" }, [
//     createElement("a", { href: `/event/${event.eventid}`, class: "event-link" }, [
//       createElement("img", {
//         class: "event-img",
//         src: `${SRC_URL}/eventpic/banner/thumb/${event.eventid}.jpg`,
//         alt: `${event.title} Banner`,
//         loading: "lazy",
//         style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
//       }),
//       createElement("div", { class: "event-info" }, [
//         createElement("h2", { class: "event-title" }, [event.title]),
//         createElement("p", {}, [
//           createElement("strong", {}, ["Date: "]),
//           new Date(event.date).toLocaleString()
//         ]),
//         createElement("p", {}, [
//           createElement("strong", {}, ["Place: "]),
//           event.placename
//         ]),
//         createElement("p", {}, [
//           createElement("strong", {}, ["Category: "]),
//           event.category
//         ]),
//         createElement("p", {}, [
//           createElement("strong", {}, ["Price: "]),
//           minPrice > 0 ? `${currency} ${minPrice}` : "Free"
//         ])
//       ])
//     ])
//   ]);
// }

// function updateEventCards() {
//   const contentDiv = document.getElementById("events");
//   if (!contentDiv) return;
//   renderEventCards(contentDiv, allEvents);
// }


// export { displayEvents, createEventCard };

// // import { apiFetch } from "../../api/api.js";
// // import Snackbar from '../../components/ui/Snackbar.mjs';
// // import { createElement } from "../../components/createElement.js";
// // import { SRC_URL } from "../../state/state.js";

// // // Globals
// // let allEvents = [];
// // let activeCategory = "All";
// // let searchTerm = "";
// // let sortOption = "date-asc";
// // let priceMin = 0;
// // let priceMax = Infinity;
// // let visibleCount = 20;
// // const PAGE_SIZE = 20;
// // let debounceTimer;

// // /**
// //  * Fetch all events
// //  */
// // async function fetchEvents() {
// //   try {
// //     return await apiFetch("/events/events");
// //   } catch (err) {
// //     console.error("fetchEvents error:", err);
// //     throw err;
// //   }
// // }

// // /**
// //  * Main renderer
// //  */
// // async function displayEvents(isLoggedIn, contentContainer) {
// //   // contentContainer.innerHTML = "";

// //   const heading = createElement("h3", {}, ["Events"]);
// //   contentContainer.appendChild(heading);

// //   const controlPanel = createElement("div", {
// //     id: "event-controls",
// //     class: "filter-controls"
// //   });
// //   contentContainer.appendChild(controlPanel);

// //   const filterBar = createElement("div", {
// //     id: "event-category-filter",
// //     class: "filter-bar"
// //   });
// //   contentContainer.appendChild(filterBar);

// //   const content = createElement("div", {
// //     id: "events",
// //     class: "hvflex"
// //   });
// //   contentContainer.appendChild(content);

// //   try {
// //     parseURLFilters();
// //     allEvents = await fetchEvents();

// //     if (!Array.isArray(allEvents) || allEvents.length === 0) {
// //       content.appendChild(createElement("p", {}, ["No events available."]));
// //       return;
// //     }

// //     renderSearchSortAndPriceControls(controlPanel, allEvents);
// //     renderEventCategoryFilters(filterBar, allEvents);
// //     renderEventCards(content, allEvents);
// //     // setupScrollObserver();
// //   } catch (err) {
// //     content.appendChild(
// //       createElement("p", { class: "error-text" }, ["Error fetching events. Please try again later."])
// //     );
// //     Snackbar("Unexpected error loading events.", 3000);
// //   }
// // }

// // /**
// //  * Control panel
// //  */
// // function renderSearchSortAndPriceControls(container, events) {
// //   container.innerHTML = "";

// //   const searchInput = createElement("input", {
// //     type: "text",
// //     placeholder: "Search by title or location...",
// //     value: searchTerm,
// //     class: "location-input"
// //   });
// //   searchInput.addEventListener("input", (e) => {
// //     clearTimeout(debounceTimer);
// //     debounceTimer = setTimeout(() => {
// //       searchTerm = e.target.value.trim().toLowerCase();
// //       visibleCount = PAGE_SIZE;
// //       updateEventCards();
// //     }, 300);
// //   });

// //   const sortSelect = createElement("select", { class: "sort-select" });
// //   const options = [
// //     { value: "date-asc", label: "Date ↑" },
// //     { value: "date-desc", label: "Date ↓" },
// //     { value: "price-asc", label: "Price ↑" },
// //     { value: "price-desc", label: "Price ↓" }
// //   ];
// //   options.forEach(({ value, label }) => {
// //     const opt = createElement("option", { value }, [label]);
// //     if (value === sortOption) opt.selected = true;
// //     sortSelect.appendChild(opt);
// //   });
// //   sortSelect.addEventListener("change", (e) => {
// //     sortOption = e.target.value;
// //     visibleCount = PAGE_SIZE;
// //     updateEventCards();
// //   });

// //   const prices = events.map((e) => e.price || 0);
// //   const min = Math.min(...prices);
// //   const max = Math.max(...prices);
// //   if (!Number.isFinite(priceMin)) priceMin = min;
// //   if (!Number.isFinite(priceMax)) priceMax = max;

// //   const priceLabel = createElement("label", {}, [`Max Price: $${priceMax}`]);
// //   const priceSlider = createElement("input", {
// //     type: "range",
// //     min,
// //     max,
// //     step: 1,
// //     value: priceMax,
// //     class: "price-slider"
// //   });
// //   priceSlider.addEventListener("input", (e) => {
// //     priceMax = parseInt(e.target.value, 10);
// //     priceLabel.innerHTML = `Max Price: $${priceMax}`;
// //     visibleCount = PAGE_SIZE;
// //     updateEventCards();
// //   });

// //   const resetBtn = createElement("button", { class: "reset-btn" }, ["Reset Filters"]);
// //   resetBtn.addEventListener("click", () => {
// //     activeCategory = "All";
// //     searchTerm = "";
// //     sortOption = "date-asc";
// //     priceMin = min;
// //     priceMax = max;
// //     visibleCount = PAGE_SIZE;
// //     updateEventCards();
// //     displayEvents(false, document.querySelector("#main-content")); // optional full reload
// //   });

// //   container.appendChild(searchInput);
// //   container.appendChild(sortSelect);
// //   container.appendChild(priceLabel);
// //   container.appendChild(priceSlider);
// //   container.appendChild(resetBtn);
// // }

// // /**
// //  * Filter by category
// //  */
// // function renderEventCategoryFilters(container, events) {
// //   container.innerHTML = "";
// //   const categories = Array.from(new Set(events.map((e) => e.category).filter(Boolean)));
// //   categories.unshift("All");

// //   if (categories.length < 2) {
// //     container.style.display = "none";
// //     return;
// //   }
// //   container.style.display = "";

// //   categories.forEach((category) => {
// //     const btn = createElement("button", {
// //       "data-cat": category,
// //       class: category === activeCategory ? "active" : ""
// //     }, [category]);

// //     btn.addEventListener("click", () => {
// //       activeCategory = category;
// //       visibleCount = PAGE_SIZE;
// //       container.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
// //       btn.classList.add("active");
// //       updateEventCards();
// //     });

// //     container.appendChild(btn);
// //   });
// // }

// // /**
// //  * Render events
// //  */
// // function renderEventCards(container, events) {
// //   container.innerHTML = "";

// //   let filtered = [...events];

// //   if (activeCategory !== "All") {
// //     filtered = filtered.filter((e) => e.category === activeCategory);
// //   }

// //   if (searchTerm) {
// //     filtered = filtered.filter((e) =>
// //       (e.placename || "").toLowerCase().includes(searchTerm) ||
// //       (e.title || "").toLowerCase().includes(searchTerm)
// //     );
// //   }

// //   filtered = filtered.filter((e) => {
// //     const price = e.price || 0;
// //     return price >= priceMin && price <= priceMax;
// //   });

// //   switch (sortOption) {
// //     case "date-asc":
// //       filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
// //       break;
// //     case "date-desc":
// //       filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
// //       break;
// //     case "price-asc":
// //       filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
// //       break;
// //     case "price-desc":
// //       filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
// //       break;
// //   }

// //   updateURLFilters();

// //   const visible = filtered.slice(0, visibleCount);
// //   if (visible.length === 0) {
// //     container.appendChild(createElement("p", {}, ["No events match the current filters."]));
// //     return;
// //   }

// //   visible.forEach((event) => {
// //     container.appendChild(createEventCard(event));
// //   });
// // }

// // /**
// //  * Lazy loading on scroll
// //  */
// // function setupScrollObserver() {
// //   window.addEventListener("scroll", () => {
// //     const scrollY = window.scrollY + window.innerHeight;
// //     const fullHeight = document.documentElement.scrollHeight;

// //     if (scrollY >= fullHeight - 100) {
// //       const previousCount = visibleCount;
// //       visibleCount += PAGE_SIZE;
// //       if (previousCount !== visibleCount) updateEventCards();
// //     }
// //   });
// // }

// // /**
// //  * Trigger UI update
// //  */
// // function updateEventCards() {
// //   const contentDiv = document.getElementById("events");
// //   if (!contentDiv) return;
// //   renderEventCards(contentDiv, allEvents);
// // }

// // /**
// //  * URL sync
// //  */
// // function updateURLFilters() {
// //   const params = new URLSearchParams();
// //   if (activeCategory !== "All") params.set("category", activeCategory);
// //   if (searchTerm) params.set("search", searchTerm);
// //   if (sortOption !== "date-asc") params.set("sort", sortOption);
// //   if (priceMin > 0) params.set("priceMin", priceMin);
// //   if (priceMax < Infinity) params.set("priceMax", priceMax);
// //   history.replaceState(null, "", "?" + params.toString());
// // }

// // /**
// //  * Parse URL
// //  */
// // function parseURLFilters() {
// //   const params = new URLSearchParams(window.location.search);
// //   if (params.has("category")) activeCategory = params.get("category");
// //   if (params.has("search")) searchTerm = params.get("search");
// //   if (params.has("sort")) sortOption = params.get("sort");
// //   if (params.has("priceMin")) priceMin = parseFloat(params.get("priceMin"));
// //   if (params.has("priceMax")) priceMax = parseFloat(params.get("priceMax"));
// // }

// // /**
// //  * Build event card
// //  */
// // function createEventCard(event) {
// //   return createElement("div", { class: "event-card" }, [
// //     createElement("a", { href: `/event/${event.eventid}`, class: "event-link" }, [
// //       createElement("img", {
// //         class: "event-img",
// //         src: `${SRC_URL}/eventpic/banner/thumb/${event.eventid}.jpg`,
// //         alt: `${event.title} Banner`,
// //         loading: "lazy",
// //         style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
// //       }),
// //       createElement("div", { class: "event-info" }, [
// //         createElement("h2", { class: "event-title" }, [event.title]),
// //         createElement("p", {}, [
// //           createElement("strong", {}, ["Date: "]),
// //           new Date(event.date).toLocaleString()
// //         ]),
// //         createElement("p", {}, [
// //           createElement("strong", {}, ["Place: "]),
// //           event.placename
// //         ]),
// //         createElement("p", {}, [
// //           createElement("strong", {}, ["Category: "]),
// //           event.category
// //         ]),
// //         createElement("p", {}, [
// //           createElement("strong", {}, ["Price: "]),
// //           `$${event.price ?? 0}`
// //         ])
// //       ])
// //     ])
// //   ]);
// // }

// // export { displayEvents, createEventCard };

// // // import { apiFetch } from "../../api/api.js";
// // // import Snackbar from '../../components/ui/Snackbar.mjs';
// // // import { createElement } from "../../components/createElement.js";
// // // import { SRC_URL } from "../../state/state.js";
// // // import Button from "../../components/base/Button.js";

// // // let allEvents = [];
// // // let activeCategory = "All";
// // // let searchLocation = "";
// // // let sortOption = "date-asc";

// // // /**
// // //  * Fetch all events from the backend.
// // //  * @returns {Promise<Array>} Array of event objects
// // //  */
// // // async function fetchEvents() {
// // //   try {
// // //     return await apiFetch("/events/events");
// // //   } catch (err) {
// // //     console.error("fetchEvents error:", err);
// // //     throw err;
// // //   }
// // // }

// // // /**
// // //  * Main function to render Events with category filters.
// // //  * @param {boolean} isLoggedIn
// // //  * @param {HTMLElement} contentContainer
// // //  */
// // // async function displayEvents(isLoggedIn, contentContainer) {
// // //   contentContainer.innerHTML = "";

// // //   const heading = createElement("h3", {}, ["Events"]);
// // //   contentContainer.appendChild(heading);

// // //   const controlPanel = createElement("div", { id: "event-controls", class: "filter-controls" });
// // //   contentContainer.appendChild(controlPanel);

// // //   const filterBar = createElement("div", {
// // //     id: "event-category-filter",
// // //     class: "filter-bar",
// // //   });
// // //   contentContainer.appendChild(filterBar);

// // //   const content = createElement("div", {
// // //     id: "events",
// // //     class: "hvflex",
// // //   });
// // //   contentContainer.appendChild(content);

// // //   try {
// // //     allEvents = await fetchEvents();

// // //     if (!Array.isArray(allEvents) || allEvents.length === 0) {
// // //       content.appendChild(
// // //         createElement("p", {}, ["No events available."])
// // //       );
// // //       return;
// // //     }

// // //     renderSearchAndSortControls(controlPanel);
// // //     renderEventCategoryFilters(filterBar, allEvents);
// // //     renderEventCards(content, allEvents);
// // //   } catch (error) {
// // //     content.appendChild(
// // //       createElement("p", { class: "error-text" }, [
// // //         "Error fetching events. Please try again later.",
// // //       ])
// // //     );
// // //     Snackbar("Unexpected error loading events.", 3000);
// // //   }
// // // }

// // // /**
// // //  * Creates the location search input and sort selector.
// // //  * @param {HTMLElement} container
// // //  */
// // // function renderSearchAndSortControls(container) {
// // //   container.innerHTML = "";

// // //   // Search by location
// // //   const searchInput = createElement("input", {
// // //     type: "text",
// // //     placeholder: "Search by location...",
// // //     value: searchLocation,
// // //     class: "location-input"
// // //   });
// // //   searchInput.addEventListener("input", (e) => {
// // //     searchLocation = e.target.value.trim().toLowerCase();
// // //     updateEventCards();
// // //   });

// // //   // Sort selector
// // //   const sortSelect = createElement("select", { class: "sort-select" });
// // //   const options = [
// // //     { value: "date-asc", label: "Date ↑" },
// // //     { value: "date-desc", label: "Date ↓" },
// // //     { value: "price-asc", label: "Price ↑" },
// // //     { value: "price-desc", label: "Price ↓" },
// // //   ];
// // //   options.forEach(({ value, label }) => {
// // //     const opt = createElement("option", { value }, [label]);
// // //     if (value === sortOption) opt.selected = true;
// // //     sortSelect.appendChild(opt);
// // //   });

// // //   sortSelect.addEventListener("change", (e) => {
// // //     sortOption = e.target.value;
// // //     updateEventCards();
// // //   });

// // //   container.appendChild(searchInput);
// // //   container.appendChild(sortSelect);
// // // }

// // // /**
// // //  * Build filter buttons based on distinct categories.
// // //  * @param {HTMLElement} container
// // //  * @param {Array} events
// // //  */
// // // function renderEventCategoryFilters(container, events) {
// // //   container.innerHTML = "";

// // //   const categories = Array.from(
// // //     new Set(events.map((e) => e.category).filter(Boolean))
// // //   );
// // //   categories.unshift("All");

// // //   if (categories.length < 2) {
// // //     container.style.display = "none";
// // //     return;
// // //   } else {
// // //     container.style.display = "";
// // //   }

// // //   categories.forEach((category) => {
// // //     const btn = createElement(
// // //       "button",
// // //       {
// // //         "data-cat": category,
// // //         class: category === activeCategory ? "active" : "",
// // //       },
// // //       [category]
// // //     );

// // //     btn.addEventListener("click", () => {
// // //       activeCategory = category;
// // //       updateEventCards();
// // //       container.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
// // //       btn.classList.add("active");
// // //     });

// // //     container.appendChild(btn);
// // //   });
// // // }

// // // /**
// // //  * Render event cards into the given container, filtered by activeCategory and location.
// // //  * @param {HTMLElement} container
// // //  * @param {Array} events
// // //  */
// // // function renderEventCards(container, events) {
// // //   container.innerHTML = "";

// // //   let filtered = events;

// // //   // Filter by category
// // //   if (activeCategory !== "All") {
// // //     filtered = filtered.filter((e) => e.category === activeCategory);
// // //   }

// // //   // Filter by location
// // //   if (searchLocation) {
// // //     filtered = filtered.filter((e) =>
// // //       e.placename?.toLowerCase().includes(searchLocation)
// // //     );
// // //   }

// // //   // Sort logic
// // //   switch (sortOption) {
// // //     case "date-asc":
// // //       filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
// // //       break;
// // //     case "date-desc":
// // //       filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
// // //       break;
// // //     case "price-asc":
// // //       filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
// // //       break;
// // //     case "price-desc":
// // //       filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
// // //       break;
// // //   }

// // //   if (filtered.length === 0) {
// // //     container.appendChild(
// // //       createElement("p", {}, ["No events match the current filters."])
// // //     );
// // //     return;
// // //   }

// // //   filtered.forEach((event) => {
// // //     container.appendChild(createEventCard(event));
// // //   });
// // // }

// // // /**
// // //  * Called when a filter/search/sort is changed.
// // //  */
// // // function updateEventCards() {
// // //   const contentDiv = document.getElementById("events");
// // //   if (!contentDiv) return;
// // //   renderEventCards(contentDiv, allEvents);
// // // }

// // // /**
// // //  * Creates a single event card.
// // //  * @param {Object} event
// // //  * @returns {HTMLElement}
// // //  */
// // // function createEventCard(event) {
// // //   return createElement(
// // //     "div",
// // //     { class: "event-card" },
// // //     [
// // //       createElement(
// // //         "a",
// // //         { href: `/event/${event.eventid}`, class: "event-link" },
// // //         [
// // //           createElement("img", {
// // //             class: "event-img",
// // //             src: `${SRC_URL}/eventpic/banner/thumb/${event.eventid}.jpg`,
// // //             alt: `${event.title} Banner`,
// // //             loading: "lazy",
// // //             style: "width:100%;aspect-ratio:16/9;object-fit:cover;",
// // //           }),
// // //           createElement(
// // //             "div",
// // //             { class: "event-info" },
// // //             [
// // //               createElement("h2", { class: "event-title" }, [event.title]),
// // //               createElement("p", {}, [
// // //                 createElement("strong", {}, ["Date: "]),
// // //                 new Date(event.date).toLocaleString(),
// // //               ]),
// // //               createElement("p", {}, [
// // //                 createElement("strong", {}, ["Place: "]),
// // //                 event.placename,
// // //               ]),
// // //               createElement("p", {}, [
// // //                 createElement("strong", {}, ["Category: "]),
// // //                 event.category,
// // //               ]),
// // //               event.price != null
// // //                 ? createElement("p", {}, [
// // //                     createElement("strong", {}, ["Price: "]),
// // //                     `${event.price} USD`,
// // //                   ])
// // //                 : null,
// // //             ].filter(Boolean)
// // //           ),
// // //         ]
// // //       ),
// // //     ]
// // //   );
// // // }

// // // export { displayEvents, createEventCard };

// // // // import { apiFetch } from "../../api/api.js";
// // // // import Snackbar from '../../components/ui/Snackbar.mjs';
// // // // import { createElement } from "../../components/createElement.js";
// // // // import { SRC_URL } from "../../state/state.js";
// // // // import Button from "../../components/base/Button.js";

// // // // let allEvents = [];
// // // // let activeCategory = "All";

// // // // /**
// // // //  * Fetch all events from the backend.
// // // //  * @returns {Promise<Array>} Array of event objects
// // // //  */
// // // // async function fetchEvents() {
// // // //   try {
// // // //     return await apiFetch("/events/events");
// // // //   } catch (err) {
// // // //     console.error("fetchEvents error:", err);
// // // //     throw err;
// // // //   }
// // // // }

// // // // /**
// // // //  * Main function to render Events with category filters.
// // // //  * @param {boolean} isLoggedIn
// // // //  * @param {HTMLElement} contentContainer
// // // //  */
// // // // async function displayEvents(isLoggedIn, contentContainer) {
// // // //   // 1. Clear container so we don’t append repeatedly
// // // //   contentContainer.innerHTML = "";

// // // //   // 2. Heading
// // // //   const heading = createElement("h3", {}, ["Events"]);
// // // //   contentContainer.appendChild(heading);

// // // //   // 3. Filter bar container (initially empty)
// // // //   const filterBar = createElement("div", {
// // // //     id: "event-category-filter",
// // // //     class: "filter-bar",
// // // //   });
// // // //   contentContainer.appendChild(filterBar);

// // // //   // 4. Events grid container
// // // //   const content = createElement("div", {
// // // //     id: "events",
// // // //     class: "hvflex",
// // // //   });
// // // //   contentContainer.appendChild(content);

// // // //   // 5. Fetch + sort + render
// // // //   try {
// // // //     allEvents = await fetchEvents();

// // // //     if (!Array.isArray(allEvents) || allEvents.length === 0) {
// // // //       content.appendChild(
// // // //         createElement("p", {}, ["No events available."])
// // // //       );
// // // //       return;
// // // //     }

// // // //     // Sort by date ascending
// // // //     allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

// // // //     // Render filters (only if >1 category)
// // // //     renderEventCategoryFilters(filterBar, allEvents);

// // // //     // Render the cards
// // // //     renderEventCards(content, allEvents);
// // // //   } catch (error) {
// // // //     // In-context error message
// // // //     content.appendChild(
// // // //       createElement("p", { class: "error-text" }, [
// // // //         "Error fetching events. Please try again later.",
// // // //       ])
// // // //     );
// // // //     Snackbar("Unexpected error loading events.", 3000);
// // // //   }
// // // // }

// // // // /**
// // // //  * Build filter buttons based on distinct categories.
// // // //  * @param {HTMLElement} container
// // // //  * @param {Array} events
// // // //  */
// // // // function renderEventCategoryFilters(container, events) {
// // // //   // Clear any previous filter buttons
// // // //   container.innerHTML = "";

// // // //   // Extract unique categories
// // // //   const categories = Array.from(
// // // //     new Set(events.map((e) => e.category).filter(Boolean))
// // // //   );
// // // //   // Always include "All" at the front
// // // //   categories.unshift("All");

// // // //   // If only "All" exists, hide the filter bar
// // // //   if (categories.length < 2) {
// // // //     container.style.display = "none";
// // // //     return;
// // // //   } else {
// // // //     container.style.display = "";
// // // //   }

// // // //   categories.forEach((category) => {
// // // //     // Each button gets its own data-cat attribute
// // // //     const btn = createElement(
// // // //       "button",
// // // //       {
// // // //         "data-cat": category,
// // // //         class: category === activeCategory ? "active" : "",
// // // //       },
// // // //       [category]
// // // //     );

// // // //     btn.addEventListener("click", () => {
// // // //       // Update activeCategory and re-render
// // // //       activeCategory = category;
// // // //       updateEventCards();
// // // //       // Toggle active class on the bar
// // // //       container
// // // //         .querySelectorAll("button")
// // // //         .forEach((b) => b.classList.remove("active"));
// // // //       btn.classList.add("active");
// // // //     });

// // // //     container.appendChild(btn);
// // // //   });
// // // // }

// // // // /**
// // // //  * Render event cards into the given container, filtered by activeCategory.
// // // //  * @param {HTMLElement} container
// // // //  * @param {Array} events
// // // //  */
// // // // function renderEventCards(container, events) {
// // // //   container.innerHTML = ""; // Clear previous cards

// // // //   // Filter by category
// // // //   const filtered =
// // // //     activeCategory === "All"
// // // //       ? events
// // // //       : events.filter((e) => e.category === activeCategory);

// // // //   if (filtered.length === 0) {
// // // //     container.appendChild(
// // // //       createElement("p", {}, [
// // // //         "No events available in this category.",
// // // //       ])
// // // //     );
// // // //     return;
// // // //   }

// // // //   filtered.forEach((event) => {
// // // //     container.appendChild(createEventCard(event));
// // // //   });
// // // // }

// // // // /**
// // // //  * Called when a filter button is clicked; re-renders the cards in-place.
// // // //  */
// // // // function updateEventCards() {
// // // //   const contentDiv = document.getElementById("events");
// // // //   if (!contentDiv) return;
// // // //   renderEventCards(contentDiv, allEvents);
// // // // }

// // // // /**
// // // //  * Creates a single event card.
// // // //  * @param {Object} event
// // // //  * @returns {HTMLElement}
// // // //  */
// // // // function createEventCard(event) {
// // // //   return createElement(
// // // //     "div",
// // // //     { class: "event-card" },
// // // //     [
// // // //       createElement(
// // // //         "a",
// // // //         { href: `/event/${event.eventid}`, class: "event-link" },
// // // //         [
// // // //           createElement("img", {
// // // //             class: "event-img",
// // // //             src: `${SRC_URL}/eventpic/banner/thumb/${event.eventid}.jpg`,
// // // //             alt: `${event.title} Banner`,
// // // //             loading: "lazy",
// // // //             style: "width:100%;aspect-ratio:16/9;object-fit:cover;",
// // // //           }),
// // // //           createElement(
// // // //             "div",
// // // //             { class: "event-info" },
// // // //             [
// // // //               createElement(
// // // //                 "h2",
// // // //                 { class: "event-title" },
// // // //                 [event.title]
// // // //               ),
// // // //               createElement(
// // // //                 "p",
// // // //                 {},
// // // //                 [
// // // //                   createElement("strong", {}, ["Date: "]),
// // // //                   new Date(event.date).toLocaleString(),
// // // //                 ]
// // // //               ),
// // // //               createElement(
// // // //                 "p",
// // // //                 {},
// // // //                 [
// // // //                   createElement("strong", {}, ["Place: "]),
// // // //                   event.placename,
// // // //                 ]
// // // //               ),
// // // //               createElement(
// // // //                 "p",
// // // //                 {},
// // // //                 [
// // // //                   createElement("strong", {}, ["Category: "]),
// // // //                   event.category,
// // // //                 ]
// // // //               ),
// // // //             ]
// // // //           ),
// // // //         ]
// // // //       ),
// // // //     ]
// // // //   );
// // // // }

// // // // export { displayEvents, createEventCard };
