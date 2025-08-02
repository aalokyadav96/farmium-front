// import { apiFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";
// import { createLoginForm } from "../../pages/auth/auth.js";
// import { login } from "../auth/authService.js";

// const liLink = (text, href) => createElement("li", {}, [
//     createElement("a", { href: href || "#", target: "_blank" }, [text])
// ]);

// const liText = text => createElement("li", {}, [text]);

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

// export function NewHome(isLoggedIn, container) {
//     container.innerHTML = "";

//     const layout = createElement("div", { class: "portal-layout" }, [
//         topIconBar(),
//         searchBar(),
//         appGrid(),
//         adBanner(),
//         weatherWidget(),
//         createElement("div", { class: "portal-columns" }, [
//             createColumn("portal-left", WIDGETS_LEFT),
//             createColumn("portal-right", WIDGETS_RIGHT, isLoggedIn)
//         ])
//     ]);

//     container.appendChild(layout);
// }

// function createColumn(className, widgets, isLoggedIn = false) {
//     const col = createElement("div", { class: className });

//     const enhanced = widgets.map(w =>
//         w.id === "auth" ? { ...w, custom: () => createAuthWidget(isLoggedIn) } :
//         w.id === "search" ? { ...w, custom: createSearchWidget } : w
//     );

//     const sideKey = className === "portal-left" ? "left" : "right";
//     restoreLayout(col, enhanced, sideKey);
//     makeDraggable(col, sideKey);

//     return col;
// }

// function createWidget({ id, title, endpoint, render }) {
//     const section = createElement("section", { class: "widget draggable", "data-id": id, draggable: true }, [
//         createElement("h2", {}, [title || "Widget"]),
//         createElement("div", { class: "widget-body" }, [createElement("p", {}, ["Loading..."])])
//     ]);

//     const body = section.querySelector(".widget-body");

//     if (endpoint && render) {
//         requestIdleCallback(() => {
//             apiFetch(endpoint)
//                 .then(data => {
//                     if (!Array.isArray(data) || !data.length) {
//                         body.replaceChildren(createElement("p", {}, ["Nothing to show."]));
//                         return;
//                     }
//                     body.replaceChildren(...render(data));
//                 })
//                 .catch(err => {
//                     body.replaceChildren(createElement("p", {}, ["Failed to load."]));
//                     console.error(`[${id}] Error:`, err);
//                 });
//         });
//     }

//     return section;
// }

// function restoreLayout(column, defaultWidgets, key) {
//     const saved = JSON.parse(localStorage.getItem(`home-${key}`) || "[]");
//     const idsInUse = new Set(saved);
//     const remaining = defaultWidgets.filter(w => !idsInUse.has(w.id));

//     const final = [...saved, ...remaining.map(w => w.id)]
//         .map(id => defaultWidgets.find(w => w.id === id))
//         .filter(Boolean);

//     final.forEach(w => {
//         const node = w.custom ? w.custom() : createWidget(w);
//         column.appendChild(node);
//     });
// }

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

// function createAuthWidget(isLoggedIn) {
//     const section = createElement("section", { class: "widget draggable", draggable: true, "data-id": "auth" });

//     section.appendChild(createElement("h2", {}, [isLoggedIn ? "👋 Welcome back!" : "🔐 Login"]));

//     if (isLoggedIn) {
//         section.appendChild(createElement("button", {
//             id: "go-dashboard",
//             onclick: () => location.hash = "#/dashboard"
//         }, ["Go to Dashboard"]));
//     } else {
//         section.append(createLoginForm());
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
//         createElement("input", { type: "text", placeholder: "Search...", name: "search" }),
//         createElement("button", {}, ["Go"])
//     ]);
// }

// // UI components
// function topIconBar() {
//     return createElement("div", { class: "top-icons" }, [
//         createElement("button", {}, ["☰"]),
//         createElement("div", { class: "icon-group" }, [
//             iconCircle("💰"), iconCircle("🛒"), iconCircle("💬"), iconCircle("🔔"), iconCircle("👤")
//         ])
//     ]);
// }

// function searchBar() {
//     return createElement("div", { class: "search-bar" }, [
//         createElement("span", { class: "logo-n" }, ["N"]),
//         createElement("input", { type: "text", placeholder: "검색어를 입력해주세요." }),
//         createElement("button", {}, ["🔍"])
//     ]);
// }

// function appGrid() {
//     const apps = [
//         ["뉴스판", "📄"], ["스토어", "🛍️"], ["경제판", "📈"], ["클립판", "🎞️"],
//         ["메일", "📧", "35"], ["카페", "☕"], ["블로그", "📝"], ["더보기", "➕"]
//     ];

//     return createElement("div", { class: "app-grid" }, apps.map(([label, icon, badge]) =>
//         createElement("div", { class: "app-icon" }, [
//             iconCircle(icon, badge),
//             createElement("div", { class: "app-label" }, [label])
//         ])
//     ));
// }

