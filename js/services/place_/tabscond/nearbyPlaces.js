import { apiFetch } from "../../../api/api";
import { createElement } from "../../../components/createElement";
import Button from "../../../components/base/Button";

let allPlaces = [];
let activeCategory = "All";

// Fetch and render nearby places
export async function displayPlaceNearby(container, placeId) {
    container.innerHTML = ""; // Clear the container

    const nearbyPlaces = await apiFetch(`/suggestions/places/nearby?place=${placeId}&lat=28.6139&lng=77.2090`);

    if (!nearbyPlaces || nearbyPlaces.length === 0) {
        container.innerHTML = "No nearby Places found";
        return;
    }

    allPlaces = nearbyPlaces;

    // Get unique categories
    const categories = ["All", ...new Set(allPlaces.map(p => p.category))];

    // Create filter bar
    const filterBar = createElement("div", { id: "category-filter", class: "filter-bar" }, []);
    categories.forEach(category => {
        const button = createElement("button", {
            class: category === activeCategory ? "filter-button active" : "filter-button"
        }, [category]);

        button.addEventListener("click", () => {
            activeCategory = category;
            updateFilterButtons(filterBar, category); // Highlight selected filter
            renderPlaces(contentWrapper); // Re-render places
        });

        filterBar.appendChild(button);
    });

    container.appendChild(filterBar);

    // Create content wrapper
    const contentWrapper = createElement("div", { class: "hvflex", id: "places-wrapper" }, []);
    container.appendChild(contentWrapper);

    // Initial rendering
    renderPlaces(contentWrapper);
}

// Helper to update active filter button UI
function updateFilterButtons(filterBar, selectedCategory) {
    [...filterBar.children].forEach(btn => {
        btn.classList.toggle("active", btn.textContent === selectedCategory);
    });
}

// Renders places based on activeCategory
function renderPlaces(wrapper) {
    wrapper.innerHTML = "";

    const filtered = activeCategory === "All"
        ? allPlaces
        : allPlaces.filter(p => p.category === activeCategory);

    if (filtered.length === 0) {
        wrapper.appendChild(createElement("p", {}, ["No places available in this category."]));
        return;
    }

    filtered.forEach((place, index) => {
        wrapper.appendChild(placeCard(place, index));
    });
}

// Card component for each place
function placeCard(place, index = 0) {
    return createElement("div", { class: "nearby-item" }, [
        createElement("div", { class: "nearby-details" }, [
            createElement("h4", {}, [place.name]),
            createElement("p", {}, [`Category: ${place.category}`]),
            createElement("p", {}, [`Capacity: ${place.capacity || 1}`]),
            createElement("p", {}, [`⭐ Review Count: ${place.reviewCount}`]),
        ]),
        Button("View Details", `nearby-btn-${index}`, {
            click: () => navigate(`/place/${place.placeid}`),
        }),
    ]);
}

