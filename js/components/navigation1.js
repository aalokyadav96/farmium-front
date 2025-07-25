import { navigate } from "../routes/index.js";
import { moreSVG, chatSVG, notifSVG } from "./svgs.js";

/** Utility Functions */
const handleNavigation = (event, href) => {
    event.preventDefault();
    if (!href) return console.error("🚨 handleNavigation received null href!");
    navigate(href);
};

/** Navigation Item */
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
        // { href: "/home", label: "Home" },
        { href: "/dash", label: "Dash" },
        { href: "/crops", label: "Crops" },
        { href: "/farms", label: "Farms" },
        { href: "/baitos", label: "Baito" },
        { href: "/places", label: "Places" },
        { href: "/events", label: "Events" },
        { href: "/feed", label: "Feed" },
        { href: "/posts", label: "Posts" },
        // { href: "/artists", label: "Artists" },
        // { href: "/itinerary", label: "Itinerary" },
        // { href: "/products", label: "Products" },
        // { href: "/tools", label: "Tools" },
        // { href: "/recipes", label: "Recipes" },
        // { href: "/search", label: "Search" },
        // { href: "/merechats", label: "FarmChat" },
        // { href: "/livechat", label: "LiveChat" },
        // { href: "/chats", label: "UserChat" },
    ];

    const nav = document.createElement("nav");
    nav.className = "navigation";

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
    // toggleLabel.innerHTML = moreSVG;
    toggleLabel.innerText = "More";

    toggleLabelWrapper.appendChild(toggleLabel);

    inner.appendChild(ul);
    inner.appendChild(toggleLabelWrapper);

    nav.appendChild(toggle);
    nav.appendChild(inner);

    return nav;
};

export { createNav, createNavItem };
