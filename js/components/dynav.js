import "../../css/dynav.css";
import { createElement } from "./createElement";

export function createNav() {
  const navItems = [
    { href: "/home", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/places", label: "Places" },
    { href: "/artists", label: "Artists" },
    { href: "/feed", label: "Feed" },
    { href: "/itinerary", label: "Itinerary" },
    { href: "/posts", label: "Posts" },
    { href: "/baitos", label: "Baito" },
    { href: "/dash", label: "Dashboard" },
    { href: "/crops", label: "Crops" },
    { href: "/farms", label: "Farms" },
    { href: "/products", label: "Products" },
    { href: "/tools", label: "Tools" },
    { href: "/recipes", label: "Recipes" },
    { href: "/search", label: "Search" },
    { href: "/merechats", label: "FarmChat" },
    { href: "/livechat", label: "LiveChat" },
    { href: "/chats", label: "UserChat" },
  ];

  const createNavItem = (href, label) => {
    const li = document.createElement("li");
    li.className = "navigation__item";

    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.className = "navigation__link";
    anchor.textContent = label;

    // Optional: navigation click handler
    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = href;
    });

    li.appendChild(anchor);
    return li;
  };

  const mainTab = createElement("ul", { id: "main-tabs" }, []);
  const navx = document.getElementById("primary-nav");
  navx.appendChild(mainTab);

  window.addEventListener("resize", () => {
    clearNav();
    fillNav();
  });

  function clearNav() {
    mainTab.innerHTML = "";
  }

  function fillNav() {
    const WinWidth =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;

    // Estimate tab width using a sample item
    const sample = createNavItem("/", "Sample");
    mainTab.appendChild(sample);
    const tabWidth = sample.getBoundingClientRect().width;
    sample.remove();

    const maxTabs = Math.floor(WinWidth / tabWidth);

    if (maxTabs >= navItems.length) {
      navItems.forEach(({ href, label }) => {
        mainTab.appendChild(createNavItem(href, label));
      });
    } else {
      navItems.slice(0, maxTabs - 1).forEach(({ href, label }) => {
        mainTab.appendChild(createNavItem(href, label));
      });

      const extraLI = document.createElement("li");
      extraLI.setAttribute("id", "extraLI");
      extraLI.setAttribute("tabindex", "0");
      extraLI.className = "navigation__item";

      const span = document.createElement("span");
      span.textContent = "More +";
      span.className = "navigation__link";

      const extraTabsList = document.createElement("ul");
      extraTabsList.setAttribute("id", "extra-tabs");

      navItems.slice(maxTabs - 1).reverse().forEach(({ href, label }) => {
        extraTabsList.insertBefore(createNavItem(href, label), extraTabsList.firstChild);
      });

      extraLI.appendChild(span);
      extraLI.appendChild(extraTabsList);
      mainTab.appendChild(extraLI);

      extraLI.addEventListener("click", () => {
        extraTabsList.classList.toggle("display-dropdown");
      });

      extraLI.addEventListener("blur", () => {
        extraTabsList.classList.remove("display-dropdown");
      });
    }
  }

  fillNav();
}
