
import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { Button } from "../../components/base/Button.js";
import { paginate, createFilterControls } from "../../utils/listUtils.js";

// --- Generic Listing Page ---
export async function displayListingPage(container, {
  title = "",
  apiEndpoint,
  cardBuilder,      // function: item => HTMLElement
  type = "generic", // "baitos", "events", etc
  pageSize = 10,
  sidebarActions   // optional function: aside => void
}) {
  container.replaceChildren();

  // Layout
  const layout = createElement("div", { class: `${type}-page` });
  const aside = createElement("aside", { class: `${type}-aside` });
  const main = createElement("div", { class: `${type}-main` });
  layout.append(main, aside);
  container.appendChild(layout);

  // Sidebar
  if (typeof sidebarActions === "function") sidebarActions(aside);

  // Main header
  if (title) main.appendChild(createElement("h1", {}, [title]));

  // List container
  const listSection = createElement("div", { class: `${type}-list` });
  main.appendChild(listSection);

  // Pagination state
  let items = [];
  let currentPage = 1;
  let isLoading = false;
  let loadFailed = false;

  function setLoading(flag) { isLoading = !!flag; }

  function clearElement(el) { el.replaceChildren(); }

  function renderPage(filteredItems) {
    clearElement(listSection);

    if (loadFailed) {
      listSection.appendChild(
        createElement("p", { class: "error-msg" }, [`⚠️ Failed to load ${type}. Please try again later.`])
      );
      return;
    }

    if (isLoading) {
      listSection.appendChild(createElement("p", {}, ["⏳ Loading..."]));
      return;
    }

    const pageData = paginate(filteredItems, currentPage, pageSize);

    if (!pageData.length) {
      listSection.appendChild(
        createElement("div", { class: "empty-state" }, [
          createElement("p", {}, [`😢 No matching ${type}.`]),
          Button("Clear Filters", "clear-filters-inline", {
            click: () => {
              if (typeof filterControls.reset === "function") filterControls.reset();
            }
          }, "buttonx btn-secondary")
        ])
      );
      return;
    }

    pageData.forEach(item => listSection.appendChild(cardBuilder(item)));
  }

  function buildPagination(prevCb, nextCb) {
    const wrapper = createElement("div", { class: "pagination-wrapper" });
    const prevBtn = Button("◀ Prev", "", { click: prevCb }, "buttonx btn-secondary");
    const nextBtn = Button("Next ▶", "", { click: nextCb }, "buttonx btn-secondary");
    wrapper.append(prevBtn, nextBtn);

    function update(totalItems) {
      const totalPages = Math.ceil(totalItems / pageSize);
      prevBtn.disabled = currentPage === 1 || totalPages <= 1;
      nextBtn.disabled = currentPage >= totalPages || totalPages <= 1;
    }

    return { wrapper, prevBtn, nextBtn, update };
  }

  try {
    setLoading(true);
    listSection.appendChild(createElement("p", {}, ["⏳ Loading..."]));

    let resp = await apiFetch(apiEndpoint);

    // --- normalize array from API response ---
    if (Array.isArray(resp)) items = resp;
    else if (resp?.events) items = resp.events;
    else if (resp?.posts) items = resp.posts;
    else if (resp?.recipes) items = resp.recipes;
    else if (resp?.data) items = resp.data;
    else items = [];

    setLoading(false);
    loadFailed = false;

    // --- Pagination controls ---
    const paginationWrapper = buildPagination(() => {
      if (currentPage > 1) currentPage--;
      renderPage(filterControls.currentFiltered || []);
    }, () => {
      const filtered = filterControls.currentFiltered || [];
      if (currentPage * 10 < filtered.length) currentPage++;
      renderPage(filtered);
    });
    

    main.appendChild(paginationWrapper.wrapper);

    // --- Filter controls ---
    const filterControls = createFilterControls({
      type,
      items,
      onRender: filtered => {
        currentPage = 1;
        renderPage(filtered);
        paginationWrapper.update(filtered.length);
      }
    });

    const filterToggle = createElement(
      "details",
      { class: `${type}-filter-toggle`, open: true },
      [createElement("summary", { class: `${type}-filter-summary` }, ["🔍 Filter"]), filterControls.controls]
    );

    main.insertBefore(filterToggle, listSection);
    main.insertBefore(filterControls.chipContainer, listSection);

  } catch (err) {
    setLoading(false);
    loadFailed = true;
    clearElement(listSection);
    listSection.appendChild(
      createElement("p", { class: "error-msg" }, [`⚠️ Failed to load ${type}. Please try again later.`])
    );
    console.error(err);
  }
}
