import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { SRC_URL } from "../../state/state.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

export function displayEvents(isLoggedIn, container) {
  renderEventsPage(container);
}

async function renderEventsPage(layout) {
  const aside = createElement("aside", { class: "events-sidebar" }, []);
  const main = createElement("div", { class: "events-main" }, []);
  layout.appendChild(main);
  layout.appendChild(aside);

  aside.appendChild(
    createElement("div", { class: "sidebar-cta" }, [
      createElement("h3", {}, ["Actions"]),
      Button("Create Event", "crt-evnt", { click: () => navigate("/create-event") }),
      createElement("a", { href: "/my-events", class: "cta-btn" }, ["My Events"]),
      createElement("a", { href: "/event-calendar", class: "cta-btn" }, ["Event Calendar"]),
      Button("Browse Artists", "artsts-brws", { click: () => navigate("/artists") })
    ])
  );

  main.appendChild(createElement("h2", {}, ["All Events"]));

  const controls = createElement("div", { class: "event-controls" }, []);
  const searchInput = createElement("input", {
    type: "text",
    placeholder: "Search events...",
    class: "event-search"
  });
  const sortSelect = createElement("select", { class: "event-sort" }, [
    createElement("option", { value: "date" }, ["Sort by Date"]),
    createElement("option", { value: "price" }, ["Sort by Price"]),
    createElement("option", { value: "title" }, ["Sort by Title"])
  ]);
  controls.appendChild(searchInput);
  controls.appendChild(sortSelect);
  main.appendChild(controls);

  const chipContainer = createElement("div", { class: "category-chips" }, []);
  main.appendChild(chipContainer);

  const content = createElement("div", { id: "events", class: "hvflex" });
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
          const matchesKeyword =
            (ev.title?.toLowerCase() || "").includes(keyword) ||
            (ev.placename?.toLowerCase() || "").includes(keyword);
          return matchesCategory && matchesKeyword;
        })
        .sort((a, b) => {
          if (sortBy === "date") return new Date(a.date || 0) - new Date(b.date || 0);
          if (sortBy === "price") {
            const priceA = Math.min(...(a.prices || [0]));
            const priceB = Math.min(...(b.prices || [0]));
            return priceA - priceB;
          }
          if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
          return 0;
        });

      content.innerHTML = "";

      if (filtered.length === 0) {
        content.appendChild(createElement("p", {}, ["No matching events found."]));
        return;
      }

      filtered.forEach(ev => content.appendChild(createEventCard(ev)));
    }

    renderFilteredEvents();

  } catch (err) {
    console.error("Error fetching events", err);
    content.appendChild(createElement("p", { class: "error-text" }, ["Failed to load events."]));
  }
}

function createEventCard(ev) {
  const minPrice = Array.isArray(ev.prices) ? Math.min(...ev.prices) : 0;
  const currency = ev.currency || "USD";
  const priceDisplay = minPrice > 0 ? `${currency} ${minPrice}` : "Free";

  const now = Date.now();
  const isPast = new Date(ev.date).getTime() < now;

  const savedEvents = getSavedEvents();
  let isSaved = savedEvents.includes(ev.eventid);

  const bannerFilename = ev.banner_image || "placeholder.png";
  const bannerUrl = resolveImagePath(EntityType.EVENT, PictureType.THUMB, bannerFilename);

  const saveToggle = createElement("span", {
    title: "Save Event",
    style: `cursor:pointer;font-size:18px;color:${isSaved ? "gold" : "gray"};margin-left:auto;`,
    onclick: (e) => {
      e.preventDefault();
      e.stopPropagation();

      toggleSaveEvent(ev.eventid);
      isSaved = !isSaved;
      saveToggle.textContent = isSaved ? "★" : "☆";
      saveToggle.style.color = isSaved ? "gold" : "gray";
    }
  }, [isSaved ? "★" : "☆"]);

  const shareBtn = createElement("button", {
    type: "button",
    style: "font-size:12px;margin-top:4px;",
    onclick: (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(`${location.origin}/event/${ev.eventid}`);
      shareBtn.textContent = "Link Copied";
      setTimeout(() => shareBtn.textContent = "Share", 1500);
    }
  }, ["Share"]);

  const statusLabel = createElement("span", {
    style: `font-size:0.75rem;padding:2px 6px;border-radius:4px;background:${isPast ? "#888" : "#28a745"};color:white;margin-left:8px;`
  }, [isPast ? "Past" : "Upcoming"]);

  const bannerImg = createElement("img", {
    src: bannerUrl,
    alt: `${ev.title || "Event"} Banner`,
    loading: "lazy",
    style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
  });

  bannerImg.onerror = () => {
    bannerImg.src = resolveImagePath(EntityType.DEFAULT, PictureType.THUMB, "placeholder.png");
  };

  const eventLink = createElement("a", {
    href: `/event/${ev.eventid}`,
    class: "event-link"
  }, [
    bannerImg,
    createElement("div", { class: "event-info" }, [
      createElement("div", {
        style: "display:flex;align-items:center;gap:8px;"
      }, [
        createElement("h3", {}, [ev.title || "Untitled"]),
        statusLabel,
        saveToggle
      ]),
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
      ]),
      shareBtn
    ])
  ]);

  return createElement("div", { class: "event-card" }, [eventLink]);
}

