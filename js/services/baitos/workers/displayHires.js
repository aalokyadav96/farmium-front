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

  const container = createElement("div", { id: "worker-list-page" });
  const controls = createElement("div", { id: "controls" });

  const searchInput = createElement("input", {
    placeholder: "Search by name or location",
    type: "text"
  });

  const skillFilter = createElement("select", {});
  const viewToggle = Button("Toggle View", "toggle-view", {
    click: () => {
      isGridView = !isGridView;
      localStorage.setItem("workerView", isGridView ? "grid" : "list");
      renderWorkerList(list, lastWorkerData, isGridView, isLoggedIn);
    }
  });

  const list = createElement("div", { id: "worker-list" });
  const pagination = createElement("div", { id: "pagination" });

  container.appendChild(createElement("h2", {}, ["Find Skilled Workers"]));
  controls.appendChild(searchInput);
  controls.appendChild(skillFilter);
  controls.appendChild(viewToggle);
  container.appendChild(controls);
  container.appendChild(list);
  container.appendChild(pagination);
  contentContainer.appendChild(container);

  function setLoading(state) {
    searchInput.disabled = state;
    skillFilter.disabled = state;
    viewToggle.disabled = state;
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
      const pageBtn = Button(`${i}`, `page-${i}`, {
        click: () => {
          currentPage = i;
          fetchWorkers();
        }
      }, i === currentPage ? "active-page" : "");
      pagination.appendChild(pageBtn);
    }
  }

  async function fetchSkills() {
    const res = await apiFetch("/baitos/workers/skills");
    const options = [createElement("option", { value: "" }, ["All Roles"])];
    res.forEach((role) => {
      options.push(createElement("option", { value: role }, [role]));
    });
    skillFilter.innerHTML = "";
    options.forEach((opt) => skillFilter.appendChild(opt));
  }

  async function fetchWorkers() {
    setLoading(true);
    const params = new URLSearchParams({
      search: searchQuery,
      skill: selectedSkill,
      page: currentPage,
      limit: PER_PAGE
    });

    const res = await apiFetch(`/baitos/workers?${params.toString()}`);
    lastWorkerData = res.data;
    renderWorkerList(list, lastWorkerData, isGridView, isLoggedIn);
    totalPages = Math.ceil(res.total / PER_PAGE);
    renderPagination();
    setLoading(false);
  }

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

  fetchSkills();
  fetchWorkers();
}

// import { createElement } from "../../../components/createElement";
// import { Button } from "../../../components/base/Button.js";
// import { SRC_URL, apiFetch } from "../../../api/api.js";

// export function displayHireWorkers(isLoggedIn, contentContainer) {
//   const PER_PAGE = 3;
//   let currentPage = 1;
//   let searchQuery = "";
//   let selectedSkill = "";
//   let totalPages = 1;
//   let isGridView = localStorage.getItem("workerView") !== "list";

//   const container = createElement("div", { id: "worker-list-page" });
//   const controls = createElement("div", { id: "controls" });

//   const searchInput = createElement("input", {
//     placeholder: "Search by name or location",
//     type: "text",
//   });

//   const skillFilter = createElement("select", {});
//   const viewToggle = Button("Toggle View", "toggle-view", {
//     click: () => {
//       isGridView = !isGridView;
//       localStorage.setItem("workerView", isGridView ? "grid" : "list");
//       renderWorkers(lastWorkerData); // reuse cached data
//     },
//   });

//   const list = createElement("div", { id: "worker-list" });
//   const pagination = createElement("div", { id: "pagination" });

//   container.appendChild(createElement("h2", {}, ["Find Skilled Workers"]));
//   controls.appendChild(searchInput);
//   controls.appendChild(skillFilter);
//   controls.appendChild(viewToggle);
//   container.appendChild(controls);
//   container.appendChild(list);
//   container.appendChild(pagination);
//   contentContainer.appendChild(container);

//   let lastWorkerData = [];

//   function setLoading(state) {
//     searchInput.disabled = state;
//     skillFilter.disabled = state;
//     viewToggle.disabled = state;
//   }

//   function buildWorkerCard(worker) {
//     const photoDiv = createElement("div", { class: "worker-photo" });
//     if (worker.profile_picture) {
//       photoDiv.appendChild(createElement("img", {
//         src: `${SRC_URL}/uploads/baitos/${worker.profile_picture}`,
//         class: "profile-thumbnail",
//       }));
//     }

