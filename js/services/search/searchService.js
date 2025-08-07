import { SEARCH_URL, SRC_URL } from "../../state/state.js";
import Toast from "../../components/ui/Toast.mjs";

// Function to display search form and tabs
import { createTabs } from "../../components/ui/createTabs.js"; // adjust path
import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { searchSVG } from "../../components/svgs.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

export async function displaySearchForm(container) {
  container.innerHTML = "";

  const d3container = createElement("div", { class: "vflex" });

  const searchContainer = createElement("div", { class: "search-container" });

  // Search Bar
  const searchBar = createElement("div", { class: "d3" });

  const searchInput = createElement("input", {
    id: "search-query",
    placeholder: "Search anything...",
    required: true,
    class: "search-field",
  });

  // const searchButton = Button("Search",{},[]);
  // searchButton.innerHTML = searchSVG ;
  
  const searchButton = document.createElement("button");
  searchButton.id = "search-button";
  searchButton.className = "search-btn";
  searchButton.innerHTML = `
    <svg class="srchicon" viewBox="0 0 24 24" width="100%" height="100%" role="img" stroke="#000000">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>`;
    
  // const searchButton = createElement("button", {
  //   id: "search-button",
  //   class: "search-btn"
  // }, [createElement("svg", {
  //   class: "srchicon",
  //   viewBox: "0 0 24 24",
  //   width: "100%",
  //   height: "100%",
  //   role: "img",
  //   stroke: "#000000"
  // }, [
  //   createElement("circle", { cx: "11", cy: "11", r: "8" }),
  //   createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
  // ])]);

  const autocompleteList = createElement("ul", {
    id: "autocomplete-list",
    class: "autocomplete-list"
  });

  searchBar.appendChild(searchInput);
  searchBar.appendChild(searchButton);
  d3container.appendChild(searchBar);
  d3container.appendChild(autocompleteList);
  searchContainer.appendChild(d3container);

  // Results container reused across tabs
  const resultsContainer = createElement("div", {
    id: "search-results",
    class: "hvflex"
  });

  // Tabs
  const tabs = [
    { title: "All", id: "all", render: () => switchTab("all") },
    { title: "Events", id: "events", render: () => switchTab("events") },
    { title: "Places", id: "places", render: () => switchTab("places") },
    { title: "Social", id: "social", render: () => switchTab("social") },
    { title: "Merch", id: "merch", render: () => switchTab("merch") },
  ];

  const tabsUI = createTabs(tabs, "search-tabs", "all");

  const tabContainer = createElement("div", {
    class: "tabs-container R6-Wf"
  }, [tabsUI]);

  searchContainer.appendChild(tabContainer);
  searchContainer.appendChild(resultsContainer);

  container.appendChild(searchContainer);

  // Wire listeners
  searchButton.addEventListener("click", fetchSearchResults);
  searchInput.addEventListener("input", handleAutocomplete);
  searchInput.addEventListener("keydown", handleKeyboardNavigation);
  document.addEventListener("click", (e) => {
    if (!searchContainer.contains(e.target)) {
      autocompleteList.innerHTML = "";
    }
  });

  // --- Internal switch logic (tab content filtering or re-rendering)
  function switchTab(tabId) {
    // Replace this with real filtering logic later
    resultsContainer.innerHTML = "";
    resultsContainer.appendChild(createElement("p", {}, [`Showing results for: ${tabId}`]));
  }
}


// async function displaySearchForm(container) {
//   const d3container = document.createElement("div");
//   d3container.classList.add("vflex");

//   const searchContainer = document.createElement("div");
//   searchContainer.classList.add("search-container");

//   // Search Input Section
//   const searchBar = document.createElement("div");
//   // searchBar.classList.add("search-bar", "d3");
//   searchBar.classList.add("d3");

//   const searchInput = document.createElement("input");
//   searchInput.id = "search-query";
//   searchInput.className = "search-field";
//   searchInput.placeholder = "Search anything...";
//   searchInput.required = true;

//   const searchButton = document.createElement("button");
//   searchButton.id = "search-button";
//   searchButton.className = "search-btn";
//   searchButton.innerHTML = `
//     <svg class="srchicon" viewBox="0 0 24 24" width="100%" height="100%" role="img" stroke="#000000">
//       <circle cx="11" cy="11" r="8"></circle>
//       <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
//     </svg>`;

//   // Autocomplete dropdown
//   const autocompleteList = document.createElement("ul");
//   autocompleteList.id = "autocomplete-list";
//   autocompleteList.classList.add("autocomplete-list");

//   searchBar.appendChild(searchInput);
//   searchBar.appendChild(searchButton);
//   d3container.appendChild(searchBar);
//   d3container.appendChild(autocompleteList);
//   searchContainer.appendChild(d3container);

