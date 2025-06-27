// src/pages/farms/Home.js
import { navigate } from "../../routes/index.js";
import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";

const LEFT_WIDGETS = [
  {
    id: "top-farms",
    title: "🚜 Top Farms",
    endpoint: "/home/farms",
    render: data => data.map(f =>
      liLink(f.name, `#/farm/${f.id}`)
    )
  },
  {
    id: "categories",
    title: "📂 Farm Categories",
    endpoint: "/home/categories",
    render: data => data.map(cat =>
      liLink(cat, `#/farms?category=${encodeURIComponent(cat)}`)
    )
  },
  {
    id: "offers",
    title: "💰 Special Offers",
    endpoint: "/home/offers",
    render: data => data.map(o =>
      createElement("div", { class: "offer-card" }, [
        createElement("h4", {}, [o.title]),
        createElement("p", {}, [`Ends on ${new Date(o.endsAt).toLocaleDateString()}`]),
        createElement("button", {
          onclick: () => navigate(`#/offer/${o.id}`)
        }, ["View Offer"])
      ])
    )
  },
  {
    id: "blogs",
    title: "📝 Latest Blog Posts",
    endpoint: "/home/blogs",
    render: data => data.map(p =>
      liLink(p.title, p.link)
    )
  },
  {
    id: "seasonal-tips",
    title: "🌱 Seasonal Tips",
    endpoint: "/home/seasonal-tips",
    render: data => data.map(t => liText(`• ${t}`))
  }
];

const RIGHT_WIDGETS = [
  { id: "auth", custom: createAuthWidget },
  { id: "search", custom: createSearchWidget },
  {
    id: "map",
    title: "📍 Farm Locations",
    endpoint: "/home/locations",
    render: data => data.map(loc =>
      liText(`${loc.name}: ${loc.region}`)
    )
  },
  {
    id: "newsletter",
    custom: createNewsletterWidget
  }
];

// --- helpers for lists ---
const liLink = (text, href) =>
  createElement("li", {}, [
    createElement("a", { href, target: "_blank" }, [text])
  ]);

const liText = text =>
  createElement("li", {}, [text]);

// --- generic widget factory ---
function createWidget({ id, title, endpoint, render }) {
  const section = createElement("section", {
    class: "widget draggable",
    "data-id": id,
    draggable: true
  }, [
    createElement("h2", {}, [title || "Widget"]),
    createElement("div", { class: "widget-body" }, [
      createElement("p", {}, ["Loading..."])
    ])
  ]);

  const body = section.querySelector(".widget-body");

  if (endpoint && render) {
    apiFetch(endpoint)
      .then(resp => {
        if (!Array.isArray(resp) || !resp.length) {
          body.textContent = "Nothing to show.";
        } else {
          body.replaceChildren(...render(resp));
        }
      })
      .catch(err => {
        console.error(`[widget:${id}]`, err);
        body.textContent = "Failed to load.";
      });
  }

  return section;
}

// --- drag & drop logic ---
function makeDraggable(container, key) {
  container.addEventListener("dragstart", e => {
    if (e.target.classList.contains("draggable")) {
      e.dataTransfer.setData("text/plain", e.target.dataset.id);
      e.target.classList.add("dragging");
    }
  });
  container.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = container.querySelector(".dragging");
    const siblings = [...container.querySelectorAll(".draggable:not(.dragging)")];
    const after = siblings.find(el =>
      e.clientY < el.getBoundingClientRect().top + el.offsetHeight/2
    );
    if (dragging) container.insertBefore(dragging, after || null);
  });
  container.addEventListener("drop", () => saveLayout(key, container));
  container.addEventListener("dragend", e => e.target.classList.remove("dragging"));
}

function saveLayout(key, container) {
  const order = [...container.querySelectorAll(".draggable")].map(el => el.dataset.id);
  localStorage.setItem(`farms-home-${key}`, JSON.stringify(order));
}

function restoreLayout(container, defaults, key) {
  const saved = JSON.parse(localStorage.getItem(`farms-home-${key}`) || "[]");
  const used = new Set(saved);
  const remaining = defaults.filter(w => !used.has(w.id));
  const finalOrder = [...saved, ...remaining.map(w => w.id)]
    .map(id => defaults.find(w => w.id === id))
    .filter(Boolean);

  finalOrder.forEach(w => {
    if (w.custom) container.appendChild(w.custom());
    else container.appendChild(createWidget(w));
  });
}

