// sidebar.js
import "../../css/subpages/sidebar.css";
import { navigate } from "../routes/index.js";
import { createElement } from "../components/createElement.js";
// import { createIconButton } from "../utils/svgIconButton.js";
// import { xSVG } from "./svgs.js";

let sidebar = null;
let backdrop = null;
let isOpen = false;

function buildSidebar() {
  // const closeBtn = createElement("button", { class: "sidebar-close" }, [createIconButton({ svgMarkup: xSVG, classSuffix: "" })]);
  // closeBtn.addEventListener("click", toggleSidebar);

  const links = [
    { title: "Home", path: "/home" },
    { title: "Profile", path: "/profile" },
    { title: "Settings", path: "/settings" },
    { path: "/baitos/hire", title: "Hire" },
    { path: "/grocery", title: "Grocery" },
    { path: "/places", title: "Places" },
    { path: "/events", title: "Events" },
    { path: "/baitos", title: "Baito" },
    { path: "/social", title: "Social" },
    { path: "/posts", title: "Posts" },
    { path: "/itinerary", title: "Itinerary" },
    { path: "/recipes", title: "Recipes" },
    { path: "/artists", title: "Artists" },
  ];

  const linkEls = links.map(link => {
    const el = createElement("a", { href: link.path, class: "sidebar-link" }, [link.title]);
    el.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(link.path);
      toggleSidebar(); // close after navigation
    });
    return el;
  });

  sidebar = createElement("div", { class: "sidebar hidden" }, [
    // closeBtn,
    ...linkEls
  ]);

  backdrop = createElement("div", { class: "sidebar-backdrop hidden" });
  backdrop.addEventListener("click", toggleSidebar);

  document.body.appendChild(backdrop);
  document.body.appendChild(sidebar);

  // Escape key listener
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      toggleSidebar();
    }
  });
}

export function toggleSidebar() {
  if (!sidebar || !backdrop) buildSidebar();
  isOpen = !isOpen;

  if (isOpen) {
    sidebar.classList.remove("hidden");
    backdrop.classList.remove("hidden");
  } else {
    sidebar.classList.add("hidden");
    backdrop.classList.add("hidden");
  }
}
