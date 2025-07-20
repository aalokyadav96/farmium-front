// //original code at the bottom is better
// import { apiFetch } from "../../api/api.js";
// import { navigate } from "../../routes/index.js";
// import { state } from "../../state/state.js";
// import { editItinerary } from "./itineraryEdit.js";
// import Modal from "../../components/ui/Modal.mjs";

// function displayItinerary(isLoggedIn, divContainerNode) {
//   divContainerNode.innerHTML = "";
//   if (!isLoggedIn) {
//     divContainerNode.innerHTML = "<p>Please log in to view and manage your itineraries.</p>";
//     return;
//   }

//   // ─── Core Containers ─────────────────────────────────────────────────────
//   const layout = document.createElement("div");
//   layout.className = "itinerary-layout";

//   const listDiv = document.createElement("div");
//   listDiv.className = "itinerary-list";
//   listDiv.id = "itineraryList";

//   const rightPane = document.createElement("div");
//   rightPane.className = "itinerary-right";
//   rightPane.innerHTML = "<p>Select an itinerary to see details here.</p>";

//   layout.append(listDiv, rightPane);
//   divContainerNode.appendChild(layout);

//   // ─── Header: Create Button + Search Form ─────────────────────────────────
//   const { createBtn, searchForm } = buildListHeader();
//   listDiv.append(createBtn, searchForm);

//   searchForm.addEventListener("submit", (e) => {
//     e.preventDefault();
//     const qs = buildQueryStringFromForm(searchForm);
//     fetchAndRenderList(`/itineraries/search?${qs}`);
//   });

//   // ─── Initial Load ────────────────────────────────────────────────────────
//   fetchAndRenderList("/itineraries");

//   // ─── HELPERS ────────────────────────────────────────────────────────────

//   function buildListHeader() {
//     const btn = document.createElement("button");
//     btn.textContent = "Create Itinerary";
//     btn.className = "itinerary-create-btn";
//     btn.addEventListener("click", () => navigate("/create-itinerary"));

//     const form = document.createElement("form");
//     form.id = "searchForm";
//     form.innerHTML = `
//       <input type="text" name="start_date" placeholder="Start Date (YYYY-MM-DD)">
//       <input type="text" name="location" placeholder="Location">
//       <input type="text" name="status" placeholder="Status (Draft/Confirmed)">
//       <button type="submit">Search</button>
//     `;

//     return { createBtn: btn, searchForm: form };
//   }

//   function buildQueryStringFromForm(formNode) {
//     const formData = new FormData(formNode);
//     const params = new URLSearchParams();
//     for (const [k, v] of formData.entries()) {
//       if (v.trim()) params.append(k, v.trim());
//     }
//     return params.toString();
//   }

//   function resetListContainerWithHeader() {
//     listDiv.innerHTML = "";
//     listDiv.append(createBtn, searchForm);
//   }

//   async function fetchAndRenderList(endpoint) {
//     resetListContainerWithHeader();
//     const statusP = document.createElement("p");
//     statusP.textContent = endpoint.includes("search") ? "Searching..." : "Loading...";
//     listDiv.append(statusP);

//     try {
//       const itineraries = await apiFetch(endpoint);
//       renderItineraryList(itineraries);
//     } catch {
//       resetListContainerWithHeader();
//       const errP = document.createElement("p");
//       errP.textContent = "Error loading itineraries.";
//       listDiv.append(errP);
//     }
//   }

//   function renderItineraryList(itineraries) {
//     resetListContainerWithHeader();
//     if (!Array.isArray(itineraries) || itineraries.length === 0) {
//       const noP = document.createElement("p");
//       noP.textContent = "No itineraries found.";
//       listDiv.append(noP);
//       return;
//     }

//     itineraries.forEach((it) => {
//       const card = createItineraryCard(it);
//       listDiv.append(card);
//     });
//   }

//   function createItineraryCard(it) {
//     const isCreator = state.user?.userid === it.user_id;
//     const card = document.createElement("div");
//     card.className = "itinerary-card";

//     // Header info
//     const header = document.createElement("div");
//     header.innerHTML = `
//       <h3>${it.name}</h3>
//       <p><strong>Status:</strong> ${it.status}</p>
//       <p><strong>Start:</strong> ${it.start_date}</p>
//     `;
//     card.append(header);

//     // Action buttons container
//     const btnContainer = document.createElement("div");
//     btnContainer.className = "itinerary-card-buttons";

//     // Fork (always available)
//     const forkBtn = document.createElement("button");
//     forkBtn.textContent = "Fork";
//     forkBtn.addEventListener("click", async (e) => {
//       e.stopPropagation();
//       await forkItinerary(it.itineraryid);
//     });
//     btnContainer.append(forkBtn);

//     if (isCreator) {
//       // Edit
//       const editBtn = document.createElement("button");
//       editBtn.textContent = "Edit";
//       editBtn.addEventListener("click", (e) => {
//         e.stopPropagation();
//         const isMobile = window.innerWidth < 768;
//         if (isMobile) openEditModal(it.itineraryid);
//         else editItinerary(isLoggedIn, rightPane, it.itineraryid);
//       });
//       btnContainer.append(editBtn);

//       // Delete
//       const deleteBtn = document.createElement("button");
//       deleteBtn.textContent = "Delete";
//       deleteBtn.addEventListener("click", async (e) => {
//         e.stopPropagation();
//         await deleteItinerary(it.itineraryid, /* no modal instance */ null);
//       });
//       btnContainer.append(deleteBtn);

