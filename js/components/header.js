// Navigation Component
import { SRC_URL, state } from "../state/state.js";
import { navigate } from "../routes/index.js";
import { logout } from "../services/auth/authService.js";
import { cartSVG, notifSVG, searchSVG } from "./svgs.js";
import { isAdmin } from "../state/state.js";
import { createElement } from "../components/createElement.js";

/** Utility Functions */
const toggleElement = (selector, className) =>
    document.querySelector(selector)?.classList.toggle(className);
const closeElement = (selector, className) =>
    document.querySelector(selector)?.classList.remove(className);

const handleNavigation = (event, href) => {
    event.preventDefault();
    if (!href) return console.error("🚨 handleNavigation received null href!");
    // console.log("handleNavigation called with href:", href);
    navigate(href);
};

/** Dropdown Component */
const createDropdown = (id, label, links) => {
    const dropdown = document.createElement("li");
    dropdown.className = "dropdown";

    const button = document.createElement("button");
    button.className = "dropdown-toggle";
    button.id = id;
    button.textContent = label;

    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.setAttribute("aria-label", `${label} Menu`);

    links.forEach(({ href, text }) => {
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.className = "dropdown-item nav-link";
        anchor.textContent = text;
        anchor.addEventListener("click", (e) => handleNavigation(e, href));
        menu.appendChild(anchor);
    });

    dropdown.appendChild(button);
    dropdown.appendChild(menu);
    return dropdown;
};

/** Profile Dropdown */
const createProfileDropdown = (user) => {
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown";

    const toggle = document.createElement("div");
    toggle.className = "profile-dropdown-toggle hflex";
    toggle.tabIndex = 0;

    const profilePic = user
        ? `${SRC_URL}/userpic/thumb/${user}.jpg`
        : `${SRC_URL}/userpic/thumb/thumb.jpg`;

    const fallbackPic = `${SRC_URL}/userpic/thumb/thumb.jpg`;

    const image = document.createElement("img");
    image.src = profilePic;
    image.loading = "lazy";
    image.alt = "Profile Picture";
    image.className = "profile-image circle";

    // Set fallback image if the user's picture doesn't load
    image.onerror = function () {
        this.onerror = null; // Prevent infinite loop if fallback also fails
        this.src = fallbackPic;
    };

    toggle.appendChild(image);

    const menu = document.createElement("div");
    menu.className = "profile-dropdown-menu";

    const links = [
        { href: "/profile", text: "Profile" },
        { href: "/admin", text: "Admin" },
    ];
    if (isAdmin()) { links.push({ href: "/admin", text: "Admin" }) }
    links.forEach(({ href, text }) => {
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.className = "dropdown-item nav-link";
        anchor.textContent = text;
        anchor.addEventListener("click", (e) => handleNavigation(e, href));
        menu.appendChild(anchor);
    });

    // Logout Button
    const logoutButton = document.createElement("button");
    logoutButton.className = "dropdown-item logout-btn";
    logoutButton.textContent = "Logout";
    logoutButton.addEventListener("click", async () => await logout());
    menu.appendChild(logoutButton);

    dropdown.appendChild(toggle);
    dropdown.appendChild(menu);
    return dropdown;
};


const createheader = (isLoggedIn) => {
    // Create Header (with logo and profile or login button)
    const header = document.createElement("header");
    header.className = "navbar hflex-sb";

    const logoDiv = document.createElement("div");
    logoDiv.className = "logo";

    const logoLink = document.createElement("a");
    logoLink.href = "/";
    logoLink.className = "logo-link";
    logoLink.textContent = "Farmium";
    logoDiv.appendChild(logoLink);

    header.appendChild(logoDiv);

    const topRightDiv = document.createElement("div");
    topRightDiv.className = "hflex-sb";
    header.appendChild(topRightDiv);

    const searchspan = createElement('a', { class: "flex-center", id: "chatNotif" }, []);
    searchspan.innerHTML = searchSVG;
    searchspan.href = "/search";
    const searchLink = createElement('div', { class: "top-svg" }, [searchspan]);
    topRightDiv.appendChild(searchLink);

    let lynx = [
        { href: "/create-farm", text: "Farm" },
    ]

    topRightDiv.appendChild(createDropdown("create-menu", "Create", lynx));

    const cartspan = createElement('a', { class: "flex-center" }, []);
    cartspan.innerHTML = cartSVG;
    cartspan.href = "/cart";
    const cartLink = createElement('div', { class: "top-svg" }, [cartspan]);
    topRightDiv.appendChild(cartLink);

    const notifspan = createElement('span', { class: "flex-center" }, []);
    notifspan.innerHTML = notifSVG;
    const notifLink = createElement('div', { class: "top-svg" }, [notifspan]);
    topRightDiv.appendChild(notifLink);

    // const chatspan = createElement('a', { class: "flex-center", id: "chatNotif" }, []);
    // chatspan.innerHTML = chatSVG;
    // chatspan.href = "/chats";
    // const chatLink = createElement('div', { class: "top-svg" }, [chatspan]);
    // topRightDiv.appendChild(chatLink);

    // Add Profile Dropdown or Login Button
    const profileOrLogin = (node) => {
        if (isLoggedIn) {
            node.appendChild(createProfileDropdown(state.user));
        } else {
            const loginButton = document.createElement("a");
            loginButton.className = "btn auth-btn";
            loginButton.textContent = "Login";
            loginButton.addEventListener("click", () => navigate("/login"));
            node.appendChild(loginButton);
        }
    };
    profileOrLogin(topRightDiv);

    // Wrap header and nav in a container so that they are siblings
    const container = document.createElement("div");
    container.className = "navigation-container";


    container.appendChild(header);

    return container;
}

/** Attach Navigation Event Listeners */
const attachNavEventListeners = () => {
    // Create Dropdown Toggle for "Create" menu
    document.getElementById("create-menu")?.addEventListener("click", (e) => {
        e.preventDefault();
        toggleElement(".dropdown-menu", "show");
    });

    // Profile Dropdown Toggle
    const profileToggle = document.querySelector(".profile-dropdown-toggle");
    profileToggle?.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleElement(".profile-dropdown-menu", "show");
    });

    // Close Profile Dropdown on Outside Click
    document.addEventListener("click", () => closeElement(".profile-dropdown-menu", "show"));

    // Keyboard Accessibility for Profile Dropdown
    profileToggle?.addEventListener("keydown", (e) => {
        if (["Enter", " "].includes(e.key)) {
            toggleElement(".profile-dropdown-menu", "show");
            e.preventDefault();
        }
    });
};

export { createheader, attachNavEventListeners, createDropdown, createProfileDropdown };
