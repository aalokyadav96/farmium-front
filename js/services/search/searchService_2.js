import { SEARCH_URL, SRC_URL } from "../../state/state.js";
import Toast from "../../components/ui/Toast.mjs";
import { createTabs } from "../../components/ui/createTabs.js";
import { createElement } from "../../components/createElement.js";

export async function displaySearchForm(container) {
  while (container.firstChild) container.removeChild(container.firstChild);

  const d3container = createElement("div", { class: "vflex" });
  const searchContainer = createElement("div", { class: "search-container" });

  const searchBar = createElement("div", { class: "d3" });
  const searchInput = createElement("input", {
    id: "search-query",
    placeholder: "Search anything...",
    required: true,
    class: "search-field"
  });

  const searchButton = createElement("button", {
    id: "search-button",
    class: "search-btn"
  }, [
    createElement("svg", {
      class: "srchicon",
      viewBox: "0 0 24 24",
      width: "100%",
      height: "100%",
      role: "img",
      stroke: "#ffffff"
    }, [
      createElement("circle", { cx: "11", cy: "11", r: "8" }),
      createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
    ])
  ]);

  const autocompleteList = createElement("ul", {
    id: "autocomplete-list",
    class: "autocomplete-list"
  });

  searchBar.appendChild(searchInput);
  searchBar.appendChild(searchButton);
  d3container.appendChild(searchBar);
  d3container.appendChild(autocompleteList);
  searchContainer.appendChild(d3container);

  const resultsContainer = createElement("div", {
    id: "search-results",
    class: "hvflex"
  });

  const tabs = [
    { title: "All", id: "all", render: () => switchTab("all") },
    { title: "Events", id: "events", render: () => switchTab("events") },
    { title: "Places", id: "places", render: () => switchTab("places") },
    { title: "Social", id: "social", render: () => switchTab("social") },
    { title: "Merch", id: "merch", render: () => switchTab("merch") }
  ];

  const tabsUI = createTabs(tabs, "search-tabs", "all");
  const tabContainer = createElement("div", {
    class: "tabs-container R6-Wf"
  }, [tabsUI]);

  searchContainer.appendChild(tabContainer);
  searchContainer.appendChild(resultsContainer);
  container.appendChild(searchContainer);

  // Listeners
  searchButton.addEventListener("click", fetchSearchResults);
  searchInput.addEventListener("input", handleAutocomplete);
  searchInput.addEventListener("keydown", handleKeyboardNavigation);
  document.addEventListener("click", (e) => {
    if (!searchContainer.contains(e.target)) {
      while (autocompleteList.firstChild) autocompleteList.removeChild(autocompleteList.firstChild);
    }
  });
}

async function handleAutocomplete(event) {
  const query = event.target.value.trim();
  const list = document.getElementById("autocomplete-list");
  while (list.firstChild) list.removeChild(list.firstChild);

  if (query.length < 1) return;

  try {
    const response = await fetch(`${SEARCH_URL}/ac?prefix=${encodeURIComponent(query)}`);
    const suggestions = await response.json();

    suggestions.forEach(suggestion => {
      const item = createElement("li", {
        class: "autocomplete-item"
      }, [suggestion]);

      item.addEventListener("click", () => {
        document.getElementById("search-query").value = suggestion;
        while (list.firstChild) list.removeChild(list.firstChild);
        fetchSearchResults();
      });

      list.appendChild(item);
    });
  } catch (error) {
    console.error("Autocomplete error:", error);
  }
}

function handleKeyboardNavigation(event) {
  const list = document.getElementById("autocomplete-list");
  const items = Array.from(list.querySelectorAll(".autocomplete-item"));
  if (!items.length) return;

  let index = items.findIndex(i => i.classList.contains("selected"));

  if (event.key === "ArrowDown") index = (index + 1) % items.length;
  else if (event.key === "ArrowUp") index = (index - 1 + items.length) % items.length;
  else if (event.key === "Enter") {
    if (index >= 0) {
      items[index].click();
      event.preventDefault();
    }
    return;
  } else return;

  items.forEach(i => i.classList.remove("selected"));
  items[index].classList.add("selected");
}