// function adBanner() {
//     return createElement("div", { class: "ad-banner" }, [
//         createElement("img", { src: "https://via.placeholder.com/350x120", alt: "Car Ad", loading: "lazy" }),
//         createElement("div", { class: "ad-text" }, [
//             createElement("strong", {}, ["rethink electric, 르노 세닉"]),
//             createElement("p", {}, ["[사전예약 오픈] 지금 신청해보세요"])
//         ])
//     ]);
// }

// function weatherWidget() {
//     return createElement("div", { class: "weather" }, [
//         createElement("div", { class: "weather-icon" }, ["☀️"]),
//         createElement("div", { class: "weather-text" }, ["31.4° 울릉/독도"])
//     ]);
// }

// function iconCircle(emoji, badge = "") {
//     const wrapper = createElement("div", { class: "circle-icon" }, [emoji]);
//     if (badge) wrapper.appendChild(createElement("span", { class: "badge" }, [badge]));
//     return wrapper;
// }


// // import { apiFetch } from "../../api/api.js";
// // import { createElement } from "../../components/createElement.js";
// // import { createLoginForm } from "../../pages/auth/auth.js";

// // const WIDGETS_LEFT = [
// //   { id: "news", title: "📰 Top News", endpoint: "/home/news", render: d => d.map(i => liLink(i.title, i.link)) },
// //   { id: "trends", title: "🔥 Trending", endpoint: "/home/trends", render: d => d.map(tag => liText(tag)) },
// //   { id: "events", title: "📅 Upcoming Events", endpoint: "/home/events", render: d => d.map(e => liLink(e.title, e.link)) },
// //   { id: "places", title: "🏙️ Top Places", endpoint: "/home/places", render: d => d.map(p => liLink(p.name, p.link)) },
// //   { id: "community", title: "💬 From the Community", endpoint: "/home/posts", render: d => d.map(p => liLink(p.title, p.link)) }
// // ];

// // const WIDGETS_RIGHT = [
// //   { id: "auth", custom: createAuthWidget },
// //   { id: "search", custom: createSearchWidget },
// //   { id: "media", title: "📸 Explore Media", endpoint: "/home/media", render: d => d.map(i => createElement("img", { src: i.url, alt: i.alt || "", loading: "lazy" })) },
// //   { id: "notices", title: "📢 Announcements", endpoint: "/home/notices", render: d => d.map(n => createElement("p", {}, [n.text])) }
// // ];

// // export function NewHome(isLoggedIn, container) {
// //   container.innerHTML = "";

// //   const layout = createElement("div", { class: "superapp-home" }, [
// //     topIconBar(),
// //     searchBar(),
// //     appGrid(),
// //     adBanner(),
// //     weatherWidget(),
// //     createElement("div", { class: "widget-columns" }, [
// //       createColumn("left", WIDGETS_LEFT),
// //       createColumn("right", WIDGETS_RIGHT, isLoggedIn)
// //     ])
// //   ]);

// //   container.appendChild(layout);
// // }

// // function createColumn(side, widgets, isLoggedIn = false) {
// //   const col = createElement("div", { class: `widget-col ${side}` });

// //   const enhanced = widgets.map(w =>
// //     w.id === "auth" ? { ...w, custom: () => createAuthWidget(isLoggedIn) } :
// //     w.id === "search" ? { ...w, custom: createSearchWidget } : w
// //   );

// //   restoreLayout(col, enhanced, side);
// //   makeDraggable(col, side);

// //   return col;
// // }

// // // UI sections
// // function topIconBar() {
// //   return createElement("div", { class: "top-icons" }, [
// //     createElement("button", {}, ["☰"]),
// //     createElement("div", { class: "icon-group" }, [
// //       iconCircle("💰"), iconCircle("🛒"), iconCircle("💬"), iconCircle("🔔"), iconCircle("👤")
// //     ])
// //   ]);
// // }

// // function searchBar() {
// //   return createElement("div", { class: "search-bar" }, [
// //     createElement("span", { class: "logo-n" }, ["N"]),
// //     createElement("input", { type: "text", placeholder: "검색어를 입력해주세요." }),
// //     createElement("button", {}, ["🔍"])
// //   ]);
// // }

// // function appGrid() {
// //   const apps = [
// //     ["뉴스판", "📄"], ["스토어", "🛍️"], ["경제판", "📈"], ["클립판", "🎞️"],
// //     ["메일", "📧", "35"], ["카페", "☕"], ["블로그", "📝"], ["더보기", "➕"]
// //   ];

// //   return createElement("div", { class: "app-grid" }, apps.map(([label, icon, badge]) =>
// //     createElement("div", { class: "app-icon" }, [
// //       iconCircle(icon, badge),
// //       createElement("div", { class: "app-label" }, [label])
// //     ])
// //   ));
// // }

// // function adBanner() {
// //   return createElement("div", { class: "ad-banner" }, [
// //     createElement("img", { src: "https://via.placeholder.com/350x120", alt: "Car Ad", loading: "lazy" }),
// //     createElement("div", { class: "ad-text" }, [
// //       createElement("strong", {}, ["rethink electric, 르노 세닉"]),
// //       createElement("p", {}, ["[사전예약 오픈] 지금 신청해보세요"])
// //     ])
// //   ]);
// // }

