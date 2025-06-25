import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";

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

// Helper creators
const liLink = (text, href) => createElement("li", {}, [createElement("a", { href: href || "#", target: "_blank" }, [text])]);
const liText = text => createElement("li", {}, [text]);

function createWidget({ id, title, endpoint, render }) {
    const section = createElement("section", { class: "widget draggable", "data-id": id, draggable: true }, [
        createElement("h2", {}, [title || "Widget"]),
        createElement("div", { class: "widget-body" }, [createElement("p", {}, ["Loading..."])])
    ]);

    const body = section.querySelector(".widget-body");

    if (endpoint && render) {
        apiFetch(endpoint)
            .then(data => {
                if (!Array.isArray(data) || !data.length) {
                    body.textContent = "Nothing to show.";
                    return;
                }
                body.replaceChildren(...render(data));
            })
            .catch(err => {
                body.textContent = "Failed to load.";
                console.error(`[${id}] Error:`, err);
            });
    }

    return section;
}

// DRAG LOGIC
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
        if (w.custom) {
            column.appendChild(w.custom());
        } else {
            column.appendChild(createWidget(w));
        }
    });
}

function createAuthWidget(isLoggedIn) {
    const section = createElement("section", { class: "widget draggable", draggable: true, "data-id": "auth" });

    section.appendChild(createElement("h2", {}, [isLoggedIn ? "👋 Welcome back!" : "🔐 Login"]));

    if (isLoggedIn) {
        section.appendChild(createElement("button", {
            id: "go-dashboard",
            onclick: () => location.hash = "#/dashboard"
        }, ["Go to Dashboard"]));
    } else {
        section.append(
            createElement("input", { type: "text", placeholder: "Username" }),
            createElement("input", { type: "password", placeholder: "Password" }),
            createElement("button", {
                id: "login-btn",
                onclick: () => location.hash = "#/auth"
            }, ["Login"])
        );
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
        createElement("input", { type: "text", placeholder: "Search..." }),
        createElement("button", {}, ["Go"])
    ]);
}