function switchTab(type) {
  document.querySelectorAll(".tab-button").forEach(btn => {
    btn.classList.remove("active");
  });

  const active = document.querySelector(`[data-type="${type}"]`);
  if (active) active.classList.add("active");

  const input = document.getElementById("search-query");
  if (input && input.value.trim()) {
    fetchSearchResults();
  }
}


async function fetchSearchResults() {
  const query = document.getElementById("search-query").value.trim();
  const tab = document.querySelector(".tab-button.active").dataset.type;

  if (!query) {
    Toast("Please enter a search query.", "error");
    return;
  }

  try {
    const url = `${SEARCH_URL}/search/${tab}?query=${encodeURIComponent(query)}`;
    const data = await apiFetch(url);
    displaySearchResults(tab, data);
  } catch (err) {
    Toast("Search failed", "error");
  }
}

function createCard(type, item) {
  const card = createElement("div", { class: `result-card ${type}` });

  const header = createElement("div", { class: "result-header" });

  const infoChildren = [];
  let imageSrc = "", alt = "";

  if (type === "events") {
    imageSrc = `${SRC_URL}/eventpic/thumb/${item.eventid}.jpg`;
    alt = item.title || "Event";
    infoChildren.push(createElement("h3", {}, [item.title || "No Title"]));
  } else if (type === "places") {
    imageSrc = `${SRC_URL}/placepic/thumb/${item.placeid}.jpg`;
    alt = item.name || "Place";
    infoChildren.push(createElement("h3", {}, [item.name || "No Name"]));
  }

  if (item.category) {
    infoChildren.push(createElement("p", { class: "category" }, [`🏷️ ${item.category}`]));
  }

  if (imageSrc) {
    const image = createElement("img", {
      src: imageSrc,
      alt: alt,
      loading: "lazy",
      class: "result-image"
    });
    header.appendChild(image);
  }

  header.appendChild(createElement("div", { class: "result-info" }, infoChildren));
  card.appendChild(header);

  const detailChildren = [];

  if (type === "events") {
    detailChildren.push(
      createElement("p", {}, [`Location: ${item.location || "N/A"}`]),
      createElement("p", {}, [`Date: ${item.date ? new Date(item.date).toLocaleString() : "N/A"}`]),
      createElement("em", {}, [item.description || "No description available."])
    );
  } else if (type === "places") {
    detailChildren.push(
      createElement("p", {}, [`Address: ${item.address || "N/A"}`]),
      createElement("p", {}, [`Rating: ${item.rating || "Not Rated"}`]),
      createElement("em", {}, [`Description: ${item.description || "No description available."}`])
    );
  }

  card.appendChild(createElement("div", { class: "result-details" }, detailChildren));

  const footerButtons = [];
  if (type === "events" && item.eventid) {
    footerButtons.push(createElement("a", {
      href: `/event/${item.eventid}`,
      target: "_blank",
      class: "btn"
    }, ["View Details"]));
  } else if (type === "places" && item.placeid) {
    footerButtons.push(createElement("a", {
      href: `/place/${item.placeid}`,
      target: "_blank",
      class: "btn"
    }, ["View on Map"]));
  }

  if (footerButtons.length > 0) {
    card.appendChild(createElement("div", { class: "result-footer" }, footerButtons));
  }

  return card;
}