//       // Publish (if not yet published)
//       if (!it.published) {
//         const pubBtn = document.createElement("button");
//         pubBtn.textContent = "Publish";
//         pubBtn.addEventListener("click", async (e) => {
//           e.stopPropagation();
//           await publishItinerary(it.itineraryid, /* no modal instance */ null);
//         });
//         btnContainer.append(pubBtn);
//       }
//     }

//     card.append(btnContainer);

//     // Card click → view details (desktop inline or mobile modal)
//     card.addEventListener("click", () => {
//       const isMobile = window.innerWidth < 768;
//       if (isMobile) openViewModal(it.itineraryid, isCreator);
//       else loadItineraryInline(it.itineraryid, isCreator);
//     });

//     return card;
//   }

//   // ─── VIEW & EDIT HANDLERS ─────────────────────────────────────────────────

//   async function loadItineraryInline(id, isCreator) {
//     rightPane.innerHTML = "<p>Loading details…</p>";
//     try {
//       const it = await apiFetch(`/itineraries/all/${id}`);
//       renderItineraryDetails(it, rightPane, isCreator, /* no modalInst */ null);
//     } catch {
//       rightPane.innerHTML = "<p>Error loading itinerary details.</p>";
//     }
//   }

//   function openViewModal(id, isCreator) {
//     const container = document.createElement("div");
//     container.innerHTML = "<p>Loading details…</p>";

//     let modalInst = null;
//     modalInst = Modal({
//       title: "Itinerary Details",
//       content: container,
//       onClose: () => modalInst.remove(),
//       size: "large",
//       closeOnOverlayClick: true,
//     });

//     apiFetch(`/itineraries/all/${id}`)
//       .then((it) => {
//         container.innerHTML = "";
//         renderItineraryDetails(it, container, isCreator, modalInst);
//       })
//       .catch(() => {
//         container.innerHTML = "<p>Error loading itinerary details.</p>";
//       });
//   }

//   function openEditModal(id) {
//     const container = document.createElement("div");

//     let modalInst = null;
//     modalInst = Modal({
//       title: "Edit Itinerary",
//       content: container,
//       onClose: () => modalInst.remove(),
//       size: "large",
//       closeOnOverlayClick: false,
//     });

//     // Invoke editItinerary inside the modal container
//     editItinerary(isLoggedIn, container, id);
//   }

//   /**
//    * @param {object} it             — itinerary object from API
//    * @param {HTMLElement} target     — where to render (rightPane or modal body)
//    * @param {boolean} isCreator     — whether current user can edit/delete/publish
//    * @param {object|null} modalInst — modal instance (if rendering inside a modal)
//    */
//   function renderItineraryDetails(it, target, isCreator, modalInst = null) {
//     target.innerHTML = "";

//     // Title + meta
//     const title = document.createElement("h2");
//     title.textContent = it.name;

//     const meta = document.createElement("p");
//     meta.innerHTML = `
//       <strong>Status:</strong> ${it.status} &nbsp;|&nbsp;
//       <strong>Start:</strong> ${it.start_date} &nbsp;|&nbsp;
//       <strong>End:</strong> ${it.end_date}
//     `;

//     const desc = document.createElement("p");
//     desc.innerHTML = `<strong>Description:</strong> ${it.description || "N/A"}`;

//     target.append(title, meta, desc);

//     // Creator-only buttons
//     if (isCreator) {
//       const btnContainer = document.createElement("div");
//       btnContainer.className = "itinerary-detail-buttons";

//       // EDIT
//       const editBtn = document.createElement("button");
//       editBtn.textContent = "Edit";
//       editBtn.addEventListener("click", () => {
//         target.innerHTML = "";
//         editItinerary(isLoggedIn, target, it.itineraryid);
//       });
//       btnContainer.append(editBtn);

//       // DELETE
//       const deleteBtn = document.createElement("button");
//       deleteBtn.textContent = "Delete";
//       deleteBtn.addEventListener("click", async () => {
//         if (!confirm("Are you sure you want to delete this itinerary?")) return;
//         try {
//           await apiFetch(`/itineraries/${it.itineraryid}`, "DELETE");
//           alert("Itinerary deleted successfully");
//           if (modalInst && typeof modalInst.onClose === "function") {
//             modalInst.onClose();
//           }
//           fetchAndRenderList("/itineraries");
//           rightPane.innerHTML = "<p>Select an itinerary to see details here.</p>";
//         } catch {
//           alert("Error deleting itinerary");
//         }
//       });
//       btnContainer.append(deleteBtn);

//       // PUBLISH (if not yet published)
//       if (!it.published) {
//         const pubBtn = document.createElement("button");
//         pubBtn.textContent = "Publish";
//         pubBtn.addEventListener("click", async () => {
//           try {
//             await apiFetch(`/itineraries/${it.itineraryid}/publish`, "PUT");
//             alert("Itinerary published successfully");
//             if (modalInst && typeof modalInst.onClose === "function") {
//               modalInst.onClose();
//             }
//             fetchAndRenderList("/itineraries");
//           } catch {
//             alert("Error publishing itinerary");
//           }
//         });
//         btnContainer.append(pubBtn);
//       }

//       target.append(btnContainer);
//     }

//     // Days & Visits
//     if (!Array.isArray(it.days) || it.days.length === 0) {
//       const noSchedule = document.createElement("p");
//       noSchedule.textContent = "No schedule available.";
//       target.append(noSchedule);
//       return;
//     }

