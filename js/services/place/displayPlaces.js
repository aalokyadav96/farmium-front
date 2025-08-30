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
  container.innerHTML = "";

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

      content.innerHTML = "";
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

// import { apigFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";
// import { SRC_URL } from "../../state/state.js";
// import { Button } from "../../components/base/Button.js";
// import { navigate } from "../../routes/index.js";
// import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
// import Imagex from "../../components/base/Imagex.js";

// export function displayPlaces(isLoggedIn, container) {
//   renderPlacesPage(container);
// }

// async function renderPlacesPage(container) {
//   container.innerHTML = "";

//   const layout = createElement("div", { class: "places-layout" });
//   const main = createElement("div", { class: "places-main" });
//   const aside = createElement("aside", { class: "places-aside" });
//   container.appendChild(layout);
//   layout.appendChild(main);
//   layout.appendChild(aside);

//   const heading = createElement("h2", {}, ["All Places"]);
//   main.appendChild(heading);

//   const controls = createElement("div", { class: "place-controls" });
//   main.appendChild(controls);

//   const searchInput = createElement("input", {
//     type: "text",
//     placeholder: "Search places...",
//     class: "place-search"
//   });
//   controls.appendChild(searchInput);

//   const sortSelect = createElement("select", { class: "place-sort" }, [
//     createElement("option", { value: "name" }, ["Sort by Name"]),
//     createElement("option", { value: "capacity" }, ["Sort by Capacity"]),
//     createElement("option", { value: "recent" }, ["Sort by Recent"]),
//     createElement("option", { value: "popular" }, ["Sort by Popularity"])
//   ]);
//   controls.appendChild(sortSelect);

//   // const viewToggle = Button("Toggle View", "btn-toggle-view", {}, "buttonx secondary");
//   // controls.appendChild(viewToggle);

//   const chipContainer = createElement("div", { class: "category-chips" });
//   main.appendChild(chipContainer);

//   const content = createElement("div", {
//     id: "places",
//     class: "hvflex placelist-wrapper"
//   });
//   main.appendChild(content);

//   aside.appendChild(createElement("h3", {}, ["Actions"]));

//   aside.appendChild(Button("Create Place", "btn-create-place", {
//     click: () => navigate("/create-place")
//   }, "buttonx primary"));

//   aside.appendChild(Button("Create Itinerary", "btn-create-itinerary", {
//     click: () => navigate("/itinerary")
//   }, "buttonx primary"));

//   aside.appendChild(Button("Manage Places", "btn-manage-places", {
//     click: () => navigate("/places/manage")
//   }, "buttonx secondary"));

//   aside.appendChild(Button("Help / FAQ", "btn-help", {
//     click: () => navigate("/help")
//   }, "buttonx secondary"));

//   try {
//     const resp = await apigFetch("/places/places?page=1&limit=1000");
//     const places = Array.isArray(resp) ? resp : [];

//     if (places.length === 0) {
//       content.appendChild(createElement("p", {}, ["No places available."]));
//       return;
//     }

//     // extract unique categories for filter chips
//     const categories = [...new Set(places.map(p => p.category).filter(Boolean))];
//     const selectedCategory = { value: null };
//     let gridView = true;

//     categories.forEach(cat => {
//       const chip = createElement("button", {
//         class: "category-chip",
//         onclick: () => {
//           selectedCategory.value = selectedCategory.value === cat ? null : cat;
//           renderFilteredPlaces();
//         }
//       }, [cat]);
//       chipContainer.appendChild(chip);
//     });

//     searchInput.addEventListener("input", renderFilteredPlaces);
//     sortSelect.addEventListener("change", renderFilteredPlaces);
//     // viewToggle.addEventListener("click", () => {
//     //   gridView = !gridView;
//     //   content.className = gridView ? "hvflex" : "listview";
//     //   renderFilteredPlaces();
//     // });

//     function renderFilteredPlaces() {
//       const keyword = searchInput.value.toLowerCase();
//       const sortBy = sortSelect.value;

//       const filtered = places
//         .filter(p => {
//           const matchesCategory = !selectedCategory.value || p.category === selectedCategory.value;
//           const matchesKeyword =
//             (p.name || "").toLowerCase().includes(keyword) ||
//             (p.short_desc || "").toLowerCase().includes(keyword) ||
//             (p.address || "").toLowerCase().includes(keyword);
//           return matchesCategory && matchesKeyword;
//         })
//         .sort((a, b) => {
//           if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
//           if (sortBy === "capacity") return (a.capacity || 0) - (b.capacity || 0);
//           if (sortBy === "recent") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
//           if (sortBy === "popular") return (b.views || 0) - (a.views || 0);
//           return 0;
//         });

//       content.innerHTML = "";

//       if (filtered.length === 0) {
//         content.appendChild(createElement("p", {}, ["No matching places."]));
//         return;
//       }

//       filtered.forEach(p => content.appendChild(createPlaceCard(p)));
//     }

//     renderFilteredPlaces();

//   } catch (err) {
//     console.error("Error fetching places", err);
//     content.appendChild(
//       createElement("p", { class: "error-text" }, ["Failed to load places."])
//     );
//   }
// }

// function createPlaceCard(place) {
//   // Resolve banner image url, fallback to placeholder
//   // const bannerUrl = place.banner
//   //   ? resolveImagePath(EntityType.PLACE, PictureType.THUMB, place.banner)
//   //   : resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.png");
//   const bannerUrl = resolveImagePath(EntityType.PLACE, PictureType.THUMB, place.banner);

//   const image = Imagex({
//     src: bannerUrl,
//     alt: `${place.name || "Unnamed"} Banner`,
//     loading: "lazy",
//   });

//   // const image = createElement("img", {
//   //   src: bannerUrl,
//   //   alt: `${place.name || "Unnamed"} Banner`,
//   //   loading: "lazy",
//   //   style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
//   // });

//   image.onerror = () => {
//     image.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.png");
//   };

//   const metaRow = createElement("div", {
//     style: "display:flex;align-items:center;justify-content:space-between;margin-top:4px;"
//   }, [
//     createElement("span", { class: "badge" }, [place.category || "-"])
//   ]);

//   return createElement("div", { class: "place-card" }, [
//     createElement("a", {
//       href: `/place/${place.placeid}`,
//       style: "text-decoration:none;color:inherit;display:block;"
//     }, [
//       image,
//       createElement("div", { class: "place-info" }, [
//         createElement("h2", {}, [place.name || "Unnamed Place"]),
//         createElement("p", {}, [
//           createElement("span", {}, [place.address || "-"]),
//         ]),
//       createElement("p", {}, [place.short_desc || "-"]),
//       metaRow,
//       ]),
//     ]),
//   ]);
// }