function displaySearchResults(type, data) {
  const container = document.getElementById("search-results");
  while (container.firstChild) container.removeChild(container.firstChild);

  if (type === "all" && typeof data === "object" && !Array.isArray(data)) {
    if (data.events && data.events.length > 0) {
      container.appendChild(createElement("h2", {}, ["Events"]));
      data.events.forEach(item => container.appendChild(createCard("events", item)));
    }

    if (data.places && data.places.length > 0) {
      container.appendChild(createElement("h2", {}, ["Places"]));
      data.places.forEach(item => container.appendChild(createCard("places", item)));
    }

    if ((!data.events || data.events.length === 0) && (!data.places || data.places.length === 0)) {
      container.appendChild(createElement("p", {}, ["No results found."]));
    }
  } else if (Array.isArray(data)) {
    if (data.length === 0) {
      container.appendChild(createElement("p", {}, ["No results found."]));
    } else {
      data.forEach(item => container.appendChild(createCard(type, item)));
    }
  } else {
    container.appendChild(createElement("p", {}, ["No results found."]));
  }
}

async function displaySearch(container) {
  const sec = createElement("div", { id: "srch" });
  container.appendChild(sec);
  displaySearchForm(sec);
}

async function apiFetch(endpoint, method = "GET", body = null, options = {}) {
  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      body: body ? JSON.stringify(body) : null,
      ...options
    });
    if (!res.ok) throw new Error(res.statusText);
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch (err) {
    console.error("API Error:", err);
    Toast(`API Error: ${err}`, "error");
    return [];
  }
}

export { displaySearch };

// // import { SEARCH_URL, SRC_URL } from "../../state/state.js";
// // import Toast from "../../components/ui/Toast.mjs";
// // // import { createTabs } from "../../components/ui/createTabs.js";
// // import { createElement } from "../../components/createElement.js";
// // import { apiFetch } from "../../api/api.js";
// // import { persistTabs } from "../../utils/persistTabs.js";

// // export async function displaySearch(container, isLoggedIn) {
// //   const srchsec = createElement("div", { id: "srch" }, []);
// //   container.appendChild(srchsec);
// //   displaySearchForm(srchsec);
// // }

// // function displaySearchForm(container) {
// //   container.innerHTML = "";

// //   const d3container = createElement("div", { class: "vflex" });
// //   const searchContainer = createElement("div", { class: "search-container" });

// //   const searchBar = createElement("div", { class: "d3" });

// //   const searchInput = createElement("input", {
// //     id: "search-query",
// //     placeholder: "Search anything...",
// //     required: true,
// //     class: "search-field"
// //   });

// //   const searchButton = createElement("button", {
// //     id: "search-button",
// //     class: "search-btn"
// //   }, [
// //     createElement("svg", {
// //       class: "srchicon",
// //       viewBox: "0 0 24 24",
// //       width: "100%",
// //       height: "100%",
// //       role: "img",
// //       stroke: "#000000",
// //       "aria-label": "Search"
// //     }, [
// //       createElement("circle", { cx: "11", cy: "11", r: "8" }),
// //       createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
// //     ])
// //   ]);

// //   const autocompleteList = createElement("ul", {
// //     id: "autocomplete-list",
// //     class: "autocomplete-list"
// //   });

// //   searchBar.appendChild(searchInput);
// //   searchBar.appendChild(searchButton);
// //   d3container.appendChild(searchBar);
// //   d3container.appendChild(autocompleteList);
// //   searchContainer.appendChild(d3container);

// //   const resultsContainer = createElement("div", {
// //     id: "search-results",
// //     class: "hvflex"
// //   });

// //   const tabs = [
// //     { title: "All", id: "all", render: () => switchTab("all") },
// //     { title: "Events", id: "events", render: () => switchTab("events") },
// //     { title: "Places", id: "places", render: () => switchTab("places") },
// //     { title: "Social", id: "social", render: () => switchTab("social") },
// //     { title: "Merch", id: "merch", render: () => switchTab("merch") },
// //   ];

// //   const tabContainer = createElement("div", { class: "tabs-container R6-Wf" }, []);
// //   persistTabs(tabContainer, tabs, "srchtabs");

// //   // const tabsUI = createTabs(tabs, "search-tabs", "all");
// //   // const tabContainer = createElement("div", { class: "tabs-container R6-Wf" }, [tabsUI]);