//     it.days.forEach((day, di) => {
//       const dayDiv = document.createElement("div");
//       dayDiv.className = "itinerary-day";

//       const dayHeader = document.createElement("h3");
//       dayHeader.textContent = `Day ${di + 1}: ${day.date}`;
//       dayDiv.append(dayHeader);

//       day.visits.forEach((visit, vi) => {
//         const visitDiv = document.createElement("div");
//         visitDiv.className = "itinerary-visit";

//         const timeP = document.createElement("p");
//         timeP.innerHTML = `<strong>Time:</strong> ${visit.start_time} – ${visit.end_time}`;

//         const locP = document.createElement("p");
//         locP.innerHTML = `<strong>Location:</strong> ${visit.location}`;

//         visitDiv.append(timeP, locP);

//         if (vi > 0 && visit.transport) {
//           const transP = document.createElement("p");
//           transP.innerHTML = `<strong>Transport:</strong> ${visit.transport}`;
//           visitDiv.append(transP);
//         }

//         dayDiv.append(visitDiv);
//       });

//       target.append(dayDiv);
//     });
//   }

//   // ─── BACKEND ACTION HELPERS ───────────────────────────────────────────────

//   async function deleteItinerary(id, modalInst) {
//     if (!confirm("Are you sure you want to delete this itinerary?")) return;
//     try {
//       await apiFetch(`/itineraries/${id}`, "DELETE");
//       alert("Itinerary deleted successfully");
//       if (modalInst && typeof modalInst.onClose === "function") {
//         modalInst.onClose();
//       }
//       fetchAndRenderList("/itineraries");
//       rightPane.innerHTML = "<p>Select an itinerary to see details here.</p>";
//     } catch {
//       alert("Error deleting itinerary");
//     }
//   }

//   async function forkItinerary(id) {
//     try {
//       await apiFetch(`/itineraries/${id}/fork`, "POST");
//       alert("Itinerary forked successfully");
//       fetchAndRenderList("/itineraries");
//     } catch {
//       alert("Error forking itinerary");
//     }
//   }

//   async function publishItinerary(id, modalInst) {
//     try {
//       await apiFetch(`/itineraries/${id}/publish`, "PUT");
//       alert("Itinerary published successfully");
//       if (modalInst && typeof modalInst.onClose === "function") {
//         modalInst.onClose();
//       }
//       fetchAndRenderList("/itineraries");
//     } catch {
//       alert("Error publishing itinerary");
//     }
//   }
// }

// export { displayItinerary };

// // import { apiFetch } from "../../api/api.js";
// // import { navigate } from "../../routes/index.js";
// // import { state } from "../../state/state.js";
// // import { editItinerary } from "./itineraryEdit.js";
// // import Modal from "../../components/ui/Modal.mjs";

// // function displayItinerary(isLoggedIn, divContainerNode) {
// //   divContainerNode.innerHTML = "";
// //   if (!isLoggedIn) {
// //     divContainerNode.innerHTML = "<p>Please log in to view and manage your itineraries.</p>";
// //     return;
// //   }

// //   // ─── Create core DOM elements ───────────────────────────────────────────
// //   const layout = document.createElement("div");
// //   layout.className = "itinerary-layout";

// //   const listDiv = document.createElement("div");
// //   listDiv.className = "itinerary-list";
// //   listDiv.id = "itineraryList";

// //   const rightPane = document.createElement("div");
// //   rightPane.className = "itinerary-right";
// //   rightPane.innerHTML = "<p>Select an itinerary to see details here.</p>";

// //   layout.append(listDiv, rightPane);
// //   divContainerNode.appendChild(layout);

// //   // ─── Build and append header (Create + Search) ──────────────────────────
// //   const { createBtn, searchForm } = buildListHeader();
// //   listDiv.append(createBtn, searchForm);

// //   searchForm.addEventListener("submit", (e) => {
// //     e.preventDefault();
// //     const qs = buildQueryStringFromForm(searchForm);
// //     fetchAndRenderList(`/itineraries/search?${qs}`);
// //   });

// //   // ─── Initial load ───────────────────────────────────────────────────────
// //   fetchAndRenderList("/itineraries");

// //   // ─── HELPERS ────────────────────────────────────────────────────────────

// //   function buildListHeader() {
// //     // Create "Create Itinerary" button
// //     const btn = document.createElement("button");
// //     btn.textContent = "Create Itinerary";
// //     btn.className = "itinerary-create-btn";
// //     btn.addEventListener("click", () => navigate("/create-itinerary"));

// //     // Create search form
// //     const form = document.createElement("form");
// //     form.id = "searchForm";
// //     form.innerHTML = `
// //       <input type="text" name="start_date" placeholder="Start Date (YYYY-MM-DD)">
// //       <input type="text" name="location" placeholder="Location">
// //       <input type="text" name="status" placeholder="Status (Draft/Confirmed)">
// //       <button type="submit">Search</button>
// //     `;

// //     return { createBtn: btn, searchForm: form };
// //   }

// //   function buildQueryStringFromForm(formNode) {
// //     const formData = new FormData(formNode);
// //     const params = new URLSearchParams();
// //     for (const [k, v] of formData.entries()) {
// //       if (v.trim()) params.append(k, v.trim());
// //     }
// //     return params.toString();
// //   }

// //   function resetListContainerWithHeader() {
// //     listDiv.innerHTML = "";
// //     listDiv.append(createBtn, searchForm);
// //   }

