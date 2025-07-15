import { SRC_URL, getState, isAdmin, subscribe, unsubscribe } from "../state/state.js";
import { navigate } from "../routes/index.js";
import { logout } from "../services/auth/authService.js";
import { cartSVG, notifSVG, searchSVG, moonSVG } from "./svgs.js";
import { createElement } from "../components/createElement.js";
import Button from "./base/Button.js";
// import Button from "./base/Button.js";

/** Utility Functions */
const toggleElement = (el, className) => el?.classList.toggle(className);
const closeElement = (el, className) => el?.classList.remove(className);

const handleNavigation = (event, href) => {
    event.preventDefault();
    if (!href) return console.error("🚨 handleNavigation received null href!");
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
const createProfileDropdown = (userId) => {
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown";

    const toggle = document.createElement("div");
    toggle.className = "profile-dropdown-toggle hflex";
    toggle.tabIndex = 0;
    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const menu = toggle.nextElementSibling;
        toggleElement(menu, "show");
    });
    toggle.addEventListener("keydown", (e) => {
        if (["Enter", " "].includes(e.key)) {
            const menu = profileToggle.nextElementSibling;
            toggleElement(menu, "show");
            alert("working");
            e.preventDefault();
        }
    });

    const profilePic = userId
        ? `${SRC_URL}/userpic/thumb/${getState("user")}.jpg`
        : `${SRC_URL}/userpic/thumb/thumb.jpg`;

    const fallbackPic = `${SRC_URL}/userpic/thumb/thumb.jpg`;

    const image = document.createElement("img");
    image.src = profilePic;
    image.loading = "lazy";
    image.alt = "Profile Picture";
    image.className = "profile-image circle";

    image.onerror = function () {
        this.onerror = null;
        this.src = fallbackPic;
    };

    toggle.appendChild(image);

    const menu = document.createElement("div");
    menu.className = "profile-dropdown-menu";
    menu.addEventListener("click", () => {
        const menu = document.querySelector(".profile-dropdown-menu");
        closeElement(menu, "show");
    });
    const links = [
        { href: "/profile", text: "Profile" },
        { href: "/my-orders", text: "My Orders" }
    ];
    if (isAdmin()) {
        links.push({ href: "/admin", text: "Admin" });
    }

    links.forEach(({ href, text }) => {
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.className = "dropdown-item nav-link";
        anchor.textContent = text;
        anchor.addEventListener("click", (e) => handleNavigation(e, href));
        menu.appendChild(anchor);
    });

    const logoutButton = document.createElement("button");
    logoutButton.className = "dropdown-item logout-btn";
    logoutButton.textContent = "Logout";
    logoutButton.addEventListener("click", async () => await logout());
    menu.appendChild(logoutButton);

    dropdown.appendChild(toggle);
    dropdown.appendChild(menu);
    return dropdown;
};

/** Helper */
const isLoggedIn = () => !!getState("token");