// //   searchContainer.appendChild(tabContainer);
// //   searchContainer.appendChild(resultsContainer);
// //   container.appendChild(searchContainer);

// //   searchButton.addEventListener("click", fetchSearchResults);

// //   // Debounced input listener
// //   let debounceTimeout;
// //   searchInput.addEventListener("input", (e) => {
// //     clearTimeout(debounceTimeout);
// //     debounceTimeout = setTimeout(() => handleAutocomplete(e), 200);
// //   });

// //   searchInput.addEventListener("keydown", handleKeyboardNavigation);

// //   document.addEventListener("click", (e) => {
// //     if (!searchContainer.contains(e.target)) {
// //       autocompleteList.innerHTML = "";
// //     }
// //   });
// // }

// // function switchTab(selectedType) {
// //   document.querySelectorAll(".tab-button").forEach((button) => {
// //     button.classList.remove("active");
// //   });

// //   const active = document.querySelector(`[data-type="${selectedType}"]`);
// //   if (active) active.classList.add("active");

// //   const resultsContainer = document.getElementById("search-results");
// //   resultsContainer.innerHTML = "";
// //   resultsContainer.appendChild(
// //     createElement("p", {}, [`Showing results for: ${selectedType}`])
// //   );

// //   const query = document.getElementById("search-query").value.trim();
// //   if (query) {
// //     fetchSearchResults();
// //   }
// // }

// // async function handleAutocomplete(event) {
// //   const query = event.target.value.trim();
// //   const autocompleteList = document.getElementById("autocomplete-list");

// //   if (query.length < 1) {
// //     autocompleteList.innerHTML = "";
// //     return;
// //   }

// //   try {
// //     const response = await fetch(`${SEARCH_URL}/ac?prefix=${encodeURIComponent(query)}`);
// //     const suggestions = await response.json();

// //     autocompleteList.innerHTML = "";
// //     suggestions.forEach((suggestion) => {
// //       const item = createElement("li", { class: "autocomplete-item" }, [suggestion]);

// //       // Use mousedown instead of click to avoid blur cancel
// //       item.addEventListener("mousedown", () => {
// //         document.getElementById("search-query").value = suggestion;
// //         autocompleteList.innerHTML = "";
// //         fetchSearchResults();
// //       });

// //       autocompleteList.appendChild(item);
// //     });
// //   } catch (error) {
// //     console.error("Error fetching autocomplete suggestions:", error);
// //   }
// // }

// // function handleKeyboardNavigation(event) {
// //   const autocompleteList = document.getElementById("autocomplete-list");
// //   const items = autocompleteList.querySelectorAll(".autocomplete-item");
// //   if (items.length === 0) return;

// //   let index = Array.from(items).findIndex((item) => item.classList.contains("selected"));

// //   if (event.key === "ArrowDown") {
// //     index = (index + 1) % items.length;
// //   } else if (event.key === "ArrowUp") {
// //     index = (index - 1 + items.length) % items.length;
// //   } else if (event.key === "Enter" && index >= 0) {
// //     items[index].dispatchEvent(new MouseEvent("mousedown"));
// //     event.preventDefault();
// //     return;
// //   } else {
// //     return;
// //   }

// //   items.forEach((item) => item.classList.remove("selected"));
// //   items[index].classList.add("selected");
// // }

// // async function fetchSearchResults() {
// //   const query = document.getElementById("search-query").value.trim();
// //   const activeTab = document.querySelector(".tab-button.active").dataset.type;

// //   if (!query) {
// //     Toast("Please enter a search query.", "error");
// //     return;
// //   }

// //   try {
// //     const url = `${SEARCH_URL}/search/${activeTab}?query=${encodeURIComponent(query)}`;
// //     const results = await apiFetch(url);
// //     displaySearchResults(activeTab, results);
// //   } catch (error) {
// //     console.error("Error fetching search results:", error);
// //     Toast("Error fetching search results.", "error");
// //   }
// // }

