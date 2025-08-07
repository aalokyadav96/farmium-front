import { SRC_URL, apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";

// ─── Events (Arena) ────────────────────────────────────────────────────────────

// async function displayPlaceEvents(container, placeId, isCreator, isLoggedIn) {
//   container.innerHTML = "";
//   showLoading(container);

//   try {
//     const events = await apiFetch(`/place/${placeId}/events`);
//     container.innerHTML = "";

//     container.appendChild(createElement("h3", {}, ["Arena Events"]));
//     const eventSection = createElement("div", { class: "event-section" }, []);

//     events.forEach((e) => {
//       const evDiv = createElement("div", { class: "event-item" }, [
//         createElement("h4", {}, [e.name]),
//         createElement("p", {}, [`Date: ${e.date}`])
//       ]);

//       if (isLoggedIn) {
//         const viewBtn = Button("View", `view-${e._id}`, {
//           click: () => {
//             // Possibly open a modal or navigate to event details
//             window.location.href = `/places/${placeId}/events/${e._id}`;
//           }
//         });
//         evDiv.appendChild(viewBtn);
//       }

//       if (isCreator) {
//         const editBtn = Button("Edit", `edit-event-${e._id}`, {
//           click: () => {
//             const formFields = [
//               { name: "name", placeholder: "Name", value: e.name },
//               { name: "date", placeholder: "Date", type: "date", value: e.date }
//             ];
//             const editForm = createInlineForm(
//               formFields,
//               async (data, formEl) => {
//                 try {
//                   await apiFetch(`/place/${placeId}/events/${e._id}`, {
//                     method: "PUT",
//                     body: JSON.stringify(data)
//                   });
//                   displayPlaceEvents(container, placeId, isCreator, isLoggedIn);
//                 } catch (ee) {
//                   alert(`Update failed: ${ee.message}`);
//                 }
//               },
//               (formEl) => evDiv.replaceChild(evDivClone, formEl)
//             );
//             const evDivClone = evDiv.cloneNode(true);
//             evDiv.replaceChildren(editForm);
//           }
//         });
//         const deleteBtn = Button("Delete", `delete-event-${e._id}`, {
//           click: async () => {
//             if (!confirm(`Delete event "${e.name}"?`)) return;
//             try {
//               await apiFetch(`/place/${placeId}/events/${e._id}`, {
//                 method: "DELETE"
//               });
//               displayPlaceEvents(container, placeId, isCreator, isLoggedIn);
//             } catch (ee) {
//               alert(`Delete failed: ${ee.message}`);
//             }
//           }
//         });
//         evDiv.appendChild(editBtn);
//         evDiv.appendChild(deleteBtn);
//       }

//       eventSection.appendChild(evDiv);
//     });

//     container.appendChild(eventSection);

//     if (isCreator) {
//       const addBtn = Button("Add Event", "add-event", {
//         click: () => {
//           const formFields = [
//             { name: "name", placeholder: "Name" },
//             { name: "date", placeholder: "Date", type: "date" }
//           ];
//           const addForm = createInlineForm(
//             formFields,
//             async (data, formEl) => {
//               try {
//                 await apiFetch(`/place/${placeId}/events`, {
//                   method: "POST",
//                   body: JSON.stringify(data)
//                 });
//                 displayPlaceEvents(container, placeId, isCreator, isLoggedIn);
//               } catch (ee) {
//                 alert(`Creation failed: ${ee.message}`);
//               }
//             },
//             (formEl) => container.removeChild(formEl)
//           );
//           container.appendChild(addForm);
//           addBtn.disabled = true;
//         }
//       });
//       container.appendChild(addBtn);
//     }
//   } catch (err) {
//     container.innerHTML = "";
//     showError(container, "Events unavailable.");
//   }
// }

// function fetchAndDisplayEvents(container, placeid, page = 1, limit = 10) {
//   container.innerHTML = ''; // Clear old content

//   const endpoint = `/place/${placeid}/events?page=${page}&limit=${limit}`;

//   apiFetch(endpoint)
//       .then(events => {
//           const total = events.length;

//           const listContainer = document.createElement('div');
//           renderEvents(listContainer, events);
//           container.appendChild(listContainer);

//           const pagination = document.createElement('div');
//           renderPaginationControls(pagination, total, page, limit, container, placeid);
//           container.appendChild(pagination);

//           createModalIfNotExists();
//       })
//       .catch(err => {
//           const errMsg = document.createElement('p');
//           errMsg.textContent = 'Error loading events: ' + err.message;
//           container.appendChild(errMsg);
//       });
// }


// export async function displayPlaceEvents(container, placeId, isCreator, isLoggedIn) {
//     fetchAndDisplayEvents(container, placeId, 1, 10);
// }

// function fetchAndDisplayEvents(container, placeid, page = 1, limit = 10) {
//     container.innerHTML = ''; // Clear old content

//     const endpoint = `/place/${placeid}/events?page=${page}&limit=${limit}`;

//     apiFetch(endpoint)
//         .then(data => {
//             if (data.events != null) {
//                 const events = data.events;
//                 const total = data.total;

//                 const listContainer = document.createElement('div');
//                 renderEvents(listContainer, events);
//                 container.appendChild(listContainer);

//                 const pagination = document.createElement('div');
//                 renderPaginationControls(pagination, total, page, limit, container, placeid);
//                 container.appendChild(pagination);

//                 createModalIfNotExists();
//             } else {
//                 const errMsg = document.createElement('p');
//                 errMsg.textContent = "No Upcoming Events";
//                 container.appendChild(errMsg);
//             }
//         })
//         .catch(err => {
//             const errMsg = document.createElement('p');
//             errMsg.textContent = 'Error loading events: ' + err.message;
//             container.appendChild(errMsg);
//         });
// }


// function renderEvents(container, events) {
//     var containerx = createElement('div', { class: "hvflex" }, []);
//     container.appendChild(containerx);

//     events.forEach(event => {
//         const card = document.createElement('div');
//         card.style.border = '1px solid #ccc';
//         card.style.margin = '10px 0';
//         card.style.padding = '10px';
//         card.style.cursor = 'pointer';
//         card.style.maxWidth = "270px"

//         const title = document.createElement('h3');
//         title.textContent = event.title;
//         card.appendChild(title);

//         if (event.banner_image) {
//             const banner = document.createElement('img');
//             banner.src = `${SRC_URL}/eventpic/banner/thumb/${event.banner_image}`;
//             banner.alt = event.title;
//             banner.style.width = '100%';
//             banner.style.maxHeight = '200px';
//             banner.style.objectFit = 'cover';
//             card.appendChild(banner);
//         }

//         const time = document.createElement('p');
//         const start = new Date(event.start_date_time).toLocaleString();
//         const end = new Date(event.end_date_time).toLocaleString();
//         time.textContent = `From: ${start} To: ${end}`;
//         card.appendChild(time);

//         const location = document.createElement('p');
//         location.textContent = `Location: ${event.placename || 'Unknown'}`;
//         card.appendChild(location);

//         card.addEventListener('click', () => openEventModal(event));
//         containerx.appendChild(card);
//     });
// }

// function renderPaginationControls(container, total, currentPage, limit, rootContainer, placeid) {
//     container.innerHTML = '';
//     const totalPages = Math.ceil(total / limit);

//     for (let i = 1; i <= totalPages; i++) {
//         const btn = document.createElement('button');
//         btn.textContent = i;
//         btn.disabled = i === currentPage;
//         btn.style.marginRight = '5px';

//         btn.addEventListener('click', () => {
//             rootContainer.innerHTML = '';
//             fetchAndDisplayEvents(rootContainer, placeid, i, limit);
//         });

//         container.appendChild(btn);
//     }
// }
let allEvents = [];
let activeEventCategory = "All";

export async function displayPlaceEvents(container, placeId, isCreator, isLoggedIn) {
    fetchAndDisplayEvents(container, placeId, 1, 10);
}

function fetchAndDisplayEvents(container, placeid, page = 1, limit = 10) {
    container.innerHTML = ''; // Clear old content

    const endpoint = `/place/${placeid}/events?page=${page}&limit=${limit}`;

    apiFetch(endpoint)
        .then(data => {
            if (data.events != null) {
                allEvents = data.events;
                const total = data.total;

                // Get unique categories from events
                const categories = ["All", ...new Set(allEvents.map(e => e.category || "Uncategorized"))];

                // Render filter bar
                const filterBar = createElement("div", { class: "filter-bar" }, []);
                categories.forEach(category => {
                    const btn = createElement("button", {
                        class: category === activeEventCategory ? "filter-button active" : "filter-button"
                    }, [category]);

                    btn.addEventListener("click", () => {
                        activeEventCategory = category;
                        updateEventFilterButtons(filterBar, category);
                        renderEvents(eventContainer, allEvents); // Refresh filtered list
                    });

                    filterBar.appendChild(btn);
                });
                container.appendChild(filterBar);

                // Render events list
                const eventContainer = document.createElement('div');
                container.appendChild(eventContainer);
                renderEvents(eventContainer, allEvents);

                // Render pagination
                const pagination = document.createElement('div');
                renderPaginationControls(pagination, total, page, limit, container, placeid);
                container.appendChild(pagination);

                createModalIfNotExists();
            } else {
                const errMsg = document.createElement('p');
                errMsg.textContent = "No Upcoming Events";
                container.appendChild(errMsg);
            }
        })
        .catch(err => {
            const errMsg = document.createElement('p');
            errMsg.textContent = 'Error loading events: ' + err.message;
            container.appendChild(errMsg);
        });
}

// Helper to update active filter button UI
function updateEventFilterButtons(filterBar, selectedCategory) {
    [...filterBar.children].forEach(btn => {
        btn.classList.toggle("active", btn.textContent === selectedCategory);
    });
}

function renderEvents(container, events) {
    container.innerHTML = ''; // Clear old events

    const containerx = createElement('div', { class: "hvflex" }, []);
    container.appendChild(containerx);

    const filtered = activeEventCategory === "All"
        ? events
        : events.filter(e => (e.category || "Uncategorized") === activeEventCategory);

    if (filtered.length === 0) {
        containerx.appendChild(createElement('p', {}, ["No events available in this category."]));
        return;
    }

    filtered.forEach(event => {
        const card = document.createElement('div');
        card.style.border = '1px solid #ccc';
        card.style.margin = '10px 0';
        card.style.padding = '10px';
        card.style.cursor = 'pointer';
        card.style.maxWidth = "270px";

        const title = document.createElement('h3');
        title.textContent = event.title;
        card.appendChild(title);

        if (event.banner_image) {
            const banner = document.createElement('img');
            // banner.src = `${SRC_URL}/eventpic/banner/thumb/${event.banner_image}`;
            banner.src = resolveImagePath(EntityType.USER, PictureType.THUMB, `${event.banner_image}`);
            banner.alt = event.title;
            banner.style.width = '100%';
            banner.style.maxHeight = '200px';
            banner.style.objectFit = 'cover';
            card.appendChild(banner);
        }

        const time = document.createElement('p');
        const start = new Date(event.start_date_time).toLocaleString();
        const end = new Date(event.end_date_time).toLocaleString();
        time.textContent = `From: ${start} To: ${end}`;
        card.appendChild(time);

        const location = document.createElement('p');
        location.textContent = `Location: ${event.placename || 'Unknown'}`;
        card.appendChild(location);

        card.addEventListener('click', () => openEventModal(event));
        containerx.appendChild(card);
    });
}

function renderPaginationControls(container, total, currentPage, limit, rootContainer, placeid) {
    container.innerHTML = '';
    const totalPages = Math.ceil(total / limit);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.disabled = i === currentPage;
        btn.style.marginRight = '5px';

        btn.addEventListener('click', () => {
            rootContainer.innerHTML = '';
            fetchAndDisplayEvents(rootContainer, placeid, i, limit);
        });

        container.appendChild(btn);
    }
}

