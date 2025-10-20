// displayLive.js
import { liveFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { goLiveWithTitle, scheduleLivestream } from "./startLive.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

/*
  displayLive(container, entityType, entityId, isL = false, isCreator = null)
  - encapsulated state object to avoid global collisions
  - lazy loaded images
  - caching cards and toggling visibility instead of destroying nodes
  - uses createElement and Button per project conventions
*/
export async function displayLive(container, entityType, entityId, isL = false, isCreator = null) {
    clearElement(container);

    // --- Always render Go Live button if creator ---
    if (isCreator) {
        const goLiveBtn = showGoLiveButton(entityType, entityId);
        container.appendChild(goLiveBtn);
    }

    // --- Start by showing "skeleton" interface ---
    const loadingEl = createElement("div", { class: "loading" }, ["Loading live sessions..."]);
    container.appendChild(loadingEl);

    let res = null;
    try {
        res = await liveFetch(`/live/info/${entityType}/${entityId}`, "GET");
    } catch {
        res = null;
    }

    // --- Remove loading text ---
    if (container.contains(loadingEl)) container.removeChild(loadingEl);

    // --- Initialize base UI structure ---
    const state = {
        currentView: "grid",
        activeCategory: "All",
        liveCardsCache: {},
        allLives: res?.previous || []
    };

    // --- Scheduled Live (if available) ---
    if (res?.scheduled) {
        const scheduled = showScheduledLive(res.scheduled);
        container.appendChild(scheduled);
    }

    // --- Categories + Controls (even offline) ---
    const categories = getCategories(state.allLives);
    const controlsBar = createElement("div", { class: "controls-bar hvflex" }, [
        buildFilterBar(categories.length ? categories : ["All"], state),
        buildViewToggle(state)
    ]);

    const contentWrapper = createElement("div", {
        id: "lives-wrapper",
        class: `lives-wrapper ${state.currentView}`
    });

    container.appendChild(controlsBar);
    container.appendChild(contentWrapper);

    // --- If API unreachable ---
    if (!res) {
        const offlineMsg = createElement("div", { class: "offline-message" }, [
            "⚠️ Unable to reach the live service. Showing cached or partial data."
        ]);
        container.appendChild(offlineMsg);
        return;
    }

    // --- Normal path (API succeeded) ---
    buildLiveCardsCache(state);
    if (state.allLives.length) {
        showCategory(state.activeCategory, contentWrapper, state);
    } else {
        contentWrapper.appendChild(createElement("div", { class: "empty" }, ["No previous live sessions."]));
    }
}


// --- COMPONENTS ---
function showGoLiveButton(entityType, entityId) {
    const goLiveButton = Button("Go Live", "goLiveBtn", { click: () => goLiveWithTitle(entityType, entityId) }, "go-live-btn");
    const scheduleButton = Button("Schedule a Live", "scheduleLiveBtn", { click: () => scheduleLivestream(entityType, entityId) }, "schedule-live-btn");
    return createElement("div", { class: "go-live-buttons" }, [goLiveButton, scheduleButton]);
}

function showScheduledLive(data) {
    const title = createElement("h2", { class: "live-title" }, [data.title]);
    const banner = createElement("img", {
        src: resolveImagePath(EntityType.LIVE, PictureType.PHOTO, data.banner),
        alt: data.title,
        class: "live-banner",
        loading: "lazy"
    });
    const info = createElement("p", { class: "live-info" }, [`Scheduled: ${data.date} at ${data.time}`]);
    return createElement("section", { class: "scheduled-live" }, [title, banner, info]);
}

// --- FILTER BAR ---
function buildFilterBar(categories, state) {
    const filterBar = createElement("div", { id: "live-category-filter", class: "filter-bar" });
    categories.forEach(category => {
        const btn = createElement("button", { "data-category": category, class: category === state.activeCategory ? "active" : "" }, [category]);
        btn.addEventListener("click", () => {
            if (state.activeCategory === category) return;
            state.activeCategory = category;
            updateFilterButtons(filterBar, state);
            const wrapper = document.getElementById("lives-wrapper");
            if (wrapper) showCategory(category, wrapper, state);
        });
        filterBar.appendChild(btn);
    });
    return filterBar;
}

function getCategories(lives) {
    return ["All", ...new Set(lives.map(l => l.category || "Uncategorized"))];
}

function updateFilterButtons(filterBar, state) {
    [...filterBar.children].forEach(btn => btn.classList.toggle("active", btn.getAttribute("data-category") === state.activeCategory));
}

// --- VIEW TOGGLE ---
function buildViewToggle(state) {
    const wrapper = createElement("div", { class: "view-toggle" });
    const gridBtn = createElement("button", { class: state.currentView === "grid" ? "active" : "" }, ["🔳 Grid"]);
    const listBtn = createElement("button", { class: state.currentView === "list" ? "active" : "" }, ["📋 List"]);
    gridBtn.addEventListener("click", () => { if (state.currentView !== "grid") { state.currentView = "grid"; updateView(state); } });
    listBtn.addEventListener("click", () => { if (state.currentView !== "list") { state.currentView = "list"; updateView(state); } });
    wrapper.appendChild(gridBtn); wrapper.appendChild(listBtn);
    return wrapper;
}

function updateView(state) {
    const wrapper = document.getElementById("lives-wrapper");
    if (!wrapper) return;
    wrapper.className = `lives-wrapper ${state.currentView}`;
    showCategory(state.activeCategory, wrapper, state);

    const toggleButtons = wrapper.parentElement.querySelectorAll(".view-toggle button");
    toggleButtons.forEach(btn => {
        const isGridBtn = btn.textContent.includes("Grid");
        btn.classList.toggle("active", (isGridBtn && state.currentView === "grid") || (!isGridBtn && state.currentView === "list"));
    });
}

// --- CARDS ---
function buildLiveCardsCache(state) {
    state.liveCardsCache = {};
    const allCategoryCards = state.allLives.map((live, i) => liveCard(live, i));
    state.liveCardsCache["All"] = allCategoryCards;
    const categories = getCategories(state.allLives).filter(c => c !== "All");
    categories.forEach(category => {
        state.liveCardsCache[category] = allCategoryCards.filter(card => card.dataset.category === category);
    });
}

function liveCard(live, index) {
    const banner = createElement("img", {
        src: live.banner,
        alt: live.title,
        class: "live-card-banner",
        loading: "lazy"
    });
    const title = createElement("h3", { class: "live-card-title" }, [live.title]);
    const meta = createElement("p", { class: "live-card-meta" }, [`${live.date} ${live.time} • ${live.playCount || 0} plays • ${live.likeCount || 0} likes`]);
    const btn = Button("Watch", `watch-${index}`, { click: () => openLivePlayer(live) }, "watch-btn");
    const node = createElement("div", { "data-category": live.category || "Uncategorized", "data-id": live.id || `live-${index}`, class: "live-card" }, [banner, title, meta, btn]);
    // initially visible; we will toggle display on category changes
    node.style.display = "";
    return node;
}

function openLivePlayer(live) {
    // Replace blocking alert with a navigation or player open (placeholder)
    if (live?.liveid) {
        // navigate to live page — assume router exists elsewhere
        const url = `/live/${live.liveid}`;
        window.location.href = url;
    } else {
        // fallback: open ephemeral player
        alert(`Opening ${live.title}`);
    }
}

function showCategory(category, wrapper, state) {
    // toggle visibility of cached nodes instead of destroying/re-creating
    const cards = state.liveCardsCache["All"] || [];
    if (!cards.length) {
        clearElement(wrapper);
        wrapper.appendChild(createElement("p", { class: "no-lives" }, ["No lives in this category."]));
        wrapper.classList.toggle("grid", state.currentView === "grid");
        wrapper.classList.toggle("list", state.currentView === "list");
        return;
    }

    // ensure wrapper contains all nodes (append those not yet in DOM)
    cards.forEach(card => {
        if (!card.parentElement) wrapper.appendChild(card);
    });

    // show/hide by data-category
    cards.forEach(card => {
        const cardCategory = card.getAttribute("data-category") || "Uncategorized";
        const shouldShow = category === "All" || cardCategory === category;
        card.style.display = shouldShow ? "" : "none";
    });

    wrapper.classList.toggle("grid", state.currentView === "grid");
    wrapper.classList.toggle("list", state.currentView === "list");
}

function clearElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
}