function createheader() {
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

    topRightDiv.appendChild(Button("Create Farm", "create-farm-head-btn", {
        click: () => { navigate(`/create-farm`); }
    }, "", { "font-size": "14px" }));

    // // Static Links
    // const searchspan = createElement("a", { class: "flex-center", id: "chatNotif" }, []);
    // searchspan.innerHTML = searchSVG;
    // searchspan.href = "/search";
    // const searchLink = createElement("div", { class: "top-svg" }, [searchspan]);
    // topRightDiv.appendChild(searchLink);

    // const lynx = [
    //     { href: "/create-event", text: "Event" },
    //     { href: "/create-place", text: "Place" },
    //     { href: "/create-artist", text: "Artist" },
    //     { href: "/create-post", text: "Post" },
    //     { href: "/create-baito", text: "Baito" },
    //     { href: "/create-farm", text: "Farm" },
    //     { href: "/create-itinerary", text: "Itinerary" },
    // ];
    // topRightDiv.appendChild(createDropdown("create-menu", "Create", lynx));
    // let createMenuDpd = createDropdown("create-menu", "Create", lynx);
    // topRightDiv.appendChild(createMenuDpd);
    // createMenuDpd.addEventListener("click", (e) => {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         createMenuDpd.nextElementSibling?.classList.toggle("show");
    //     });

    const cartspan = createElement('a', { class: "flex-center" }, []);
    cartspan.innerHTML = cartSVG;
    cartspan.href = "/cart";
    const cartLink = createElement('div', { class: "top-svg" }, [cartspan]);
    topRightDiv.appendChild(cartLink);

    const notifspan = createElement("span", { class: "flex-center" }, []);
    notifspan.innerHTML = notifSVG;
    const notifLink = createElement("div", { class: "top-svg" }, [notifspan]);
    topRightDiv.appendChild(notifLink);

    const moonTheme = createElement('a', { class: "flex-center" }, []);
    moonTheme.innerHTML = moonSVG;
    moonTheme.addEventListener("click", toggleTheme);
    const moonLink = createElement('div', { class: "top-svg" }, [moonTheme]);
    topRightDiv.appendChild(moonLink);

    const themes = ["light", "dark", "solarized", "dimmed"];
    let currentThemeIndex = 0;

    function loadTheme() {
        const saved = localStorage.getItem("theme");
        const index = themes.indexOf(saved);
        if (index >= 0) {
            document.documentElement.setAttribute("data-theme", saved);
            currentThemeIndex = index;
        }
    }

    function toggleTheme() {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        const newTheme = themes[currentThemeIndex];
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    }

    loadTheme();

    const userArea = document.createElement("div");
    topRightDiv.appendChild(userArea);

    const renderUserArea = () => {
        userArea.innerHTML = ""; // Clear existing
        if (isLoggedIn()) {
            // const userId = typeof getState("user") === "string" ? getState("user") : getState("user")?.id;
            const userId = getState("user");
            userArea.appendChild(createProfileDropdown(userId));
        } else {
            // const loginButton = document.createElement("a");
            // loginButton.className = "btn auth-btn";
            // loginButton.textContent = "Login";
            // loginButton.addEventListener("click", () => navigate("/login"));
            // userArea.appendChild(loginButton);
            
            const loginButton = createElement("a",{"href":"#", "class":"btn auth-btn"},["Login"]);
            loginButton.addEventListener("click", () => navigate("/login"));
            userArea.appendChild(loginButton);
        }
    };

    renderUserArea(); // Initial render

    const tokenChangeHandler = () => renderUserArea();
    // subscribe("token", tokenChangeHandler);
    subscribe("user", tokenChangeHandler);

    // Auto unsubscribe if header is removed
    const observer = new MutationObserver(() => {
        if (!document.body.contains(header)) {
            unsubscribe("token", tokenChangeHandler);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const container = document.createElement("div");
    container.className = "navigation-container";
    container.appendChild(header);

    return container;
}

/** Attach Navigation Event Listeners */
const attachNavEventListeners = () => {
    // // "Create" dropdown toggle
    // const createToggle = document.getElementById("create-menu");
    // createToggle?.addEventListener("click", (e) => {
    //     e.preventDefault();
    //     e.stopPropagation();
    //     createToggle.nextElementSibling?.classList.toggle("show");
    // });

    // // Profile Dropdown Toggle
    // const profileToggle = document.querySelector(".profile-dropdown-toggle");
    // profileToggle?.addEventListener("click", (e) => {
    //     e.stopPropagation();
    //     const menu = profileToggle.nextElementSibling;
    //     toggleElement(menu, "show");
    // });

    // // Close profile menu on outside click
    // document.addEventListener("click", () => {
    //     const menu = document.querySelector(".profile-dropdown-menu");
    //     closeElement(menu, "show");
    // });

    // // Keyboard toggle
    // profileToggle?.addEventListener("keydown", (e) => {
    //     if (["Enter", " "].includes(e.key)) {
    //         const menu = profileToggle.nextElementSibling;
    //         toggleElement(menu, "show");
    //         alert("working");
    //         e.preventDefault();
    //     }
    // });
};

export { createheader, attachNavEventListeners, createDropdown, createProfileDropdown };