function openEventModal(event) {
    const modal = document.getElementById('event-modal');
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');

    content.innerHTML = ''; // Clear old content

    const title = document.createElement('h2');
    title.textContent = event.title;
    content.appendChild(title);

    const desc = document.createElement('p');
    desc.textContent = event.description || 'No description provided.';
    content.appendChild(desc);

    const time = document.createElement('p');
    time.textContent = `From ${new Date(event.start_date_time).toLocaleString()} to ${new Date(event.end_date_time).toLocaleString()}`;
    content.appendChild(time);

    const category = document.createElement('p');
    category.textContent = `Category: ${event.category || 'N/A'}`;
    content.appendChild(category);

    const location = document.createElement('p');
    location.textContent = `Location: ${event.placename || 'Unknown'}`;
    content.appendChild(location);

    if (event.banner_image) {
        const img = document.createElement('img');
        img.src = `${SRC_URL}/eventpic/banner/thumb/${event.banner_image}`;
        img.alt = event.title;
        img.style.width = '100%';
        img.style.maxHeight = '300px';
        img.style.objectFit = 'cover';
        content.appendChild(img);
    }

    modal.style.display = 'block';
    overlay.style.display = 'block';
}

function createModalIfNotExists() {
    if (document.getElementById('event-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'event-modal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    // modal.style.top = '10%';
    // modal.style.left = '10%';
    // modal.style.right = '10%';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.backgroundColor = '#fff';
    modal.style.border = '1px solid #000';
    modal.style.padding = '20px';
    modal.style.zIndex = 1000;
    modal.style.overflowY = "scroll";
    modal.style.maxHeight = "100vh";

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    });
    modal.appendChild(closeBtn);

    const content = document.createElement('div');
    content.id = 'modal-content';
    modal.appendChild(content);

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.display = 'none';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = 999;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