//     const details = createElement("div", { class: "worker-details" }, [
//       createElement("h3", {}, [worker.name]),
//       createElement("p", {}, [`Phone: ${worker.phone_number}`]),
//       createElement("p", {}, [`Roles: ${worker.preferred_roles}`]),
//       createElement("p", {}, [`Location: ${worker.address}`]),
//       createElement("p", {}, [`Bio: ${worker.bio}`]),
//       isLoggedIn
//         ? Button("Hire", `hire-${worker.baito_user_id}`, {
//             click: () => console.log(`Hiring ${worker.name}`),
//           })
//         : createElement("p", {}, ["Login to hire"]),
//     ]);

//     return createElement("div", { class: "worker-card" }, [photoDiv, details]);
//   }

//   function renderWorkers(workers) {
//     lastWorkerData = workers;
//     list.innerHTML = "";
//     list.className = isGridView ? "grid-view" : "list-view";

//     if (!workers.length) {
//       list.appendChild(createElement("p", {}, ["No workers found."]));
//       pagination.innerHTML = "";
//       return;
//     }

//     workers.forEach((worker) => {
//       list.appendChild(buildWorkerCard(worker));
//     });
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
//         },
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
//       limit: PER_PAGE,
//     });

//     const res = await apiFetch(`/baitos/workers?${params.toString()}`);
//     renderWorkers(res.data);
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

// // import { createElement } from "../../../components/createElement";
// // import { Button } from "../../../components/base/Button.js";
// // import { SRC_URL, apiFetch } from "../../../api/api";

// // export function displayHireWorkers(isLoggedIn, contentContainer) {
// //   const PER_PAGE = 3;
// //   let currentPage = 1;
// //   let searchQuery = "";
// //   let selectedSkill = "";
// //   let totalPages = 1;
// //   let isGridView = true;

// //   const container = createElement("div", { id: "worker-list-page" });
// //   const controls = createElement("div", { id: "controls" });

// //   const searchInput = createElement("input", {
// //     placeholder: "Search by name or location",
// //     type: "text",
// //   });

// //   const skillFilter = createElement("select", {});
// //   const viewToggle = Button("Toggle View", "toggle-view", {
// //     click: () => {
// //       isGridView = !isGridView;
// //       fetchWorkers();
// //     },
// //   });

// //   const list = createElement("div", { id: "worker-list" });
// //   const pagination = createElement("div", { id: "pagination" });

// //   container.appendChild(createElement("h2", {}, ["Find Skilled Workers"]));
// //   controls.appendChild(searchInput);
// //   controls.appendChild(skillFilter);
// //   controls.appendChild(viewToggle);
// //   container.appendChild(controls);
// //   container.appendChild(list);
// //   container.appendChild(pagination);
// //   contentContainer.appendChild(container);

// //   function renderWorkers(workers) {
// //     list.innerHTML = "";
// //     list.className = isGridView ? "grid-view" : "list-view";

// //     workers.forEach((worker) => {
// //       const photoDiv = createElement("div", { class: "worker-photo" });
// //       if (worker.profile_picture) {
// //         photoDiv.appendChild(
// //           createElement("img", {
// //             src: `${SRC_URL}/uploads/baitos/${worker.profile_picture}`,
// //             class: "profile-thumbnail",
// //           })
// //         );
// //       }

// //       const detailsDiv = createElement("div", { class: "worker-details" }, [
// //         createElement("h3", {}, [worker.name]),
// //         createElement("p", {}, [`Phone: ${worker.phone_number}`]),
// //         createElement("p", {}, [`Roles: ${worker.preferred_roles}`]),
// //         createElement("p", {}, [`Location: ${worker.address}`]),
// //         createElement("p", {}, [`Bio: ${worker.bio}`]),
// //         isLoggedIn
// //           ? Button("Hire", `hire-${worker.baito_user_id}`, {
// //               click: () => console.log(`Hiring ${worker.name}`),
// //             })
// //           : createElement("p", {}, ["Login to hire"]),
// //       ]);

// //       const card = createElement("div", { class: "worker-card" }, [
// //         photoDiv,
// //         detailsDiv,
// //       ]);

// //       list.appendChild(card);
// //     });
// //   }