// //   async function fetchAndRenderList(endpoint) {
// //     resetListContainerWithHeader();
// //     const statusP = document.createElement("p");
// //     statusP.textContent = endpoint.includes("search") ? "Searching..." : "Loading...";
// //     listDiv.append(statusP);

// //     try {
// //       const itineraries = await apiFetch(endpoint);
// //       renderItineraryList(itineraries);
// //     } catch {
// //       resetListContainerWithHeader();
// //       const errP = document.createElement("p");
// //       errP.textContent = "Error loading itineraries.";
// //       listDiv.append(errP);
// //     }
// //   }

// //   function renderItineraryList(itineraries) {
// //     resetListContainerWithHeader();
// //     if (!Array.isArray(itineraries) || itineraries.length === 0) {
// //       const noP = document.createElement("p");
// //       noP.textContent = "No itineraries found.";
// //       listDiv.append(noP);
// //       return;
// //     }

// //     itineraries.forEach((it) => {
// //       const card = createItineraryCard(it);
// //       listDiv.append(card);
// //     });
// //   }

// //   function createItineraryCard(it) {
// //     const isCreator = state.user?.userid === it.user_id;
// //     const card = document.createElement("div");
// //     card.className = "itinerary-card";
// //     card.innerHTML = `
// //       <h3>${it.name}</h3>
// //       <p><strong>Status:</strong> ${it.status}</p>
// //       <p><strong>Start:</strong> ${it.start_date}</p>
// //     `;

// //     card.addEventListener("click", () => {
// //       if (window.innerWidth < 768) {
// //         openItineraryModal(it.itineraryid, isCreator);
// //       } else {
// //         loadItineraryInline(it.itineraryid, isCreator);
// //       }
// //     });

// //     return card;
// //   }

// //   // ─── VIEW HANDLERS ──────────────────────────────────────────────────────

// //   async function loadItineraryInline(id, isCreator) {
// //     rightPane.innerHTML = "<p>Loading details…</p>";
// //     try {
// //       const it = await apiFetch(`/itineraries/all/${id}`);
// //       renderItineraryDetails(it, rightPane, isCreator, /*modalInstance=*/ null);
// //     } catch {
// //       rightPane.innerHTML = "<p>Error loading itinerary details.</p>";
// //     }
// //   }

// //   function openItineraryModal(id, isCreator) {
// //     // Create a dummy container for loading state
// //     const container = document.createElement("div");
// //     container.innerHTML = "<p>Loading details…</p>";

// //     // Launch Modal
// //     const instance = Modal({
// //       title: "Itinerary Details",
// //       content: container,
// //       onClose: () => instance.remove(), // remove overlay when closed
// //       size: "large",
// //       closeOnOverlayClick: true,
// //     });

// //     // Fetch and render inside modal
// //     apiFetch(`/itineraries/all/${id}`)
// //       .then((it) => {
// //         container.innerHTML = "";
// //         renderItineraryDetails(it, container, isCreator, instance);
// //       })
// //       .catch(() => {
// //         container.innerHTML = "<p>Error loading itinerary details.</p>";
// //       });
// //   }

// //   /**
// //    * @param {object} it             — itinerary object from API
// //    * @param {HTMLElement} target     — where to render (either rightPane or modal body)
// //    * @param {boolean} isCreator     — whether current user can edit/delete/publish
// //    * @param {object|null} modalInst — modal instance (if rendering inside a modal)
// //    */
// //   function renderItineraryDetails(it, target, isCreator, modalInst = null) {
// //     target.innerHTML = "";

// //     // Header: Name, Status, Dates, Description
// //     const title = document.createElement("h2");
// //     title.textContent = it.name;

// //     const meta = document.createElement("p");
// //     meta.innerHTML = `
// //       <strong>Status:</strong> ${it.status} &nbsp;|&nbsp;
// //       <strong>Start:</strong> ${it.start_date} &nbsp;|&nbsp;
// //       <strong>End:</strong> ${it.end_date}
// //     `;

// //     const desc = document.createElement("p");
// //     desc.innerHTML = `<strong>Description:</strong> ${it.description || "N/A"}`;

// //     target.append(title, meta, desc);

// //     // If user is creator, show action buttons once
// //     if (isCreator) {
// //       const btnContainer = document.createElement("div");
// //       btnContainer.className = "itinerary-detail-buttons";

// //       // EDIT
// //       const editBtn = document.createElement("button");
// //       editBtn.textContent = "Edit";
// //       editBtn.addEventListener("click", () => {
// //         target.innerHTML = "";
// //         editItinerary(isLoggedIn, target, it.itineraryid);
// //       });
// //       btnContainer.append(editBtn);

// //       // DELETE
// //       const deleteBtn = document.createElement("button");
// //       deleteBtn.textContent = "Delete";
// //       deleteBtn.addEventListener("click", async () => {
// //         if (!confirm("Are you sure you want to delete this itinerary?")) return;
// //         try {
// //           await apiFetch(`/itineraries/${it.itineraryid}`, "DELETE");
// //           alert("Itinerary deleted successfully");
// //           if (modalInst && typeof modalInst.onClose === "function") {
// //             modalInst.onClose();
// //           }
// //           fetchAndRenderList("/itineraries");
// //           rightPane.innerHTML = "<p>Select an itinerary to see details here.</p>";
// //         } catch {
// //           alert("Error deleting itinerary");
// //         }
// //       });
// //       btnContainer.append(deleteBtn);

