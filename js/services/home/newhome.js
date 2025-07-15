import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { createLoginForm } from "../../pages/auth/auth.js";
import { login } from "../auth/authService.js";

const WIDGETS_LEFT = [
    { id: "news", title: "📰 Top News", endpoint: "/home/news", render: d => d.map(i => liLink(i.title, i.link)) },
    { id: "trends", title: "🔥 Trending", endpoint: "/home/trends", render: d => d.map(tag => liText(tag)) },
    { id: "events", title: "📅 Upcoming Events", endpoint: "/home/events", render: d => d.map(e => liLink(e.title, e.link)) },
    { id: "places", title: "🏙️ Top Places", endpoint: "/home/places", render: d => d.map(p => liLink(p.name, p.link)) },
    { id: "community", title: "💬 From the Community", endpoint: "/home/posts", render: d => d.map(p => liLink(p.title, p.link)) }
];

const WIDGETS_RIGHT = [
    { id: "auth", custom: createAuthWidget },
    { id: "search", custom: createSearchWidget },
    { id: "media", title: "📸 Explore Media", endpoint: "/home/media", render: d => d.map(i => createElement("img", { src: i.url, alt: i.alt || "", loading: "lazy" })) },
    { id: "notices", title: "📢 Announcements", endpoint: "/home/notices", render: d => d.map(n => createElement("p", {}, [n.text])) }
];

const liLink = (text, href) => createElement("li", {}, [
    createElement("a", { href: href || "#", target: "_blank" }, [text])
]);

const liText = text => createElement("li", {}, [text]);

function createWidget({ id, title, endpoint, render }) {
    const section = createElement("section", { class: "widget draggable", "data-id": id, draggable: true }, [
        createElement("h2", {}, [title || "Widget"]),
        createElement("div", { class: "widget-body" }, [createElement("p", {}, ["Loading..."])])
    ]);

    const body = section.querySelector(".widget-body");

    if (endpoint && render) {
        requestIdleCallback(() => {
            apiFetch(endpoint)
                .then(data => {
                    if (!Array.isArray(data) || !data.length) {
                        body.replaceChildren(createElement("p", {}, ["Nothing to show."]));
                        return;
                    }
                    body.replaceChildren(...render(data));
                })
                .catch(err => {
                    body.replaceChildren(createElement("p", {}, ["Failed to load."]));
                    console.error(`[${id}] Error:`, err);
                });
        });
    }

    return section;
}

function makeDraggable(column, keyName) {
    column.addEventListener("dragstart", e => {
        if (e.target.classList.contains("draggable")) {
            e.dataTransfer.setData("text/plain", e.target.dataset.id);
            e.target.classList.add("dragging");
        }
    });

    column.addEventListener("dragover", e => {
        e.preventDefault();
        const dragging = column.querySelector(".dragging");
        const after = [...column.querySelectorAll(".draggable:not(.dragging)")].find(el =>
            e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2
        );
        if (dragging) {
            column.insertBefore(dragging, after || null);
        }
    });

    column.addEventListener("drop", () => saveLayout(keyName, column));
    column.addEventListener("dragend", e => e.target.classList.remove("dragging"));
}

function saveLayout(key, column) {
    const order = [...column.querySelectorAll(".draggable")].map(el => el.dataset.id);
    localStorage.setItem(`home-${key}`, JSON.stringify(order));
}

function restoreLayout(column, defaultWidgets, key) {
    const saved = JSON.parse(localStorage.getItem(`home-${key}`) || "[]");
    const idsInUse = new Set(saved);
    const remaining = defaultWidgets.filter(w => !idsInUse.has(w.id));

    const final = [...saved, ...remaining.map(w => w.id)]
        .map(id => defaultWidgets.find(w => w.id === id))
        .filter(Boolean);

    final.forEach(w => {
        const node = w.custom ? w.custom() : createWidget(w);
        column.appendChild(node);
    });
}

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
//             createElement("input", { type: "text", placeholder: "Username", name: "username" }),
//             createElement("input", { type: "password", placeholder: "Password", name: "password" }),
//             createElement("button", {
//                 id: "login-btn",
//                 onclick: () => location.hash = "#/auth"
//             }, ["Login"])
//         );
//     }

//     return section;
// }

function createAuthWidget(isLoggedIn) {
    const section = createElement("section", { class: "widget draggable", draggable: true, "data-id": "auth" });

    section.appendChild(createElement("h2", {}, [isLoggedIn ? "👋 Welcome back!" : "🔐 Login"]));

    if (isLoggedIn) {
        section.appendChild(createElement("button", {
            id: "go-dashboard",
            onclick: () => location.hash = "#/dashboard"
        }, ["Go to Dashboard"]));
    } else {
        section.append(createLoginForm());
    }

    return section;
}

function createSearchWidget() {
    return createElement("section", {
        class: "widget draggable",
        draggable: true,
        "data-id": "search"
    }, [
        createElement("h2", {}, ["🔎 Search"]),
        createElement("input", { type: "text", placeholder: "Search...", name: "search" }),
        createElement("button", {}, ["Go"])
    ]);
}

export function NewHome(isLoggedIn, container) {
    container.innerHTML = "";

    const layout = createElement("div", { class: "portal-layout" });
    const leftCol = createElement("div", { class: "portal-left" });
    const rightCol = createElement("div", { class: "portal-right" });

    const leftWidgets = WIDGETS_LEFT.map(w => ({ ...w }));
    const rightWidgets = WIDGETS_RIGHT.map(w =>
        w.id === "auth" ? { ...w, custom: () => createAuthWidget(isLoggedIn) } :
        w.id === "search" ? { ...w, custom: createSearchWidget } : w
    );

    restoreLayout(leftCol, leftWidgets, "left");
    restoreLayout(rightCol, rightWidgets, "right");

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
