// Navigation Component
import { navigate } from "../routes/index.js";
import { moreSVG, chatSVG, notifSVG } from "./svgs.js";

/** Utility Functions */
const handleNavigation = (event, href) => {
    event.preventDefault();
    if (!href) return console.error("🚨 handleNavigation received null href!");
    // console.log("handleNavigation called with href:", href);
    navigate(href);
};

/*********************** */

/** Navigation Item */
const createNavItem = (href, label) => {
    const li = document.createElement("li");
    li.className = "navigation__item";
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.className = "nav-link navigation__link";
    anchor.textContent = label;
    anchor.addEventListener("click", (e) => handleNavigation(e, href));
    li.appendChild(anchor);
    return li;
};

/** Navigation Bar */
const createNav = (isLoggedIn) => {

    // const isLoggedIn = Boolean(state.token);
    const navItems = [
        { href: "/home", label: "Home" },
        { href: "/farms", label: "Farms" },
        { href: "/crops", label: "Crops" },

    ];

    /*************************** */

    // Create Navigation Menu
    const nav = document.createElement("nav");
    // nav.className = "nav-menu hflex";
    nav.className = "navigation hflex";

    const ul = document.createElement("ul");
    // ul.className = "nav-list hflex";
    ul.className = "navigation__list";

    // Append Navigation Items
    const fragment = document.createDocumentFragment();
    navItems.forEach((item) => fragment.appendChild(createNavItem(item.href, item.label)));


    const ulx = document.createElement("div");
    ulx.className = "navigation__inner";

    const ipt = document.createElement("input");
    ipt.className = "toggle";
    ipt.type = "checkbox";
    ipt.id = "more";
    ipt.setAttribute("aria-hidden", "true");
    ipt.setAttribute("tabindex", "-1");

    // const nin = document.createElement("div");
    // nin.className = "navigation__toggle flex-center";
    // nin.style.borderLeft = "1px solid #ccc";
    // // nin.innerHTML = `<label class="navigation__link" for="more" aria-hidden="true">${downloadSVG}</label>`;
    // nin.innerHTML = `<label class="flex-center" for="more" aria-hidden="true">${moreSVG}</label>`;


    ul.appendChild(fragment);
    nav.appendChild(ipt);
    ulx.appendChild(ul);
    // ulx.appendChild(nin);
    nav.appendChild(ulx);

    const container = document.createElement("div");
    container.className = "navigation-container";

    /*********************** */
    container.appendChild(nav);

    return container;
};

export { createNav, createNavItem };
