import Button from "../../../components/base/Button.js";
import { createElement } from "../../../components/createElement.js";
import { apiFetch } from "../../../api/api.js";
import {
  renderFarmCards,
  renderFeaturedFarm,
  renderWeatherWidget,
  renderFarmStats,
} from "./farmListHelpers.js";

// Config
const PAGE_SIZE = 10;

// State
const state = {
  farms: [],
  page: 1,
  isLoading: false,
  favorites: new Set(JSON.parse(localStorage.getItem("favFarms") || "[]")),
};

let currentSidebar, isLoggedIn;

// Fetch farms
async function fetchFarms(page) {
  const res = await apiFetch(`/farms?page=${page}&limit=${PAGE_SIZE}`);
  return res?.farms || [];
}

// Grid
function Grid() {
  const container = createElement("div", { class: "farm__grid" });

  return {
    container,
    render(farms) {
      container.innerHTML = "";
      if (!farms.length) {
        container.appendChild(createElement("p", {}, ["No farms found."]));
      } else {
        renderFarmCards(farms, container, isLoggedIn, toggleFavorite);
      }
    }
  };
}

// Sidebar
function Sidebar() {
  const container = createElement("div", { class: "farm__sidebar" });

  return {
    container,
    render(allFarms) {
      container.innerHTML = "";
      renderWeatherWidget(container);
      renderFeaturedFarm(container, allFarms[0]);
      renderFarmStats(container, allFarms);
      renderFavorites(container);
      renderMap(container);
      renderRatings(container, allFarms);
    }
  };
}

function renderFavorites(container) {
  if (!isLoggedIn) return;

  const section = createElement("section", { class: "farm__favorites" }, [
    createElement("h3", {}, ["Favorites"]),
  ]);

  if (state.favorites.size === 0) {
    section.appendChild(createElement("p", {}, ["None yet. Click ❤ on a card."]));
  } else {
    const list = createElement("ul");
    state.favorites.forEach(id => {
      const farm = state.farms.find(f => f.id === id);
      if (farm) list.appendChild(createElement("li", {}, [farm.name]));
    });
    section.appendChild(list);
  }

  container.appendChild(section);
}

function renderMap(container) {
  const section = createElement("section", { class: "farm__map" }, [
    createElement("h3", {}, ["Farm Map"]),
    createElement("div", { class: "farm__map-placeholder" }, ["Map integration point"])
  ]);
  container.appendChild(section);
}

function renderRatings(container, farms) {
  const section = createElement("section", { class: "farm__ratings" }, [
    createElement("h3", {}, ["Top Rated"])
  ]);

  const top = farms.filter(f => typeof f.rating === "number")
                   .sort((a, b) => b.rating - a.rating)
                   .slice(0, 3);

  if (!top.length) {
    section.appendChild(createElement("p", {}, ["No ratings yet."]));
  } else {
    top.forEach(f => {
      const stars = "★".repeat(Math.round(f.rating)) + "☆".repeat(5 - Math.round(f.rating));
      section.appendChild(createElement("div", { class: "rating" }, [
        createElement("strong", {}, [f.name]),
        createElement("span", {}, [stars])
      ]));
    });
  }

  container.appendChild(section);
}

function toggleFavorite(farmId) {
  if (state.favorites.has(farmId)) {
    state.favorites.delete(farmId);
  } else {
    state.favorites.add(farmId);
  }
  localStorage.setItem("favFarms", JSON.stringify([...state.favorites]));
  if (currentSidebar) currentSidebar.render(state.farms);
}

// Main
export async function displayFarms(container, loggedIn) {
  container.innerHTML = "";
  isLoggedIn = loggedIn;

  const layout = createElement("div", { class: "farm-page" });
  const main   = createElement("div", { class: "farm__main" });
  const side   = createElement("aside", { class: "farm__side" });
  layout.append(createElement("div", { class: "farm__layout" }, [main, side]));
  container.appendChild(layout);

  const grid     = Grid();
  const sidebar  = Sidebar();
  const sentinel = createElement("div", { class: "farm__sentinel" });

  currentSidebar = sidebar;

  main.append(grid.container, sentinel);
  side.appendChild(sidebar.container);

  const observer = new IntersectionObserver(onIntersect, { rootMargin: "200px" });
  observer.observe(sentinel);

  await loadNextPage();
  renderAll();

  async function loadNextPage() {
    if (state.isLoading) return;
    state.isLoading = true;
    const batch = await fetchFarms(state.page);
    if (batch.length) {
      state.farms.push(...batch);
      state.page++;
    } else {
      observer.disconnect();
    }
    state.isLoading = false;
  }

  function renderAll() {
    grid.render(state.farms);
    sidebar.render(state.farms);
  }

  async function onIntersect(entries) {
    if (entries.some(e => e.isIntersecting)) {
      await loadNextPage();
      renderAll();
    }
  }
}