// // function weatherWidget() {
// //   return createElement("div", { class: "weather" }, [
// //     createElement("div", { class: "weather-icon" }, ["☀️"]),
// //     createElement("div", { class: "weather-text" }, ["31.4° 울릉/독도"])
// //   ]);
// // }

// // function iconCircle(emoji, badge = "") {
// //   const wrapper = createElement("div", { class: "circle-icon" }, [emoji]);
// //   if (badge) wrapper.appendChild(createElement("span", { class: "badge" }, [badge]));
// //   return wrapper;
// // }

// // // Widget logic
// // function createWidget({ id, title, endpoint, render }) {
// //   const section = createElement("section", { class: "widget draggable", "data-id": id, draggable: true }, [
// //     createElement("h2", {}, [title || "Widget"]),
// //     createElement("div", { class: "widget-body" }, [createElement("p", {}, ["Loading..."])])
// //   ]);

// //   const body = section.querySelector(".widget-body");

// //   if (endpoint && render) {
// //     requestIdleCallback(() => {
// //       apiFetch(endpoint)
// //         .then(data => {
// //           if (!Array.isArray(data) || !data.length) {
// //             body.replaceChildren(createElement("p", {}, ["Nothing to show."]));
// //             return;
// //           }
// //           body.replaceChildren(...render(data));
// //         })
// //         .catch(err => {
// //           body.replaceChildren(createElement("p", {}, ["Failed to load."]));
// //           console.error(`[${id}] Error:`, err);
// //         });
// //     });
// //   }

// //   return section;
// // }

// // function restoreLayout(col, widgets, key) {
// //   const saved = JSON.parse(localStorage.getItem(`home-${key}`) || "[]");
// //   const used = new Set(saved);
// //   const remaining = widgets.filter(w => !used.has(w.id));

// //   [...saved, ...remaining.map(w => w.id)]
// //     .map(id => widgets.find(w => w.id === id))
// //     .filter(Boolean)
// //     .forEach(w => {
// //       const node = w.custom ? w.custom() : createWidget(w);
// //       col.appendChild(node);
// //     });
// // }

// // function makeDraggable(col, key) {
// //   col.addEventListener("dragstart", e => {
// //     if (e.target.classList.contains("draggable")) {
// //       e.dataTransfer.setData("text/plain", e.target.dataset.id);
// //       e.target.classList.add("dragging");
// //     }
// //   });

// //   col.addEventListener("dragover", e => {
// //     e.preventDefault();
// //     const dragging = col.querySelector(".dragging");
// //     const after = [...col.querySelectorAll(".draggable:not(.dragging)")].find(el =>
// //       e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2
// //     );
// //     if (dragging) col.insertBefore(dragging, after || null);
// //   });

// //   col.addEventListener("drop", () => saveLayout(key, col));
// //   col.addEventListener("dragend", e => e.target.classList.remove("dragging"));
// // }

// // function saveLayout(key, col) {
// //   const order = [...col.querySelectorAll(".draggable")].map(el => el.dataset.id);
// //   localStorage.setItem(`home-${key}`, JSON.stringify(order));
// // }

// // // Special widgets
// // function createAuthWidget(isLoggedIn) {
// //   const section = createElement("section", { class: "widget draggable", draggable: true, "data-id": "auth" });
// //   section.appendChild(createElement("h2", {}, [isLoggedIn ? "👋 Welcome back!" : "🔐 Login"]));

// //   if (isLoggedIn) {
// //     section.appendChild(createElement("button", {
// //       id: "go-dashboard",
// //       onclick: () => location.hash = "#/dashboard"
// //     }, ["Go to Dashboard"]));
// //   } else {
// //     section.appendChild(createLoginForm());
// //   }

// //   return section;
// // }

// // function createSearchWidget() {
// //   return createElement("section", {
// //     class: "widget draggable", draggable: true, "data-id": "search"
// //   }, [
// //     createElement("h2", {}, ["🔎 Search"]),
// //     createElement("input", { type: "text", placeholder: "Search..." }),
// //     createElement("button", {}, ["Go"])
// //   ]);
// // }

// // // import { apiFetch } from "../../api/api.js";
// // // import { createElement } from "../../components/createElement.js";
// // // import { createLoginForm } from "../../pages/auth/auth.js";

// // // const WIDGETS_LEFT = [
// // //   { id: "news", title: "📰 Top News", endpoint: "/home/news", render: d => d.map(i => liLink(i.title, i.link)) },
// // //   { id: "trends", title: "🔥 Trending", endpoint: "/home/trends", render: d => d.map(tag => liText(tag)) },
// // //   { id: "events", title: "📅 Upcoming Events", endpoint: "/home/events", render: d => d.map(e => liLink(e.title, e.link)) },
// // //   { id: "places", title: "🏙️ Top Places", endpoint: "/home/places", render: d => d.map(p => liLink(p.name, p.link)) },
// // //   { id: "community", title: "💬 From the Community", endpoint: "/home/posts", render: d => d.map(p => liLink(p.title, p.link)) }
// // // ];

