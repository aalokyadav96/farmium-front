import { createElement } from "../../../components/createElement.js";
import { Button } from "../../../components/base/Button.js";
import { apiFetch, apigFetch } from "../../../api/api.js";
import { renderWorkerList } from "./WorkerList.js";
import { navigate } from "../../../routes/index.js";
import {debounce} from "../../../utils/deutils.js";

export function displayHireWorkers(isLoggedIn, contentContainer) {
  const PER_PAGE = 3;
  let currentPage = 1;
  let searchQuery = localStorage.getItem("workerSearch") || "";
  let selectedSkill = localStorage.getItem("workerSkill") || "";
  let totalPages = 1;
  let isGridView = localStorage.getItem("workerView") !== "list";
  let lastWorkerData = [];

  // Containers
  const container = createElement("div", { id: "worker-list-page" });
  const layout = createElement("div", { id: "worker-layout", class: "hvflex" });
  const main = createElement("div", { id: "worker-main", class: "worker-main" });
  const aside = createElement("aside", { id: "worker-aside", class: "worker-aside" });

  // Controls
  const controls = renderControls();
  const list = createElement("div", { id: "worker-list" });
  const pagination = createElement("div", { id: "pagination" });

  // Build UI
  main.appendChild(createElement("h2", {}, ["Find Skilled Workers"]));
  main.append(controls.container, list, pagination);
  aside.appendChild(renderAside());

  layout.append(main, aside);
  container.appendChild(layout);
  contentContainer.replaceChildren(container);

  // Fetch skills and workers
  fetchSkills();
  fetchWorkers();

  // ---------------- FUNCTIONS ---------------- //

  function renderControls() {
    const controls = createElement("div", { id: "controls" });

    const searchInput = createElement("input", {
      placeholder: "Search by name or location",
      type: "text",
      value: searchQuery,
      "aria-label": "Search workers"
    });

    const skillFilter = createElement("select", {
      "aria-label": "Filter by skill"
    });

    const viewToggle = Button(
      "Toggle View",
      "toggle-view",
      { click: toggleView },
      ""
    );

    // Debounced search
    searchInput.addEventListener("input", debounce((e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      localStorage.setItem("workerSearch", searchQuery);
      currentPage = 1;
      fetchWorkers();
    }, 300));

    skillFilter.addEventListener("change", (e) => {
      selectedSkill = e.target.value;
      localStorage.setItem("workerSkill", selectedSkill);
      currentPage = 1;
      fetchWorkers();
    });

    controls.append(searchInput, skillFilter, viewToggle);

    return { container: controls, searchInput, skillFilter, viewToggle };
  }

  function renderAside() {
    return createElement("div", {}, [
      createElement("h3", {}, ["Actions"]),
      createElement("ul", {}, [
        Button(
          "Create Worker Profile",
          "",
          { click: () => navigate("/baitos/create-profile") },
          "buttonx"
        ),
      ])
    ]);
  }

  function toggleView() {
    isGridView = !isGridView;
    localStorage.setItem("workerView", isGridView ? "grid" : "list");
    renderWorkerList(list, lastWorkerData, isGridView, isLoggedIn);
  }

  function renderPagination() {
    pagination.replaceChildren();
    if (totalPages <= 1) return;

    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1 && start > 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      const pageBtn = Button(
        `${i}`,
        `page-${i}`,
        {
          click: () => {
            if (i === currentPage) return;
            currentPage = i;
            fetchWorkers();
          }
        },
        i === currentPage ? "active-page" : ""
      );
      pageBtn.setAttribute("aria-label", `Go to page ${i}`);
      pagination.appendChild(pageBtn);
    }
  }

  async function fetchSkills() {
    try {
      // Cache in localStorage (24h)
      const cached = JSON.parse(localStorage.getItem("workerSkills") || "{}");
      const now = Date.now();

      if (cached.timestamp && now - cached.timestamp < 24 * 60 * 60 * 1000) {
        buildSkills(cached.data);
        return;
      }

      const roles = await apiFetch("/baitos/workers/skills");
      buildSkills(roles);
      localStorage.setItem("workerSkills", JSON.stringify({ data: roles, timestamp: now }));
    } catch (e) {
      console.error("Failed to fetch skills", e);
    }
  }

  function buildSkills(roles) {
    const skillFilter = controls.skillFilter;
    skillFilter.replaceChildren();
    skillFilter.appendChild(createElement("option", { value: "" }, ["All Roles"]));
    roles.forEach(role => {
      skillFilter.appendChild(createElement("option", { value: role }, [role]));
    });
    skillFilter.value = selectedSkill;
  }

  async function fetchWorkers() {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        search: searchQuery,
        skill: selectedSkill,
        page: currentPage,
        limit: PER_PAGE
      });

      const res = await apigFetch(`/baitos/workers?${params.toString()}`);

      lastWorkerData = res.data;
      totalPages = Math.ceil(res.total / PER_PAGE);

      if (!lastWorkerData.length) {
        list.replaceChildren(createElement("p", { class: "empty-msg" }, ["No workers found. Try adjusting your filters."]));
      } else {
        renderWorkerList(list, lastWorkerData, isGridView, isLoggedIn);
        renderPagination();
      }
    } catch (e) {
      console.error("Failed to fetch workers", e);
      list.replaceChildren(
        createElement("p", { class: "error-msg" }, ["⚠️ Failed to load workers. Please try again later."])
      );
    } finally {
      setLoading(false);
    }
  }

  function setLoading(state) {
    controls.searchInput.disabled = state;
    controls.skillFilter.disabled = state;
    controls.viewToggle.disabled = state;

    if (state) {
      list.replaceChildren(createElement("p", { class: "loading-msg" }, ["⏳ Loading workers..."]));
    }
  }

  // // Debounce helper
  // function debounce(fn, delay) {
  //   let timer = null;
  //   return (...args) => {
  //     clearTimeout(timer);
  //     timer = setTimeout(() => fn.apply(this, args), delay);
  //   };
  // }
}
