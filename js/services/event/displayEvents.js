import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { SRC_URL } from "../../state/state.js";

export function displayEvents(isLoggedIn, container) {
  renderEventsPage(container);
}

async function renderEventsPage(layout) {
  // container.innerHTML = "";
  // const layout = createElement("div", { class: "events-layout" }, []);
  // container.appendChild(layout);

  const aside = createElement("aside", { class: "events-sidebar" }, []);
  const main = createElement("div", { class: "events-main" }, []);
  layout.appendChild(main);
  layout.appendChild(aside);

  const heading = createElement("h2", {}, ["All Events"]);
  main.appendChild(heading);

  const controls = createElement("div", { class: "event-controls" }, []);
  main.appendChild(controls);

  const searchInput = createElement("input", {
    type: "text",
    placeholder: "Search events...",
    class: "event-search"
  });
  controls.appendChild(searchInput);

  const sortSelect = createElement("select", { class: "event-sort" }, [
    createElement("option", { value: "date" }, ["Sort by Date"]),
    createElement("option", { value: "price" }, ["Sort by Price"]),
    createElement("option", { value: "title" }, ["Sort by Title"])
  ]);
  controls.appendChild(sortSelect);

  const chipContainer = createElement("div", { class: "category-chips" }, []);
  main.appendChild(chipContainer);

  const content = createElement("div", {
    id: "events",
    class: "hvflex"
  });
  main.appendChild(content);

  try {
    const resp = await apiFetch("/events/events?page=1&limit=1000");
    const events = Array.isArray(resp.events) ? resp.events : [];

    if (events.length === 0) {
      content.appendChild(createElement("p", {}, ["No events available."]));
      return;
    }

    const categories = [...new Set(events.map(ev => ev.category).filter(Boolean))];
    const selectedCategory = { value: null };

    categories.forEach(cat => {
      const chip = createElement("button", {
        class: "category-chip",
        onclick: () => {
          selectedCategory.value = selectedCategory.value === cat ? null : cat;
          renderFilteredEvents();
        }
      }, [cat]);
      chipContainer.appendChild(chip);
    });

    searchInput.addEventListener("input", renderFilteredEvents);
    sortSelect.addEventListener("change", renderFilteredEvents);

    function renderFilteredEvents() {
      const keyword = searchInput.value.toLowerCase();
      const sortBy = sortSelect.value;
      const filtered = events
        .filter(ev => {
          const matchesCategory = !selectedCategory.value || ev.category === selectedCategory.value;
          const matchesKeyword = ev.title.toLowerCase().includes(keyword);
          return matchesCategory && matchesKeyword;
        })
        .sort((a, b) => {
          if (sortBy === "date") return new Date(a.date) - new Date(b.date);
          if (sortBy === "price") {
            const priceA = Math.min(...(a.prices || [0]));
            const priceB = Math.min(...(b.prices || [0]));
            return priceA - priceB;
          }
          if (sortBy === "title") return a.title.localeCompare(b.title);
          return 0;
        });

      content.innerHTML = "";
      filtered.forEach(ev => content.appendChild(createEventCard(ev)));
    }

    aside.appendChild(
      createElement("div", { class: "sidebar-cta" }, [
        createElement("h3", {}, ["Actions"]),
        Button("Create Event", "crt-evnt", { click: () => {navigate("/create-event")}}),
        createElement("a", { href: "/my-events", class: "cta-btn" }, ["My Events"]),
        createElement("a", { href: "/event-calendar", class: "cta-btn" }, ["Event Calendar"]),
        Button("Browse Artists","artsts-brws", {
          click: () => {navigate("/artists");}
        })
      ])
    );

    renderFilteredEvents();

  } catch (err) {
    console.error("Error fetching events", err);
    content.appendChild(
      createElement("p", { class: "error-text" }, ["Failed to load events."])
    );
  }
}

function createEventCard(ev) {
  const minPrice = Array.isArray(ev.prices) ? Math.min(...ev.prices) : 0;
  const currency = ev.currency || "USD";
  const priceDisplay = minPrice > 0 ? `${currency} ${minPrice}` : "Free";

  return createElement("div", { class: "event-card" }, [
    createElement("a", {
      href: `/event/${ev.eventid}`,
      class: "event-link"
    }, [
      createElement("img", {
        src: `${SRC_URL}/eventpic/banner/thumb/${ev.banner_image}`,
        alt: `${ev.title} Banner`,
        loading: "lazy",
        style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
      }),
      createElement("div", { class: "event-info" }, [
        createElement("h3", {}, [ev.title]),
        createElement("p", {}, [
          createElement("strong", {}, ["Date: "]),
          new Date(ev.date).toLocaleString()
        ]),
        createElement("p", {}, [
          createElement("strong", {}, ["Place: "]),
          ev.placename || "-"
        ]),
        createElement("p", {}, [
          createElement("strong", {}, ["Category: "]),
          ev.category || "-"
        ]),
        createElement("p", {}, [
          createElement("strong", {}, ["Price: "]),
          priceDisplay
        ])
      ])
    ])
  ]);
}

export { renderEventsPage };

// import { apiFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";
// import { SRC_URL } from "../../state/state.js";
// import { displayEvent } from "./eventService.js";

// export function displayEvents(isLoggedIn, container) {
//   renderEventsPage(container);
// }

// /**
//  * Display a simple list of events.
//  * @param {HTMLElement} container
//  */
// async function renderEventsPage(container) {
//   container.innerHTML = "";

//   const heading = createElement("h2", {}, ["All Events"]);
//   container.appendChild(heading);

//   const content = createElement("div", {
//     id: "events",
//     class: "hvflex"
//   });
//   container.appendChild(content);

//   try {
//     const resp = await apiFetch("/events/events?page=1&limit=1000");
//     const events = Array.isArray(resp.events) ? resp.events : [];

//     if (events.length === 0) {
//       content.appendChild(createElement("p", {}, ["No events available."]));
//       return;
//     }

//     events.forEach(event => {
//       content.appendChild(createEventCard(event));
//     });

//   } catch (err) {
//     console.error("Error fetching events", err);
//     content.appendChild(
//       createElement("p", { class: "error-text" }, ["Failed to load events."])
//     );
//   }
// }

// /**
//  * Create event card from single event object
//  */
// function createEventCard(ev) {
//   const minPrice = Array.isArray(ev.prices) ? Math.min(...ev.prices) : 0;
//   const currency = ev.currency || "USD";
//   const priceDisplay = minPrice > 0 ? `${currency} ${minPrice}` : "Free";

//   return createElement("div", { class: "event-card" }, [
//     createElement("a", {
//       href: `/event/${ev.eventid}`,
//       class: "event-link"
//     }, [
//       createElement("img", {
//         src: `${SRC_URL}/eventpic/banner/thumb/${ev.banner_image}`,
//         alt: `${ev.title} Banner`,
//         loading: "lazy",
//         style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
//       }),
//       createElement("div", { class: "event-info" }, [
//         createElement("h3", {}, [ev.title]),
//         createElement("p", {}, [
//           createElement("strong", {}, ["Date: "]),
//           new Date(ev.date).toLocaleString()
//         ]),
//         createElement("p", {}, [
//           createElement("strong", {}, ["Place: "]),
//           ev.placename || "-"
//         ]),
//         createElement("p", {}, [
//           createElement("strong", {}, ["Category: "]),
//           ev.category || "-"
//         ]),
//         createElement("p", {}, [
//           createElement("strong", {}, ["Price: "]),
//           priceDisplay
//         ])
//       ])
//     ])
//   ]);
// }

// export { renderEventsPage };
