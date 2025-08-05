import { SRC_URL } from "../../api/api.js";
import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { trackEvent } from "../activity/metrics.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

let currentPage = 0;
const pageSize = 10;
let allArtists = [];
let filteredArtists = [];

export async function displayArtists(content, isLoggedIn) {
  content.innerHTML = "";
  currentPage = 0;

  const container = createElement("div", { class: "artistspage" });
  content.appendChild(container);

  try {
    const artists = await apiFetch(`/artists`);
    allArtists = artists;
    filteredArtists = [...allArtists];

    // Layout wrapper
    const wrapper = createElement("div", { class: "artists-wrapper" });
    const aside = createElement("aside", { class: "artists-aside" });
    const main = createElement("div", { class: "artists-main" });

    container.appendChild(wrapper);
    wrapper.appendChild(main);
    wrapper.appendChild(aside);

    const header = createElement("div", { class: "artists-header" }, [
      createElement("h2", {}, ["Artists"]),]);
      main.appendChild(header);
  
    aside.appendChild(createElement("h3",{},["Actions"]));
    const createBtn = Button("Create Artist", "crt-artst", {
      click: () => navigate("/create-artist")
    }, "buttonx");
    aside.appendChild(createBtn);

    // Controls UI
    const controls = createSearchAndFilterUI();
    main.appendChild(controls.wrapper);

    // Grid
    const grid = createElement("section", { class: "artists-grid" });
    main.appendChild(grid);
    controls.grid = grid;

    // Sentinel for infinite scroll
    const sentinel = createElement("div", { id: "lazy-loader" });
    main.appendChild(sentinel);

    // Initial render
    renderNextPage(grid, filteredArtists, isLoggedIn);

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        renderNextPage(grid, filteredArtists, isLoggedIn);
      }
    }, { rootMargin: "100px" });

    observer.observe(sentinel);

    // Hooks
    controls.searchInput.addEventListener("input", () => {
      filterAndReset(controls, grid, isLoggedIn);
    });

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
  const start = currentPage * pageSize;
  const end = start + pageSize;
  const pageItems = artists.slice(start, end);

  pageItems.forEach(artist => {
    const imgSrc = artist.photo
      ? resolveImagePath(EntityType.ARTIST, PictureType.PHOTO, artist.photo)
      : "https://via.placeholder.com/300x300?text=No+Image";
  
    const card = createElement("article", { class: "artist-card" }, [
      createElement("img", {
        class: "artist-photo",
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

  filteredArtists = allArtists.filter(artist => {
    const matchName = artist.name.toLowerCase().includes(searchTerm);
    const matchCategory = selectedCategory ? artist.category === selectedCategory : true;
    return matchName && matchCategory;
  });

  currentPage = 0;
  grid.innerHTML = "";
  renderNextPage(grid, filteredArtists, isLoggedIn);
}

// import { SRC_URL } from "../../api/api.js";
// import { apiFetch } from "../../api/api.js";
// import Button from "../../components/base/Button.js";
// import { createElement } from "../../components/createElement.js";
// import { navigate } from "../../routes/index.js";
// import { trackEvent } from "../activity/metrics.js";


// let currentPage = 0;
// const pageSize = 10;
// let allArtists = [];
// let filteredArtists = [];

// export async function displayArtists(content, isLoggedIn) {
//   // Clear container
//   content.innerHTML = "";
//   let container = createElement('div', { "class": "artistspage" }, []);

//   content.innerHTML = "";
//   content.appendChild(container);
//   currentPage = 0;

//   container.appendChild(Button("Create Artist","crt-artst",{
//     click : () => {
//       navigate("/create-artist");
//     }
//   }, "buttonx"));

//   try {
//     // Fetch artists from API
//     const artists = await apiFetch(`/artists`);
//     allArtists = artists;
//     filteredArtists = [...allArtists]; // clone

//     // Search and Filter UI
//     const controls = createSearchAndFilterUI();
//     container.appendChild(controls.wrapper);

//     // Artist Grid
//     const grid = document.createElement("section");
//     grid.className = "artists-grid";
//     controls.grid = grid;
//     container.appendChild(grid);

//     // Initial Render
//     renderNextPage(grid, filteredArtists, isLoggedIn);

//     // Infinite scroll
//     const observer = new IntersectionObserver(([entry]) => {
//       if (entry.isIntersecting) {
//         renderNextPage(grid, filteredArtists, isLoggedIn);
//       }
//     }, {
//       rootMargin: '100px'
//     });

//     // Lazy loader sentinel
//     const sentinel = document.createElement('div');
//     sentinel.id = 'lazy-loader';
//     container.appendChild(sentinel);
//     observer.observe(sentinel);

//     // Hook up filtering
//     controls.searchInput.addEventListener('input', () => {
//       filterAndReset(controls, grid, isLoggedIn);
//     });

//     controls.filterSelect.addEventListener('change', () => {
//       filterAndReset(controls, grid, isLoggedIn);
//     });

//   } catch (error) {
//     const errMsg = document.createElement("p");
//     errMsg.className = "error-message";
//     errMsg.textContent = `Error: ${error.message}`;
//     container.appendChild(errMsg);
//   }
// }

// function createSearchAndFilterUI() {
//   const wrapper = document.createElement('div');
//   wrapper.className = 'artist-controls';

//   const searchInput = document.createElement('input');
//   searchInput.type = 'text';
//   searchInput.placeholder = 'Search artists...';
//   searchInput.className = 'artist-search';

//   const filterSelect = document.createElement('select');
//   filterSelect.className = 'artist-filter';
//   const defaultOpt = new Option('All Categories', '');
//   filterSelect.appendChild(defaultOpt);

//   // Populate dynamically later
//   const categories = new Set();
//   allArtists.forEach(a => categories.add(a.category));
//   [...categories].sort().forEach(cat => {
//     const opt = new Option(cat, cat);
//     filterSelect.appendChild(opt);
//   });

//   wrapper.appendChild(searchInput);
//   wrapper.appendChild(filterSelect);

//   return { wrapper, searchInput, filterSelect };
// }

// function renderNextPage(grid, artists, isLoggedIn) {
//   const start = currentPage * pageSize;
//   const end = start + pageSize;
//   const pageItems = artists.slice(start, end);

//   pageItems.forEach(artist => {
//     const card = document.createElement("article");
//     card.className = "artist-card";

//     const img = document.createElement("img");
//     img.className = "artist-photo";
//     img.src = artist.photo
//       ? `${SRC_URL}/artistpic/photo/${artist.photo}`
//       : `https://via.placeholder.com/300x300?text=No+Image`;
//     img.alt = `${artist.name}'s photo`;
//     card.appendChild(img);

//     const name = document.createElement("h3");
//     name.textContent = artist.name;
//     card.appendChild(name);

//     const category = document.createElement("p");
//     category.className = "artist-category";
//     category.textContent = artist.category;
//     card.appendChild(category);

//     const bio = document.createElement("p");
//     bio.className = "artist-bio";
//     bio.textContent = artist.bio?.substring(0, 100) + '...' || '';
//     card.appendChild(bio);

//     const viewBtn = Button("View Details", "view-artist-123", {
//       click: () => {
//         navigate(`/artist/${artist.artistid}`);
//         trackEvent("click_view-artist_button", { buttonId: "view-artist-123" });
//       }
//     }, "artist-view-btn");
//     card.appendChild(viewBtn);

//     // if (isLoggedIn) {
//     //   const editBtn = document.createElement("button");
//     //   editBtn.className = "artist-edit-btn";
//     //   editBtn.textContent = "Edit Artist";
//     //   editBtn.addEventListener("click", () => {
//     //     navigate(`/artist/edit/${artist.artistid}`);
//     //   });
//     //   card.appendChild(editBtn);
//     // }

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

//   // Reset
//   currentPage = 0;
//   grid.innerHTML = '';
//   renderNextPage(grid, filteredArtists, isLoggedIn);
// }