// // // const WIDGETS_RIGHT = [
// // //   { id: "auth", custom: createAuthWidget },
// // //   { id: "search", custom: createSearchWidget },
// // //   { id: "media", title: "📸 Explore Media", endpoint: "/home/media", render: d => d.map(i => createElement("img", { src: i.url, alt: i.alt || "", loading: "lazy" })) },
// // //   { id: "notices", title: "📢 Announcements", endpoint: "/home/notices", render: d => d.map(n => createElement("p", {}, [n.text])) }
// // // ];

// // // const liLink = (text, href) => createElement("li", {}, [
// // //   createElement("a", { href: href || "#", target: "_blank" }, [text])
// // // ]);

// // // const liText = text => createElement("li", {}, [text]);

// // // export function NewHome(isLoggedIn, container) {
// // //   container.innerHTML = "";

// // //   const layout = createElement("div", { class: "superapp-mobile" }, [
// // //     topIconBar(),
// // //     searchBar(),
// // //     appGrid(),
// // //     adBanner(),
// // //     weatherWidget(),
// // //     widgetLayout(isLoggedIn)
// // //   ]);

// // //   container.appendChild(layout);
// // // }

// // // function widgetLayout(isLoggedIn) {
// // //   const wrapper = createElement("div", { class: "widget-columns" });
// // //   const leftCol = createElement("div", { class: "portal-left" });
// // //   const rightCol = createElement("div", { class: "portal-right" });

// // //   const leftWidgets = WIDGETS_LEFT.map(w => ({ ...w }));
// // //   const rightWidgets = WIDGETS_RIGHT.map(w =>
// // //     w.id === "auth" ? { ...w, custom: () => createAuthWidget(isLoggedIn) } :
// // //     w.id === "search" ? { ...w, custom: createSearchWidget } : w
// // //   );

// // //   restoreLayout(leftCol, leftWidgets, "left");
// // //   restoreLayout(rightCol, rightWidgets, "right");

// // //   makeDraggable(leftCol, "left");
// // //   makeDraggable(rightCol, "right");

// // //   wrapper.append(leftCol, rightCol);
// // //   return wrapper;
// // // }

// // // function createWidget({ id, title, endpoint, render }) {
// // //   const section = createElement("section", { class: "widget draggable", "data-id": id, draggable: true }, [
// // //     createElement("h2", {}, [title || "Widget"]),
// // //     createElement("div", { class: "widget-body" }, [createElement("p", {}, ["Loading..."])])
// // //   ]);

// // //   const body = section.querySelector(".widget-body");

// // //   if (endpoint && render) {
// // //     requestIdleCallback(() => {
// // //       apiFetch(endpoint)
// // //         .then(data => {
// // //           if (!Array.isArray(data) || !data.length) {
// // //             body.replaceChildren(createElement("p", {}, ["Nothing to show."]));
// // //             return;
// // //           }
// // //           body.replaceChildren(...render(data));
// // //         })
// // //         .catch(err => {
// // //           body.replaceChildren(createElement("p", {}, ["Failed to load."]));
// // //           console.error(`[${id}] Error:`, err);
// // //         });
// // //     });
// // //   }

// // //   return section;
// // // }

// // // function restoreLayout(column, widgets, key) {
// // //   const saved = JSON.parse(localStorage.getItem(`home-${key}`) || "[]");
// // //   const idsUsed = new Set(saved);
// // //   const remaining = widgets.filter(w => !idsUsed.has(w.id));
// // //   const ordered = [...saved, ...remaining.map(w => w.id)]
// // //     .map(id => widgets.find(w => w.id === id))
// // //     .filter(Boolean);

// // //   ordered.forEach(w => {
// // //     const node = w.custom ? w.custom() : createWidget(w);
// // //     column.appendChild(node);
// // //   });
// // // }

// // // function makeDraggable(column, key) {
// // //   column.addEventListener("dragstart", e => {
// // //     if (e.target.classList.contains("draggable")) {
// // //       e.dataTransfer.setData("text/plain", e.target.dataset.id);
// // //       e.target.classList.add("dragging");
// // //     }
// // //   });

// // //   column.addEventListener("dragover", e => {
// // //     e.preventDefault();
// // //     const dragging = column.querySelector(".dragging");
// // //     const after = [...column.querySelectorAll(".draggable:not(.dragging)")].find(el =>
// // //       e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2
// // //     );
// // //     if (dragging) column.insertBefore(dragging, after || null);
// // //   });

// // //   column.addEventListener("drop", () => saveLayout(key, column));
// // //   column.addEventListener("dragend", e => e.target.classList.remove("dragging"));
// // // }

// // // function saveLayout(key, col) {
// // //   const ids = [...col.querySelectorAll(".draggable")].map(el => el.dataset.id);
// // //   localStorage.setItem(`home-${key}`, JSON.stringify(ids));
// // // }