// //       // PUBLISH (if not already)
// //       if (!it.published) {
// //         const pubBtn = document.createElement("button");
// //         pubBtn.textContent = "Publish";
// //         pubBtn.addEventListener("click", async () => {
// //           try {
// //             await apiFetch(`/itineraries/${it.itineraryid}/publish`, "PUT");
// //             alert("Itinerary published successfully");
// //             if (modalInst && typeof modalInst.onClose === "function") {
// //               modalInst.onClose();
// //             }
// //             fetchAndRenderList("/itineraries");
// //           } catch {
// //             alert("Error publishing itinerary");
// //           }
// //         });
// //         btnContainer.append(pubBtn);
// //       }

// //       target.append(btnContainer);
// //     }

// //     // Render days + visits
// //     if (!Array.isArray(it.days) || it.days.length === 0) {
// //       const noSchedule = document.createElement("p");
// //       noSchedule.textContent = "No schedule available.";
// //       target.append(noSchedule);
// //       return;
// //     }

// //     it.days.forEach((day, di) => {
// //       const dayDiv = document.createElement("div");
// //       dayDiv.className = "itinerary-day";

// //       const dayHeader = document.createElement("h3");
// //       dayHeader.textContent = `Day ${di + 1}: ${day.date}`;
// //       dayDiv.append(dayHeader);

// //       day.visits.forEach((visit, vi) => {
// //         const visitDiv = document.createElement("div");
// //         visitDiv.className = "itinerary-visit";

// //         const timeP = document.createElement("p");
// //         timeP.innerHTML = `<strong>Time:</strong> ${visit.start_time} – ${visit.end_time}`;

// //         const locP = document.createElement("p");
// //         locP.innerHTML = `<strong>Location:</strong> ${visit.location}`;

// //         visitDiv.append(timeP, locP);

// //         if (vi > 0 && visit.transport) {
// //           const transP = document.createElement("p");
// //           transP.innerHTML = `<strong>Transport:</strong> ${visit.transport}`;
// //           visitDiv.append(transP);
// //         }

// //         dayDiv.append(visitDiv);
// //       });

// //       target.append(dayDiv);
// //     });
// //   }
// // }

// // export { displayItinerary };


// // // import { apiFetch } from "../../api/api.js";
// // // import { navigate } from "../../routes/index.js";
// // // import { state } from "../../state/state.js";
// // // import { editItinerary } from "./itineraryEdit.js";
// // // // Assumes Modal is already imported or globally available in this scope:
// // // // import { Modal } from "../../components/Modal.js";
// // // import  Modal  from "../../components/ui/Modal.mjs";

// // // function displayItinerary(isLoggedIn, divContainerNode) {
// // //   divContainerNode.innerHTML = '';

// // //   if (!isLoggedIn) {
// // //     divContainerNode.innerHTML = '<p>Please log in to view and manage your itineraries.</p>';
// // //     return;
// // //   }

// // //   // Main container: left list of cards, right detail pane (desktop)
// // //   const layout = document.createElement('div');
// // //   layout.className = 'itinerary-layout';

// // //   const listDiv = document.createElement('div');
// // //   listDiv.className = 'itinerary-list';
// // //   listDiv.id = 'itineraryList';

// // //   const rightPane = document.createElement('div');
// // //   rightPane.className = 'itinerary-right';
// // //   rightPane.innerHTML = '<p>Select an itinerary to see details here.</p>';

// // //   layout.append(listDiv, rightPane);
// // //   divContainerNode.appendChild(layout);

// // //   // Search form and Create button above the list
// // //   const searchForm = document.createElement('form');
// // //   searchForm.id = 'searchForm';
// // //   searchForm.innerHTML = `
// // //     <input type="text" name="start_date" placeholder="Start Date (YYYY-MM-DD)">
// // //     <input type="text" name="location" placeholder="Location">
// // //     <input type="text" name="status" placeholder="Status (Draft/Confirmed)">
// // //     <button type="submit">Search</button>
// // //   `;

// // //   const createBtn = document.createElement('button');
// // //   createBtn.textContent = 'Create Itinerary';
// // //   createBtn.className = 'itinerary-create-btn';
// // //   createBtn.addEventListener('click', () => navigate('/create-itinerary'));

// // //   listDiv.append(createBtn, searchForm);

// // //   searchForm.addEventListener('submit', e => {
// // //     e.preventDefault();
// // //     const formData = new FormData(searchForm);
// // //     const qs = new URLSearchParams();
// // //     for (let [k, v] of formData.entries()) {
// // //       if (v.trim()) qs.append(k, v.trim());
// // //     }
// // //     searchItineraries(qs.toString());
// // //   });

// // //   loadItineraries();

// // //   // --- Core Methods ---

// // //   async function loadItineraries() {
// // //     listDiv.innerHTML = '';
// // //     listDiv.append(createBtn, searchForm);
// // //     const loadingP = document.createElement('p');
// // //     loadingP.textContent = 'Loading...';
// // //     listDiv.appendChild(loadingP);

// // //     try {
// // //       const list = await apiFetch('/itineraries');
// // //       renderItineraryList(list);
// // //     } catch {
// // //       listDiv.innerHTML = '';
// // //       listDiv.append(createBtn, searchForm);
// // //       const errP = document.createElement('p');
// // //       errP.textContent = 'Error loading itineraries.';
// // //       listDiv.appendChild(errP);
// // //     }
// // //   }

