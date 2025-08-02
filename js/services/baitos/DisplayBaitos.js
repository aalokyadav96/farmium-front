// import { displayHireWorkers } from "./hire/WorkersList.js"; // import your actual function
import { displayHireWorkers } from "./workers/displayHires.js"; // import your actual function
// import { displayBaitoTabContent } from "./baitos/BaitoListTab.js"; // extracted from your original displayBaitos
import { createTabs } from "../../components/ui/createTabs.js"; // assumes you have a reusable createTabs()
// import { createElement } from "../../components/createElement.js";

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
  container.innerHTML = "";

  const tabs = [
    {
      id: "baito-jobs",
      title: "Baitos",
      render: (tabContent) => {
        displayBaitoTabContent(tabContent, isLoggedIn);
      },
    },
    {
      id: "hire-workers",
      title: "Hire Workers",
      render: (tabContent) => {
        displayHireWorkers(isLoggedIn, tabContent);
      },
    },
  ];

  const activeTabId = localStorage.getItem("baitos-active-tab") || "baito-jobs";
  const tabUI = createTabs(tabs, "baitos-tabs", activeTabId, (newTabId) => {
    localStorage.setItem("baitos-active-tab", newTabId);
  });

  const pageWrapper = createElement("div", { class: "baitos-tabbed-page" }, [tabUI]);
  container.appendChild(pageWrapper);
}

// // export function displayBaitosWithTabs(container, isLoggedIn) {}
// export function displayBaitos(container, isLoggedIn) {
//   container.innerHTML = "";

//   const tabs = [
//     {
//       id: "baito-jobs",
//       title: "Baitos",
//       render: (tabContent) => {
//         displayBaitoTabContent(tabContent, isLoggedIn);
//       },
//     },
//     {
//       id: "hire-workers",
//       title: "Hire Workers",
//       render: (tabContent) => {
//         displayHireWorkers(isLoggedIn, tabContent);
//       },
//     },
//   ];

//   const tabUI = createTabs(tabs, "baitos-tabs");
//   const pageWrapper = createElement("div", { class: "baitos-tabbed-page" }, [tabUI]);
//   container.appendChild(pageWrapper);
// }


export async function displayBaitoTabContent(container, isLoggedIn) {
  clearElement(container);
  const layout = createElement("div", { class: "baitospage" });
  container.appendChild(layout);

  const aside = createElement("div", { class: "baitosaside" }, []);
  const page = createElement("div", { class: "baitosmain" }, []);
  layout.append(aside, page);

  aside.append(
    Button("Create Baito", "ct-baito-btn", { click: () => navigate("/create-baito") }, "buttonx"),
    Button("See Dashboard", "see-dash-btn", { click: () => navigate("/baitos/dash") }, "buttonx"),
    Button("Create Baito Profile", "", { click: () => navigate("/baitos/create-profile") }, "buttonx"),
    Button("Hire Workers", "", { click: () => navigate("/baitos/hire") }, "buttonx")
  );

  const langSelect = createElement("select", { id: "lang-toggle" });
  ["EN", "JP"].forEach(l =>
    langSelect.appendChild(createElement("option", { value: l.toLowerCase() }, [l]))
  );
  langSelect.addEventListener("change", (e) => {
    localStorage.setItem("baito-lang", e.target.value);
    location.reload();
  });
  aside.appendChild(langSelect);

  page.appendChild(buildHeader());
  const listSection = createElement("div", { class: "baito-list" });
  page.appendChild(listSection);

  let baitos = [];
  let filtered = [];
  let currentPage = 1;
  const pageSize = 10;

  const { wrapper: paginationWrapper, prevBtn, nextBtn } = buildPagination(() => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  }, () => {
    if (currentPage * pageSize < filtered.length) {
      currentPage++;
      renderPage();
    }
  });

  page.appendChild(paginationWrapper);
  let getFilterValues = () => ({});

  const filter = buildFilterBar(() => {
    const { category, subcategory, locations, keyword, minWage, sort } = getFilterValues();
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
  });

  // page.insertBefore(filter.filterBar, listSection);
  // aside.appendChild(filter.filterBar);
  const filterToggle = createElement("details", { class: "baito-filter-toggle", open: false }, [
    createElement("summary", { class: "baito-filter-summary" }, ["🔍 Filter Jobs"]),
    filter.filterBar
  ]);
  page.insertBefore(filterToggle, listSection);
  
  getFilterValues = filter.getValues;

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
  } catch (err) {
    listSection.appendChild(createElement("p", { class: "error-msg" }, ["⚠️ Failed to load baitos. Please try again later."]));
    console.error(err);
  }
}