// // // function createAuthWidget(isLoggedIn) {
// // //   const section = createElement("section", { class: "widget draggable", draggable: true, "data-id": "auth" });
// // //   section.appendChild(createElement("h2", {}, [isLoggedIn ? "👋 Welcome back!" : "🔐 Login"]));
// // //   section.appendChild(isLoggedIn
// // //     ? createElement("button", { id: "go-dashboard", onclick: () => location.hash = "#/dashboard" }, ["Go to Dashboard"])
// // //     : createLoginForm());
// // //   return section;
// // // }

// // // function createSearchWidget() {
// // //   return createElement("section", {
// // //     class: "widget draggable", draggable: true, "data-id": "search"
// // //   }, [
// // //     createElement("h2", {}, ["🔎 Search"]),
// // //     createElement("input", { type: "text", placeholder: "Search..." }),
// // //     createElement("button", {}, ["Go"])
// // //   ]);
// // // }

// // // // UI Section Elements (same as earlier mobile layout)
// // // function topIconBar() {
// // //   return createElement("div", { class: "top-icons" }, [
// // //     createElement("button", {}, ["☰"]),
// // //     createElement("div", { class: "icon-group" }, [
// // //       iconCircle("💰"), iconCircle("🛒"), iconCircle("💬"), iconCircle("🔔"), iconCircle("👤")
// // //     ])
// // //   ]);
// // // }

// // // function searchBar() {
// // //   return createElement("div", { class: "search-bar" }, [
// // //     createElement("span", { class: "logo-n" }, ["N"]),
// // //     createElement("input", { type: "text", placeholder: "검색어를 입력해주세요." }),
// // //     createElement("button", {}, ["🔍"])
// // //   ]);
// // // }

// // // function appGrid() {
// // //   const apps = [
// // //     ["뉴스판", "📄"], ["스토어", "🛍️"], ["경제판", "📈"], ["클립판", "🎞️"],
// // //     ["메일", "📧", "35"], ["카페", "☕"], ["블로그", "📝"], ["더보기", "➕"]
// // //   ];

// // //   return createElement("div", { class: "app-grid" }, apps.map(([label, icon, badge]) =>
// // //     createElement("div", { class: "app-icon" }, [
// // //       iconCircle(icon, badge),
// // //       createElement("div", { class: "app-label" }, [label])
// // //     ])
// // //   ));
// // // }

// // // function adBanner() {
// // //   return createElement("div", { class: "ad-banner" }, [
// // //     createElement("img", { src: "https://via.placeholder.com/350x120", alt: "Car Ad", loading: "lazy" }),
// // //     createElement("div", { class: "ad-text" }, [
// // //       createElement("strong", {}, ["rethink electric, 르노 세닉"]),
// // //       createElement("p", {}, ["[사전예약 오픈] 지금 신청해보세요"])
// // //     ])
// // //   ]);
// // // }

// // // function weatherWidget() {
// // //   return createElement("div", { class: "weather" }, [
// // //     createElement("div", { class: "weather-icon" }, ["☀️"]),
// // //     createElement("div", { class: "weather-text" }, ["31.4° 울릉/독도"])
// // //   ]);
// // // }

// // // function iconCircle(emoji, badge = "") {
// // //   const wrapper = createElement("div", { class: "circle-icon" }, [emoji]);
// // //   if (badge) wrapper.appendChild(createElement("span", { class: "badge" }, [badge]));
// // //   return wrapper;
// // // }

// // // import { apiFetch } from "../../api/api.js";
// // // import { createElement } from "../../components/createElement.js";
// // // import { createLoginForm } from "../../pages/auth/auth.js";

// // // const WIDGETS = [
// // //   { id: "news", title: "📰 Top News", endpoint: "/home/news", render: d => d.map(i => liLink(i.title, i.link)) },
// // //   { id: "trends", title: "🔥 Trending", endpoint: "/home/trends", render: d => d.map(tag => liText(tag)) },
// // //   { id: "events", title: "📅 Events", endpoint: "/home/events", render: d => d.map(e => liLink(e.title, e.link)) }
// // // ];

// // // const liLink = (text, href) => createElement("li", {}, [
// // //   createElement("a", { href: href || "#", target: "_blank" }, [text])
// // // ]);

// // // const liText = text => createElement("li", {}, [text]);

// // // export function NewHome(isLoggedIn, container) {
// // //   container.innerHTML = "";

// // //   const layout = createElement("div", { class: "superapp-mobile" }, [
// // //     topIconBar(),
// // //     searchBar(),
// // //     appGrid(),
// // //     adBanner(),
// // //     weatherWidget(),
// // //     feedArea(isLoggedIn)
// // //   ]);

// // //   container.appendChild(layout);
// // // }

// // // function topIconBar() {
// // //   return createElement("div", { class: "top-icons" }, [
// // //     createElement("button", {}, ["☰"]),
// // //     createElement("div", { class: "icon-group" }, [
// // //       iconCircle("💰"),
// // //       iconCircle("🛒"),
// // //       iconCircle("💬"),
// // //       iconCircle("🔔"),
// // //       iconCircle("👤")
// // //     ])
// // //   ]);
// // // }

