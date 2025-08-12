import { buildHeader } from "./baitoslisting/Header.js";
import { buildFilterBar } from "./baitoslisting/FilterBar.js";
import { buildPagination } from "./baitoslisting/Pagination.js";
import { buildCard } from "./baitoslisting/JobCard.js";
import { clearElement } from "./baitoslisting/utils.js";
import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";

export function displayBaitos(container, isLoggedIn) {
  clearElement(container);

  displayBaitoTabContent(container, isLoggedIn);
}

export async function displayBaitoTabContent(container, isLoggedIn) {
  clearElement(container);

  const layout = createElement("div", { class: "baitospage" });
  const aside = createElement("div", { class: "baitosaside" });
  const main = createElement("div", { class: "baitosmain" });

  layout.append(main, aside);
  container.appendChild(layout);

  appendAsideButtons(aside);
  appendLanguageSelector(aside);

  main.appendChild(buildHeader());

  const listSection = createElement("div", { class: "baito-list" });
  main.appendChild(listSection);

  const pageSize = 10;
  let baitos = [];
  let filtered = [];
  let currentPage = 1;

  const { wrapper: paginationWrapper, prevBtn, nextBtn } = buildPagination(
    () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage();
      }
    },
    () => {
      if (currentPage * pageSize < filtered.length) {
        currentPage++;
        renderPage();
      }
    }
  );

  main.appendChild(paginationWrapper);

  const filter = buildFilterBar(onFilterChange);
  const filterToggle = createElement(
    "details",
    { class: "baito-filter-toggle", open: false },
    [createElement("summary", { class: "baito-filter-summary" }, ["🔍 Filter Jobs"]), filter.filterBar]
  );

  main.insertBefore(filterToggle, listSection);

  function onFilterChange() {
    const { category, subcategory, locations, keyword, minWage, sort } = filter.getValues();

    filtered = baitos.filter(job =>
      (!category || job.category === category) &&
      (!subcategory || job.subcategory === subcategory) &&
      (!locations.length || locations.some(loc => job.location?.toLowerCase().includes(loc))) &&
      (!keyword || job.title?.toLowerCase().includes(keyword) || job.description?.toLowerCase().includes(keyword)) &&
      (!minWage || Number(job.wage || 0) >= minWage)
    );

    if (sort === "wage") {
      filtered.sort((a, b) => (b.wage || 0) - (a.wage || 0));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    currentPage = 1;
    renderPage();
  }

  function renderPage() {
    clearElement(listSection);
    const start = (currentPage - 1) * pageSize;
    const pageData = filtered.slice(start, start + pageSize);

    if (!pageData.length) {
      listSection.appendChild(createElement("p", {}, ["😢 No matching jobs. Try changing your filters."]));
      return;
    }

    pageData.forEach(job => listSection.appendChild(buildCard(job)));

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage * pageSize >= filtered.length;
  }

  try {
    baitos = await apiFetch("/baitos/latest");
    filter.resetPage();
    onFilterChange();
  } catch (err) {
    listSection.appendChild(createElement("p", { class: "error-msg" }, ["⚠️ Failed to load baitos. Please try again later."]));
    console.error(err);
  }
}

function appendAsideButtons(aside) {
  aside.append(
    Button("Create Baito", "ct-baito-btn", { click: () => navigate("/create-baito") }, "buttonx"),
    Button("See Dashboard", "see-dash-btn", { click: () => navigate("/baitos/dash") }, "buttonx"),
    Button("Create Baito Profile", "", { click: () => navigate("/baitos/create-profile") }, "buttonx"),
    Button("Hire Workers", "", { click: () => navigate("/baitos/hire") }, "buttonx")
  );
}

function appendLanguageSelector(aside) {
  const langSelect = createElement("select", { id: "lang-toggle" });
  ["EN", "JP"].forEach(lang =>
    langSelect.appendChild(createElement("option", { value: lang.toLowerCase() }, [lang]))
  );

  langSelect.value = localStorage.getItem("baito-lang") || "en";

  langSelect.addEventListener("change", (e) => {
    localStorage.setItem("baito-lang", e.target.value);
    location.reload();
  });

  aside.appendChild(langSelect);
}

// import { displayHireWorkers } from "./workers/displayHires.js";
// import { createTabs } from "../../components/ui/createTabs.js";
// import { buildHeader } from "./baitoslisting/Header.js";
// import { buildFilterBar } from "./baitoslisting/FilterBar.js";
// import { buildPagination } from "./baitoslisting/Pagination.js";
// import { buildCard } from "./baitoslisting/JobCard.js";
// import { clearElement } from "./baitoslisting/utils.js";
// import { apiFetch } from "../../api/api.js";
// import Button from "../../components/base/Button.js";
// import { createElement } from "../../components/createElement.js";
// import { navigate } from "../../routes/index.js";

// export function displayBaitos(container, isLoggedIn) {
//   clearElement(container);