//   // Tabs Section
//   const tabContainer = document.createElement("div");
//   tabContainer.classList.add("tabs-container", "R6-Wf");

//   const tabButtonCon = document.createElement("div");
//   tabButtonCon.classList.add("tab-buttons");

//   const tabs = [
//     { title: "All", id: "all" },
//     { title: "Events", id: "events" },
//     { title: "Places", id: "places" },
//     { title: "Social", id: "social" },
//     { title: "Merch", id: "merch" },
//   ];

//   tabs.forEach((tab, index) => {
//     const tabButton = document.createElement("div");
//     tabButton.classList.add("tab-button");
//     tabButton.textContent = tab.title;
//     tabButton.dataset.type = tab.id;

//     if (index === 0) {
//       tabButton.classList.add("active");
//     }

//     tabButton.addEventListener("click", () => switchTab(tab.id));
//     tabButtonCon.appendChild(tabButton);
//   });

//   tabContainer.appendChild(tabButtonCon);
//   searchContainer.appendChild(tabContainer);

//   // Results Section
//   const searchResultsContainer = document.createElement("div");
//   searchResultsContainer.id = "search-results";
//   searchResultsContainer.className = "hvflex";
//   searchContainer.appendChild(searchResultsContainer);

//   container.appendChild(searchContainer);

//   // Event Listeners
//   searchButton.addEventListener("click", fetchSearchResults);
//   searchInput.addEventListener("input", handleAutocomplete);
//   searchInput.addEventListener("keydown", handleKeyboardNavigation);
//   document.addEventListener("click", (e) => {
//     if (!searchContainer.contains(e.target)) {
//       autocompleteList.innerHTML = "";
//     }
//   });
// }


// Function to fetch autocomplete suggestions
async function handleAutocomplete(event) {
  const query = event.target.value.trim();
  const autocompleteList = document.getElementById("autocomplete-list");

  if (query.length < 1) {
    autocompleteList.innerHTML = "";
    return;
  }

  try {
    const response = await fetch(`${SEARCH_URL}/ac?prefix=${encodeURIComponent(query)}`);
    const suggestions = await response.json();

    autocompleteList.innerHTML = "";
    suggestions.forEach((suggestion) => {
      const item = document.createElement("li");
      item.classList.add("autocomplete-item");
      item.textContent = suggestion;
      item.addEventListener("click", () => {
        document.getElementById("search-query").value = suggestion;
        autocompleteList.innerHTML = "";
        fetchSearchResults(); // Perform search immediately
      });
      autocompleteList.appendChild(item);
    });
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
  }
}

// Handle keyboard navigation in autocomplete
function handleKeyboardNavigation(event) {
  const autocompleteList = document.getElementById("autocomplete-list");
  const items = autocompleteList.querySelectorAll(".autocomplete-item");

  if (items.length === 0) return;

  let index = Array.from(items).findIndex((item) => item.classList.contains("selected"));

  if (event.key === "ArrowDown") {
    if (index < items.length - 1) index++;
    else index = 0;
  } else if (event.key === "ArrowUp") {
    if (index > 0) index--;
    else index = items.length - 1;
  } else if (event.key === "Enter") {
    if (index >= 0) {
      items[index].click();
      event.preventDefault();
    }
    return;
  } else {
    return;
  }

  items.forEach((item) => item.classList.remove("selected"));
  items[index].classList.add("selected");
}

// Function to display search section
async function displaySearch(searchsec) {
  const srchsec = document.createElement("div");
  srchsec.id = "srch";
  searchsec.appendChild(srchsec);
  displaySearchForm(srchsec);
}

// Function to handle tab switching
function switchTab(selectedType) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active");
  });
  document.querySelector(`[data-type="${selectedType}"]`).classList.add("active");

  // Re-fetch results if there's an active search query
  if (document.getElementById("search-query").value.trim()) {
    fetchSearchResults();
  }
}

// Generic API fetch function
async function apiFetch(endpoint) {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Failed to fetch data");
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error(`API Fetch Error: ${error}`);
    Toast(`API Fetch Error: ${error}`, "error");
    return [];
  }
}

async function fetchSearchResults() {
  const query = document.getElementById("search-query").value.trim();
  const activeTab = document.querySelector(".tab-button.active").dataset.type;

  if (!query) {
    Toast("Please enter a search query.", "error");
    return;
  }

  try {
    const url = `${SEARCH_URL}/search/${activeTab}?query=${encodeURIComponent(query)}`;
    const results = await apiFetch(url);
    displaySearchResults(activeTab, results);
  } catch (error) {
    Toast("Error fetching search results.", "error");
  }
}