// // Import everything at top
// import { buildHeader } from "./baitoslisting/Header.js";
// import { buildFilterBar } from "./baitoslisting/FilterBar.js";
// import { buildPagination } from "./baitoslisting/Pagination.js";
// import { buildCard } from "./baitoslisting/JobCard.js";
// import { clearElement } from "./baitoslisting/utils.js";
// import { apiFetch } from "../../api/api.js";
// import Button from "../../components/base/Button.js";
// import { createElement } from "../../components/createElement.js";
// import { navigate } from "../../routes/index.js";

// export async function displayBaitos(container, isLoggedIn) {
//   clearElement(container);
//   const layout = createElement("div", { class: "baitospage" });
//   container.appendChild(layout);

//   const aside = createElement("div", { class: "baitosaside" }, []);
//   const page = createElement("div", { class: "baitosmain" }, []);
//   layout.append(aside, page);

//   aside.append(
//     Button("Create Baito", "ct-baito-btn", { click: () => navigate("/create-baito") }, "buttonx"),
//     Button("See Dashboard", "see-dash-btn", { click: () => navigate("/baitos/dash") }, "buttonx"),
//     Button("Create Baito Profile", "", { click: () => navigate("/baitos/create-profile") }, "buttonx"),
//     Button("Hire Workers", "", { click: () => navigate("/baitos/hire") }, "buttonx")
//   );

//   const langSelect = createElement("select", { id: "lang-toggle" });
//   ["EN", "JP"].forEach(l =>
//     langSelect.appendChild(createElement("option", { value: l.toLowerCase() }, [l]))
//   );
//   langSelect.addEventListener("change", (e) => {
//     localStorage.setItem("baito-lang", e.target.value);
//     location.reload();
//   });
//   aside.appendChild(langSelect);

//   page.appendChild(buildHeader());
//   const listSection = createElement("div", { class: "baito-list" });
//   page.appendChild(listSection);

//   let baitos = [];
//   let filtered = [];
//   let currentPage = 1;
//   const pageSize = 10;

//   const { wrapper: paginationWrapper, prevBtn, nextBtn } = buildPagination(() => {
//     if (currentPage > 1) {
//       currentPage--;
//       renderPage();
//     }
//   }, () => {
//     if (currentPage * pageSize < filtered.length) {
//       currentPage++;
//       renderPage();
//     }
//   });

//   page.appendChild(paginationWrapper);
//   let getFilterValues = () => ({});

//   const filter = buildFilterBar(() => {
//     const { category, subcategory, locations, keyword, minWage, sort } = getFilterValues();
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
//   });

//   // page.insertBefore(filter.filterBar, listSection);
//   // aside.appendChild(filter.filterBar);
//   const filterToggle = createElement("details", { class: "baito-filter-toggle", open: false }, [
//     createElement("summary", { class: "baito-filter-summary" }, ["🔍 Filter Jobs"]),
//     filter.filterBar
//   ]);
//   page.insertBefore(filterToggle, listSection);
  
//   getFilterValues = filter.getValues;

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
//   } catch (err) {
//     listSection.appendChild(createElement("p", { class: "error-msg" }, ["⚠️ Failed to load baitos. Please try again later."]));
//     console.error(err);
//   }
// }
