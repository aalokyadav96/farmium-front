import { SRC_URL } from "../../api/api.js";
import { apigFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { trackEvent } from "../activity/metrics.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Imagex from "../../components/base/Imagex.js";
import { debounce, filterItems, sortItems, paginate, attachInfiniteScroll } from "../../utils/listUtils.js";

let currentPage = 1;
const pageSize = 10;
let allArtists = [];
let filteredArtists = [];

export async function displayArtists(content, isLoggedIn) {
  content.innerHTML = "";
  currentPage = 1;

  const container = createElement("div", { class: "artistspage" });
  const wrapper = createElement("div", { class: "artists-wrapper" });
  container.appendChild(wrapper);
  content.appendChild(container);

  try {
    const artists = await apigFetch(`/artists`);
    allArtists = artists;
    filteredArtists = [...allArtists];

    const main = createElement("div", { class: "artists-main" });
    const aside = createElement("aside", { class: "artists-aside" });

    wrapper.appendChild(main);
    wrapper.appendChild(aside);

    // Header
    const header = createElement("div", { class: "artists-header" }, [
      createElement("h2", {}, ["Artists"]),
    ]);
    main.appendChild(header);

    // Aside Actions
    aside.appendChild(createElement("h3", {}, ["Actions"]));
    const createBtn = Button("Create Artist", "crt-artst", {
      click: () => navigate("/create-artist")
    }, "buttonx primary");
    aside.appendChild(createBtn);

    // Controls
    const controls = createSearchAndFilterUI();
    main.appendChild(controls.wrapper);

    // Grid
    const grid = createElement("section", { class: "artists-grid" });
    main.appendChild(grid);
    controls.grid = grid;

    // Sentinel for lazy loading
    const sentinel = createElement("div", { id: "lazy-loader" });
    main.appendChild(sentinel);

    // Initial render
    renderNextPage(grid, filteredArtists, isLoggedIn);

    // Infinite scroll with listUtils
    attachInfiniteScroll(sentinel, () => {
      renderNextPage(grid, filteredArtists, isLoggedIn);
    }, { rootMargin: "100px" });

    // Hooks with debounce
    controls.searchInput.addEventListener("input", debounce(() => {
      filterAndReset(controls, grid, isLoggedIn);
    }, 300));

    controls.filterSelect.addEventListener("change", () => {
      filterAndReset(controls, grid, isLoggedIn);
    });

    controls.resetBtn.addEventListener("click", () => {
      controls.searchInput.value = "";
      controls.filterSelect.value = "";
      filterAndReset(controls, grid, isLoggedIn);
    });

  } catch (error) {
    container.appendChild(
      createElement("p", { class: "error-message" }, [`Error: ${error.message}`])
    );
  }
}

function createSearchAndFilterUI() {
  const wrapper = createElement("div", { class: "artist-controls" });

  const searchInput = createElement("input", {
    type: "text",
    placeholder: "Search artists...",
    class: "artist-search"
  });

  const filterSelect = createElement("select", { class: "artist-filter" });
  filterSelect.appendChild(createElement("option", { value: "" }, ["All Categories"]));

  const categories = new Set(allArtists.map(a => a.category).filter(Boolean));
  [...categories].sort().forEach(cat => {
    filterSelect.appendChild(createElement("option", { value: cat }, [cat]));
  });

  const resetBtn = Button("Reset", "reset-artists", {}, "small-button");

  wrapper.appendChild(searchInput);
  wrapper.appendChild(filterSelect);
  wrapper.appendChild(resetBtn);

  return { wrapper, searchInput, filterSelect, resetBtn };
}

function renderNextPage(grid, artists, isLoggedIn) {
  const pageItems = paginate(artists, currentPage, pageSize);

  pageItems.forEach(artist => {
    const imgSrc = artist.photo
      ? resolveImagePath(EntityType.ARTIST, PictureType.THUMB, artist.photo)
      : "https://via.placeholder.com/300x300?text=No+Image";
  
    const card = createElement("article", { class: "artist-card" }, [
      Imagex({
        classes: "artist-thumb",
        src: imgSrc,
        alt: `${artist.name}'s photo`
      }),
      createElement("h3", {}, [artist.name]),
      createElement("p", { class: "artist-category" }, [artist.category]),
      createElement("p", { class: "artist-bio" }, [
        artist.bio?.substring(0, 100) + "..." || ""
      ]),
      Button("View Details", `view-${artist.artistid}`, {
        click: () => {
          navigate(`/artist/${artist.artistid}`);
          trackEvent("click_view-artist_button", { buttonId: `view-${artist.artistid}` });
        }
      }, "artist-view-btn")
    ]);
  
    grid.appendChild(card);
  });

  currentPage++;
}

function filterAndReset(controls, grid, isLoggedIn) {
  const searchTerm = controls.searchInput.value.toLowerCase();
  const selectedCategory = controls.filterSelect.value;

  filteredArtists = filterItems(allArtists, {
    keyword: searchTerm,
    category: selectedCategory || null
  });

  currentPage = 1;
  grid.innerHTML = "";
  renderNextPage(grid, filteredArtists, isLoggedIn);
}

// import { SRC_URL } from "../../api/api.js";
// import { apigFetch } from "../../api/api.js";
// import Button from "../../components/base/Button.js";
// import { createElement } from "../../components/createElement.js";
// import { navigate } from "../../routes/index.js";
// import { trackEvent } from "../activity/metrics.js";
// import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
// import Imagex from "../../components/base/Imagex.js";

// let currentPage = 0;
// const pageSize = 10;
// let allArtists = [];
// let filteredArtists = [];

// export async function displayArtists(content, isLoggedIn) {
//   content.innerHTML = "";
//   currentPage = 0;

//   const container = createElement("div", { class: "artistspage" });
//   const wrapper = createElement("div", { class: "artists-wrapper" });
//   container.appendChild(wrapper);
//   content.appendChild(container);

//   try {
//     const artists = await apigFetch(`/artists`);
//     allArtists = artists;
//     filteredArtists = [...allArtists];

//     const main = createElement("div", { class: "artists-main" });
//     const aside = createElement("aside", { class: "artists-aside" });

//     wrapper.appendChild(main);
//     wrapper.appendChild(aside);

//     // Header
//     const header = createElement("div", { class: "artists-header" }, [
//       createElement("h2", {}, ["Artists"]),
//     ]);
//     main.appendChild(header);

//     // Aside Actions
//     aside.appendChild(createElement("h3", {}, ["Actions"]));
//     const createBtn = Button("Create Artist", "crt-artst", {
//       click: () => navigate("/create-artist")
//     }, "buttonx primary");
//     aside.appendChild(createBtn);

//     // Controls
//     const controls = createSearchAndFilterUI();
//     main.appendChild(controls.wrapper);

//     // Grid
//     const grid = createElement("section", { class: "artists-grid" });
//     main.appendChild(grid);
//     controls.grid = grid;

//     // Sentinel for lazy loading
//     const sentinel = createElement("div", { id: "lazy-loader" });
//     main.appendChild(sentinel);

//     // Initial render
//     renderNextPage(grid, filteredArtists, isLoggedIn);

//     const observer = new IntersectionObserver(([entry]) => {
//       if (entry.isIntersecting) {
//         renderNextPage(grid, filteredArtists, isLoggedIn);
//       }
//     }, { rootMargin: "100px" });

//     observer.observe(sentinel);

//     // Hooks
//     controls.searchInput.addEventListener("input", () => {
//       filterAndReset(controls, grid, isLoggedIn);
//     });

//     controls.filterSelect.addEventListener("change", () => {
//       filterAndReset(controls, grid, isLoggedIn);
//     });

//     controls.resetBtn.addEventListener("click", () => {
//       controls.searchInput.value = "";
//       controls.filterSelect.value = "";
//       filterAndReset(controls, grid, isLoggedIn);
//     });

//   } catch (error) {
//     container.appendChild(
//       createElement("p", { class: "error-message" }, [`Error: ${error.message}`])
//     );
//   }
// }

// function createSearchAndFilterUI() {
//   const wrapper = createElement("div", { class: "artist-controls" });

//   const searchInput = createElement("input", {
//     type: "text",
//     placeholder: "Search artists...",
//     class: "artist-search"
//   });

//   const filterSelect = createElement("select", { class: "artist-filter" });
//   filterSelect.appendChild(createElement("option", { value: "" }, ["All Categories"]));

//   const categories = new Set(allArtists.map(a => a.category).filter(Boolean));
//   [...categories].sort().forEach(cat => {
//     filterSelect.appendChild(createElement("option", { value: cat }, [cat]));
//   });

//   const resetBtn = Button("Reset", "reset-artists", {}, "small-button");

//   wrapper.appendChild(searchInput);
//   wrapper.appendChild(filterSelect);
//   wrapper.appendChild(resetBtn);

//   return { wrapper, searchInput, filterSelect, resetBtn };
// }

// function renderNextPage(grid, artists, isLoggedIn) {
//   const start = currentPage * pageSize;
//   const end = start + pageSize;
//   const pageItems = artists.slice(start, end);

//   pageItems.forEach(artist => {
//     const imgSrc = artist.photo
//       ? resolveImagePath(EntityType.ARTIST, PictureType.THUMB, artist.photo)
//       : "https://via.placeholder.com/300x300?text=No+Image";
  
//     const card = createElement("article", { class: "artist-card" }, [
//       // createElement("img", {
//       //   class: "artist-photo",
//       //   src: imgSrc,
//       //   alt: `${artist.name}'s photo`
//       // }),
//       Imagex({
//         classes: "artist-thumb",
//         src: imgSrc,
//         alt: `${artist.name}'s photo`
//       }),
//       createElement("h3", {}, [artist.name]),
//       createElement("p", { class: "artist-category" }, [artist.category]),
//       createElement("p", { class: "artist-bio" }, [
//         artist.bio?.substring(0, 100) + "..." || ""
//       ]),
//       Button("View Details", `view-${artist.artistid}`, {
//         click: () => {
//           navigate(`/artist/${artist.artistid}`);
//           trackEvent("click_view-artist_button", { buttonId: `view-${artist.artistid}` });
//         }
//       }, "artist-view-btn")
//     ]);
  
//     grid.appendChild(card);
//   });
  

//   currentPage++;
// }

// function filterAndReset(controls, grid, isLoggedIn) {
//   const searchTerm = controls.searchInput.value.toLowerCase();
//   const selectedCategory = controls.filterSelect.value;

//   filteredArtists = allArtists.filter(artist => {
//     const matchName = artist.name.toLowerCase().includes(searchTerm);
//     const matchCategory = selectedCategory ? artist.category === selectedCategory : true;
//     return matchName && matchCategory;
//   });

//   currentPage = 0;
//   grid.innerHTML = "";
//   renderNextPage(grid, filteredArtists, isLoggedIn);
// }
