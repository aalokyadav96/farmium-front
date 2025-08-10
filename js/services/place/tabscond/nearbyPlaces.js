import { apiFetch } from "../../../api/api";
import { createElement } from "../../../components/createElement";
import Button from "../../../components/base/Button";
import { navigate } from "../../../routes";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";

let allPlaces = [];
let activeCategory = "All";
let placeCardsCache = {}; // category => array of card elements

export async function displayPlaceNearby(container, placeId) {
    clearElement(container);

    const nearbyPlaces = await apiFetch(`/suggestions/places/nearby?place=${placeId}&lat=28.6139&lng=77.2090`);
    if (!Array.isArray(nearbyPlaces) || nearbyPlaces.length === 0) {
        container.appendChild(createElement("p", {}, ["No nearby Places found."]));
        return;
    }

    allPlaces = nearbyPlaces;
    const categories = getCategories(allPlaces);

    const filterBar = buildFilterBar(categories);
    const contentWrapper = createElement("div", { class: "hvflex", id: "places-wrapper" }, []);

    container.appendChild(filterBar);
    container.appendChild(contentWrapper);

    buildPlaceCardsCache();
    showCategory(activeCategory, contentWrapper);
}

function clearElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
}

function getCategories(places) {
    return ["All", ...new Set(places.map(p => p.category || "Uncategorized"))];
}

function buildFilterBar(categories) {
    const filterBar = createElement("div", { id: "category-filter", class: "filter-bar" }, []);
    categories.forEach(category => {
        const button = createElement("button", {
            class: category === activeCategory ? "filter-button buttonx active" : "filter-button buttonx"
        }, [category]);

        button.addEventListener("click", () => {
            if (activeCategory === category) return;
            activeCategory = category;
            updateFilterButtons(filterBar, category);
            const wrapper = document.getElementById("places-wrapper");
            if (wrapper) showCategory(category, wrapper);
        });

        filterBar.appendChild(button);
    });
    return filterBar;
}

function updateFilterButtons(filterBar, selectedCategory) {
    [...filterBar.children].forEach(btn => {
        btn.classList.toggle("active", btn.textContent === selectedCategory);
    });
}

function buildPlaceCardsCache() {
    placeCardsCache = {};

    const allCategoryCards = allPlaces.map((place, index) => placeCard(place, index));
    placeCardsCache["All"] = allCategoryCards;

    const categories = getCategories(allPlaces).filter(c => c !== "All");
    categories.forEach(category => {
        placeCardsCache[category] = allCategoryCards.filter(card =>
            card.dataset.category === category
        );
    });
}

function showCategory(category, wrapper) {
    clearElement(wrapper);

    const cards = placeCardsCache[category] || [];
    if (cards.length === 0) {
        wrapper.appendChild(createElement("p", {}, ["No places available in this category."]));
        return;
    }

    cards.forEach(card => {
        wrapper.appendChild(card);
    });
}

function placeCard(place, index = 0) {
    // const imgSrc = place.imageUrl || "/images/place-placeholder.jpg";
    const imgSrc = resolveImagePath(EntityType.PLACE, PictureType.THUMB, place.banner);

    const card = createElement("div", {
        class: "nearby-item",
        "data-category": place.category || "Uncategorized"
    }, [
        createElement("div", { class: "nearby-image" }, [
            createElement("img", { src: imgSrc, alt: place.name || "Place Image" }, [])
        ]),
        createElement("div", { class: "nearby-details" }, [
            createElement("h4", {}, [place.name || "Unnamed Place"]),
            createElement("p", {}, [`Category: ${place.category || "Unknown"}`]),
            createElement("p", {}, [`Capacity: ${place.capacity ?? 1}`]),
            createElement("p", {}, [`⭐ Review Count: ${place.reviewCount ?? 0}`]),
        ]),
        Button("View Details", `nearby-btn-${index}`, {
            click: () => navigate(`/place/${place.placeid}`)
        }),
    ]);

    return card;
}