// --- custom widgets ---
function createAuthWidget(isLoggedIn) {
  const s = createElement("section", {
    class: "widget draggable",
    "data-id": "auth",
    draggable: true
  });
  s.appendChild(createElement("h2", {}, [
    isLoggedIn ? "👋 Welcome Back!" : "🔐 Please Log In"
  ]));
  if (isLoggedIn) {
    s.appendChild(createElement("button", {
      onclick: () => navigate("#/dashboard")
    }, ["Dashboard"]));
  } else {
    s.append(
      createElement("input", { type: "text", placeholder: "Username" }),
      createElement("input", { type: "password", placeholder: "Password" }),
      createElement("button", {
        onclick: () => navigate("#/auth")
      }, ["Log In"])
    );
  }
  return s;
}

function createSearchWidget() {
  return createElement("section", {
    class: "widget draggable",
    "data-id": "search",
    draggable: true
  }, [
    createElement("h2", {}, ["🔎 Search Farms"]),
    createElement("input", { type: "text", placeholder: "Search..." }),
    createElement("button", {}, ["Go"])
  ]);
}

function createNewsletterWidget() {
  const s = createElement("section", {
    class: "widget draggable",
    "data-id": "newsletter",
    draggable: true
  });
  s.appendChild(createElement("h2", {}, ["✉️ Join Our Newsletter"]));
  s.append(
    createElement("input", { type: "email", placeholder: "you@example.com" }),
    createElement("button", {}, ["Subscribe"])
  );
  return s;
}

// --- entrypoint ---
// export function FarmsHome(isLoggedIn, container) {
export function NewHome(isLoggedIn, container) {
  container.innerHTML = "";

  const layout  = createElement("div", { class: "portal-layout" });
  const leftCol = createElement("div", { class: "portal-left" });
  const rightCol= createElement("div", { class: "portal-right" });

  // clone definitions so we can inject isLoggedIn into auth
  const leftDefs  = LEFT_WIDGETS.map(w => ({ ...w }));
  const rightDefs = RIGHT_WIDGETS.map(w =>
    w.id === "auth"
      ? { ...w, custom: () => createAuthWidget(isLoggedIn) }
      : w.id === "search"
        ? { ...w, custom: createSearchWidget }
        : w
  );

  restoreLayout(leftCol, leftDefs, "left");
  restoreLayout(rightCol, rightDefs, "right");

  makeDraggable(leftCol, "left");
  makeDraggable(rightCol, "right");

  layout.append(leftCol, rightCol);
  container.appendChild(layout);
}

// import { apiFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";

// const WIDGETS_LEFT = [
//     { id: "news", title: "📰 Top News", endpoint: "/home/news", render: d => d.map(i => liLink(i.title, i.link)) },
//     { id: "trends", title: "🔥 Trending", endpoint: "/home/trends", render: d => d.map(tag => liText(tag)) },
//     { id: "events", title: "📅 Upcoming Events", endpoint: "/home/events", render: d => d.map(e => liLink(e.title, e.link)) },
//     { id: "places", title: "🏙️ Top Places", endpoint: "/home/places", render: d => d.map(p => liLink(p.name, p.link)) },
//     { id: "community", title: "💬 From the Community", endpoint: "/home/posts", render: d => d.map(p => liLink(p.title, p.link)) }
// ];

// const WIDGETS_RIGHT = [
//     { id: "auth", custom: createAuthWidget },
//     { id: "search", custom: createSearchWidget },
//     { id: "media", title: "📸 Explore Media", endpoint: "/home/media", render: d => d.map(i => createElement("img", { src: i.url, alt: i.alt || "", loading: "lazy" })) },
//     { id: "notices", title: "📢 Announcements", endpoint: "/home/notices", render: d => d.map(n => createElement("p", {}, [n.text])) }
// ];

// // Helper creators
// const liLink = (text, href) => createElement("li", {}, [createElement("a", { href: href || "#", target: "_blank" }, [text])]);
// const liText = text => createElement("li", {}, [text]);

// function createWidget({ id, title, endpoint, render }) {
//     const section = createElement("section", { class: "widget draggable", "data-id": id, draggable: true }, [
//         createElement("h2", {}, [title || "Widget"]),
//         createElement("div", { class: "widget-body" }, [createElement("p", {}, ["Loading..."])])
//     ]);

