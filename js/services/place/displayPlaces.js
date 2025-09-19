import { apigFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import { navigate } from "../../routes/index.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Imagex from "../../components/base/Imagex.js";
import { filterItems, sortItems } from "../../utils/listUtils.js";

export function displayPlaces(isLoggedIn, container) {
  renderPlacesPage(container);
}

async function renderPlacesPage(container) {
  container.replaceChildren();

  const layout = createElement("div", { class: "places-layout" });
  const main = createElement("div", { class: "places-main" });
  const aside = createElement("aside", { class: "places-aside" });
  container.appendChild(layout);
  layout.appendChild(main);
  layout.appendChild(aside);

  main.appendChild(createElement("h2", {}, ["All Places"]));

  // controls
  const controls = createElement("div", { class: "place-controls" });
  const searchInput = createElement("input", {
    type: "text",
    placeholder: "Search places...",
    class: "place-search"
  });
  const sortSelect = createElement("select", { class: "place-sort" }, [
    createElement("option", { value: "name" }, ["Sort by Name"]),
    createElement("option", { value: "capacity" }, ["Sort by Capacity"]),
    createElement("option", { value: "recent" }, ["Sort by Recent"]),
    createElement("option", { value: "popular" }, ["Sort by Popularity"])
  ]);
  controls.appendChild(searchInput);
  controls.appendChild(sortSelect);
  main.appendChild(controls);

  const chipContainer = createElement("div", { class: "category-chips" });
  main.appendChild(chipContainer);

  const content = createElement("div", {
    id: "places",
    class: "hvflex placelist-wrapper"
  });
  main.appendChild(content);

  // aside actions
  aside.appendChild(createElement("h3", {}, ["Actions"]));
  aside.appendChild(Button("Create Place", "btn-create-place", {
    click: () => navigate("/create-place")
  }, "buttonx primary"));
  aside.appendChild(Button("Create Itinerary", "btn-create-itinerary", {
    click: () => navigate("/itinerary")
  }, "buttonx primary"));
  aside.appendChild(Button("Manage Places", "btn-manage-places", {
    click: () => navigate("/places/manage")
  }, "buttonx secondary"));
  aside.appendChild(Button("Help / FAQ", "btn-help", {
    click: () => navigate("/help")
  }, "buttonx secondary"));

  try {
    const resp = await apigFetch("/places/places?page=1&limit=1000");
    const places = Array.isArray(resp) ? resp : [];

    if (places.length === 0) {
      content.appendChild(createElement("p", {}, ["No places available."]));
      return;
    }

    // categories for chips
    const categories = [...new Set(places.map(p => p.category).filter(Boolean))];
    const selectedCategory = { value: null };

    categories.forEach(cat => {
      const chip = createElement("button", {
        class: "category-chip",
        onclick: () => {
          selectedCategory.value = selectedCategory.value === cat ? null : cat;
          renderFilteredPlaces();
        }
      }, [cat]);
      chipContainer.appendChild(chip);
    });

    searchInput.addEventListener("input", renderFilteredPlaces);
    sortSelect.addEventListener("change", renderFilteredPlaces);

    function renderFilteredPlaces() {
      const keyword = searchInput.value;
      const sortBy = sortSelect.value;

      let filtered = filterItems(places, {
        keyword,
        category: selectedCategory.value,
        extraFilters: [
          p =>
            (p.short_desc || "").toLowerCase().includes(keyword.toLowerCase()) ||
            (p.address || "").toLowerCase().includes(keyword.toLowerCase())
        ]
      });

      filtered = sortItems(filtered, sortBy);

      content.replaceChildren();
      if (filtered.length === 0) {
        content.appendChild(createElement("p", {}, ["No matching places."]));
        return;
      }
      filtered.forEach(p => content.appendChild(createPlaceCard(p)));
    }

    renderFilteredPlaces();

  } catch (err) {
    console.error("Error fetching places", err);
    content.appendChild(
      createElement("p", { class: "error-text" }, ["Failed to load places."])
    );
  }
}

function createPlaceCard(place) {
  const bannerUrl = resolveImagePath(EntityType.PLACE, PictureType.THUMB, place.banner);
  const image = Imagex({
    src: bannerUrl,
    alt: `${place.name || "Unnamed"} Banner`,
    loading: "lazy"
  });
  image.onerror = () => {
    image.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.png");
  };

  const metaRow = createElement("div", {
    style: "display:flex;align-items:center;justify-content:space-between;margin-top:4px;"
  }, [
    createElement("span", { class: "badge" }, [place.category || "-"])
  ]);

  return createElement("div", { class: "place-card" }, [
    createElement("a", {
      href: `/place/${place.placeid}`,
      style: "text-decoration:none;color:inherit;display:block;"
    }, [
      image,
      createElement("div", { class: "place-info" }, [
        createElement("h2", {}, [place.name || "Unnamed Place"]),
        createElement("p", {}, [place.address || "-"]),
        createElement("p", {}, [place.short_desc || "-"]),
        metaRow
      ])
    ])
  ]);
}