// //   function renderPagination() {
// //     pagination.innerHTML = "";
// //     for (let i = 1; i <= totalPages; i++) {
// //       const pageBtn = Button(
// //         `${i}`,
// //         `page-${i}`,
// //         {
// //           click: () => {
// //             currentPage = i;
// //             fetchWorkers();
// //           },
// //         },
// //         i === currentPage ? "active-page" : ""
// //       );
// //       pagination.appendChild(pageBtn);
// //     }
// //   }

// //   async function fetchSkills() {
// //     const res = await apiFetch("/baitos/workers/skills");
// //     const options = [createElement("option", { value: "" }, ["All Roles"])];
// //     res.forEach((role) => {
// //       options.push(createElement("option", { value: role }, [role]));
// //     });
// //     skillFilter.innerHTML = "";
// //     options.forEach((opt) => skillFilter.appendChild(opt));
// //   }

// //   async function fetchWorkers() {
// //     const params = new URLSearchParams({
// //       search: searchQuery,
// //       skill: selectedSkill,
// //       page: currentPage,
// //       limit: PER_PAGE,
// //     });

// //     const res = await apiFetch(`/baitos/workers?${params.toString()}`);
// //     renderWorkers(res.data);
// //     totalPages = Math.ceil(res.total / PER_PAGE);
// //     renderPagination();
// //   }

// //   let debounceTimer = null;
// //   searchInput.addEventListener("input", (e) => {
// //     clearTimeout(debounceTimer);
// //     debounceTimer = setTimeout(() => {
// //       searchQuery = e.target.value.trim().toLowerCase();
// //       currentPage = 1;
// //       fetchWorkers();
// //     }, 300);
// //   });

// //   skillFilter.addEventListener("change", (e) => {
// //     selectedSkill = e.target.value;
// //     currentPage = 1;
// //     fetchWorkers();
// //   });

// //   fetchSkills();
// //   fetchWorkers();
// // }

// // // import { createElement } from "../../../components/createElement";
// // // import { Button } from "../../../components/base/Button.js";
// // // import { SRC_URL, apiFetch } from "../../../api/api";

// // // export function displayHireWorkers(isLoggedIn, contentContainer) {
// // //   const PER_PAGE = 3;
// // //   let currentPage = 1;
// // //   let searchQuery = "";
// // //   let selectedSkill = "";
// // //   let totalPages = 1;
// // //   let isGridView = true;

// // //   const container = createElement("div", { id: "worker-list-page" });
// // //   const controls = createElement("div", { id: "controls" });

// // //   const searchInput = createElement("input", {
// // //     placeholder: "Search by name or location",
// // //     type: "text",
// // //   });

// // //   const skillFilter = createElement("select", {});
// // //   const viewToggle = Button("Toggle View", "toggle-view", {
// // //     click: () => {
// // //       isGridView = !isGridView;
// // //       fetchWorkers(); // re-render
// // //     },
// // //   });

// // //   const list = createElement("div", { id: "worker-list" });
// // //   const pagination = createElement("div", { id: "pagination" });

// // //   container.appendChild(createElement("h2", {}, ["Find Skilled Workers"]));
// // //   controls.appendChild(searchInput);
// // //   controls.appendChild(skillFilter);
// // //   controls.appendChild(viewToggle);
// // //   container.appendChild(controls);
// // //   container.appendChild(list);
// // //   container.appendChild(pagination);
// // //   contentContainer.appendChild(container);

// // //   function renderWorkers(workers) {
// // //     list.innerHTML = "";
// // //     list.className = isGridView ? "grid-view" : "list-view";

// // //     workers.forEach((worker) => {
// // //       const card = createElement("div", { class: "worker-card" }, [
// // //         createElement("h3", {}, [worker.name]),
// // //         createElement("p", {}, [`Phone: ${worker.phone_number}`]),
// // //         createElement("p", {}, [`Roles: ${worker.preferred_roles}`]),
// // //         createElement("p", {}, [`Location: ${worker.address}`]),
// // //         createElement("p", {}, [`Bio: ${worker.bio}`]),
// // //         worker.profile_picture
// // //           ? createElement("img", {
// // //               src: `${SRC_URL}/uploads/baitos/${worker.profile_picture}`,
// // //               class: "profile-thumbnail",
// // //             })
// // //           : null,
// // //         isLoggedIn
// // //           ? Button("Hire", `hire-${worker.baito_user_id}`, {
// // //               click: () => console.log(`Hiring ${worker.name}`),
// // //             })
// // //           : createElement("p", {}, ["Login to hire"]),
// // //       ].filter(Boolean));

