import { createElement } from "../../../components/createElement.js";
import { Button } from "../../../components/base/Button.js";
import { apiFetch } from "../../../api/api.js";
import { renderWorkerList } from "./WorkerList.js";

export function displayHireWorkers(isLoggedIn, contentContainer) {
  const PER_PAGE = 3;
  let currentPage = 1;
  let searchQuery = "";
  let selectedSkill = "";
  let totalPages = 1;
  let isGridView = localStorage.getItem("workerView") !== "list";
  let lastWorkerData = [];

  // Containers
  const container = createElement("div", { id: "worker-list-page" });
  const layout = createElement("div", { id: "worker-layout", class: "hvflex" });
  const main = createElement("div", { id: "worker-main", style: "flex: 3;" });
  const aside = createElement("div", { id: "worker-aside", style: "flex: 1;" });

  // Controls
  const controls = createElement("div", { id: "controls" });
  const searchInput = createElement("input", {
    placeholder: "Search by name or location",
    type: "text"
  });
  const skillFilter = createElement("select", {});
  const viewToggle = Button(
    "Toggle View",
    "toggle-view",
    { click: toggleView },
    ""
  );

  // List & Pagination
  const list = createElement("div", { id: "worker-list" });
  const pagination = createElement("div", { id: "pagination" });

  // Build UI
  main.appendChild(createElement("h2", {}, ["Find Skilled Workers"]));
  controls.append(searchInput, skillFilter, viewToggle);
  main.append(controls, list, pagination);

  aside.append(
    createElement("h3", {}, ["Hiring Tips"]),
    createElement("ul", {}, [
      createElement("li", {}, [Button("Verify credentials", "", {}, "buttonx")]),
      createElement("li", {}, [Button("Check ratings", "", {}, "buttonx")]),
      createElement("li", {}, [Button("Set clear expectations", "", {}, "buttonx")]),
      createElement("li", {}, [Button("Schedule a call", "", {}, "buttonx")])
    ])
  );

  layout.append(main, aside);
  container.appendChild(layout);
  contentContainer.appendChild(container);

  // Event handlers
  let debounceTimer = null;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = e.target.value.trim().toLowerCase();
      currentPage = 1;
      fetchWorkers();
    }, 300);
  });

  skillFilter.addEventListener("change", (e) => {
    selectedSkill = e.target.value;
    currentPage = 1;
    fetchWorkers();
  });

  // Functions

  function setLoading(state) {
    searchInput.disabled = state;
    skillFilter.disabled = state;
    viewToggle.disabled = state;
  }

  function toggleView() {
    isGridView = !isGridView;
    localStorage.setItem("workerView", isGridView ? "grid" : "list");
    renderWorkerList(list, lastWorkerData, isGridView, isLoggedIn);
  }

  function renderPagination() {
    pagination.innerHTML = "";
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
      pagination.appendChild(pageBtn);
    }
  }

  async function fetchSkills() {
    try {
      const roles = await apiFetch("/baitos/workers/skills");
      skillFilter.innerHTML = "";
      skillFilter.appendChild(createElement("option", { value: "" }, ["All Roles"]));
      roles.forEach(role => {
        skillFilter.appendChild(createElement("option", { value: role }, [role]));
      });
      skillFilter.value = selectedSkill;
    } catch (e) {
      console.error("Failed to fetch skills", e);
    }
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

      const res = await apiFetch(`/baitos/workers?${params.toString()}`);

      lastWorkerData = res.data;
      totalPages = Math.ceil(res.total / PER_PAGE);

      renderWorkerList(list, lastWorkerData, isGridView, isLoggedIn);
      renderPagination();
    } catch (e) {
      console.error("Failed to fetch workers", e);
      list.innerHTML = createElement("p", { class: "error-msg" }, ["⚠️ Failed to load workers. Please try again later."]).outerHTML;
    } finally {
      setLoading(false);
    }
  }

  fetchSkills();
  fetchWorkers();
}

// import { createElement } from "../../../components/createElement.js";
// import { Button } from "../../../components/base/Button.js";
// import { apiFetch } from "../../../api/api.js";
// import { renderWorkerList } from "./WorkerList.js";

// export function displayHireWorkers(isLoggedIn, contentContainer) {
//   const PER_PAGE = 3;
//   let currentPage = 1;
//   let searchQuery = "";
//   let selectedSkill = "";
//   let totalPages = 1;
//   let isGridView = localStorage.getItem("workerView") !== "list";
//   let lastWorkerData = [];

