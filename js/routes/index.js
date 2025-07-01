import { attachNavEventListeners, createheader } from "../components/header.js";
// import MegaMenuC from "../components/ui/MegamenuC.mjs";
import { createNav } from "../components/navigation.js";
import { secnav } from "../components/secNav.js";
// import { Footer } from "../components/footer.js";
// import { FloatingActionButton } from "../components/ui/FAB.mjs";
import { renderPageContent } from "./render.js";
// import { renderPageContent } from "./renderPageContent.js";
import { state } from "../state/state.js";
import { coffeeSVG } from "../components/svgs.js";

async function loadContent(url) {
    const app = document.getElementById("app");
    app.innerHTML = ""; // Clear previous content

    state.token = sessionStorage.getItem("token") || localStorage.getItem("token") || null;
    const isLoggedIn = !!state.token;
    // console.log("User logged in:", isLoggedIn);

    const main = document.createElement("main");
    main.id = "content";

    app.appendChild(createheader(isLoggedIn));
    app.appendChild(createNav(isLoggedIn));

    /* */
    // app.appendChild(MegaMenuC());
    /* */

    const secNavElement = secnav(isLoggedIn);
    if (secNavElement) {
        app.appendChild(secNavElement);
    }

    // app.appendChild(secnav(isLoggedIn));
    app.appendChild(main);
    // app.appendChild(Footer());
    // FloatingActionButton(coffeeSVG, "fab-btn");

    attachNavEventListeners();
    await renderPageContent(isLoggedIn, url, main);
}


// SPA Navigation Function
function navigate(path) {
    sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
    if (!path) {
        console.error("🚨 navigate called with null or undefined!", new Error().stack);
        return;
    }
    console.log("Navigating to:", path);
    if (window.location.pathname !== path) {
        history.pushState(null, "", path);
        loadContent(path);
    }
}

// // SPA Navigation Function
// function navigate(path) {
//     sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
//     if (!path) {
//         console.error("🚨 navigate called with null or undefined!", new Error().stack);
//         return;
//     }
//     console.log("Navigating to:", path);
//     if (window.location.pathname !== path) {
//         history.pushState(null, "", path);
//         loadContent(path);
//     }
// }

// Initial Render
async function renderPage() {
    await loadContent(window.location.pathname);
}

export { navigate, renderPage, loadContent };