// // //       list.appendChild(card);
// // //     });
// // //   }

// // //   function renderPagination() {
// // //     pagination.innerHTML = "";
// // //     for (let i = 1; i <= totalPages; i++) {
// // //       const pageBtn = Button(
// // //         `${i}`,
// // //         `page-${i}`,
// // //         {
// // //           click: () => {
// // //             currentPage = i;
// // //             fetchWorkers();
// // //           },
// // //         },
// // //         i === currentPage ? "active-page" : ""
// // //       );
// // //       pagination.appendChild(pageBtn);
// // //     }
// // //   }

// // //   async function fetchSkills() {
// // //     const res = await apiFetch("/baitos/workers/skills");
// // //     const options = [createElement("option", { value: "" }, ["All Roles"])];
// // //     res.forEach((role) => {
// // //       options.push(createElement("option", { value: role }, [role]));
// // //     });
// // //     skillFilter.innerHTML = "";
// // //     options.forEach((opt) => skillFilter.appendChild(opt));
// // //   }

// // //   async function fetchWorkers() {
// // //     const params = new URLSearchParams({
// // //       search: searchQuery,
// // //       skill: selectedSkill,
// // //       page: currentPage,
// // //       limit: PER_PAGE,
// // //     });

// // //     const res = await apiFetch(`/baitos/workers?${params.toString()}`);
// // //     renderWorkers(res.data);
// // //     totalPages = Math.ceil(res.total / PER_PAGE);
// // //     renderPagination();
// // //   }

// // //   let debounceTimer = null;
// // //   searchInput.addEventListener("input", (e) => {
// // //     clearTimeout(debounceTimer);
// // //     debounceTimer = setTimeout(() => {
// // //       searchQuery = e.target.value.trim().toLowerCase();
// // //       currentPage = 1;
// // //       fetchWorkers();
// // //     }, 300);
// // //   });

// // //   skillFilter.addEventListener("change", (e) => {
// // //     selectedSkill = e.target.value;
// // //     currentPage = 1;
// // //     fetchWorkers();
// // //   });

// // //   fetchSkills();
// // //   fetchWorkers();
// // // }

// // // // import { createElement } from "../../../components/createElement";
// // // // import { Button } from "../../../components/base/Button.js";
// // // // import { SRC_URL, apiFetch } from "../../../api/api";

// // // // export function displayHireWorkers(isLoggedIn, contentContainer) {
// // // //   const PER_PAGE = 3;
// // // //   let currentPage = 1;
// // // //   let searchQuery = "";
// // // //   let selectedSkill = "";
// // // //   let totalPages = 1;

// // // //   const container = createElement("div", { id: "worker-list-page" });
// // // //   const controls = createElement("div", { id: "controls" });

// // // //   const searchInput = createElement("input", {
// // // //     placeholder: "Search by name or location",
// // // //     type: "text",
// // // //   });

// // // //   const skillFilter = createElement("select", {});
// // // //   const list = createElement("div", { id: "worker-list" });
// // // //   const pagination = createElement("div", { id: "pagination" });

// // // //   container.appendChild(createElement("h2", {}, ["Find Skilled Workers"]));
// // // //   controls.appendChild(searchInput);
// // // //   controls.appendChild(skillFilter);
// // // //   container.appendChild(controls);
// // // //   container.appendChild(list);
// // // //   container.appendChild(pagination);
// // // //   contentContainer.appendChild(container);

// // // //   function renderWorkers(workers) {
// // // //     list.innerHTML = "";

// // // //     workers.forEach((worker) => {
// // // //       const card = createElement("div", { class: "worker-card" }, [
// // // //         createElement("h3", {}, [worker.name]),
// // // //         createElement("p", {}, [`Phone: ${worker.phone_number}`]),
// // // //         createElement("p", {}, [`Roles: ${worker.preferred_roles}`]),
// // // //         createElement("p", {}, [`Location: ${worker.address}`]),
// // // //         createElement("p", {}, [`Bio: ${worker.bio}`]),
// // // //         worker.profile_picture
// // // //           ? createElement("img", {
// // // //               src: `${SRC_URL}/uploads/baitos/${worker.profile_picture}`,
// // // //               class: "profile-thumbnail"
// // // //             })
// // // //           : null,
// // // //         isLoggedIn
// // // //           ? Button("Hire", `hire-${worker.baito_user_id}`, {
// // // //               click: () => console.log(`Hiring ${worker.name}`),
// // // //             })
// // // //           : createElement("p", {}, ["Login to hire"]),
// // // //       ].filter(Boolean));

