
import Button from "../../../components/base/Button.js";
import { createElement } from "../../../components/createElement.js";
import { SRC_URL, apiFetch } from "../../../api/api.js";

import { showCategoryBrowser } from "./browseByCategory.js";
import {
    renderFarmCards,
    renderFeaturedFarm,
    renderWeatherWidget,
    renderFarmStats,
    replaceOrAppend, 
} from "./farmListHelpers.js";

let currentPage = 1;
const pageSize = 10;
let cachedPages = {};

export async function displayFarms(container, isLoggedIn) {
    container.textContent = "";
    let farms = [];

    const layout = createElement("div", { class: "farm-page" });

    const gridLayout = createElement("div", { class: "farm__layout" });
    const mainCol = createElement("div", { class: "farm__main" });
    const sideCol = createElement("aside", { class: "farm__side" });

    layout.appendChild(gridLayout);
    gridLayout.append(mainCol, sideCol);
    container.appendChild(layout);
    const searchInput = createElement("input", {
        type: "text",
        placeholder: "🔍 Search by name or location",
        class: "farm__search-input",
        id: "search-farm"
    });
    const searchLabel = createElement("label", {
        for: "search-farm"
    }, ["Search"]);

    const locationSelect = createElement("select", {
        class: "farm__location-select",
        id: "select-location"
    }, [
        createElement("option", { value: "" }, ["All Locations"])
    ]);
    const locationLabel = createElement("label", {
        for: "select-location"
    }, ["Location"]);

    const cropSelect = createElement("select", {
        class: "farm__crop-select",
        id: "select-crop"
    }, [
        createElement("option", { value: "" }, ["All Crops"])
    ]);
    const cropLabel = createElement("label", {
        for: "select-crop"
    }, ["Crop"]);

    const sortSelect = createElement("select", {
        class: "farm__sort-select",
        id: "select-sort"
    }, [
        createElement("option", { value: "" }, ["Sort By"]),
        createElement("option", { value: "name" }, ["Name"]),
        createElement("option", { value: "location" }, ["Location"]),
        createElement("option", { value: "owner" }, ["Owner"])
    ]);
    const sortLabel = createElement("label", {
        for: "select-sort"
    }, ["Sort"]);

    const farmGrid = createElement("div", { class: "farm__grid" });
    const loadMoreBtn = createElement("button", { class: "farm__load-more-btn" }, ["Load More"]);

    const controls = createElement("div", { class: "farm__controls" }, [
        createElement("div", {}, [searchLabel, searchInput]),
        createElement("div", {}, [locationLabel, locationSelect]),
        createElement("div", {}, [cropLabel, cropSelect]),
        createElement("div", {}, [sortLabel, sortSelect])
    ]);

    mainCol.append(controls, farmGrid, loadMoreBtn);

    const sidebarWidgets = createElement("div", { class: "farm__widgets" });
    sideCol.appendChild(sidebarWidgets);

    function showLoader() {
        farmGrid.textContent = "";
        for (let i = 0; i < 6; i++) {
            farmGrid.appendChild(createElement("div", { class: "farm__card skeleton" }));
        }
    }

    async function loadFarms(page = 1) {
        if (cachedPages[page]) return cachedPages[page];
        const res = await apiFetch(`/farms?page=${page}&limit=${pageSize}`);
        const data = res?.farms || [];
        cachedPages[page] = data;
        return data;
    }

    const debounce = (fn, delay = 300) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    };

    async function refreshDisplay() {
        const query = searchInput.value.toLowerCase();
        const sortKey = sortSelect.value;
        const locationFilter = locationSelect.value;
        const cropFilter = cropSelect.value;

        let filtered = farms.filter(f =>
            f.name.toLowerCase().includes(query) ||
            f.location.toLowerCase().includes(query)
        );

        if (locationFilter) filtered = filtered.filter(f => f.location === locationFilter);
        if (cropFilter) {
            filtered = filtered.filter(f =>
                f.crops?.some(c => c.name.toLowerCase() === cropFilter.toLowerCase())
            );
        }

        if (sortKey) {
            filtered.sort((a, b) => (a[sortKey] || "").localeCompare(b[sortKey] || ""));
        }

        populateDropdowns(farms);
        renderFarmCards(filtered, farmGrid, isLoggedIn);
        renderCTAWidget(sidebarWidgets, mainCol);
        renderWeatherWidget(sidebarWidgets);
        renderFeaturedFarm(sidebarWidgets, filtered[0]);
        renderFarmStats(sidebarWidgets, farms);
    }

    function populateDropdowns(list) {
        const locations = new Set();
        const crops = new Set();

        list.forEach(f => {
            if (f.location) locations.add(f.location);
            (f.crops || []).forEach(c => crops.add(c.name));
        });

        fillSelect(locationSelect, ["All Locations", ...[...locations].sort()]);
        fillSelect(cropSelect, ["All Crops", ...[...crops].sort()]);
    }

    function fillSelect(selectEl, options) {
        const currentValue = selectEl.value;
        selectEl.innerHTML = "";
        for (const val of options) {
            const opt = createElement("option", {
                value: val.startsWith("All ") ? "" : val,
                selected: val === currentValue
            }, [val]);
            selectEl.appendChild(opt);
        }
    }

    searchInput.addEventListener("input", debounce(refreshDisplay));
    locationSelect.addEventListener("change", refreshDisplay);
    cropSelect.addEventListener("change", refreshDisplay);
    sortSelect.addEventListener("change", refreshDisplay);

    loadMoreBtn.addEventListener("click", async () => {
        currentPage++;
        showLoader();
        const moreFarms = await loadFarms(currentPage);
        if (!moreFarms.length) loadMoreBtn.disabled = true;
        farms.push(...moreFarms);
        refreshDisplay();
    });

    try {
        showLoader();
        farms = await loadFarms(currentPage);
        refreshDisplay();
    } catch {
        container.textContent = "⚠️ Failed to load farms.";
    }
}

function renderCTAWidget(container, main) {
    const section = createElement("section", { class: "farm__cta" }, [
        Button("View by Category", 'view-by-cat-btn', {
            click: () => { showCategoryBrowser(main) }
        }, "buttonx"),
        Button("View by Farm", 'view-by-farm-btn', {
            click: () => { displayFarms(document.getElementById('content'), true) }
        }),
    ]);

    replaceOrAppend(container, ".farm__cta", section);
}