// // function createCard(entityType, item) {
// //   const card = createElement("div", { class: `result-card ${entityType}` });
// //   const header = createElement("div", { class: "result-header" });
// //   let imageSrc = "", altText = "";

// //   if (entityType === "events") {
// //     imageSrc = `${SRC_URL}/eventpic/thumb/${item.eventid}.jpg`;
// //     altText = item.title || "Event";
// //   } else if (entityType === "places") {
// //     imageSrc = `${SRC_URL}/placepic/thumb/${item.placeid}.jpg`;
// //     altText = item.name || "Place";
// //   }

// //   if (imageSrc) {
// //     const image = createElement("img", {
// //       src: imageSrc,
// //       loading: "lazy",
// //       alt: altText,
// //       class: "result-image"
// //     });
// //     header.appendChild(image);
// //   }

// //   const info = createElement("div", { class: "result-info" });

// //   if (entityType === "events") {
// //     info.appendChild(createElement("h3", {}, [item.title || "No Title"]));
// //   } else if (entityType === "places") {
// //     info.appendChild(createElement("h3", {}, [item.name || "No Name"]));
// //   }

// //   if (item.category) {
// //     info.appendChild(createElement("p", { class: "category" }, [`🏷️ ${item.category}`]));
// //   }

// //   header.appendChild(info);
// //   card.appendChild(header);

// //   const details = createElement("div", { class: "result-details" });

// //   if (entityType === "events") {
// //     details.appendChild(createElement("p", {}, [
// //       `Location: ${item.location || "N/A"}`,
// //       createElement("br"),
// //       `Date: ${item.date ? new Date(item.date).toLocaleString() : "N/A"}`,
// //       createElement("br"),
// //       createElement("em", {}, [item.description || "No description available."])
// //     ]));
// //   } else if (entityType === "places") {
// //     details.appendChild(createElement("p", {}, [
// //       `Address: ${item.address || "N/A"}`,
// //       createElement("br"),
// //       `Rating: ${item.rating || "Not Rated"}`,
// //       createElement("br"),
// //       createElement("em", {}, [`Description: ${item.description || "No description available."}`])
// //     ]));
// //   } else {
// //     details.appendChild(createElement("p", {}, ["No detailed view implemented."]));
// //   }

// //   card.appendChild(details);

// //   const footer = createElement("div", { class: "result-footer" });

// //   if (entityType === "events" && item.eventid) {
// //     footer.appendChild(createElement("a", {
// //       href: `/event/${item.eventid}`,
// //       class: "btn",
// //       target: "_blank"
// //     }, ["View Details"]));
// //   } else if (entityType === "places" && item.placeid) {
// //     footer.appendChild(createElement("a", {
// //       href: `/place/${item.placeid}`,
// //       class: "btn",
// //       target: "_blank"
// //     }, ["View on Map"]));
// //   }

// //   if (footer.children.length > 0) {
// //     card.appendChild(footer);
// //   }

// //   return card;
// // }

// // function displaySearchResults(entityType, data) {
// //   const container = document.getElementById("search-results");
// //   container.innerHTML = "";

// //   if (entityType === "all" && typeof data === "object" && !Array.isArray(data)) {
// //     const { events = [], places = [] } = data;

// //     if (events.length > 0) {
// //       container.appendChild(createElement("h2", {}, ["Events"]));
// //       events.forEach(item => container.appendChild(createCard("events", item)));
// //     }

// //     if (places.length > 0) {
// //       container.appendChild(createElement("h2", {}, ["Places"]));
// //       places.forEach(item => container.appendChild(createCard("places", item)));
// //     }

// //     if (events.length === 0 && places.length === 0) {
// //       container.appendChild(createElement("p", {}, ["No results found."]));
// //     }
// //   } else if (Array.isArray(data)) {
// //     if (data.length === 0) {
// //       container.appendChild(createElement("p", {}, ["No results found."]));
// //       return;
// //     }
// //     data.forEach(item => container.appendChild(createCard(entityType, item)));
// //   } else {
// //     container.appendChild(createElement("p", {}, ["No results found."]));
// //   }
// // }