// // // //       list.appendChild(card);
// // // //     });
// // // //   }

// // // //   function renderPagination() {
// // // //     pagination.innerHTML = "";
// // // //     for (let i = 1; i <= totalPages; i++) {
// // // //       const pageBtn = Button(
// // // //         `${i}`,
// // // //         `page-${i}`,
// // // //         {
// // // //           click: () => {
// // // //             currentPage = i;
// // // //             fetchWorkers();
// // // //           },
// // // //         },
// // // //         i === currentPage ? "active-page" : ""
// // // //       );
// // // //       pagination.appendChild(pageBtn);
// // // //     }
// // // //   }

// // // //   async function fetchSkills() {
// // // //     const res = await apiFetch("/baitos/workers/skills");
// // // //     const options = [createElement("option", { value: "" }, ["All Roles"])];
// // // //     res.forEach((role) => {
// // // //       options.push(createElement("option", { value: role }, [role]));
// // // //     });
// // // //     skillFilter.innerHTML = "";
// // // //     options.forEach(opt => skillFilter.appendChild(opt));
// // // //   }

// // // //   async function fetchWorkers() {
// // // //     const params = new URLSearchParams({
// // // //       search: searchQuery,
// // // //       skill: selectedSkill,
// // // //       page: currentPage,
// // // //       limit: PER_PAGE,
// // // //     });

// // // //     const res = await apiFetch(`/baitos/workers?${params.toString()}`);
// // // //     renderWorkers(res.data);
// // // //     totalPages = Math.ceil(res.total / PER_PAGE);
// // // //     renderPagination();
// // // //   }

// // // //   let debounceTimer = null;
// // // //   searchInput.addEventListener("input", (e) => {
// // // //     clearTimeout(debounceTimer);
// // // //     debounceTimer = setTimeout(() => {
// // // //       searchQuery = e.target.value.trim().toLowerCase();
// // // //       currentPage = 1;
// // // //       fetchWorkers();
// // // //     }, 300);
// // // //   });

// // // //   skillFilter.addEventListener("change", (e) => {
// // // //     selectedSkill = e.target.value;
// // // //     currentPage = 1;
// // // //     fetchWorkers();
// // // //   });

// // // //   fetchSkills();
// // // //   fetchWorkers();
// // // // }

// // // // // import { createElement } from "../../../components/createElement";
// // // // // import { Button } from "../../../components/base/Button.js";
// // // // // import { apiFetch } from "../../../api/api";

// // // // // export function displayHireWorkers(isLoggedIn, contentContainer) {
// // // // //   const PER_PAGE = 3;
// // // // //   let currentPage = 1;
// // // // //   let searchQuery = "";
// // // // //   let selectedSkill = "";
// // // // //   let totalPages = 1;

// // // // //   const container = createElement("div", { id: "worker-list-page" });
// // // // //   const controls = createElement("div", { id: "controls" });

// // // // //   const searchInput = createElement("input", {
// // // // //     placeholder: "Search by name or location",
// // // // //     type: "text",
// // // // //   });

// // // // //   const skillFilter = createElement("select", {});
// // // // //   const list = createElement("div", { id: "worker-list" });
// // // // //   const pagination = createElement("div", { id: "pagination" });

// // // // //   container.appendChild(createElement("h2", {}, ["Find Skilled Workers"]));
// // // // //   controls.appendChild(searchInput);
// // // // //   controls.appendChild(skillFilter);
// // // // //   container.appendChild(controls);
// // // // //   container.appendChild(list);
// // // // //   container.appendChild(pagination);
// // // // //   contentContainer.appendChild(container);

// // // // //   function renderWorkers(workers) {
// // // // //     list.innerHTML = "";