// // //   async function searchItineraries(qs) {
// // //     listDiv.innerHTML = '';
// // //     listDiv.append(createBtn, searchForm);
// // //     const searchingP = document.createElement('p');
// // //     searchingP.textContent = 'Searching...';
// // //     listDiv.appendChild(searchingP);

// // //     try {
// // //       const list = await apiFetch(`/itineraries/search?${qs}`);
// // //       renderItineraryList(list);
// // //     } catch {
// // //       listDiv.innerHTML = '';
// // //       listDiv.append(createBtn, searchForm);
// // //       const errP = document.createElement('p');
// // //       errP.textContent = 'Error searching itineraries.';
// // //       listDiv.appendChild(errP);
// // //     }
// // //   }

// // //   function renderItineraryList(itineraries) {
// // //     listDiv.innerHTML = '';
// // //     listDiv.append(createBtn, searchForm);

// // //     if (!Array.isArray(itineraries) || itineraries.length === 0) {
// // //       const noP = document.createElement('p');
// // //       noP.textContent = 'No itineraries found.';
// // //       listDiv.appendChild(noP);
// // //       return;
// // //     }

// // //     itineraries.forEach(it => {
// // //       const card = createItineraryListItem(it);
// // //       listDiv.appendChild(card);
// // //     });
// // //   }

// // //   function createItineraryListItem(it) {
// // //     // Determine if the current user is the creator
// // //     const isCreator = state.user?.userid === it.user_id;

// // //     const card = document.createElement('div');
// // //     card.className = 'itinerary-card';
// // //     card.innerHTML = `
// // //       <h3>${it.name}</h3>
// // //       <p><strong>Status:</strong> ${it.status}</p>
// // //       <p><strong>Start:</strong> ${it.start_date}</p>
// // //     `;

// // //     // On click, either open modal (mobile) or load inline (desktop)
// // //     card.addEventListener('click', () => {
// // //       const isMobile = window.innerWidth < 768;
// // //       if (isMobile) {
// // //         viewItineraryModal(it.itineraryid, isCreator);
// // //       } else {
// // //         viewItinerary(it.itineraryid, isCreator);
// // //       }
// // //     });

// // //     return card;
// // //   }

// // //   async function viewItinerary(id, isCreator) {
// // //     rightPane.innerHTML = '<p>Loading details…</p>';
// // //     try {
// // //       const it = await apiFetch(`/itineraries/all/${id}`);
// // //       renderItineraryDetails(it, rightPane, isCreator);
// // //     } catch {
// // //       rightPane.innerHTML = '<p>Error loading itinerary details.</p>';
// // //     }
// // //   }

// // //   async function viewItineraryModal(id, isCreator) {
// // //     // Create a container for the modal content
// // //     const container = document.createElement('div');
// // //     container.innerHTML = '<p>Loading details…</p>';

// // //     // Open the modal (using existing Modal component)
// // //     const modalInstance = Modal({
// // //       title: 'Itinerary Details',
// // //       content: container,
// // //       onClose: () => {
// // //         modalInstance.remove();
// // //         // No extra cleanup needed here
// // //       },
// // //       size: 'large',
// // //       closeOnOverlayClick: true,
// // //     });

// // //     try {
// // //       const it = await apiFetch(`/itineraries/all/${id}`);
// // //       container.innerHTML = '';
// // //       renderItineraryDetails(it, container, isCreator, modalInstance);
// // //     } catch {
// // //       container.innerHTML = '<p>Error loading itinerary details.</p>';
// // //     }
// // //   }

// // //   /**
// // //    * Renders itinerary details into the given target element.
// // //    * If rendering inside a modal, passes modalInstance so Edit/Delete buttons can close it if needed.
// // //    */
// // //   function renderItineraryDetails(it, target, isCreator, modalInstance = null) {
// // //     target.innerHTML = '';

// // //     const h2 = document.createElement('h2');
// // //     h2.textContent = it.name;

// // //     const meta = document.createElement('p');
// // //     meta.innerHTML = `
// // //       <strong>Status:</strong> ${it.status} &nbsp;|&nbsp;
// // //       <strong>Start:</strong> ${it.start_date} &nbsp;|&nbsp;
// // //       <strong>End:</strong> ${it.end_date}
// // //     `;

// // //     const desc = document.createElement('p');
// // //     desc.innerHTML = `<strong>Description:</strong> ${it.description || 'N/A'}`;

// // //     target.append(h2, meta, desc);

// // //     // If the user is the creator, show Edit/Delete/Publish buttons
// // //     if (isCreator) {
// // //       const buttonContainer = document.createElement('div');
// // //       buttonContainer.className = 'itinerary-detail-buttons';

// // //       const editBtn = document.createElement('button');
// // //       editBtn.textContent = 'Edit';
// // //       editBtn.addEventListener('click', () => {
// // //         target.innerHTML = '';
// // //         editItinerary(isLoggedIn, target, it.itineraryid);
// // //       });
// // //       buttonContainer.appendChild(editBtn);

// // //       const deleteBtn = document.createElement('button');
// // //       deleteBtn.textContent = 'Delete';
// // //       deleteBtn.addEventListener('click', async () => {
// // //         if (!confirm('Are you sure you want to delete this itinerary?')) return;
// // //         try {
// // //           await apiFetch(`/itineraries/${it.itineraryid}`, 'DELETE');
// // //           alert('Itinerary deleted successfully');
// // //           if (modalInstance) modalInstance.onClose && modalInstance.onClose();
// // //           loadItineraries();
// // //           rightPane.innerHTML = '<p>Select an itinerary to see details here.</p>';
// // //         } catch {
// // //           alert('Error deleting itinerary');
// // //         }
// // //       });
// // //       buttonContainer.appendChild(deleteBtn);