// // // function searchBar() {
// // //   return createElement("div", { class: "search-bar" }, [
// // //     createElement("span", { class: "logo-n" }, ["N"]),
// // //     createElement("input", { type: "text", placeholder: "검색어를 입력해주세요." }),
// // //     createElement("button", {}, ["🔍"])
// // //   ]);
// // // }

// // // function appGrid() {
// // //   const apps = [
// // //     ["뉴스판", "📄"],
// // //     ["스토어", "🛍️"],
// // //     ["경제판", "📈"],
// // //     ["클립판", "🎞️"],
// // //     ["메일", "📧", "35"],
// // //     ["카페", "☕"],
// // //     ["블로그", "📝"],
// // //     ["더보기", "➕"]
// // //   ];

// // //   return createElement("div", { class: "app-grid" }, apps.map(([label, icon, badge]) =>
// // //     createElement("div", { class: "app-icon" }, [
// // //       iconCircle(icon, badge),
// // //       createElement("div", { class: "app-label" }, [label])
// // //     ])
// // //   ));
// // // }

// // // function adBanner() {
// // //   return createElement("div", { class: "ad-banner" }, [
// // //     createElement("img", { src: "https://via.placeholder.com/350x120", alt: "Car Ad", loading: "lazy" }),
// // //     createElement("div", { class: "ad-text" }, [
// // //       createElement("strong", {}, ["rethink electric, 르노 세닉"]),
// // //       createElement("p", {}, ["[사전예약 오픈] 지금 신청해보세요"])
// // //     ])
// // //   ]);
// // // }

// // // function weatherWidget() {
// // //   return createElement("div", { class: "weather" }, [
// // //     createElement("div", { class: "weather-icon" }, ["☀️"]),
// // //     createElement("div", { class: "weather-text" }, ["31.4° 울릉/독도"])
// // //   ]);
// // // }

// // // function iconCircle(emoji, badge = "") {
// // //   const wrapper = createElement("div", { class: "circle-icon" }, [emoji]);
// // //   if (badge) {
// // //     wrapper.appendChild(createElement("span", { class: "badge" }, [badge]));
// // //   }
// // //   return wrapper;
// // // }

// // // function feedArea(isLoggedIn) {
// // //   const container = createElement("div", { class: "feed" });

// // //   // Auth Widget
// // //   container.appendChild(authWidget(isLoggedIn));

// // //   // Add all widgets (news, trends, events)
// // //   WIDGETS.forEach(w => {
// // //     const section = createElement("section", { class: "widget", "data-id": w.id }, [
// // //       createElement("h3", {}, [w.title]),
// // //       createElement("div", { class: "widget-body" }, [createElement("p", {}, ["Loading..."])])
// // //     ]);

// // //     container.appendChild(section);

// // //     const body = section.querySelector(".widget-body");

// // //     requestIdleCallback(() => {
// // //       apiFetch(w.endpoint)
// // //         .then(data => {
// // //           if (!Array.isArray(data) || !data.length) {
// // //             body.replaceChildren(createElement("p", {}, ["Nothing to show."]));
// // //             return;
// // //           }
// // //           body.replaceChildren(...w.render(data));
// // //         })
// // //         .catch(err => {
// // //           console.error(`[${w.id}] load failed`, err);
// // //           body.replaceChildren(createElement("p", {}, ["Failed to load."]));
// // //         });
// // //     });
// // //   });

// // //   return container;
// // // }

// // // function authWidget(isLoggedIn) {
// // //   const section = createElement("section", { class: "widget", "data-id": "auth" });
// // //   section.appendChild(createElement("h3", {}, [isLoggedIn ? "👋 Welcome Back" : "🔐 Login"]));

// // //   if (isLoggedIn) {
// // //     section.appendChild(createElement("button", {
// // //       onclick: () => location.hash = "#/dashboard"
// // //     }, ["Go to Dashboard"]));
// // //   } else {
// // //     section.appendChild(createLoginForm());
// // //   }

// // //   return section;
// // // }

// // // // import { createElement } from "../../components/createElement.js";

// // // // export function NewHome(isLoggedIn, container) {
// // // //     container.innerHTML = "";

// // // //     const layout = createElement("div", { class: "superapp-mobile" }, [
// // // //         topIconBar(),
// // // //         searchBar(),
// // // //         appGrid(),
// // // //         adBanner(),
// // // //         weatherWidget(),
// // // //         feedPreview()
// // // //     ]);

// // // //     container.appendChild(layout);
// // // // }

// // // // function topIconBar() {
// // // //     return createElement("div", { class: "top-icons" }, [
// // // //         createElement("button", {}, ["☰"]),
// // // //         createElement("div", { class: "icon-group" }, [
// // // //             iconCircle("💰"),
// // // //             iconCircle("🛒"),
// // // //             iconCircle("💬"),
// // // //             iconCircle("🔔"),
// // // //             iconCircle("👤")
// // // //         ])
// // // //     ]);
// // // // }