// // // // //     workers.forEach((worker) => {
// // // // //       const card = createElement("div", { class: "worker-card" }, [
// // // // //         createElement("h3", {}, [worker.name]),
// // // // //         createElement("p", {}, [`Phone: ${worker.phone}`]),
// // // // //         createElement("p", {}, [`Roles: ${worker.preferred_roles || worker.roles}`]),
// // // // //         createElement("p", {}, [`Location: ${worker.location}`]),
// // // // //         createElement("p", {}, [`Bio: ${worker.bio}`]),
// // // // //         worker.profile_picture
// // // // //           ? createElement("img", {
// // // // //               src: `/uploads/${worker.profile_picture}`,
// // // // //               class: "profile-thumbnail"
// // // // //             })
// // // // //           : null,
// // // // //         isLoggedIn
// // // // //           ? Button("Hire", `hire-${worker.baito_user_id}`, {
// // // // //               click: () => console.log(`Hiring ${worker.name}`),
// // // // //             })
// // // // //           : createElement("p", {}, ["Login to hire"]),
// // // // //       ].filter(Boolean)); // filter to remove null entries

// // // // //       list.appendChild(card);
// // // // //     });
// // // // //   }

// // // // //   function renderPagination() {
// // // // //     pagination.innerHTML = "";
// // // // //     for (let i = 1; i <= totalPages; i++) {
// // // // //       const pageBtn = Button(
// // // // //         `${i}`,
// // // // //         `page-${i}`,
// // // // //         {
// // // // //           click: () => {
// // // // //             currentPage = i;
// // // // //             fetchWorkers();
// // // // //           },
// // // // //         },
// // // // //         i === currentPage ? "active-page" : ""
// // // // //       );
// // // // //       pagination.appendChild(pageBtn);
// // // // //     }
// // // // //   }

// // // // //   async function fetchSkills() {
// // // // //     const res = await apiFetch("/baitos/workers/skills");
// // // // //     const options = [createElement("option", { value: "" }, ["All Roles"])];
// // // // //     res.forEach((role) => {
// // // // //       options.push(createElement("option", { value: role }, [role]));
// // // // //     });
// // // // //     skillFilter.innerHTML = "";
// // // // //     options.forEach(opt => skillFilter.appendChild(opt));
// // // // //   }

// // // // //   async function fetchWorkers() {
// // // // //     const params = new URLSearchParams({
// // // // //       search: searchQuery,
// // // // //       skill: selectedSkill,
// // // // //       page: currentPage,
// // // // //       limit: PER_PAGE,
// // // // //     });

// // // // //     const res = await apiFetch(`/baitos/workers?${params.toString()}`);
// // // // //     renderWorkers(res.data);
// // // // //     totalPages = Math.ceil(res.total / PER_PAGE);
// // // // //     renderPagination();
// // // // //   }

// // // // //   let debounceTimer = null;
// // // // //   searchInput.addEventListener("input", (e) => {
// // // // //     clearTimeout(debounceTimer);
// // // // //     debounceTimer = setTimeout(() => {
// // // // //       searchQuery = e.target.value.trim().toLowerCase();
// // // // //       currentPage = 1;
// // // // //       fetchWorkers();
// // // // //     }, 300);
// // // // //   });

// // // // //   skillFilter.addEventListener("change", (e) => {
// // // // //     selectedSkill = e.target.value;
// // // // //     currentPage = 1;
// // // // //     fetchWorkers();
// // // // //   });

// // // // //   fetchSkills();
// // // // //   fetchWorkers();
// // // // // }

// // // // // // import { createElement } from "../../../components/createElement";
// // // // // // import { Button } from "../../../components/base/Button.js";
// // // // // // import { apiFetch } from "../../../api/api";

// // // // // // export function displayHireWorkers(isLoggedIn, contentContainer) {
// // // // // //   const PER_PAGE = 3;
// // // // // //   let currentPage = 1;
// // // // // //   let searchQuery = "";
// // // // // //   let selectedSkill = "";
// // // // // //   let totalPages = 1;

// // // // // //   const container = createElement("div", { id: "worker-list-page" });
// // // // // //   const controls = createElement("div", { id: "controls" });

// // // // // //   const searchInput = createElement("input", {
// // // // // //     placeholder: "Search by name or location",
// // // // // //     type: "text",
// // // // // //   });

// // // // // //   const skillFilter = createElement("select", {});

// // // // // //   const list = createElement("div", { id: "worker-list" });
// // // // // //   const pagination = createElement("div", { id: "pagination" });

// // // // // //   container.appendChild(createElement("h2", {}, ["Find Skilled Workers"]));
// // // // // //   controls.appendChild(searchInput);
// // // // // //   controls.appendChild(skillFilter);
// // // // // //   container.appendChild(controls);
// // // // // //   container.appendChild(list);
// // // // // //   container.appendChild(pagination);
// // // // // //   contentContainer.appendChild(container);

