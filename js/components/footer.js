import { setLanguage } from "../i18n/i18n.js";
import { navigate } from "../routes/index.js";
import { webSiteName } from "../state/state.js";
import Button from "./base/Button.js";

const handleNavigation = (event, href) => {
    event.preventDefault();
    if (!href) return console.error("🚨 handleNavigation received null href!");
    console.log("handleNavigation called with href:", href);
    navigate(href);
};

/** Footer Bar */
const Footer = () => {
    // Create Elements
    // const footer = document.createElement("footer");
    // footer.className = "footer";
    // footer.id = "footer";

    const container = document.createElement("div");
    container.className = "footer-container";

    // Navigation Links
    const nav = document.createElement("nav");
    nav.className = "footer-nav";

    const pages = [
        { href: "/about", text: "About Us" },
        { href: "/contact", text: "Contact Us" },
        { href: "/faq", text: "FAQ" },
        { href: "/terms", text: "Terms & Conditions" },
        { href: "/privacy", text: "Privacy Policy" },
        { href: "/refund", text: "Refund Policy" },
        { href: "/shipping", text: "Shipping Policy" },
        { href: "/returns", text: "Return Policy" },
        { href: "/disclaimer", text: "Disclaimer" },
        { href: "/blog", text: "Blog" },
    ];

    pages.forEach(({ href, text }) => {
        const link = document.createElement("a");
        link.href = href;
        link.textContent = text;
        link.className = "footer-link";
        link.addEventListener("click", (e) => handleNavigation(e, href));
        nav.appendChild(link);
    });

    // Language Selector
    const langSelect = document.createElement("select");
    langSelect.className = "lang-select";
    langSelect.setAttribute('name', 'lang-select');
    langSelect.setAttribute('aria-label', 'Select Page Language');
    langSelect.innerHTML = `
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="es">Español</option>
        <option value="hi">हिन्दी</option>
    `;

    // Set initial selected value based on current language
    const currentLang = localStorage.getItem("lang") || "en";
    langSelect.value = currentLang;

    langSelect.addEventListener("change", async (event) => {
        const selectedLang = event.target.value;
        if (selectedLang) {
            await setLanguage(selectedLang);
            langSelect.value = selectedLang;
        }
    });

    var reportButt = Button("Feedback", 'feedback-btn', {}, "buttonx", {});

    // Footer Bottom
    const footerBottom = document.createElement("div");
    footerBottom.className = "footer-bottom";

    const copyright = document.createElement("p");
    copyright.textContent = `© ${new Date().getFullYear()} ${webSiteName}. All rights reserved.`;

    footerBottom.appendChild(langSelect);
    footerBottom.appendChild(copyright);
    footerBottom.appendChild(reportButt);

    // Append elements
    container.appendChild(nav);
    container.appendChild(footerBottom);
    // footer.appendChild(container);

    // return footer;
    return container;
};

export { Footer };