// Helper function to create a result card element
function createCard(entityType, item) {
  const card = document.createElement("div");
  card.classList.add("result-card", entityType);

  // Header (Image + Info)
  const header = document.createElement("div");
  header.classList.add("result-header");

  // Image (if exists)
  let imageSrc = "";
  let altText = "";
  if (entityType === "events") {
    // imageSrc = `${SRC_URL}/eventpic/thumb/${item.eventid}.jpg`;
    imageSrc = resolveImagePath(EntityType.EVENT, PictureType.THUMB, `${item.eventid}.jpg`);
    altText = item.title || "Event";
  } else if (entityType === "places") {
    // imageSrc = `${SRC_URL}/placepic/thumb/${item.placeid}.jpg`;
    imageSrc = resolveImagePath(EntityType.PLACE, PictureType.THUMB, `${item.placeid}.jpg`);
    altText = item.name || "Place";
  }
  if (imageSrc) {
    const image = document.createElement("img");
    image.src = imageSrc;
    image.loading = "lazy";
    image.alt = altText;
    image.classList.add("result-image");
    header.appendChild(image);
  }

  // Info section
  const info = document.createElement("div");
  info.classList.add("result-info");
  if (entityType === "events") {
    const title = document.createElement("h3");
    title.textContent = item.title || "No Title";
    info.appendChild(title);
  } else if (entityType === "places") {
    const name = document.createElement("h3");
    name.textContent = item.name || "No Name";
    info.appendChild(name);
  }
  if (item.category) {
    const category = document.createElement("p");
    category.classList.add("category");
    category.textContent = `🏷️ ${item.category}`;
    info.appendChild(category);
  }
  header.appendChild(info);
  card.appendChild(header);

  // Details section
  const details = document.createElement("div");
  details.classList.add("result-details");
  if (entityType === "events") {
    details.innerHTML = `
      <strong>Location:</strong> ${item.location || "N/A"} 
      <br>
      <strong>Date:</strong> ${item.date ? new Date(item.date).toLocaleString() : "N/A"} 
      <br>
      <em>${item.description || "No description available."}</em>
    `;
  } else if (entityType === "places") {
    details.innerHTML = `
      <strong>Address:</strong> ${item.address || "N/A"} 
      <br>
      <strong>Rating:</strong> ${item.rating || "Not Rated"} 
      <br>
      <em>Description: ${item.description || "No description available."}</em>
    `;
  }
  card.appendChild(details);

  // Footer (Buttons)
  const footer = document.createElement("div");
  footer.classList.add("result-footer");
  if (entityType === "events" && item.eventid) {
    const cta = document.createElement("a");
    cta.href = `/event/${item.eventid}`;
    cta.textContent = "View Details";
    cta.classList.add("btn");
    cta.target = "_blank";
    footer.appendChild(cta);
  } else if (entityType === "places" && item.placeid) {
    const cta = document.createElement("a");
    cta.href = `/place/${item.placeid}`;
    cta.textContent = "View on Map";
    cta.classList.add("btn");
    cta.target = "_blank";
    footer.appendChild(cta);
  }
  if (footer.children.length > 0) {
    card.appendChild(footer);
  }
  return card;
}

// Function to display search results
function displaySearchResults(entityType, data) {
  const searchResultsContainer = document.getElementById("search-results");
  searchResultsContainer.innerHTML = ""; // Clear previous results

  // Handle the "all" tab, which returns an object with both events and places
  if (entityType === "all" && typeof data === "object" && !Array.isArray(data)) {
    // Display events if available
    if (data.events && data.events.length > 0) {
      const eventsHeader = document.createElement("h2");
      eventsHeader.textContent = "Events";
      searchResultsContainer.appendChild(eventsHeader);
      data.events.forEach((item) => {
        const card = createCard("events", item);
        searchResultsContainer.appendChild(card);
      });
    }

    // Display places if available
    if (data.places && data.places.length > 0) {
      const placesHeader = document.createElement("h2");
      placesHeader.textContent = "Places";
      searchResultsContainer.appendChild(placesHeader);
      data.places.forEach((item) => {
        const card = createCard("places", item);
        searchResultsContainer.appendChild(card);
      });
    }

    // If neither events nor places have results, show a message
    if (
      (!data.events || data.events.length === 0) &&
      (!data.places || data.places.length === 0)
    ) {
      searchResultsContainer.innerHTML = "<p>No results found.</p>";
    }
  }
  // Otherwise, assume data is an array (for "events" or "places" tabs)
  else if (Array.isArray(data)) {
    if (data.length === 0) {
      searchResultsContainer.innerHTML = "<p>No results found.</p>";
      return;
    }
    data.forEach((item) => {
      const card = createCard(entityType, item);
      searchResultsContainer.appendChild(card);
    });
  } else {
    searchResultsContainer.innerHTML = "<p>No results found.</p>";
  }
}

export { displaySearch };