// import { SEARCH_URL, SRC_URL } from "../../state/state.js";
// import Toast from "../../components/ui/Toast.mjs";

// // Function to display search form and tabs
// import { createTabs } from "../../components/ui/createTabs.js"; // adjust path
// import { createElement } from "../../components/createElement.js";

// export async function displaySearchForm(container) {
//   container.innerHTML = "";

//   const d3container = createElement("div", { class: "vflex" });

//   const searchContainer = createElement("div", { class: "search-container" });

//   // Search Bar
//   const searchBar = createElement("div", { class: "d3" });

//   const searchInput = createElement("input", {
//     id: "search-query",
//     placeholder: "Search anything...",
//     required: true,
//     class: "search-field",
//   });

//   const searchButton = createElement("button", {
//     id: "search-button",
//     class: "search-btn"
//   }, [createElement("svg", {
//     class: "srchicon",
//     viewBox: "0 0 24 24",
//     width: "100%",
//     height: "100%",
//     role: "img",
//     stroke: "#000000"
//   }, [
//     createElement("circle", { cx: "11", cy: "11", r: "8" }),
//     createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
//   ])]);

//   const autocompleteList = createElement("ul", {
//     id: "autocomplete-list",
//     class: "autocomplete-list"
//   });

//   searchBar.appendChild(searchInput);
//   searchBar.appendChild(searchButton);
//   d3container.appendChild(searchBar);
//   d3container.appendChild(autocompleteList);
//   searchContainer.appendChild(d3container);

//   // Results container reused across tabs
//   const resultsContainer = createElement("div", {
//     id: "search-results",
//     class: "hvflex"
//   });

//   // Tabs
//   const tabs = [
//     { title: "All", id: "all", render: () => switchTab("all") },
//     { title: "Events", id: "events", render: () => switchTab("events") },
//     { title: "Places", id: "places", render: () => switchTab("places") },
//     { title: "Social", id: "social", render: () => switchTab("social") },
//     { title: "Merch", id: "merch", render: () => switchTab("merch") },
//   ];

//   const tabsUI = createTabs(tabs, "search-tabs", "all");

//   const tabContainer = createElement("div", {
//     class: "tabs-container R6-Wf"
//   }, [tabsUI]);

//   searchContainer.appendChild(tabContainer);
//   searchContainer.appendChild(resultsContainer);

//   container.appendChild(searchContainer);

//   // Wire listeners
//   searchButton.addEventListener("click", fetchSearchResults);
//   searchInput.addEventListener("input", handleAutocomplete);
//   searchInput.addEventListener("keydown", handleKeyboardNavigation);
//   document.addEventListener("click", (e) => {
//     if (!searchContainer.contains(e.target)) {
//       autocompleteList.innerHTML = "";
//     }
//   });

//   // --- Internal switch logic (tab content filtering or re-rendering)
//   // function switchTab(tabId) {
//   //   // Replace this with real filtering logic later
//   //   resultsContainer.innerHTML = "";
//   //   resultsContainer.appendChild(createElement("p", {}, [`Showing results for: ${tabId}`]));
//   // }
// }


// // Function to fetch autocomplete suggestions
// async function handleAutocomplete(event) {
//   const query = event.target.value.trim();
//   const autocompleteList = document.getElementById("autocomplete-list");

//   if (query.length < 1) {
//     autocompleteList.innerHTML = "";
//     return;
//   }

//   try {
//     const response = await fetch(`${SEARCH_URL}/ac?prefix=${encodeURIComponent(query)}`);
//     const suggestions = await response.json();