//   // Layout containers
//   const container = createElement("div", { id: "worker-list-page" });
//   const layout = createElement("div", { id: "worker-layout", class:"hvflex"});
//   const main = createElement("div", { id: "worker-main", style: "flex: 3;" });
//   const aside = createElement("div", { id: "worker-aside", style: "flex: 1;" });

//   // Controls
//   const controls = createElement("div", { id: "controls" });
//   const searchInput = createElement("input", {
//     placeholder: "Search by name or location",
//     type: "text"
//   });

//   const skillFilter = createElement("select", {});
//   const viewToggle = Button("Toggle View", "toggle-view", {
//     click: () => {
//       isGridView = !isGridView;
//       localStorage.setItem("workerView", isGridView ? "grid" : "list");
//       renderWorkerList(list, lastWorkerData, isGridView, isLoggedIn);
//     }
//   });

//   // List and pagination
//   const list = createElement("div", { id: "worker-list" });
//   const pagination = createElement("div", { id: "pagination" });

//   // Assemble main section
//   main.appendChild(createElement("h2", {}, ["Find Skilled Workers"]));
//   controls.appendChild(searchInput);
//   controls.appendChild(skillFilter);
//   controls.appendChild(viewToggle);
//   main.appendChild(controls);
//   main.appendChild(list);
//   main.appendChild(pagination);

//   // Dummy sidebar content
//   aside.appendChild(createElement("h3", {}, ["Hiring Tips"]));
//   aside.appendChild(createElement("ul", {}, [
//     createElement("li", {}, [Button("Verify credentials", "",{},"buttonx")]),
//     createElement("li", {}, [Button("Check ratings", "",{},"buttonx")]),
//     createElement("li", {}, [Button("Set clear expectations", "",{},"buttonx")]),
//     createElement("li", {}, [Button("Schedule a call", "",{},"buttonx")])
//   ]));

//   // Assemble full layout
//   layout.appendChild(main);
//   layout.appendChild(aside);
//   container.appendChild(layout);
//   contentContainer.appendChild(container);

//   function setLoading(state) {
//     searchInput.disabled = state;
//     skillFilter.disabled = state;
//     viewToggle.disabled = state;
//   }

//   function renderPagination() {
//     pagination.innerHTML = "";
//     if (totalPages <= 1) return;

//     const maxButtons = 5;
//     let start = Math.max(1, currentPage - 2);
//     let end = Math.min(totalPages, start + maxButtons - 1);
//     if (end - start < maxButtons - 1 && start > 1) {
//       start = Math.max(1, end - maxButtons + 1);
//     }

//     for (let i = start; i <= end; i++) {
//       const pageBtn = Button(`${i}`, `page-${i}`, {
//         click: () => {
//           currentPage = i;
//           fetchWorkers();
//         }
//       }, i === currentPage ? "active-page" : "");
//       pagination.appendChild(pageBtn);
//     }
//   }

//   async function fetchSkills() {
//     const res = await apiFetch("/baitos/workers/skills");
//     const options = [createElement("option", { value: "" }, ["All Roles"])];
//     res.forEach((role) => {
//       options.push(createElement("option", { value: role }, [role]));
//     });
//     skillFilter.innerHTML = "";
//     options.forEach((opt) => skillFilter.appendChild(opt));
//   }

//   async function fetchWorkers() {
//     setLoading(true);
//     const params = new URLSearchParams({
//       search: searchQuery,
//       skill: selectedSkill,
//       page: currentPage,
//       limit: PER_PAGE
//     });

//     const res = await apiFetch(`/baitos/workers?${params.toString()}`);
//     lastWorkerData = res.data;
//     renderWorkerList(list, lastWorkerData, isGridView, isLoggedIn);
//     totalPages = Math.ceil(res.total / PER_PAGE);
//     renderPagination();
//     setLoading(false);
//   }

//   let debounceTimer = null;
//   searchInput.addEventListener("input", (e) => {
//     clearTimeout(debounceTimer);
//     debounceTimer = setTimeout(() => {
//       searchQuery = e.target.value.trim().toLowerCase();
//       currentPage = 1;
//       fetchWorkers();
//     }, 300);
//   });

//   skillFilter.addEventListener("change", (e) => {
//     selectedSkill = e.target.value;
//     currentPage = 1;
//     fetchWorkers();
//   });

//   fetchSkills();
//   fetchWorkers();
// }
