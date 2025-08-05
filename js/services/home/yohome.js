import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { createheader } from "../../components/header.js";
import { navigate } from "../../routes/index.js";

createheader();

const formatDate = () => {
  const d = new Date();
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

// Info widget: Temp + Date + Location
const infoWidget = createElement("div", { class: "info-widget" }, [
  createElement("div", { class: "temp" }, ["🌤️ 28.6°C"]),
  createElement("div", { class: "location" }, ["Farmtown Central"]),
  createElement("div", { class: "date" }, [formatDate()]),
]);

// Search bar
const searchBar = createElement("div", { class: "search-bar" }, [
  createElement("input", {
    class: "search-input",
    type: "text",
    placeholder: "Search here...",
  }),
]);

// Emoji nav link component
const createNavIcon = (emoji, label, href) =>
  createElement("div", { class: "icon" }, [
    createElement("span", { style: "cursor:pointer;" }, [emoji]),
    createElement("span", {}, [label]),
  ]);

// Nav links
const navLinks = [
  ["🌾", "Grocery", "/grocery"],
  ["📍", "Places", "/places"],
  ["💼", "Baito", "/baitos"],
  ["🎫", "Events", "/events"],
  ["📢", "Social", "/social"],
  ["🛍️", "Products", "/products"],
];

// Collapsible nav
const visibleCount = 6;
const collapsed = createElement("div", { class: "icons-grid" });
const expanded = createElement("div", {
  class: "icons-grid",
  style: "display:none;",
});

navLinks.forEach(([emoji, label, href], index) => {
  const icon = createNavIcon(emoji, label, href);
  (index < visibleCount ? collapsed : expanded).appendChild(icon);
  icon.addEventListener("click", () => navigate(href));
});

const iconChildren = [collapsed];
let isExpanded = false;

if (navLinks.length > visibleCount) {
  const toggleButton = createElement("div", {
    style: "text-align:center; cursor:pointer; font-weight:800; color:#000; padding:10px;",
  }, ["More"]);

  toggleButton.addEventListener("click", () => {
    isExpanded = !isExpanded;
    expanded.style.display = isExpanded ? "flex" : "none";
    toggleButton.textContent = isExpanded ? "Less" : "More";
  });

  iconChildren.push(expanded, toggleButton);
}

const iconWrapper = createElement("div", {}, iconChildren);

// Trending / recent links
const trendingLinks = createElement("div", { class: "recent-links" }, [
  createElement("h3", {}, ["Trending Now"]),
  createElement("ul", {}, [
    createElement("li", {}, [
      createElement("a", { href: "#" }, ["Popular Grocery Deals"]),
    ]),
    createElement("li", {}, [
      createElement("a", { href: "#" }, ["Events This Week"]),
    ]),
    createElement("li", {}, [
      createElement("a", { href: "#" }, ["Top Baito Jobs"]),
    ]),
  ]),
]);

// Content container
const content = createElement("div", { class: "yohome" }, [
  infoWidget,
  searchBar,
  createElement("h2", {}, ["Explore"]),
  iconWrapper,
  trendingLinks,
]);

export function YoHome(isLoggedIn, container) {
  const installer = createElement("div", {}, [
    createElement("button", {
      id: "install-pwa",
      style: "display:none;",
    }, ["Install App"])
  ]);

  container.appendChild(installer);
  container.appendChild(content);
}

// import { createElement } from "../../components/createElement.js";
// import { apiFetch } from "../../api/api.js";
// import { createheader } from "../../components/header.js";
// import { navigate } from "../../routes/index.js";

// createheader();

// // Create emoji-based navigation span
// const navSpan = (emoji, href) => {
//   const span = createElement("span", { style: "cursor:pointer;" }, [emoji]);
//   return span;
// };

// // Create nav icon block
// const createNavIcon = (emoji, label, href) =>
//   createElement("div", { class: "icon" }, [
//     navSpan(emoji, href),
//     createElement("span", {}, [label]),
//   ]);

// // Search bar
// const searchBar = createElement("div", { class: "search-bar" }, [
//   createElement("input", {
//     class: "search-input",
//     type: "text",
//     placeholder: "Search here...",
//   }),
// ]);

// // Navigation links
// const navLinks = [
//   ["🌾", "Grocery", "/grocery"],
//   ["📍", "Places", "/places"],
//   ["💼", "Baito", "/baitos"],
//   ["🎫", "Events", "/events"],
//   ["📢", "Social", "/social"],
//   ["🛍️", "Products", "/products"],
// ];

// const visibleCount = 6;
// const collapsed = createElement("div", { class: "icons-grid" });
// const expanded = createElement("div", {
//   class: "icons-grid",
//   style: "display:none;",
// });

// navLinks.forEach(([emoji, label, href], index) => {
//   const icon = createNavIcon(emoji, label, href);
//   (index < visibleCount ? collapsed : expanded).appendChild(icon);
//   if (href) {
//     icon.addEventListener("click", (e) => {
//       e.preventDefault();
//       navigate(href);
//     });
//   }
// });

// const iconChildren = [collapsed];
// let isExpanded = false;

// if (navLinks.length > visibleCount) {
//   const toggleButton = createElement("div", {
//     style: "text-align:center; cursor:pointer; font-weight:800; color:#000; padding:10px;",
//   }, ["More"]);

//   toggleButton.addEventListener("click", () => {
//     isExpanded = !isExpanded;
//     expanded.style.display = isExpanded ? "flex" : "none";
//     toggleButton.textContent = isExpanded ? "Less" : "More";
//   });

//   iconChildren.push(expanded, toggleButton);
// }

// const iconWrapper = createElement("div", {}, iconChildren);

// // Temporary banner
// const tempBanner = createElement("div", { class: "temp-banner" }, [
//   "🌤️ 28.6°C Farmtown Central"
// ]);

// const content = createElement("div");
// content.append(tempBanner, searchBar, iconWrapper);

// export function YoHome(isLoggedIn, container) {
//   let installer = createElement("div",{},[]);
//   installer.innerHTML=`<button id="install-pwa" style="display:none;">Install App</button>`;
//   container.appendChild(installer);
//   container.appendChild(content);
// }

// // import { createElement } from "../../components/createElement.js";
// // import { apiFetch } from "../../api/api.js";
// // import { createheader } from "../../components/header.js";
// // import { navigate } from "../../routes/index.js";

// // createheader();

// // // Utility to create emoji-based navigation spans
// // const navSpan = (emoji, href) => {
// //   const span = createElement("span", { style: "cursor:pointer;" }, [emoji]);
// //   if (href) {
// //     span.addEventListener("click", (e) => {
// //       e.preventDefault();
// //       navigate(href);
// //     });
// //   }
// //   return span;
// // };

// // // Search bar
// // const searchBar = createElement("div", { class: "search-bar" }, [
// //   createElement("input", {
// //     class: "search-input",
// //     type: "text",
// //     placeholder: "Search here...",
// //   }),
// // ]);

// // // Navigation data
// // const navLinks = [
// //   ["🌾", "Grocery", "/crops"],
// //   ["📍", "Places", "/places"],
// //   ["💼", "Baito", "/baitos"],
// //   ["🎫", "Events", "/events"],
// //   ["📢", "Social", "/social"],
// //   ["🛍️", "Products", "/products"],
// // ];

// // const visibleCount = 6;

// // const collapsed = createElement("div", { class: "icons-grid" }, []);
// // const expanded = createElement("div", {
// //   class: "icons-grid",
// //   style: "display:none;",
// // }, []);

// // navLinks.slice(0, visibleCount).forEach(([emoji, label, href]) => {
// //   collapsed.appendChild(
// //     createElement("div", { class: "icon" }, [
// //       navSpan(emoji, href),
// //       createElement("span", {}, [label]),
// //     ])
// //   );
// // });

// // navLinks.slice(visibleCount).forEach(([emoji, label, href]) => {
// //   expanded.appendChild(
// //     createElement("div", { class: "icon" }, [
// //       navSpan(emoji, href),
// //       createElement("span", {}, [label]),
// //     ])
// //   );
// // });

// // const iconChildren = [collapsed];
// // let isExpanded = false;

// // let toggleButton;
// // if (visibleCount < navLinks.length) {
// //   toggleButton = createElement("div", {
// //     style: "text-align:center; cursor:pointer;font-weight:800; color:#000; padding:10px;"
// //   }, ["More"]);
// //   toggleButton.addEventListener("click", () => {
// //     isExpanded = !isExpanded;
// //     expanded.style.display = isExpanded ? "flex" : "none";
// //     toggleButton.textContent = isExpanded ? "Less" : "More";
// //   });
// //   iconChildren.push(expanded, toggleButton);
// // }

// // const iconWrapper = createElement("div", {}, iconChildren);

// // // Temporary banner or weather/info block
// // const tempBanner = createElement("div", { class: "temp-banner" }, [
// //   "🌤️ 28.6°C Farmtown Central"
// // ]);

// // // Hydrate content into main content area
// // const content = createElement("div");
// // content.innerHTML = "";
// // content.append(
// //   tempBanner,
// //   searchBar,
// //   iconWrapper,
// // );

// // export function Hemre(isLoggedIn, container) {
// //   container.appendChild(content);
// // }