// // // // function searchBar() {
// // // //     return createElement("div", { class: "search-bar" }, [
// // // //         createElement("span", { class: "logo-n" }, ["N"]),
// // // //         createElement("input", { type: "text", placeholder: "검색어를 입력해주세요." }),
// // // //         createElement("button", {}, ["🔍"])
// // // //     ]);
// // // // }

// // // // function appGrid() {
// // // //     const apps = [
// // // //         ["뉴스판", "📄"],
// // // //         ["스토어", "🛍️"],
// // // //         ["경제판", "📈"],
// // // //         ["클립판", "🎞️"],
// // // //         ["메일", "📧", "35"],
// // // //         ["카페", "☕"],
// // // //         ["블로그", "📝"],
// // // //         ["더보기", "➕"]
// // // //     ];

// // // //     return createElement("div", { class: "app-grid" }, apps.map(([label, icon, badge]) =>
// // // //         createElement("div", { class: "app-icon" }, [
// // // //             iconCircle(icon, badge),
// // // //             createElement("div", { class: "app-label" }, [label])
// // // //         ])
// // // //     ));
// // // // }

// // // // function adBanner() {
// // // //     return createElement("div", { class: "ad-banner" }, [
// // // //         createElement("img", { src: "https://via.placeholder.com/350x120", alt: "Car Ad", loading: "lazy" }),
// // // //         createElement("div", { class: "ad-text" }, [
// // // //             createElement("strong", {}, ["rethink electric, 르노 세닉"]),
// // // //             createElement("p", {}, ["[사전예약 오픈] 지금 신청해보세요"])
// // // //         ])
// // // //     ]);
// // // // }

// // // // function weatherWidget() {
// // // //     return createElement("div", { class: "weather" }, [
// // // //         createElement("div", { class: "weather-icon" }, ["☀️"]),
// // // //         createElement("div", { class: "weather-text" }, ["31.4° 울릉/독도"])
// // // //     ]);
// // // // }

// // // // function feedPreview() {
// // // //     return createElement("div", { class: "feed" }, [
// // // //         createElement("div", { class: "feed-card" }, [
// // // //             createElement("strong", {}, ["유리"]),
// // // //             createElement("p", {}, ["프로미스나인 백지헌 인스타 사진 모음"])
// // // //         ])
// // // //     ]);
// // // // }

// // // // function iconCircle(emoji, badge = "") {
// // // //     const wrapper = createElement("div", { class: "circle-icon" }, [emoji]);
// // // //     if (badge) {
// // // //         wrapper.appendChild(createElement("span", { class: "badge" }, [badge]));
// // // //     }
// // // //     return wrapper;
// // // // }

// // // // // import { apiFetch } from "../../api/api.js";
// // // // // import { createElement } from "../../components/createElement.js";
// // // // // import { createLoginForm } from "../../pages/auth/auth.js";
// // // // // import { login } from "../auth/authService.js";

// // // // // const WIDGETS_LEFT = [
// // // // //     { id: "news", title: "📰 Top News", endpoint: "/home/news", render: d => d.map(i => liLink(i.title, i.link)) },
// // // // //     { id: "trends", title: "🔥 Trending", endpoint: "/home/trends", render: d => d.map(tag => liText(tag)) },
// // // // //     { id: "events", title: "📅 Upcoming Events", endpoint: "/home/events", render: d => d.map(e => liLink(e.title, e.link)) },
// // // // //     { id: "places", title: "🏙️ Top Places", endpoint: "/home/places", render: d => d.map(p => liLink(p.name, p.link)) },
// // // // //     { id: "community", title: "💬 From the Community", endpoint: "/home/posts", render: d => d.map(p => liLink(p.title, p.link)) }
// // // // // ];

// // // // // const WIDGETS_RIGHT = [
// // // // //     { id: "auth", custom: createAuthWidget },
// // // // //     { id: "search", custom: createSearchWidget },
// // // // //     { id: "media", title: "📸 Explore Media", endpoint: "/home/media", render: d => d.map(i => createElement("img", { src: i.url, alt: i.alt || "", loading: "lazy" })) },
// // // // //     { id: "notices", title: "📢 Announcements", endpoint: "/home/notices", render: d => d.map(n => createElement("p", {}, [n.text])) }
// // // // // ];

// // // // // const liLink = (text, href) => createElement("li", {}, [
// // // // //     createElement("a", { href: href || "#", target: "_blank" }, [text])
// // // // // ]);

// // // // // const liText = text => createElement("li", {}, [text]);

// // // // // function createWidget({ id, title, endpoint, render }) {
// // // // //     const section = createElement("section", { class: "widget draggable", "data-id": id, draggable: true }, [
// // // // //         createElement("h2", {}, [title || "Widget"]),
// // // // //         createElement("div", { class: "widget-body" }, [createElement("p", {}, ["Loading..."])])
// // // // //     ]);

// // // // //     const body = section.querySelector(".widget-body");