//   const tabs = [
//     {
//       id: "baito-jobs",
//       title: "Baitos",
//       render: (tabContent) => displayBaitoTabContent(tabContent, isLoggedIn),
//     },
//     {
//       id: "hire-workers",
//       title: "Hire Workers",
//       render: (tabContent) => displayHireWorkers(isLoggedIn, tabContent),
//     },
//   ];

//   const activeTabId = localStorage.getItem("baitos-active-tab") || "baito-jobs";

//   const tabUI = createTabs(tabs, "baitos-tabs", activeTabId, (newTabId) => {
//     localStorage.setItem("baitos-active-tab", newTabId);
//   });

//   const pageWrapper = createElement("div", { class: "baitos-tabbed-page" }, [tabUI]);
//   container.appendChild(pageWrapper);
// }

// export async function displayBaitoTabContent(container, isLoggedIn) {
//   clearElement(container);

//   const layout = createElement("div", { class: "baitospage" });
//   const aside = createElement("div", { class: "baitosaside" });
//   const main = createElement("div", { class: "baitosmain" });

//   layout.append(main, aside);
//   container.appendChild(layout);

//   appendAsideButtons(aside);
//   appendLanguageSelector(aside);

//   main.appendChild(buildHeader());

//   const listSection = createElement("div", { class: "baito-list" });
//   main.appendChild(listSection);

//   const pageSize = 10;
//   let baitos = [];
//   let filtered = [];
//   let currentPage = 1;

//   const { wrapper: paginationWrapper, prevBtn, nextBtn } = buildPagination(
//     () => {
//       if (currentPage > 1) {
//         currentPage--;
//         renderPage();
//       }
//     },
//     () => {
//       if (currentPage * pageSize < filtered.length) {
//         currentPage++;
//         renderPage();
//       }
//     }
//   );

//   main.appendChild(paginationWrapper);

//   const filter = buildFilterBar(onFilterChange);
//   const filterToggle = createElement(
//     "details",
//     { class: "baito-filter-toggle", open: false },
//     [createElement("summary", { class: "baito-filter-summary" }, ["🔍 Filter Jobs"]), filter.filterBar]
//   );

//   main.insertBefore(filterToggle, listSection);

//   function onFilterChange() {
//     const { category, subcategory, locations, keyword, minWage, sort } = filter.getValues();

//     filtered = baitos.filter(job =>
//       (!category || job.category === category) &&
//       (!subcategory || job.subcategory === subcategory) &&
//       (!locations.length || locations.some(loc => job.location?.toLowerCase().includes(loc))) &&
//       (!keyword || job.title?.toLowerCase().includes(keyword) || job.description?.toLowerCase().includes(keyword)) &&
//       (!minWage || Number(job.wage || 0) >= minWage)
//     );

//     if (sort === "wage") {
//       filtered.sort((a, b) => (b.wage || 0) - (a.wage || 0));
//     } else {
//       filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
//     }

//     currentPage = 1;
//     renderPage();
//   }

//   function renderPage() {
//     clearElement(listSection);
//     const start = (currentPage - 1) * pageSize;
//     const pageData = filtered.slice(start, start + pageSize);

//     if (!pageData.length) {
//       listSection.appendChild(createElement("p", {}, ["😢 No matching jobs. Try changing your filters."]));
//       return;
//     }

//     pageData.forEach(job => listSection.appendChild(buildCard(job)));

//     prevBtn.disabled = currentPage === 1;
//     nextBtn.disabled = currentPage * pageSize >= filtered.length;
//   }

//   try {
//     baitos = await apiFetch("/baitos/latest");
//     filter.resetPage();
//     onFilterChange();
//   } catch (err) {
//     listSection.appendChild(createElement("p", { class: "error-msg" }, ["⚠️ Failed to load baitos. Please try again later."]));
//     console.error(err);
//   }
// }

// function appendAsideButtons(aside) {
//   aside.append(
//     Button("Create Baito", "ct-baito-btn", { click: () => navigate("/create-baito") }, "buttonx"),
//     Button("See Dashboard", "see-dash-btn", { click: () => navigate("/baitos/dash") }, "buttonx"),
//     Button("Create Baito Profile", "", { click: () => navigate("/baitos/create-profile") }, "buttonx"),
//     Button("Hire Workers", "", { click: () => navigate("/baitos/hire") }, "buttonx")
//   );
// }

// function appendLanguageSelector(aside) {
//   const langSelect = createElement("select", { id: "lang-toggle" });
//   ["EN", "JP"].forEach(lang =>
//     langSelect.appendChild(createElement("option", { value: lang.toLowerCase() }, [lang]))
//   );

//   langSelect.value = localStorage.getItem("baito-lang") || "en";

//   langSelect.addEventListener("change", (e) => {
//     localStorage.setItem("baito-lang", e.target.value);
//     location.reload();
//   });

//   aside.appendChild(langSelect);
// }