// import Button from "../../../components/base/Button.js";
// import { createElement } from "../../../components/createElement.js";
// import { apiFetch } from "../../../api/api.js";

// const pageSize = 10;
// let allFarms = [];

// function renderCropItem(crop) {
//     const isOutOfStock = crop.quantity === 0;
//     const cropItem = createElement('li', {
//         class: `crop-item${isOutOfStock ? ' out-of-stock' : ''}`
//     }, [
//         createElement('img', {
//             src: crop.imageUrl,
//             alt: `${crop.name} image`,
//             class: 'crop-image',
//             loading: 'lazy'
//         }),
//         createElement('div', { class: 'crop-info' }, [
//             createElement('strong', {}, [crop.name]),
//             createElement('p', {}, [
//                 isOutOfStock ? 'Out of Stock' : `${crop.quantity} ${crop.unit} at ₹${crop.price}`
//             ]),
//             crop.notes ? createElement('p', {}, [`📝 ${crop.notes}`]) : null
//         ].filter(Boolean))
//     ]);

//     return cropItem;
// }

// function renderFarmCard(farm, isLoggedIn) {
//     const farmInfo = [
//         createElement('h2', { class: 'farm-name' }, [farm.name]),
//         createElement('img', {
//             src: farm.photo,
//             alt: `${farm.name} image`,
//             class: 'farm-photo',
//             loading: 'lazy'
//         }),
//         farm.location ? createElement('p', {}, [`📍 ${farm.location}`]) : null,
//         farm.owner ? createElement('p', {}, [`👤 Owner: ${farm.owner}`]) : null,
//         farm.availabilityTiming ? createElement('p', {}, [`🕒 Timing: ${farm.availabilityTiming}`]) : null,
//         farm.contact ? createElement('p', {}, [`📞 Contact: ${farm.contact}`]) : null,
//         farm.description ? createElement('p', {}, [farm.description]) : null
//     ].filter(Boolean);

//     const actionButtons = isLoggedIn
//         ? createElement('div', { class: 'farm-actions' }, [
//             Button('View Details', () => alert(`Viewing farm: ${farm.name}`)),
//             Button('Edit', () => alert(`Editing farm: ${farm.name}`)),
//             Button('Request Visit', () => alert(`Contacting farm: ${farm.name}`))
//         ])
//         : null;

//     const farmCard = createElement('div', { class: 'farm-card' }, [
//         ...farmInfo,
//         actionButtons
//     ]);

//     if (farm.crops?.length) {
//         const cropsTitle = createElement('h4', {}, ['🌾 Crops Available:']);
//         const cropsList = createElement('ul', { class: 'crops-list' });

//         // Optional: sort crops by price ascending
//         const sortedCrops = [...farm.crops].sort((a, b) => a.price - b.price);
//         sortedCrops.forEach(crop => cropsList.appendChild(renderCropItem(crop)));

//         farmCard.appendChild(cropsTitle);
//         farmCard.appendChild(cropsList);
//     }

//     return farmCard;
// }

// function createPagination(currentPage, totalPages, onPageChange) {
//     const wrapper = createElement('div', { class: 'pagination' });
//     for (let i = 1; i <= totalPages; i++) {
//         const btn = Button(i.toString(), () => onPageChange(i));
//         if (i === currentPage) btn.classList.add('active');
//         wrapper.appendChild(btn);
//     }
//     return wrapper;
// }

// function createSearchBar(onSearch) {
//     const input = createElement('input', {
//         type: 'text',
//         placeholder: 'Search farms or crops...',
//         oninput: (e) => onSearch(e.target.value.trim().toLowerCase())
//     });

//     return createElement('div', { class: 'search-bar' }, [input]);
// }

// function filterFarmsByQuery(farms, query) {
//     if (!query) return farms;
//     return farms.filter(f =>
//         f.name.toLowerCase().includes(query) ||
//         f.crops?.some(c => c.name.toLowerCase().includes(query))
//     );
// }

// async function loadFarms(page = 1) {
//     const res = await apiFetch(`/farms?page=${page}&limit=${pageSize}`);
//     return {
//         farms: res?.farms || [],
//         total: res?.total || 0,
//         page: res?.page || 1
//     };
// }