//     const body = section.querySelector(".widget-body");

//     if (endpoint && render) {
//         apiFetch(endpoint)
//             .then(data => {
//                 if (!Array.isArray(data) || !data.length) {
//                     body.textContent = "Nothing to show.";
//                     return;
//                 }
//                 body.replaceChildren(...render(data));
//             })
//             .catch(err => {
//                 body.textContent = "Failed to load.";
//                 console.error(`[${id}] Error:`, err);
//             });
//     }

//     return section;
// }

// // DRAG LOGIC
// function makeDraggable(column, keyName) {
//     column.addEventListener("dragstart", e => {
//         if (e.target.classList.contains("draggable")) {
//             e.dataTransfer.setData("text/plain", e.target.dataset.id);
//             e.target.classList.add("dragging");
//         }
//     });

//     column.addEventListener("dragover", e => {
//         e.preventDefault();
//         const dragging = column.querySelector(".dragging");
//         const after = [...column.querySelectorAll(".draggable:not(.dragging)")].find(el =>
//             e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2
//         );
//         if (dragging) {
//             column.insertBefore(dragging, after || null);
//         }
//     });

//     column.addEventListener("drop", () => saveLayout(keyName, column));
//     column.addEventListener("dragend", e => e.target.classList.remove("dragging"));
// }

// function saveLayout(key, column) {
//     const order = [...column.querySelectorAll(".draggable")].map(el => el.dataset.id);
//     localStorage.setItem(`home-${key}`, JSON.stringify(order));
// }

// function restoreLayout(column, defaultWidgets, key) {
//     const saved = JSON.parse(localStorage.getItem(`home-${key}`) || "[]");
//     const idsInUse = new Set(saved);
//     const remaining = defaultWidgets.filter(w => !idsInUse.has(w.id));

//     const final = [...saved, ...remaining.map(w => w.id)]
//         .map(id => defaultWidgets.find(w => w.id === id))
//         .filter(Boolean);

//     final.forEach(w => {
//         if (w.custom) {
//             column.appendChild(w.custom());
//         } else {
//             column.appendChild(createWidget(w));
//         }
//     });
// }

// function createAuthWidget(isLoggedIn) {
//     const section = createElement("section", { class: "widget draggable", draggable: true, "data-id": "auth" });

//     section.appendChild(createElement("h2", {}, [isLoggedIn ? "👋 Welcome back!" : "🔐 Login"]));

//     if (isLoggedIn) {
//         section.appendChild(createElement("button", {
//             id: "go-dashboard",
//             onclick: () => location.hash = "#/dashboard"
//         }, ["Go to Dashboard"]));
//     } else {
//         section.append(
//             createElement("input", { type: "text", placeholder: "Username" }),
//             createElement("input", { type: "password", placeholder: "Password" }),
//             createElement("button", {
//                 id: "login-btn",
//                 onclick: () => location.hash = "#/auth"
//             }, ["Login"])
//         );
//     }

//     return section;
// }

// function createSearchWidget() {
//     return createElement("section", {
//         class: "widget draggable",
//         draggable: true,
//         "data-id": "search"
//     }, [
//         createElement("h2", {}, ["🔎 Search"]),
//         createElement("input", { type: "text", placeholder: "Search..." }),
//         createElement("button", {}, ["Go"])
//     ]);
// }

// export function NewHome(isLoggedIn, container) {
//     container.innerHTML = "";

//     const layout = createElement("div", { class: "portal-layout" });
//     const leftCol = createElement("div", { class: "portal-left" });
//     const rightCol = createElement("div", { class: "portal-right" });

//     // Provide context for auth widget
//     const leftWidgets = WIDGETS_LEFT.map(w => ({ ...w }));
//     const rightWidgets = WIDGETS_RIGHT.map(w =>
//         w.id === "auth" ? { ...w, custom: () => createAuthWidget(isLoggedIn) } :
//         w.id === "search" ? { ...w, custom: createSearchWidget } : w
//     );

//     restoreLayout(leftCol, leftWidgets, "left");
//     restoreLayout(rightCol, rightWidgets, "right");

//     makeDraggable(leftCol, "left");
//     makeDraggable(rightCol, "right");

//     layout.append(leftCol, rightCol);
//     container.appendChild(layout);
// }