// // // // // //   function renderWorkers(workers) {
// // // // // //     list.innerHTML = "";

// // // // // //     workers.forEach((worker) => {
// // // // // //       const card = createElement("div", { class: "worker-card" }, [
// // // // // //         createElement("h3", {}, [worker.name]),
// // // // // //         createElement("p", {}, [`Skill: ${worker.skill}`]),
// // // // // //         createElement("p", {}, [`Experience: ${worker.experience}`]),
// // // // // //         createElement("p", {}, [`Location: ${worker.location}`]),
// // // // // //         isLoggedIn
// // // // // //           ? Button("Hire", `hire-${worker._id}`, {
// // // // // //               click: () => console.log(`Hiring ${worker.name}`),
// // // // // //             })
// // // // // //           : createElement("p", {}, ["Login to hire"]),
// // // // // //       ]);
// // // // // //       list.appendChild(card);
// // // // // //     });
// // // // // //   }

// // // // // //   function renderPagination() {
// // // // // //     pagination.innerHTML = "";
// // // // // //     for (let i = 1; i <= totalPages; i++) {
// // // // // //       const pageBtn = Button(
// // // // // //         `${i}`,
// // // // // //         `page-${i}`,
// // // // // //         {
// // // // // //           click: () => {
// // // // // //             currentPage = i;
// // // // // //             fetchWorkers();
// // // // // //           },
// // // // // //         },
// // // // // //         i === currentPage ? "active-page" : ""
// // // // // //       );
// // // // // //       pagination.appendChild(pageBtn);
// // // // // //     }
// // // // // //   }

// // // // // //   async function fetchSkills() {
// // // // // //     const res = await apiFetch("/baitos/workers/skills");
// // // // // //     const options = [createElement("option", { value: "" }, ["All Skills"])];
// // // // // //     res.forEach((skill) => {
// // // // // //       options.push(createElement("option", { value: skill }, [skill]));
// // // // // //     });
// // // // // //     skillFilter.innerHTML = "";
// // // // // //     options.forEach(opt => skillFilter.appendChild(opt));
// // // // // //   }

// // // // // //   async function fetchWorkers() {
// // // // // //     const params = new URLSearchParams({
// // // // // //       search: searchQuery,
// // // // // //       skill: selectedSkill,
// // // // // //       page: currentPage,
// // // // // //       limit: PER_PAGE,
// // // // // //     });

// // // // // //     const res = await apiFetch(`/baitos/workers?${params.toString()}`);
// // // // // //     renderWorkers(res.data);
// // // // // //     totalPages = Math.ceil(res.total / PER_PAGE);
// // // // // //     renderPagination();
// // // // // //   }

// // // // // //   // Debounce input
// // // // // //   let debounceTimer = null;
// // // // // //   searchInput.addEventListener("input", (e) => {
// // // // // //     clearTimeout(debounceTimer);
// // // // // //     debounceTimer = setTimeout(() => {
// // // // // //       searchQuery = e.target.value.trim().toLowerCase();
// // // // // //       currentPage = 1;
// // // // // //       fetchWorkers();
// // // // // //     }, 300);
// // // // // //   });

// // // // // //   skillFilter.addEventListener("change", (e) => {
// // // // // //     selectedSkill = e.target.value;
// // // // // //     currentPage = 1;
// // // // // //     fetchWorkers();
// // // // // //   });

// // // // // //   fetchSkills();
// // // // // //   fetchWorkers();
// // // // // // }

// // // // // // // import { createElement } from "../../../components/createElement";
// // // // // // // import { Button } from "../../../components/base/Button.js";

// // // // // // // const dummyWorkers = [
// // // // // // //   { id: "w1", name: "Ramesh Kumar", skill: "Electrician", experience: "5 years", location: "Delhi" },
// // // // // // //   { id: "w2", name: "Suresh Verma", skill: "Plumber", experience: "8 years", location: "Mumbai" },
// // // // // // //   { id: "w3", name: "Anil Yadav", skill: "Carpenter", experience: "4 years", location: "Lucknow" },
// // // // // // //   { id: "w4", name: "Vikas Mehta", skill: "Electrician", experience: "6 years", location: "Chennai" },
// // // // // // //   { id: "w5", name: "Rahul Singh", skill: "Plumber", experience: "3 years", location: "Kolkata" },
// // // // // // //   { id: "w6", name: "Amit Dubey", skill: "Carpenter", experience: "7 years", location: "Bangalore" },
// // // // // // // ];