// export async function setupFarmsPage(container, isLoggedIn) {
//     const res = await apiFetch(`/farms?page=1&limit=1000`);
//     allFarms = res?.farms || [];

//     const wrapper = createElement('div', { class: 'farms-wrapper' });
//     const farmsContainer = createElement('div', { class: 'farms-container' });

//     const searchBar = createSearchBar(query => {
//         const filtered = filterFarmsByQuery(allFarms, query);
//         farmsContainer.innerHTML = '';
//         filtered.forEach(farm => farmsContainer.appendChild(renderFarmCard(farm, isLoggedIn)));
//     });

//     wrapper.appendChild(searchBar);
//     wrapper.appendChild(farmsContainer);
//     container.innerHTML = ''; // Clear container
//     container.appendChild(wrapper);

//     displayFarms(farmsContainer, isLoggedIn, 1);
// }

// export async function displayFarms(container, isLoggedIn, page = 1) {
//     const { farms, total } = await loadFarms(page);
//     const totalPages = Math.ceil(total / pageSize);

//     container.innerHTML = '';

//     if (!farms.length) {
//         container.textContent = 'No farms available at the moment.';
//         return;
//     }

//     farms.forEach(farm => container.appendChild(renderFarmCard(farm, isLoggedIn)));

//     if (totalPages > 1) {
//         container.appendChild(createPagination(page, totalPages, newPage => displayFarms(container, isLoggedIn, newPage)));
//     }
// }

// // import Button from "../../../components/base/Button.js";
// // import { createElement } from "../../../components/createElement.js";
// // import { apiFetch } from "../../../api/api.js";

// // const pageSize = 10;
// // const cachedPages = {};

// // async function loadFarms(page = 1) {
// //     if (cachedPages[page]) return cachedPages[page];
// //     const res = await apiFetch(`/farms?page=${page}&limit=${pageSize}`);
// //     const data = res?.farms || [];
// //     cachedPages[page] = data;
// //     return data;
// // }

// // export async function displayFarms(container, isLoggedIn) {
// //     const farms = await loadFarms(1);

// //     container.innerHTML = '';

// //     if (!farms.length) {
// //         container.textContent = 'No farms available at the moment.';
// //         return;
// //     }

// //     farms.forEach(farm => {
// //         const farmInfo = [
// //             createElement('h2', { class: 'farm-name' }, [farm.name]),
// //             createElement('img', {
// //                 src: farm.photo,
// //                 alt: `${farm.name} image`,
// //                 class: 'farm-photo'
// //             }),
// //             farm.location ? createElement('p', {}, [`📍 ${farm.location}`]) : null,
// //             farm.owner ? createElement('p', {}, [`👤 Owner: ${farm.owner}`]) : null,
// //             farm.availabilityTiming ? createElement('p', {}, [`🕒 Timing: ${farm.availabilityTiming}`]) : null,
// //             farm.contact ? createElement('p', {}, [`📞 Contact: ${farm.contact}`]) : null,
// //             farm.description ? createElement('p', {}, [farm.description]) : null
// //         ].filter(Boolean);

// //         const cardButtons = isLoggedIn
// //             ? createElement('div', { class: 'farm-actions' }, [
// //                   Button('View Details', () => alert(`Viewing farm: ${farm.name}`)),
// //                   Button('Edit', () => alert(`Editing farm: ${farm.name}`))
// //               ])
// //             : null;

// //         const farmCard = createElement('div', { class: 'farm-card' }, [
// //             ...farmInfo,
// //             cardButtons
// //         ]);

// //         if (farm.crops?.length) {
// //             const cropsTitle = createElement('h4', {}, ['🌾 Crops Available:']);
// //             const cropsList = createElement('ul', { class: 'crops-list' });

// //             farm.crops.forEach(crop => {
// //                 const cropDetails = createElement('li', { class: 'crop-item' }, [
// //                     createElement('img', {
// //                         src: crop.imageUrl,
// //                         alt: `${crop.name} image`,
// //                         class: 'crop-image'
// //                     }),
// //                     createElement('div', { class: 'crop-info' }, [
// //                         createElement('strong', {}, [crop.name]),
// //                         createElement('p', {}, [`${crop.quantity} ${crop.unit} at ₹${crop.price}`]),
// //                         crop.notes ? createElement('p', {}, [`📝 ${crop.notes}`]) : null
// //                     ])
// //                 ]);
// //                 cropsList.appendChild(cropDetails);
// //             });

// //             farmCard.appendChild(cropsTitle);
// //             farmCard.appendChild(cropsList);
// //         }

// //         container.appendChild(farmCard);
// //     });
// // }