// // //       if (!it.published) {
// // //         const publishBtn = document.createElement('button');
// // //         publishBtn.textContent = 'Publish';
// // //         publishBtn.addEventListener('click', async () => {
// // //           try {
// // //             await apiFetch(`/itineraries/${it.itineraryid}/publish`, 'PUT');
// // //             alert('Itinerary published successfully');
// // //             if (modalInstance) modalInstance.onClose && modalInstance.onClose();
// // //             loadItineraries();
// // //           } catch {
// // //             alert('Error publishing itinerary');
// // //           }
// // //         });
// // //         buttonContainer.appendChild(publishBtn);
// // //       }

// // //       target.appendChild(buttonContainer);
// // //     }

// // //     // Render days and visits
// // //     if (!Array.isArray(it.days) || it.days.length === 0) {
// // //       const noScheduleP = document.createElement('p');
// // //       noScheduleP.textContent = 'No schedule available.';
// // //       target.appendChild(noScheduleP);
// // //       return;
// // //     }

// // //     it.days.forEach((day, di) => {
// // //       const dayDiv = document.createElement('div');
// // //       dayDiv.className = 'itinerary-day';

// // //       const dayHeader = document.createElement('h3');
// // //       dayHeader.textContent = `Day ${di + 1}: ${day.date}`;
// // //       dayDiv.appendChild(dayHeader);

// // //       day.visits.forEach((visit, vi) => {
// // //         const visitDiv = document.createElement('div');
// // //         visitDiv.className = 'itinerary-visit';

// // //         const timeP = document.createElement('p');
// // //         timeP.innerHTML = `<strong>Time:</strong> ${visit.start_time} – ${visit.end_time}`;

// // //         const locP = document.createElement('p');
// // //         locP.innerHTML = `<strong>Location:</strong> ${visit.location}`;

// // //         visitDiv.append(timeP, locP);

// // //         if (vi > 0 && visit.transport) {
// // //           const transP = document.createElement('p');
// // //           transP.innerHTML = `<strong>Transport:</strong> ${visit.transport}`;
// // //           visitDiv.appendChild(transP);
// // //         }

// // //         dayDiv.appendChild(visitDiv);
// // //       });

// // //       target.appendChild(dayDiv);
// // //     });
// // //   }

// // //   async function deleteItinerary(id) {
// // //     if (!confirm('Are you sure you want to delete this itinerary?')) return;
// // //     try {
// // //       await apiFetch(`/itineraries/${id}`, 'DELETE');
// // //       alert('Itinerary deleted successfully');
// // //       loadItineraries();
// // //       rightPane.innerHTML = '<p>Select an itinerary to see details here.</p>';
// // //     } catch {
// // //       alert('Error deleting itinerary');
// // //     }
// // //   }

// // //   async function forkItinerary(id) {
// // //     try {
// // //       await apiFetch(`/itineraries/${id}/fork`, 'POST');
// // //       alert('Itinerary forked successfully');
// // //       loadItineraries();
// // //     } catch {
// // //       alert('Error forking itinerary');
// // //     }
// // //   }

// // //   async function publishItinerary(id) {
// // //     try {
// // //       await apiFetch(`/itineraries/${id}/publish`, 'PUT');
// // //       alert('Itinerary published successfully');
// // //       loadItineraries();
// // //     } catch {
// // //       alert('Error publishing itinerary');
// // //     }
// // //   }
// // // }

// // // export { displayItinerary };


import { apiFetch } from "../../api/api.js";
import { navigate } from "../../routes/index.js";
import { state } from "../../state/state.js";
import { editItinerary } from "./itineraryEdit.js";

