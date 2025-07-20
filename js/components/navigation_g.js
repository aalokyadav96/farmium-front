import { navigate } from "../routes/index.js";

/** --- Navigation Config --- */
const navConfig = [
    // { label: "Home", href: "/home" },
    { label: "Dashboard", href: "/dash" },
    { label: "Search", href: "/search" },
    {
        label: "Social",
        dropdown: [
            { label: "Feed", href: "/feed" },
            { label: "Posts", href: "/posts" },
            { label: "UserChat", href: "/chats" },
            { label: "LiveChat", href: "/livechat" },
            { label: "FarmChat", href: "/merechats" },
        ],
    },
    {
        label: "Travel",
        dropdown: [
            { label: "Events", href: "/events" },
            { label: "Places", href: "/places" },
            { label: "Baito", href: "/baitos" },
            { label: "Itinerary", href: "/itinerary" },
        ],
    },
    {
        label: "Farm",
        dropdown: [
            { label: "Crops", href: "/crops" },
            { label: "Farms", href: "/farms" },
            { label: "Products", href: "/products" },
            { label: "Tools", href: "/tools" },
            { label: "Recipes", href: "/recipes" },
        ],
    },
];

/** --- Utility --- */
const handleNavigation = (event, href) => {
    event.preventDefault();
    if (!href) return;
    navigate(href);
};

/** --- Nav Builder --- */
const createNav = () => {
    const navWrapper = document.createElement("div");
    navWrapper.style.width = "100%";

    const nav = document.createElement("nav");
    nav.classList.add("topnav");

    const ul = document.createElement("ul");
    ul.classList.add("topnav__list");

    const dropdownContainer = document.createElement("div");
    dropdownContainer.classList.add("dropdown");

    navConfig.forEach((item, index) => {
        const li = document.createElement("li");
        li.classList.add("topnav__item");

        const tab = document.createElement("a");
        tab.href = item.href || "#";
        tab.classList.add("topnav__link");
        tab.textContent = item.label;

        if (item.dropdown) {
            tab.addEventListener("click", (e) => {
                e.preventDefault();
                const current = dropdownContainer.getAttribute("data-active");

                if (current === item.label) {
                    dropdownContainer.classList.remove("open");
                    dropdownContainer.innerHTML = "";
                    dropdownContainer.removeAttribute("data-active");
                    document.querySelectorAll(".topnav__link.active").forEach(el => el.classList.remove("active"));
                } else {
                    dropdownContainer.classList.add("open");
                    dropdownContainer.innerHTML = "";
                    dropdownContainer.setAttribute("data-active", item.label);
                    document.querySelectorAll(".topnav__link.active").forEach(el => el.classList.remove("active"));
                    tab.classList.add("active");

                    const grid = document.createElement("div");
                    grid.classList.add("dropdown__grid");

                    item.dropdown.forEach((subItem) => {
                        const link = document.createElement("a");
                        link.href = subItem.href;
                        link.classList.add("dropdown__link");
                        link.textContent = subItem.label;
                        link.addEventListener("click", (e) => handleNavigation(e, subItem.href));
                        grid.appendChild(link);
                    });

                    dropdownContainer.appendChild(grid);
                }
            });
        } else {
            tab.addEventListener("click", (e) => handleNavigation(e, item.href));
        }

        li.appendChild(tab);
        ul.appendChild(li);
    });

    nav.appendChild(ul);
    navWrapper.appendChild(nav);
    navWrapper.appendChild(dropdownContainer);

    return navWrapper;
};

export { createNav };