// function createEventCard(ev) {
//   const minPrice = Array.isArray(ev.prices) ? Math.min(...ev.prices) : 0;
//   const currency = ev.currency || "USD";
//   const priceDisplay = minPrice > 0 ? `${currency} ${minPrice}` : "Free";

//   const now = Date.now();
//   const isPast = new Date(ev.date).getTime() < now;

//   const saved = getSavedEvents().includes(ev.eventid);
//   const bannerUrl = `${SRC_URL}/eventpic/banner/thumb/${ev.banner_image}`;

//   const saveToggle = createElement("span", {
//     title: "Save Event",
//     style: `cursor:pointer;font-size:18px;color:${saved ? "gold" : "gray"};margin-left:auto;`,
//     onclick: (e) => {
//       e.stopPropagation();
//       e.preventDefault();
//       toggleSaveEvent(ev.eventid);
//       saveToggle.textContent = getSavedEvents().includes(ev.eventid) ? "★" : "☆";
//       saveToggle.style.color = getSavedEvents().includes(ev.eventid) ? "gold" : "gray";
//     }
//   }, [saved ? "★" : "☆"]);

//   const shareBtn = createElement("button", {
//     type: "button",
//     style: "font-size:12px;margin-top:4px;",
//     onclick: (e) => {
//       e.preventDefault();
//       navigator.clipboard.writeText(location.origin + `/event/${ev.eventid}`);
//       shareBtn.textContent = "Link Copied";
//       setTimeout(() => shareBtn.textContent = "Share", 1500);
//     }
//   }, ["Share"]);

//   const statusLabel = createElement("span", {
//     style: `font-size:0.75rem;padding:2px 6px;border-radius:4px;background:${isPast ? "#888" : "#28a745"};color:white;margin-left:8px;`
//   }, [isPast ? "Past" : "Upcoming"]);

//   return createElement("div", { class: "event-card" }, [
//     createElement("a", {
//       href: `/event/${ev.eventid}`,
//       class: "event-link"
//     }, [
//       createElement("img", {
//         src: bannerUrl,
//         alt: `${ev.title} Banner`,
//         loading: "lazy",
//         style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
//       }),
//       createElement("div", { class: "event-info" }, [
//         createElement("div", {
//           style: "display:flex;align-items:center;gap:8px;"
//         }, [
//           createElement("h3", {}, [ev.title || "Untitled"]),
//           statusLabel,
//           saveToggle
//         ]),
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
//         ]),
//         shareBtn
//       ])
//     ])
//   ]);
// }

function getSavedEvents() {
  try {
    return JSON.parse(localStorage.getItem("saved_events") || "[]");
  } catch {
    return [];
  }
}

function toggleSaveEvent(id) {
  let saved = getSavedEvents();
  if (saved.includes(id)) {
    saved = saved.filter(eid => eid !== id);
  } else {
    saved.push(id);
  }
  localStorage.setItem("saved_events", JSON.stringify(saved));
}

export { renderEventsPage };

// import { apiFetch } from "../../api/api.js";
// import Button from "../../components/base/Button.js";
// import { createElement } from "../../components/createElement.js";
// import { navigate } from "../../routes/index.js";
// import { SRC_URL } from "../../state/state.js";

// export function displayEvents(isLoggedIn, container) {
//   renderEventsPage(container);
// }

// async function renderEventsPage(layout) {
//   // container.innerHTML = "";
//   // const layout = createElement("div", { class: "events-layout" }, []);
//   // container.appendChild(layout);

//   const aside = createElement("aside", { class: "events-sidebar" }, []);
//   const main = createElement("div", { class: "events-main" }, []);
//   layout.appendChild(main);
//   layout.appendChild(aside);

//   aside.appendChild(
//     createElement("div", { class: "sidebar-cta" }, [
//       createElement("h3", {}, ["Actions"]),
//       Button("Create Event", "crt-evnt", { click: () => {navigate("/create-event")}}),
//       createElement("a", { href: "/my-events", class: "cta-btn" }, ["My Events"]),
//       createElement("a", { href: "/event-calendar", class: "cta-btn" }, ["Event Calendar"]),
//       Button("Browse Artists","artsts-brws", {
//         click: () => {navigate("/artists");}
//       })
//     ])
//   );

//   const heading = createElement("h2", {}, ["All Events"]);
//   main.appendChild(heading);

//   const controls = createElement("div", { class: "event-controls" }, []);
//   main.appendChild(controls);

//   const searchInput = createElement("input", {
//     type: "text",
//     placeholder: "Search events...",
//     class: "event-search"
//   });
//   controls.appendChild(searchInput);

//   const sortSelect = createElement("select", { class: "event-sort" }, [
//     createElement("option", { value: "date" }, ["Sort by Date"]),
//     createElement("option", { value: "price" }, ["Sort by Price"]),
//     createElement("option", { value: "title" }, ["Sort by Title"])
//   ]);
//   controls.appendChild(sortSelect);

