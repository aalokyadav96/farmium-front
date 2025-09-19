import { buildHeader } from "./baitoslisting/Header.js";
import { buildFilterBar } from "./baitoslisting/FilterBar.js";
import { buildPagination } from "./baitoslisting/Pagination.js";
import { buildCard } from "./baitoslisting/JobCard.js";
import { clearElement } from "./baitoslisting/utils.js";
import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import { navigate } from "../../routes/index.js";
import { filterItems, sortItems } from "../../utils/listUtils.js";

export function displayBaitos(container, isLoggedIn) {
  clearElement(container);
  displayBaitoTabContent(container, isLoggedIn);
}

export async function displayBaitoTabContent(container, isLoggedIn) {
  clearElement(container);
  const layout = createElement("div", { class: "baitospage" });
  const aside = createElement("aside", { class: "baitosaside" });
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
  let loadFailed = false;
  let isLoading = false;

  function setLoading(flag) {
    isLoading = !!flag;
  }

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

  const filter = buildFilterBar(onFilterChange, () => {
    currentPage = 1;
    renderPage();
  });

  const filterToggle = createElement(
    "details",
    { class: "baito-filter-toggle", open: false },
    [createElement("summary", { class: "baito-filter-summary" }, ["🔍 Filter Jobs"]), filter.filterBar]
  );
  main.insertBefore(filterToggle, listSection);

  function onFilterChange() {
    const { category, subcategory, locations, keyword, minWage, sort } = filter.getValues();

    filtered = filterItems(baitos, {
      keyword,
      category,
      subcategory,
      extraFilters: [
        job => !locations.length || locations.some(loc => job.location?.toLowerCase().includes(loc)),
        job => !minWage || Number(job.wage || 0) >= minWage
      ]
    });

    filtered = sortItems(filtered, sort === "wage" ? "wage" : "recent");

    currentPage = 1;
    renderPage();
  }

  function renderPage() {
    clearElement(listSection);

    if (loadFailed) {
      listSection.appendChild(
        createElement("p", { class: "error-msg" }, ["⚠️ Failed to load baitos. Please try again later."])
      );
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    if (isLoading) {
      listSection.appendChild(createElement("p", {}, ["⏳ Loading baitos..."]));
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    const start = (currentPage - 1) * pageSize;
    const pageData = filtered.slice(start, start + pageSize);

    if (!pageData.length) {
      listSection.appendChild(
        createElement("div", { class: "empty-state" }, [
          createElement("p", {}, ["😢 No matching jobs. Try changing your filters."]),
          Button("Clear Filters", "clear-filters-inline", {
            click: () => {
              if (typeof filter.clearFilters === "function") filter.clearFilters();
            }
          }, "buttonx btn-secondary")
        ])
      );
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = true;
      return;
    }

    pageData.forEach(job => listSection.appendChild(buildCard(job)));
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage * pageSize >= filtered.length;
  }

  try {
    setLoading(true);
    listSection.appendChild(createElement("p", {}, ["⏳ Loading baitos..."]));
    baitos = await apiFetch("/baitos/latest");
    loadFailed = false;
    filter.resetPage(); // should call onFilterChange internally
    setLoading(false);
    onFilterChange();
  } catch (err) {
    setLoading(false);
    loadFailed = true;
    clearElement(listSection);
    listSection.appendChild(
      createElement("p", { class: "error-msg" }, ["⚠️ Failed to load baitos. Please try again later."])
    );
    console.error(err);
    renderPage();
  }
}

function appendAsideButtons(aside) {
  aside.append(
    createElement("h3", {}, ["Actions"]),
    Button("Create Baito", "ct-baito-btn", { click: () => navigate("/create-baito") }, "buttonx"),
    Button("See Dashboard", "see-dash-btn", { click: () => navigate("/baitos/dash") }, "buttonx"),
    Button("Create Baito Profile", "", { click: () => navigate("/baitos/create-profile") }, "buttonx secondary"),
    Button("Hire Workers", "", { click: () => navigate("/baitos/hire") }, "buttonx secondary")
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
    navigate(window.location.pathname);
  });
  aside.appendChild(langSelect);
}