// // // // //     if (endpoint && render) {
// // // // //         requestIdleCallback(() => {
// // // // //             apiFetch(endpoint)
// // // // //                 .then(data => {
// // // // //                     if (!Array.isArray(data) || !data.length) {
// // // // //                         body.replaceChildren(createElement("p", {}, ["Nothing to show."]));
// // // // //                         return;
// // // // //                     }
// // // // //                     body.replaceChildren(...render(data));
// // // // //                 })
// // // // //                 .catch(err => {
// // // // //                     body.replaceChildren(createElement("p", {}, ["Failed to load."]));
// // // // //                     console.error(`[${id}] Error:`, err);
// // // // //                 });
// // // // //         });
// // // // //     }

// // // // //     return section;
// // // // // }

// // // // // function makeDraggable(column, keyName) {
// // // // //     column.addEventListener("dragstart", e => {
// // // // //         if (e.target.classList.contains("draggable")) {
// // // // //             e.dataTransfer.setData("text/plain", e.target.dataset.id);
// // // // //             e.target.classList.add("dragging");
// // // // //         }
// // // // //     });

// // // // //     column.addEventListener("dragover", e => {
// // // // //         e.preventDefault();
// // // // //         const dragging = column.querySelector(".dragging");
// // // // //         const after = [...column.querySelectorAll(".draggable:not(.dragging)")].find(el =>
// // // // //             e.clientY < el.getBoundingClientRect().top + el.offsetHeight / 2
// // // // //         );
// // // // //         if (dragging) {
// // // // //             column.insertBefore(dragging, after || null);
// // // // //         }
// // // // //     });

// // // // //     column.addEventListener("drop", () => saveLayout(keyName, column));
// // // // //     column.addEventListener("dragend", e => e.target.classList.remove("dragging"));
// // // // // }

// // // // // function saveLayout(key, column) {
// // // // //     const order = [...column.querySelectorAll(".draggable")].map(el => el.dataset.id);
// // // // //     localStorage.setItem(`home-${key}`, JSON.stringify(order));
// // // // // }

// // // // // function restoreLayout(column, defaultWidgets, key) {
// // // // //     const saved = JSON.parse(localStorage.getItem(`home-${key}`) || "[]");
// // // // //     const idsInUse = new Set(saved);
// // // // //     const remaining = defaultWidgets.filter(w => !idsInUse.has(w.id));

// // // // //     const final = [...saved, ...remaining.map(w => w.id)]
// // // // //         .map(id => defaultWidgets.find(w => w.id === id))
// // // // //         .filter(Boolean);

// // // // //     final.forEach(w => {
// // // // //         const node = w.custom ? w.custom() : createWidget(w);
// // // // //         column.appendChild(node);
// // // // //     });
// // // // // }

// // // // // function createAuthWidget(isLoggedIn) {
// // // // //     const section = createElement("section", { class: "widget draggable", draggable: true, "data-id": "auth" });

// // // // //     section.appendChild(createElement("h2", {}, [isLoggedIn ? "👋 Welcome back!" : "🔐 Login"]));

// // // // //     if (isLoggedIn) {
// // // // //         section.appendChild(createElement("button", {
// // // // //             id: "go-dashboard",
// // // // //             onclick: () => location.hash = "#/dashboard"
// // // // //         }, ["Go to Dashboard"]));
// // // // //     } else {
// // // // //         section.append(createLoginForm());
// // // // //     }

// // // // //     return section;
// // // // // }

// // // // // function createSearchWidget() {
// // // // //     return createElement("section", {
// // // // //         class: "widget draggable",
// // // // //         draggable: true,
// // // // //         "data-id": "search"
// // // // //     }, [
// // // // //         createElement("h2", {}, ["🔎 Search"]),
// // // // //         createElement("input", { type: "text", placeholder: "Search...", name: "search" }),
// // // // //         createElement("button", {}, ["Go"])
// // // // //     ]);
// // // // // }

// // // // // export function NewHome(isLoggedIn, container) {
// // // // //     container.innerHTML = "";

// // // // //     const layout = createElement("div", { class: "portal-layout" });
// // // // //     const leftCol = createElement("div", { class: "portal-left" });
// // // // //     const rightCol = createElement("div", { class: "portal-right" });

// // // // //     const leftWidgets = WIDGETS_LEFT.map(w => ({ ...w }));
// // // // //     const rightWidgets = WIDGETS_RIGHT.map(w =>
// // // // //         w.id === "auth" ? { ...w, custom: () => createAuthWidget(isLoggedIn) } :
// // // // //         w.id === "search" ? { ...w, custom: createSearchWidget } : w
// // // // //     );

// // // // //     restoreLayout(leftCol, leftWidgets, "left");
// // // // //     restoreLayout(rightCol, rightWidgets, "right");

// // // // //     makeDraggable(leftCol, "left");
// // // // //     makeDraggable(rightCol, "right");

// // // // //     layout.append(leftCol, rightCol);
// // // // //     container.appendChild(layout);
// // // // // }