//   const chipContainer = createElement("div", { class: "category-chips" }, []);
//   main.appendChild(chipContainer);

//   const content = createElement("div", {
//     id: "events",
//     class: "hvflex"
//   });
//   main.appendChild(content);

//   try {
//     const resp = await apiFetch("/events/events?page=1&limit=1000");
//     const events = Array.isArray(resp.events) ? resp.events : [];

//     if (events.length === 0) {
//       content.appendChild(createElement("p", {}, ["No events available."]));
//       return;
//     }

//     const categories = [...new Set(events.map(ev => ev.category).filter(Boolean))];
//     const selectedCategory = { value: null };

//     categories.forEach(cat => {
//       const chip = createElement("button", {
//         class: "category-chip",
//         onclick: () => {
//           selectedCategory.value = selectedCategory.value === cat ? null : cat;
//           renderFilteredEvents();
//         }
//       }, [cat]);
//       chipContainer.appendChild(chip);
//     });

//     searchInput.addEventListener("input", renderFilteredEvents);
//     sortSelect.addEventListener("change", renderFilteredEvents);

//     function renderFilteredEvents() {
//       const keyword = searchInput.value.toLowerCase();
//       const sortBy = sortSelect.value;
//       const filtered = events
//         .filter(ev => {
//           const matchesCategory = !selectedCategory.value || ev.category === selectedCategory.value;
//           const matchesKeyword = ev.title.toLowerCase().includes(keyword);
//           return matchesCategory && matchesKeyword;
//         })
//         .sort((a, b) => {
//           if (sortBy === "date") return new Date(a.date) - new Date(b.date);
//           if (sortBy === "price") {
//             const priceA = Math.min(...(a.prices || [0]));
//             const priceB = Math.min(...(b.prices || [0]));
//             return priceA - priceB;
//           }
//           if (sortBy === "title") return a.title.localeCompare(b.title);
//           return 0;
//         });

//       content.innerHTML = "";
//       filtered.forEach(ev => content.appendChild(createEventCard(ev)));
//     }

//     renderFilteredEvents();

//   } catch (err) {
//     console.error("Error fetching events", err);
//     content.appendChild(
//       createElement("p", { class: "error-text" }, ["Failed to load events."])
//     );
//   }
// }

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

// // import { apiFetch } from "../../api/api.js";
// // import { createElement } from "../../components/createElement.js";
// // import { SRC_URL } from "../../state/state.js";
// // import { displayEvent } from "./eventService.js";

// // export function displayEvents(isLoggedIn, container) {
// //   renderEventsPage(container);
// // }

// // /**
// //  * Display a simple list of events.
// //  * @param {HTMLElement} container
// //  */
// // async function renderEventsPage(container) {
// //   container.innerHTML = "";

// //   const heading = createElement("h2", {}, ["All Events"]);
// //   container.appendChild(heading);

// //   const content = createElement("div", {
// //     id: "events",
// //     class: "hvflex"
// //   });
// //   container.appendChild(content);

// //   try {
// //     const resp = await apiFetch("/events/events?page=1&limit=1000");
// //     const events = Array.isArray(resp.events) ? resp.events : [];

// //     if (events.length === 0) {
// //       content.appendChild(createElement("p", {}, ["No events available."]));
// //       return;
// //     }

// //     events.forEach(event => {
// //       content.appendChild(createEventCard(event));
// //     });

// //   } catch (err) {
// //     console.error("Error fetching events", err);
// //     content.appendChild(
// //       createElement("p", { class: "error-text" }, ["Failed to load events."])
// //     );
// //   }
// // }

// // /**
// //  * Create event card from single event object
// //  */
// // function createEventCard(ev) {
// //   const minPrice = Array.isArray(ev.prices) ? Math.min(...ev.prices) : 0;
// //   const currency = ev.currency || "USD";
// //   const priceDisplay = minPrice > 0 ? `${currency} ${minPrice}` : "Free";

// //   return createElement("div", { class: "event-card" }, [
// //     createElement("a", {
// //       href: `/event/${ev.eventid}`,
// //       class: "event-link"
// //     }, [
// //       createElement("img", {
// //         src: `${SRC_URL}/eventpic/banner/thumb/${ev.banner_image}`,
// //         alt: `${ev.title} Banner`,
// //         loading: "lazy",
// //         style: "width:100%;aspect-ratio:16/9;object-fit:cover;"
// //       }),
// //       createElement("div", { class: "event-info" }, [
// //         createElement("h3", {}, [ev.title]),
// //         createElement("p", {}, [
// //           createElement("strong", {}, ["Date: "]),
// //           new Date(ev.date).toLocaleString()
// //         ]),
// //         createElement("p", {}, [
// //           createElement("strong", {}, ["Place: "]),
// //           ev.placename || "-"
// //         ]),
// //         createElement("p", {}, [
// //           createElement("strong", {}, ["Category: "]),
// //           ev.category || "-"
// //         ]),
// //         createElement("p", {}, [
// //           createElement("strong", {}, ["Price: "]),
// //           priceDisplay
// //         ])
// //       ])
// //     ])
// //   ]);
// // }

// // export { renderEventsPage };
