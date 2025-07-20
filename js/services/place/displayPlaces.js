import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { SRC_URL } from "../../state/state.js";
import { Button } from "../../components/base/Button.js"; // as per your setup

export function displayPlaces(isLoggedIn, contentA) {
  renderPlacesPage(contentA);
}

async function renderPlacesPage(container) {
  container.innerHTML = "";

  // Two-column layout container
  const layout = createElement("div", {
    class: "places-layout",
  });

  const main = createElement("div", {
    "class": "places-main",
  });

  const aside = createElement("aside", {
    "class": "palces-aside",
  });

  container.appendChild(layout);
  layout.appendChild(main);
  layout.appendChild(aside);

  const heading = createElement("h2", {}, ["All Places"]);
  main.appendChild(heading);

  const controls = createElement("div", { class: "place-controls" }, []);
  main.appendChild(controls);

  const searchInput = createElement("input", {
    type: "text",
    placeholder: "Search places...",
    class: "place-search"
  });
  controls.appendChild(searchInput);

  const sortSelect = createElement("select", { class: "place-sort" }, [
    createElement("option", { value: "name" }, ["Sort by Name"]),
    createElement("option", { value: "capacity" }, ["Sort by Capacity"])
  ]);
  controls.appendChild(sortSelect);

  const chipContainer = createElement("div", { class: "category-chips" }, []);
  main.appendChild(chipContainer);

  const content = createElement("div", {
    id: "places",
    class: "hvflex"
  });
  main.appendChild(content);

  // ASIDE CTA BUTTONS
  aside.appendChild(Button("Create Itinerary", "btn-create-itinerary", {
    click: () => {
      // window.location.href = "/itinerary/create";
      window.location.href = "/itinerary";
    }
  }, "buttonx primary"));

  aside.appendChild(Button("Manage Places", "btn-manage-places", {
    click: () => {
      window.location.href = "/places/manage";
    }
  }, "buttonx secondary"));

  aside.appendChild(Button("Help / FAQ", "btn-help", {
    click: () => {
      window.location.href = "/help";
    }
  }, "buttonx secondary"));

  try {
    const resp = await apiFetch("/places/places?page=1&limit=1000");
    const places = Array.isArray(resp) ? resp : [];

    if (places.length === 0) {
      content.appendChild(createElement("p", {}, ["No places available."]));
      return;
    }

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
      const keyword = searchInput.value.toLowerCase();
      const sortBy = sortSelect.value;

      const filtered = places
        .filter(p => {
          const matchesCategory = !selectedCategory.value || p.category === selectedCategory.value;
          const matchesKeyword =
            (p.name || "").toLowerCase().includes(keyword) ||
            (p.description || "").toLowerCase().includes(keyword);
          return matchesCategory && matchesKeyword;
        })
        .sort((a, b) => {
          if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
          if (sortBy === "capacity") return (a.capacity || 0) - (b.capacity || 0);
          return 0;
        });

      content.innerHTML = "";
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
  const bannerUrl = place.banner
    ? `${SRC_URL}/placepic/thumb/${place.banner}`
    : `${SRC_URL}/defaults/placeholder.png`;

  const cardContent = createElement("div", { class: "place-card" }, [
    createElement("img", {
      src: bannerUrl,
      alt: `${place.name || "Unnamed"} Banner`,
      loading: "lazy",
      style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
    }),
    createElement("div", { class: "place-info" }, [
      createElement("h3", {}, [place.name || "Unnamed Place"]),
      createElement("p", {}, [
        createElement("strong", {}, ["Description: "]),
        place.description || "-"
      ]),
      createElement("p", {}, [
        createElement("strong", {}, ["Address: "]),
        place.address || "-"
      ]),
      createElement("p", {}, [
        createElement("strong", {}, ["Capacity: "]),
        place.capacity != null ? place.capacity : "-"
      ]),
      createElement("p", {}, [
        createElement("strong", {}, ["Category: "]),
        place.category || "-"
      ])
    ])
  ]);

  // Wrap the card in a link to its place page
  return createElement("a", {
    href: `/place/${place.placeid}`,
    style: "text-decoration:none;color:inherit;"
  }, [cardContent]);
}