// // // // // // // export function displayHireWorkers(isLoggedIn, contentContainer) {
// // // // // // //   const PER_PAGE = 3;
// // // // // // //   let currentPage = 1;
// // // // // // //   let searchQuery = "";
// // // // // // //   let selectedSkill = "";

// // // // // // //   const container = createElement("div", { id: "worker-list-page" });
// // // // // // //   const controls = createElement("div", { id: "controls" });

// // // // // // //   const searchInput = createElement("input", {
// // // // // // //     placeholder: "Search by name or location",
// // // // // // //     type: "text",
// // // // // // //     oninput: (e) => {
// // // // // // //       searchQuery = e.target.value.trim().toLowerCase();
// // // // // // //       currentPage = 1;
// // // // // // //       renderList();
// // // // // // //     },
// // // // // // //   });

// // // // // // //   const skillFilter = createElement("select", {
// // // // // // //     onchange: (e) => {
// // // // // // //       selectedSkill = e.target.value;
// // // // // // //       currentPage = 1;
// // // // // // //       renderList();
// // // // // // //     },
// // // // // // //   }, [
// // // // // // //     createElement("option", { value: "" }, ["All Skills"]),
// // // // // // //     ...[...new Set(dummyWorkers.map(w => w.skill))].map(skill =>
// // // // // // //       createElement("option", { value: skill }, [skill])
// // // // // // //     ),
// // // // // // //   ]);

// // // // // // //   controls.appendChild(searchInput);
// // // // // // //   controls.appendChild(skillFilter);
// // // // // // //   container.appendChild(createElement("h2", {}, ["Find Skilled Workers"]));
// // // // // // //   container.appendChild(controls);

// // // // // // //   const list = createElement("div", { id: "worker-list" });
// // // // // // //   const pagination = createElement("div", { id: "pagination" });

// // // // // // //   function filterAndSearch(data) {
// // // // // // //     return data.filter(w => {
// // // // // // //       const matchSearch = w.name.toLowerCase().includes(searchQuery) ||
// // // // // // //                           w.location.toLowerCase().includes(searchQuery);
// // // // // // //       const matchSkill = selectedSkill === "" || w.skill === selectedSkill;
// // // // // // //       return matchSearch && matchSkill;
// // // // // // //     });
// // // // // // //   }

// // // // // // //   function renderList() {
// // // // // // //     list.innerHTML = "";
// // // // // // //     pagination.innerHTML = "";

// // // // // // //     const filtered = filterAndSearch(dummyWorkers);
// // // // // // //     const totalPages = Math.ceil(filtered.length / PER_PAGE);
// // // // // // //     const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

// // // // // // //     paginated.forEach((worker) => {
// // // // // // //       const card = createElement("div", { class: "worker-card" }, [
// // // // // // //         createElement("h3", {}, [worker.name]),
// // // // // // //         createElement("p", {}, [`Skill: ${worker.skill}`]),
// // // // // // //         createElement("p", {}, [`Experience: ${worker.experience}`]),
// // // // // // //         createElement("p", {}, [`Location: ${worker.location}`]),
// // // // // // //         isLoggedIn
// // // // // // //           ? Button("Hire", `hire-${worker.id}`, {
// // // // // // //               click: () => console.log(`Hiring ${worker.name}`),
// // // // // // //             })
// // // // // // //           : createElement("p", {}, ["Login to hire"]),
// // // // // // //       ]);
// // // // // // //       list.appendChild(card);
// // // // // // //     });

// // // // // // //     if (totalPages > 1) {
// // // // // // //       for (let i = 1; i <= totalPages; i++) {
// // // // // // //         const pageBtn = Button(
// // // // // // //           `${i}`,
// // // // // // //           `page-${i}`,
// // // // // // //           {
// // // // // // //             click: () => {
// // // // // // //               currentPage = i;
// // // // // // //               renderList();
// // // // // // //             },
// // // // // // //           },
// // // // // // //           i === currentPage ? "active-page" : ""
// // // // // // //         );
// // // // // // //         pagination.appendChild(pageBtn);
// // // // // // //       }
// // // // // // //     }
// // // // // // //   }

// // // // // // //   container.appendChild(list);
// // // // // // //   container.appendChild(pagination);
// // // // // // //   contentContainer.appendChild(container);
// // // // // // //   renderList();
// // // // // // // }