//     autocompleteList.innerHTML = "";
//     suggestions.forEach((suggestion) => {
//       const item = document.createElement("li");
//       item.classList.add("autocomplete-item");
//       item.textContent = suggestion;
//       item.addEventListener("click", () => {
//         document.getElementById("search-query").value = suggestion;
//         autocompleteList.innerHTML = "";
//         fetchSearchResults(); // Perform search immediately
//       });
//       autocompleteList.appendChild(item);
//     });
//   } catch (error) {
//     console.error("Error fetching autocomplete suggestions:", error);
//   }
// }

// // Handle keyboard navigation in autocomplete
// function handleKeyboardNavigation(event) {
//   const autocompleteList = document.getElementById("autocomplete-list");
//   const items = autocompleteList.querySelectorAll(".autocomplete-item");

//   if (items.length === 0) return;

//   let index = Array.from(items).findIndex((item) => item.classList.contains("selected"));

//   if (event.key === "ArrowDown") {
//     if (index < items.length - 1) index++;
//     else index = 0;
//   } else if (event.key === "ArrowUp") {
//     if (index > 0) index--;
//     else index = items.length - 1;
//   } else if (event.key === "Enter") {
//     if (index >= 0) {
//       items[index].click();
//       event.preventDefault();
//     }
//     return;
//   } else {
//     return;
//   }

//   items.forEach((item) => item.classList.remove("selected"));
//   items[index].classList.add("selected");
// }

// // Function to display search section
// async function displaySearch(searchsec) {
//   const srchsec = document.createElement("div");
//   srchsec.id = "srch";
//   searchsec.appendChild(srchsec);
//   displaySearchForm(srchsec);
// }

// // Function to handle tab switching
// function switchTab(selectedType) {
//   document.querySelectorAll(".tab-button").forEach((button) => {
//     button.classList.remove("active");
//   });
//   document.querySelector(`[data-type="${selectedType}"]`).classList.add("active");

//   // Re-fetch results if there's an active search query
//   if (document.getElementById("search-query").value.trim()) {
//     fetchSearchResults();
//   }
// }

// // Generic API fetch function
// async function apiFetch(endpoint) {
//   try {
//     const response = await fetch(endpoint);
//     if (!response.ok) throw new Error("Failed to fetch data");
//     const text = await response.text();
//     return text ? JSON.parse(text) : [];
//   } catch (error) {
//     console.error(`API Fetch Error: ${error}`);
//     Toast(`API Fetch Error: ${error}`, "error");
//     return [];
//   }
// }

// async function fetchSearchResults() {
//   const query = document.getElementById("search-query").value.trim();
//   const activeTab = document.querySelector(".tab-button.active").dataset.type;

//   if (!query) {
//     Toast("Please enter a search query.", "error");
//     return;
//   }

//   try {
//     const url = `${SEARCH_URL}/search/${activeTab}?query=${encodeURIComponent(query)}`;
//     const results = await apiFetch(url);
//     displaySearchResults(activeTab, results);
//   } catch (error) {
//     Toast("Error fetching search results.", "error");
//   }
// }

// // Helper function to create a result card element
// function createCard(entityType, item) {
//   const card = document.createElement("div");
//   card.classList.add("result-card", entityType);

//   // Header (Image + Info)
//   const header = document.createElement("div");
//   header.classList.add("result-header");

//   // Image (if exists)
//   let imageSrc = "";
//   let altText = "";
//   if (entityType === "events") {
//     imageSrc = `${SRC_URL}/eventpic/thumb/${item.eventid}.jpg`;
//     altText = item.title || "Event";
//   } else if (entityType === "places") {
//     imageSrc = `${SRC_URL}/placepic/thumb/${item.placeid}.jpg`;
//     altText = item.name || "Place";
//   }
//   if (imageSrc) {
//     const image = document.createElement("img");
//     image.src = imageSrc;
//     image.loading = "lazy";
//     image.alt = altText;
//     image.classList.add("result-image");
//     header.appendChild(image);
//   }