export function NewHome(isLoggedIn, container) {
    container.innerHTML = "";

    const layout = createElement("div", { class: "portal-layout" });
    const leftCol = createElement("div", { class: "portal-left" });
    const rightCol = createElement("div", { class: "portal-right" });

    // Provide context for auth widget
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

// // Helper to build a widget section
// function createWidget({ title, endpoint, renderItem }) {
//     const section = createElement("section", { class: "widget" }, [
//         createElement("h2", {}, [title]),
//         createElement("div", { class: "widget-body" }, [createElement("p", {}, ["Loading..."])])
//     ]);
//     section.setAttribute("draggable", "true");
//     section.classList.add("draggable-widget");
    
//     const content = section.querySelector(".widget-body");

//     apiFetch(endpoint)
//         .then(data => {
//             if (!Array.isArray(data) || !data.length) {
//                 content.textContent = "Nothing to display.";
//                 return;
//             }
//             const items = renderItem(data);
//             content.replaceChildren(...items);
//         })
//         .catch(err => {
//             content.textContent = "Failed to load content.";
//             console.error(`❌ ${title} fetch error:`, err);
//         });

//     return section;
// }

// // Individual widgets
// const createNewsWidget = () =>
//     createWidget({
//         title: "📰 Top News",
//         endpoint: "/home/news",
//         renderItem: data =>
//             data.map(item =>
//                 createElement("li", {}, [
//                     createElement("a", { href: item.link || "#", target: "_blank" }, [item.title])
//                 ])
//             )
//     });

// const createTrendsWidget = () =>
//     createWidget({
//         title: "🔥 Trending",
//         endpoint: "/home/trends",
//         renderItem: data =>
//             data.map(tag =>
//                 createElement("li", {}, [tag])
//             )
//     });

// const createEventsWidget = () =>
//     createWidget({
//         title: "📅 Upcoming Events",
//         endpoint: "/home/events",
//         renderItem: data =>
//             data.map(ev =>
//                 createElement("li", {}, [
//                     createElement("a", { href: ev.link || "#", target: "_blank" }, [ev.title])
//                 ])
//             )
//     });

// const createPlacesWidget = () =>
//     createWidget({
//         title: "🏙️ Top Places",
//         endpoint: "/home/places",
//         renderItem: data =>
//             data.map(place =>
//                 createElement("li", {}, [
//                     createElement("a", { href: place.link || "#", target: "_blank" }, [place.name])
//                 ])
//             )
//     });

// const createCommunityWidget = () =>
//     createWidget({
//         title: "💬 From the Community",
//         endpoint: "/home/posts",
//         renderItem: data =>
//             data.map(post =>
//                 createElement("li", {}, [
//                     createElement("a", { href: post.link || "#", target: "_blank" }, [post.title])
//                 ])
//             )
//     });

// const createMediaWidget = () =>
//     createWidget({
//         title: "📸 Explore Media",
//         endpoint: "/home/media",
//         renderItem: data =>
//             data.map(item =>
//                 createElement("img", {
//                     src: item.url,
//                     alt: item.alt || "thumbnail",
//                     loading: "lazy"
//                 })
//             )
//     });

// const createNoticeWidget = () =>
//     createWidget({
//         title: "📢 Announcements",
//         endpoint: "/home/notices",
//         renderItem: data =>
//             data.map(note =>
//                 createElement("p", {}, [note.text])
//             )
//     });

// function createAuthWidget(isLoggedIn) {
//     const section = createElement("section", { class: "widget auth-widget" });

//     if (isLoggedIn) {
//         section.append(
//             createElement("h2", {}, ["👋 Welcome back!"]),
//             createElement("button", {
//                 id: "go-dashboard",
//                 onclick: () => location.hash = "#/dashboard"
//             }, ["Go to Dashboard"])
//         );
//     } else {
//         section.append(
//             createElement("h2", {}, ["🔐 Login"]),
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
//     return createElement("section", { class: "widget search-widget" }, [
//         createElement("h2", {}, ["🔎 Search"]),
//         createElement("input", { type: "text", placeholder: "Search..." }),
//         createElement("button", {}, ["Go"])
//     ]);
// }

// export function NewHome(isLoggedIn, container) {
//     container.textContent = "";

//     const layout = createElement("div", { class: "portal-layout" });

//     const leftCol = createElement("div", { class: "portal-left" });
//     const rightCol = createElement("div", { class: "portal-right" });

//     leftCol.append(
//         createNewsWidget(),
//         createTrendsWidget(),
//         createEventsWidget(),
//         createPlacesWidget(),
//         createCommunityWidget()
//     );

//     rightCol.append(
//         createAuthWidget(isLoggedIn),
//         createSearchWidget(),
//         createMediaWidget(),
//         createNoticeWidget()
//     );

//     layout.append(leftCol, rightCol);
//     container.appendChild(layout);
//     [leftCol, rightCol].forEach(col => {
//         col.addEventListener("dragstart", (e) => {
//             if (e.target.classList.contains("draggable-widget")) {
//                 e.dataTransfer.setData("text/plain", e.target.dataset.widgetId || "");
//                 e.dataTransfer.effectAllowed = "move";
//                 e.target.classList.add("dragging");
//             }
//         });
    
//         col.addEventListener("dragover", (e) => {
//             e.preventDefault();
//             const dragging = document.querySelector(".dragging");
//             const afterElement = [...col.querySelectorAll(".widget:not(.dragging)")].find(el =>
//                 e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2
//             );
//             if (dragging) {
//                 col.insertBefore(dragging, afterElement || null);
//             }
//         });
    
//         col.addEventListener("dragend", (e) => {
//             e.target.classList.remove("dragging");
//         });
//     });
    
// }

// // import { apiFetch } from "../../api/api.js";
// // import {createElement} from "../../components/createElement.js";

// // function createNewsWidget() {
// //     const section = createElement('section', { class: 'widget news-widget' }, [
// //         createElement('h2', {}, ['Top News']),
// //         createElement('p', {}, ['Loading...'])
// //     ]);

// //     apiFetch('/home/news')
// //         .then(data => {
// //             section.replaceChildren(
// //                 createElement('h2', {}, ['Top News']),
// //                 createElement('ul', {}, data.map(item =>
// //                     createElement('li', {}, [createElement('a', { href: item.link || '#' }, [item.title])])
// //                 ))
// //             );
// //         });

// //     return section;
// // }

// // function createTrendsWidget() {
// //     const section = createElement('section', { class: 'widget trends-widget' }, [
// //         createElement('h2', {}, ['Trending']),
// //         createElement('p', {}, ['Loading...'])
// //     ]);

// //     apiFetch('/home/trends')
// //         .then(data => {
// //             section.replaceChildren(
// //                 createElement('h2', {}, ['Trending']),
// //                 createElement('ol', {}, data.map(tag =>
// //                     createElement('li', {}, [tag])
// //                 ))
// //             );
// //         });

// //     return section;
// // }

// // function createEventsWidget() {
// //     const section = createElement('section', { class: 'widget events-widget' }, [
// //         createElement('h2', {}, ['Upcoming Events']),
// //         createElement('p', {}, ['Loading...'])
// //     ]);

// //     apiFetch('/home/events')
// //         .then(data => {
// //             section.replaceChildren(
// //                 createElement('h2', {}, ['Upcoming Events']),
// //                 createElement('ul', {}, data.map(ev =>
// //                     createElement('li', {}, [createElement('a', { href: ev.link || '#' }, [ev.title])])
// //                 ))
// //             );
// //         });

// //     return section;
// // }

// // function createPlacesWidget() {
// //     const section = createElement('section', { class: 'widget places-widget' }, [
// //         createElement('h2', {}, ['Top Places']),
// //         createElement('p', {}, ['Loading...'])
// //     ]);

// //     apiFetch('/home/places')
// //         .then(data => {
// //             section.replaceChildren(
// //                 createElement('h2', {}, ['Top Places']),
// //                 createElement('ul', {}, data.map(place =>
// //                     createElement('li', {}, [createElement('a', { href: place.link || '#' }, [place.name])])
// //                 ))
// //             );
// //         });

// //     return section;
// // }

// // function createCommunityWidget() {
// //     const section = createElement('section', { class: 'widget community-widget' }, [
// //         createElement('h2', {}, ['From the Community']),
// //         createElement('p', {}, ['Loading...'])
// //     ]);

// //     apiFetch('/home/posts')
// //         .then(data => {
// //             section.replaceChildren(
// //                 createElement('h2', {}, ['From the Community']),
// //                 createElement('ul', {}, data.map(post =>
// //                     createElement('li', {}, [createElement('a', { href: post.link || '#' }, [post.title])])
// //                 ))
// //             );
// //         });

// //     return section;
// // }
// // function createAuthWidget(isLoggedIn) {
// //   const section = createElement('section', { class: 'widget auth-widget' });

// //   if (isLoggedIn) {
// //       section.appendChild(createElement('h2', {}, ['Welcome back!']));
// //       const btn = createElement('button', { id: 'go-dashboard' }, ['Go to Dashboard']);
// //       btn.addEventListener('click', () => location.hash = '#/dashboard');
// //       section.appendChild(btn);
// //   } else {
// //       section.appendChild(createElement('h2', {}, ['Login']));
// //       const usernameInput = createElement('input', { type: 'text', placeholder: 'Username' });
// //       const passwordInput = createElement('input', { type: 'password', placeholder: 'Password' });
// //       const loginBtn = createElement('button', { id: 'login-btn' }, ['Login']);
// //       loginBtn.addEventListener('click', () => location.hash = '#/auth');
// //       section.append(usernameInput, passwordInput, loginBtn);
// //   }

// //   return section;
// // }

// // function createSearchWidget() {
// //   return createElement('section', { class: 'widget search-widget' }, [
// //       createElement('input', { type: 'text', placeholder: 'Search...' }),
// //       createElement('button', {}, ['🔍'])
// //   ]);
// // }

// // function createMediaWidget() {
// //   const section = createElement('section', { class: 'widget media-widget' }, [
// //       createElement('h2', {}, ['Explore Media']),
// //       createElement('p', {}, ['Loading...'])
// //   ]);

// //   apiFetch('/home/media')
// //       .then(data => {
// //           section.replaceChildren(
// //               createElement('h2', {}, ['Explore Media']),
// //               ...data.map(item =>
// //                   createElement('img', { src: item.url, alt: item.alt || 'thumb' })
// //               )
// //           );
// //       });

// //   return section;
// // }

// // function createNoticeWidget() {
// //   const section = createElement('section', { class: 'widget notice-widget' }, [
// //       createElement('h2', {}, ['Announcements']),
// //       createElement('p', {}, ['Loading...'])
// //   ]);

// //   apiFetch('/home/notices')
// //       .then(data => {
// //           section.replaceChildren(
// //               createElement('h2', {}, ['Announcements']),
// //               ...data.map(note =>
// //                   createElement('p', {}, [note.text])
// //               )
// //           );
// //       });

// //   return section;
// // }

// // export function NewHome(isLoggedIn, container) {
// //   container.textContent = '';
// //   const layout = createElement('div', { class: 'portal-layout' });

// //   const leftCol = createElement('div', { class: 'portal-left' });
// //   const rightCol = createElement('div', { class: 'portal-right' });

// //   // Append widget placeholders
// //   leftCol.append(
// //       createNewsWidget(),
// //       createTrendsWidget(),
// //       createEventsWidget(),
// //       createPlacesWidget(),
// //       createCommunityWidget()
// //   );

// //   rightCol.append(
// //       createAuthWidget(isLoggedIn),
// //       createSearchWidget(),
// //       createMediaWidget(),
// //       createNoticeWidget()
// //   );

// //   layout.append(leftCol, rightCol);
// //   container.appendChild(layout);
// // }