function displayItinerary(isLoggedIn, divContainerNode) {
  divContainerNode.innerHTML = '';

  if (!isLoggedIn) {
    divContainerNode.innerHTML = '<p>Please log in to view and manage your itineraries.</p>';
    return;
  }

  // const isCreator = state.user?.userid === it.user_id;
  let isCreator = false;

  // Main container layout: list on the left, details on the right
  const layout = document.createElement('div');
  layout.className = 'itinerary-layout';

  const leftPane = document.createElement('div');
  leftPane.className = 'itinerary-left';

  const rightPane = document.createElement('div');
  rightPane.className = 'itinerary-right';
  rightPane.innerHTML = '<p>Select an itinerary to see details here.</p>';

  layout.append(leftPane, rightPane);
  divContainerNode.appendChild(layout);

  // --- Search Form ---
  const searchForm = document.createElement('form');
  searchForm.id = 'searchForm';
  searchForm.innerHTML = `
    <input type="text" name="start_date" placeholder="Start Date (YYYY-MM-DD)">
    <input type="text" name="location" placeholder="Location">
    <input type="text" name="status" placeholder="Status (Draft/Confirmed)">
    <button type="submit">Search</button>
  `;

  // --- Create Button ---
  const createBtn = document.createElement('button');
  createBtn.textContent = 'Create Itinerary';
  createBtn.className = 'itinerary-create-btn';
  createBtn.addEventListener('click', () => navigate('/create-itinerary'));

  const listDiv = document.createElement('div');
  listDiv.id = 'itineraryList';

  leftPane.append(searchForm, createBtn, listDiv);

  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(searchForm);
    const qs = new URLSearchParams();
    for (let [k, v] of formData.entries()) {
      if (v.trim()) qs.append(k, v.trim());
    }
    searchItineraries(qs.toString());
  });

  loadItineraries();

  // --- Core Methods ---

  async function loadItineraries() {
    listDiv.innerHTML = '<p>Loading...</p>';
    try {
      const list = await apiFetch('/itineraries');
      renderItineraryList(list);
    } catch {
      listDiv.innerHTML = '<p>Error loading itineraries.</p>';
    }
  }

  async function searchItineraries(qs) {
    listDiv.innerHTML = '<p>Searching...</p>';
    try {
      const list = await apiFetch(`/itineraries/search?${qs}`);
      renderItineraryList(list);
    } catch {
      listDiv.innerHTML = '<p>Error searching itineraries.</p>';
    }
  }

  function renderItineraryList(itineraries) {
    listDiv.innerHTML = '';
    if (!itineraries.length) {
      listDiv.innerHTML = '<p>No itineraries found.</p>';
      return;
    }
    const ul = document.createElement('ul');
    itineraries.forEach(it => ul.appendChild(createItineraryListItem(it)));
    listDiv.appendChild(ul);
  }

  function createItineraryListItem(it) {
    // isCreator = state.user?.userid === it.user_id;
    isCreator = state.user === it.user_id;
    console.log(isCreator);
    const li = document.createElement('li');
    li.style.marginBottom = '10px';
    li.innerHTML = `<strong>${it.name}</strong> (${it.status}) `;
    const buttons = [
      { label: 'View', fn: () => viewItinerary(it.itineraryid) },
      { label: 'Fork', fn: () => forkItinerary(it.itineraryid) },
    ];
    
    if (isCreator) {
      buttons.push(
        { label: 'Edit', fn: () => editItinerary(isLoggedIn, rightPane, it.itineraryid) },
        { label: 'Delete', fn: () => deleteItinerary(it.itineraryid) },
        // Only show Publish if not already published
        ...(!it.published ? [{ label: 'Publish', fn: () => publishItinerary(it.itineraryid) }] : [])
      );
    }
    
    buttons.forEach(({ label, fn }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.marginLeft = '5px';
      btn.addEventListener('click', fn);
      li.appendChild(btn);
    });
    
    return li;
  }

  async function viewItinerary(id) {
    rightPane.innerHTML = '<p>Loading details…</p>';
    try {
      const it = await apiFetch(`/itineraries/all/${id}`);
      renderItineraryDetails(it);
    } catch {
      rightPane.innerHTML = '<p>Error loading itinerary details.</p>';
    }
  }

  function renderItineraryDetails(it) { 
    // Clear and build header
    rightPane.innerHTML = '';
    const h2 = document.createElement('h2');
    h2.textContent = it.name;
    const meta = document.createElement('p');
    meta.innerHTML = `
      <strong>Status:</strong> ${it.status} &nbsp;|&nbsp;
      <strong>Start:</strong> ${it.start_date} &nbsp;|&nbsp;
      <strong>End:</strong> ${it.end_date}
    `;
    const desc = document.createElement('p');
    desc.innerHTML = `<strong>Description:</strong> ${it.description || 'N/A'}`;

    rightPane.append(h2, meta, desc);

    // Render each day
    if (!Array.isArray(it.days) || it.days.length === 0) {
      rightPane.append(document.createElement('p').appendChild(document.createTextNode('No schedule available.')));
      return;
    }

    it.days.forEach((day, di) => {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'itinerary-day';

      const dayHeader = document.createElement('h3');
      dayHeader.textContent = `Day ${di + 1}: ${day.date}`;
      dayDiv.appendChild(dayHeader);

      day.visits.forEach((visit, vi) => {
        const visitDiv = document.createElement('div');
        visitDiv.className = 'itinerary-visit';

        const timeP = document.createElement('p');
        timeP.innerHTML = `<strong>Time:</strong> ${visit.start_time} – ${visit.end_time}`;

        const locP = document.createElement('p');
        locP.innerHTML = `<strong>Location:</strong> ${visit.location}`;

        visitDiv.append(timeP, locP);

        // Transport only for visits after the first one
        if (vi > 0 && visit.transport) {
          const transP = document.createElement('p');
          transP.innerHTML = `<strong>Transport:</strong> ${visit.transport}`;
          visitDiv.appendChild(transP);
        }

        dayDiv.appendChild(visitDiv);
      });

      rightPane.appendChild(dayDiv);
    });
  }

  function editItineraryHandler(isLoggedIn, pane, id) {
    pane.innerHTML = '';
    editItinerary(isLoggedIn, pane, id);
  }

  async function deleteItinerary(id) {
    if (!confirm('Are you sure you want to delete this itinerary?')) return;
    try {
      await apiFetch(`/itineraries/${id}`, 'DELETE');
      alert('Itinerary deleted successfully');
      loadItineraries();
      rightPane.innerHTML = '<p>Select an itinerary to see details here.</p>';
    } catch {
      alert('Error deleting itinerary');
    }
  }

  async function forkItinerary(id) {
    try {
      await apiFetch(`/itineraries/${id}/fork`, 'POST');
      alert('Itinerary forked successfully');
      loadItineraries();
    } catch {
      alert('Error forking itinerary');
    }
  }

  async function publishItinerary(id) {
    try {
      await apiFetch(`/itineraries/${id}/publish`, 'PUT');
      alert('Itinerary published successfully');
      loadItineraries();
    } catch {
      alert('Error publishing itinerary');
    }
  }
}

export { displayItinerary };
