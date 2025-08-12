import { navigate } from "../routes/index.js";
import { moreSVG, chatSVG, notifSVG } from "./svgs.js";

/** Utility: Highlight current active link based on path */
export const highlightActiveNav = (path) => {
    const links = document.querySelectorAll(".navigation__link");
    links.forEach(link => {
        const href = link.getAttribute("href");
        if (href === path) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
};

/** Utility: Handle navigation + active class */
const handleNavigation = (event, href) => {
    event.preventDefault();
    if (!href) return console.error("🚨 handleNavigation received null href!");
    
    // highlightActiveNav(href);
    navigate(href);
};

/** Create one navigation item */
const createNavItem = (href, label) => {
    const li = document.createElement("li");
    li.className = "navigation__item";

    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.className = "navigation__link";
    anchor.textContent = label;

    anchor.addEventListener("click", (e) => handleNavigation(e, href));

    li.appendChild(anchor);
    return li;
};

/** Navigation Bar */
const createNav = () => {
    const navItems = [
        // { href: "/places", label: "Places" },
        { href: "/grocery", label: "Grocery" },
        // { href: "/events", label: "Events" },
        // { href: "/baitos", label: "Baito" },
        // { href: "/baitos/hire", label: "Hire" },
        { href: "/crops", label: "Crops" },
        { href: "/farms", label: "Farms" },
        // { href: "/social", label: "Social" },
        // { href: "/posts", label: "Posts" },
        // { href: "/shop", label: "Shop" },
        { href: "/recipes", label: "Recipes" },
        { href: "/tools", label: "Tools" },
        { href: "/search", label: "Search" },
        // { href: "/itinerary", label: "Itinerary" },
        // { href: "/artists", label: "Artists" },
        { href: "/dash", label: "Dash" },
    ];

    const nav = document.createElement("div");
    // nav.className = "navigation";

    const toggle = document.createElement("input");
    toggle.className = "toggle";
    toggle.type = "checkbox";
    toggle.id = "more";
    toggle.setAttribute("aria-hidden", "true");
    toggle.setAttribute("tabindex", "-1");

    const inner = document.createElement("div");
    inner.className = "navigation__inner";

    const ul = document.createElement("ul");
    ul.className = "navigation__list";

    const fragment = document.createDocumentFragment();
    navItems.forEach(({ href, label }) => {
        fragment.appendChild(createNavItem(href, label));
    });
    ul.appendChild(fragment);

    const toggleLabelWrapper = document.createElement("div");
    toggleLabelWrapper.className = "navigation__toggle";

    const toggleLabel = document.createElement("label");
    toggleLabel.className = "navigation__link";
    toggleLabel.setAttribute("for", "more");
    toggleLabel.setAttribute("aria-hidden", "true");
    toggleLabel.innerText = "More";

    toggleLabelWrapper.appendChild(toggleLabel);
    inner.appendChild(ul);
    inner.appendChild(toggleLabelWrapper);
    nav.appendChild(toggle);
    nav.appendChild(inner);

    // Highlight the current route on initial render
    highlightActiveNav(window.location.pathname);

    return nav;
};

export { createNav, createNavItem };