//   // Info section
//   const info = document.createElement("div");
//   info.classList.add("result-info");
//   if (entityType === "events") {
//     const title = document.createElement("h3");
//     title.textContent = item.title || "No Title";
//     info.appendChild(title);
//   } else if (entityType === "places") {
//     const name = document.createElement("h3");
//     name.textContent = item.name || "No Name";
//     info.appendChild(name);
//   }
//   if (item.category) {
//     const category = document.createElement("p");
//     category.classList.add("category");
//     category.textContent = `🏷️ ${item.category}`;
//     info.appendChild(category);
//   }
//   header.appendChild(info);
//   card.appendChild(header);

//   // Details section
//   const details = document.createElement("div");
//   details.classList.add("result-details");
//   if (entityType === "events") {
//     details.innerHTML = `
//       <strong>Location:</strong> ${item.location || "N/A"}
//       <br>
//       <strong>Date:</strong> ${item.date ? new Date(item.date).toLocaleString() : "N/A"}
//       <br>
//       <em>${item.description || "No description available."}</em>
//     `;
//   } else if (entityType === "places") {
//     details.innerHTML = `
//       <strong>Address:</strong> ${item.address || "N/A"}
//       <br>
//       <strong>Rating:</strong> ${item.rating || "Not Rated"}
//       <br>
//       <em>Description: ${item.description || "No description available."}</em>
//     `;
//   }
//   card.appendChild(details);

//   // Footer (Buttons)
//   const footer = document.createElement("div");
//   footer.classList.add("result-footer");
//   if (entityType === "events" && item.eventid) {
//     const cta = document.createElement("a");
//     cta.href = `/event/${item.eventid}`;
//     cta.textContent = "View Details";
//     cta.classList.add("btn");
//     cta.target = "_blank";
//     footer.appendChild(cta);
//   } else if (entityType === "places" && item.placeid) {
//     const cta = document.createElement("a");
//     cta.href = `/place/${item.placeid}`;
//     cta.textContent = "View on Map";
//     cta.classList.add("btn");
//     cta.target = "_blank";
//     footer.appendChild(cta);
//   }
//   if (footer.children.length > 0) {
//     card.appendChild(footer);
//   }
//   return card;
// }

// // Function to display search results
// function displaySearchResults(entityType, data) {
//   const searchResultsContainer = document.getElementById("search-results");
//   searchResultsContainer.innerHTML = ""; // Clear previous results

//   // Handle the "all" tab, which returns an object with both events and places
//   if (entityType === "all" && typeof data === "object" && !Array.isArray(data)) {
//     // Display events if available
//     if (data.events && data.events.length > 0) {
//       const eventsHeader = document.createElement("h2");
//       eventsHeader.textContent = "Events";
//       searchResultsContainer.appendChild(eventsHeader);
//       data.events.forEach((item) => {
//         const card = createCard("events", item);
//         searchResultsContainer.appendChild(card);
//       });
//     }

//     // Display places if available
//     if (data.places && data.places.length > 0) {
//       const placesHeader = document.createElement("h2");
//       placesHeader.textContent = "Places";
//       searchResultsContainer.appendChild(placesHeader);
//       data.places.forEach((item) => {
//         const card = createCard("places", item);
//         searchResultsContainer.appendChild(card);
//       });
//     }

//     // If neither events nor places have results, show a message
//     if (
//       (!data.events || data.events.length === 0) &&
//       (!data.places || data.places.length === 0)
//     ) {
//       const noResults = createElement("p", {}, ["No results found."]);
// searchResultsContainer.appendChild(noResults);

//     }
//   }
//   // Otherwise, assume data is an array (for "events" or "places" tabs)
//   else if (Array.isArray(data)) {
//     if (data.length === 0) {
//       const noResults = createElement("p", {}, ["No results found."]);
// searchResultsContainer.appendChild(noResults);

//       return;
//     }
//     data.forEach((item) => {
//       const card = createCard(entityType, item);
//       searchResultsContainer.appendChild(card);
//     });
//   } else {
//     const noResults = createElement("p", {}, ["No results found."]);
// searchResultsContainer.appendChild(noResults);

//   }
// }

// export { displaySearch };
