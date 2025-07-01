// farmFilters.js
import { createElement } from "../../../components/createElement.js";
import { createOption } from "../../../components/ui/createOption.mjs";

export function createFilterControls(state, onFilterChange) {
    const container = createElement("div", { class: "farm__filters" });

    // Search by name
    const searchInput = createElement("input", {
        type: "text",
        placeholder: "🔍 Search farms…",
        class: "farm__search"
    });

    // Sort dropdown
    const sortSelect = createElement("select", { class: "farm__sort" });
    [
        ["", "Sort by…"],
        ["name-asc", "Name A→Z"],
        ["name-desc", "Name Z→A"],
        ["rating-desc", "Rating ↓"],
        ["rating-asc", "Rating ↑"]
    ].forEach(([val, label]) => sortSelect.appendChild(createOption(val, label)));

    // Location filter
    const locationInput = createElement("input", {
        type: "text",
        placeholder: "📍 Filter by location",
        class: "farm__location"
    });

    // Availability filter (checkbox)
    const availToggle = createElement("input", {
        type: "checkbox",
        title: "Only show available farms"
    });
    const availLabel = createElement("label", {}, ["🟢 Available Only ", availToggle]);

    // Min/Max Rating filter
    const ratingMin = createElement("input", {
        type: "number",
        min: 0, max: 5, step: 0.1,
        placeholder: "Min ⭐"
    });
    const ratingMax = createElement("input", {
        type: "number",
        min: 0, max: 5, step: 0.1,
        placeholder: "Max ⭐"
    });

    // Events
    searchInput.oninput = () => {
        state.searchKeyword = searchInput.value.toLowerCase().trim();
        onFilterChange();
    };

    sortSelect.onchange = () => {
        const [key, dir] = sortSelect.value.split("-");
        state.sortBy = key;
        state.sortDir = dir;
        onFilterChange();
    };

    locationInput.oninput = () => {
        state.locationFilter = locationInput.value.toLowerCase().trim();
        onFilterChange();
    };

    availToggle.onchange = () => {
        state.onlyAvailable = availToggle.checked;
        onFilterChange();
    };

    [ratingMin, ratingMax].forEach(input => {
        input.oninput = () => {
            state.minRating = parseFloat(ratingMin.value) || 0;
            state.maxRating = parseFloat(ratingMax.value) || 5;
            onFilterChange();
        };
    });

    container.append(
        searchInput,
        sortSelect,
        locationInput,
        availLabel,
        ratingMin,
        ratingMax
    );

    return container;
}

export function applyFiltersAndSort(farms, state) {
    let result = [...farms];

    if (state.searchKeyword) {
        result = result.filter(f => f.name?.toLowerCase().includes(state.searchKeyword));
    }

    if (state.locationFilter) {
        result = result.filter(f => f.location?.toLowerCase().includes(state.locationFilter));
    }

    if (state.onlyAvailable) {
        result = result.filter(f => f.available === true);
    }

    result = result.filter(f => {
        const rating = f.rating ?? 0;
        return rating >= state.minRating && rating <= state.maxRating;
    });

    if (state.sortBy) {
        result.sort((a, b) => {
            let res = 0;
            if (state.sortBy === "name") res = a.name.localeCompare(b.name);
            if (state.sortBy === "rating") res = (a.rating ?? 0) - (b.rating ?? 0);
            return state.sortDir === "asc" ? res : -res;
        });
    }

    return result;
}
