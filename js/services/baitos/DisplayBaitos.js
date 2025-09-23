// import { buildHeader } from "./baitoslisting/Header.js";
import { buildCard } from "./baitoslisting/JobCard.js";
import { clearElement } from "./baitoslisting/utils.js";
import { displayListingPage } from "../../utils/displayListingPage.js"; // your generic listing page
import { createElement } from "../../components/createElement.js";
import { Button } from "../../components/base/Button.js";
import { navigate } from "../../routes/index.js";

export function displayBaitos(container, isLoggedIn) {
  clearElement(container);

  displayListingPage(container, {
    title: "Baitos",
    apiEndpoint: "/baitos/latest",
    cardBuilder: buildCard,
    type: "baitos",
    pageSize: 10,
    sidebarActions: aside => {
      // Layout aside buttons
      aside.append(
        createElement("h3", {}, ["Actions"]),
        Button("Create Baito", "ct-baito-btn", { click: () => navigate("/create-baito") }, "buttonx"),
        Button("See Dashboard", "see-dash-btn", { click: () => navigate("/baitos/dash") }, "buttonx"),
        Button("Create Baito Profile", "", { click: () => navigate("/baitos/create-profile") }, "buttonx secondary"),
        Button("Hire Workers", "", { click: () => navigate("/baitos/hire") }, "buttonx secondary")
      );

      // Language selector
      const langSelect = createElement("select", { id: "lang-toggle" });
      ["EN", "JP"].forEach(lang =>
        langSelect.appendChild(createElement("option", { value: lang.toLowerCase() }, [lang]))
      );
      langSelect.value = localStorage.getItem("baito-lang") || "en";
      langSelect.addEventListener("change", e => {
        localStorage.setItem("baito-lang", e.target.value);
        navigate(window.location.pathname);
      });
      aside.appendChild(langSelect);
    }
  });

  // // Append header above list
  // const main = container.querySelector(".baitos-main");
  // if (main) main.insertBefore(buildHeader(), main.firstChild);
}
