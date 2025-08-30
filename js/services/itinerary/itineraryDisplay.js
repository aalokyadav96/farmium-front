import { apiFetch, apigFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import Modal from "../../components/ui/Modal.mjs";
import { navigate } from "../../routes/index.js";
import { state } from "../../state/state.js";
import { editItinerary } from "./itineraryEdit.js";

function displayItinerary(isLoggedIn, divContainerNode) {
  divContainerNode.innerHTML = '';

  if (!isLoggedIn) {
    divContainerNode.innerHTML = '<p>Please log in to view and manage your itineraries.</p>';
    return;
  }

  let isCreator = false;

  // Main layout: left pane (list) / right pane (details)
  const layout = createElement('div', { class: 'itinerary-layout' }, []);
  const leftPane = createElement('div', { class: 'itinerary-left' }, []);
  const rightPane = createElement('div', { class: 'itinerary-right' }, [
    createElement('p', {}, ['Select an itinerary to see details here.'])
  ]);
  layout.append(leftPane, rightPane);
  divContainerNode.appendChild(layout);

  // --- Search Form ---
  const searchForm = createElement('form', { id: 'searchForm', class: 'itinerary-search-form' }, [
    createElement('input', { type: 'text', name: 'start_date', placeholder: 'Start Date (YYYY-MM-DD)' }),
    createElement('input', { type: 'text', name: 'location', placeholder: 'Location' }),
    createElement('input', { type: 'text', name: 'status', placeholder: 'Status (Draft/Confirmed)' }),
    createElement('button', { type: 'submit' }, ['Search'])
  ]);

  // --- Create Button ---
  const createBtn = createElement('button', { class: 'itinerary-create-btn' }, ['Create Itinerary']);
  createBtn.addEventListener('click', () => navigate('/create-itinerary'));

  const listDiv = createElement('div', { id: 'itineraryList' }, []);

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
      const list = await apigFetch('/itineraries');
      renderItineraryList(list);
    } catch {
      listDiv.innerHTML = '<p>Error loading itineraries.</p>';
    }
  }

  async function searchItineraries(qs) {
    listDiv.innerHTML = '<p>Searching...</p>';
    try {
      const list = await apigFetch(`/itineraries/search?${qs}`);
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
    const ul = createElement('ul', { class: 'itinerary-list' }, []);
    itineraries.forEach(it => ul.appendChild(createItineraryListItem(it)));
    listDiv.appendChild(ul);
  }

  function createItineraryListItem(it) {
    isCreator = state.user === it.user_id;

    const li = createElement('li', { class: 'itinerary-list-item' }, [
      createElement('strong', {}, [it.name]),
      document.createTextNode(` (${it.status}) `)
    ]);

    const buttons = [
      { label: 'View', fn: () => viewItinerary(it.itineraryid) },
      { label: 'Fork', fn: () => forkItinerary(it.itineraryid) }
    ];

    if (isCreator) {
      buttons.push(
        { label: 'Edit', fn: () => editItinerary(rightPane, isLoggedIn, it.itineraryid) },
        { label: 'Delete', fn: () => deleteItinerary(it.itineraryid) },
        ...(!it.published ? [{ label: 'Publish', fn: () => publishItinerary(it.itineraryid) }] : [])
      );
    }

    // buttons.forEach(({ label, fn }) => {
    //   const btn = createElement('button', { class: 'itinerary-btn' }, [label]);
    //   btn.addEventListener('click', fn);
    //   li.appendChild(btn);
    // });

    buttons.forEach(({ label, fn }) => {
      const btn = Button(label, `it-disp-${label}`, {
        click: () => {
          fn();
        }
       }, 'itinerary-btn buttonx secondary');
      li.appendChild(btn);
    });

    return li;
  }

  async function openViewModal(id) {
    const modalLoading = Modal({
      title: 'Loading Itinerary Details…',
      content: 'Loading...',
      onClose: () => { },
      size: 'large',
      closeOnOverlayClick: true,
    });

    try {
      const it = await apiFetch(`/itineraries/all/${id}`);
      const contentNode = renderItineraryDetailsContent(it);
      modalLoading.querySelector('.modal-body').replaceWith(contentNode);

      const titleEl = modalLoading.querySelector('.modal-header h3');
      titleEl.textContent = it.name;
    } catch {
      const body = modalLoading.querySelector('.modal-body');
      body.textContent = 'Error loading itinerary details.';
    }
  }

  function renderItineraryDetailsContent(it) {
    const container = createElement('div', { class: 'itinerary-con timeline' }, []);
  
    // Meta info
    const meta = createElement('div', { class: 'itinerary-meta' }, [
      createElement('span', { class: 'status' }, [`Status: ${it.status}`]),
      createElement('span', { class: 'dates' }, [`Start: ${it.start_date}`, `End: ${it.end_date}`])
    ]);
    container.appendChild(meta);
  
    const desc = createElement('p', { class: 'itinerary-desc' }, [`Description: ${it.description || 'N/A'}`]);
    container.appendChild(desc);
  
    if (!Array.isArray(it.days) || !it.days.length) {
      container.appendChild(createElement('p', { class: 'no-schedule' }, ['No schedule available.']));
      return container;
    }
  
    it.days.forEach((day, di) => {
      const dayDiv = createElement('div', { class: 'itinerary-day timeline-day' }, []);
      const dayHeader = createElement('h3', { class: 'day-header' }, [`Day ${di + 1}: ${day.date}`]);
      dayDiv.appendChild(dayHeader);
  
      const visitsContainer = createElement('div', { class: 'visits-container' }, []);
  
      day.visits.forEach((visit, vi) => {
        const visitCard = createElement('div', { class: 'visit-card timeline-node' }, []);
  
        const time = createElement('span', { class: 'visit-time' }, [`${visit.start_time} – ${visit.end_time}`]);
        const location = createElement('span', { class: 'visit-location' }, [visit.location]);
        const infoRow = createElement('div', { class: 'visit-info' }, [time, location]);
        visitCard.appendChild(infoRow);
  
        if (visit.transport) {
          const transportBadge = createElement('span', { class: `transport ${visit.transport.toLowerCase()}` }, [visit.transport]);
          visitCard.appendChild(transportBadge);
        }
  
        visitsContainer.appendChild(visitCard);
  
        // Add connector with arrow
        if (vi < day.visits.length - 1 && visit.transport) {
          const connector = createElement('div', { class: `transport-connector ${visit.transport.toLowerCase()}` }, []);
          const line = createElement('div', { class: 'line' }, []);
          const arrow = createElement('div', { class: 'arrow' }, []);
          const label = createElement('span', { class: 'connector-label' }, [visit.transport]);
  
          connector.appendChild(line);
          connector.appendChild(arrow);
          connector.appendChild(label);
          visitsContainer.appendChild(connector);
        }
      });
  
      dayDiv.appendChild(visitsContainer);
      container.appendChild(dayDiv);
    });
  
    return container;
  }
  
  // function renderItineraryDetailsContent(it) {
  //   const container = createElement('div', { class: 'itinerary-con timeline' }, []);
  
  //   // Meta info
  //   const meta = createElement('div', { class: 'itinerary-meta' }, [
  //     createElement('span', { class: 'status' }, [`Status: ${it.status}`]),
  //     createElement('span', { class: 'dates' }, [`Start: ${it.start_date}`, `End: ${it.end_date}`])
  //   ]);
  //   container.appendChild(meta);
  
  //   const desc = createElement('p', { class: 'itinerary-desc' }, [`Description: ${it.description || 'N/A'}`]);
  //   container.appendChild(desc);
  
  //   if (!Array.isArray(it.days) || !it.days.length) {
  //     container.appendChild(createElement('p', { class: 'no-schedule' }, ['No schedule available.']));
  //     return container;
  //   }
  
  //   it.days.forEach((day, di) => {
  //     const dayDiv = createElement('div', { class: 'itinerary-day timeline-day' }, []);
  //     const dayHeader = createElement('h3', { class: 'day-header' }, [`Day ${di + 1}: ${day.date}`]);
  //     dayDiv.appendChild(dayHeader);
  
  //     const visitsContainer = createElement('div', { class: 'visits-container' }, []);
  
  //     day.visits.forEach((visit, vi) => {
  //       const visitCard = createElement('div', { class: 'visit-card timeline-node' }, []);
  
  //       const time = createElement('span', { class: 'visit-time' }, [`${visit.start_time} – ${visit.end_time}`]);
  //       const location = createElement('span', { class: 'visit-location' }, [visit.location]);
  //       const infoRow = createElement('div', { class: 'visit-info' }, [time, location]);
  //       visitCard.appendChild(infoRow);
  
  //       // Add transport badge inside the card if defined
  //       if (visit.transport) {
  //         const transportBadge = createElement('span', { class: `transport ${visit.transport.toLowerCase()}` }, [visit.transport]);
  //         visitCard.appendChild(transportBadge);
  //       }
  
  //       visitsContainer.appendChild(visitCard);
  
  //       // Add transport connector between visits
  //       if (vi < day.visits.length - 1 && visit.transport) {
  //         const nextTransport = createElement('div', { class: `transport-connector ${visit.transport.toLowerCase()}` }, [
  //           visit.transport
  //         ]);
  //         visitsContainer.appendChild(nextTransport);
  //       }
  //     });
  
  //     dayDiv.appendChild(visitsContainer);
  //     container.appendChild(dayDiv);
  //   });
  
  //   return container;
  // }
  

  // // function renderItineraryDetailsContent(it) {
  // //   const container = createElement('div', { class: 'itinerary-con timeline' }, []);
  
  // //   // Meta info
  // //   const meta = createElement('div', { class: 'itinerary-meta' }, [
  // //     createElement('span', { class: 'status' }, [`Status: ${it.status}`]),
  // //     createElement('span', { class: 'dates' }, [`Start: ${it.start_date}`, `End: ${it.end_date}`])
  // //   ]);
  // //   container.appendChild(meta);
  
  // //   const desc = createElement('p', { class: 'itinerary-desc' }, [`Description: ${it.description || 'N/A'}`]);
  // //   container.appendChild(desc);
  
  // //   if (!Array.isArray(it.days) || !it.days.length) {
  // //     container.appendChild(createElement('p', { class: 'no-schedule' }, ['No schedule available.']));
  // //     return container;
  // //   }
  
  // //   it.days.forEach((day, di) => {
  // //     const dayDiv = createElement('div', { class: 'itinerary-day timeline-day' }, []);
  // //     const dayHeader = createElement('h3', { class: 'day-header' }, [`Day ${di + 1}: ${day.date}`]);
  // //     dayDiv.appendChild(dayHeader);
  
  // //     const visitsContainer = createElement('div', { class: 'visits-container' }, []);
  
  // //     day.visits.forEach((visit, vi) => {
  // //       const visitCard = createElement('div', { class: 'visit-card timeline-node' }, []);
  
  // //       if (visit.transport) {
  // //         const transportBadge = createElement('span', { class: `transport ${visit.transport.toLowerCase()}` }, [visit.transport]);
  // //         visitCard.appendChild(transportBadge);
  // //       }
  
  // //       const time = createElement('span', { class: 'visit-time' }, [`${visit.start_time} – ${visit.end_time}`]);
  // //       const location = createElement('span', { class: 'visit-location' }, [visit.location]);
  // //       const infoRow = createElement('div', { class: 'visit-info' }, [time, location]);
  
  // //       visitCard.appendChild(infoRow);
  // //       visitsContainer.appendChild(visitCard);
  // //     });
  
  // //     dayDiv.appendChild(visitsContainer);
  // //     container.appendChild(dayDiv);
  // //   });
  
  // //   return container;
  // // }
  
  // // // function renderItineraryDetailsContent(it) {
  // // //   const container = createElement('div', { class: 'itinerary-con' }, []);
  
  // // //   // Meta info
  // // //   const meta = createElement('div', { class: 'itinerary-meta' }, [
  // // //     createElement('span', { class: 'status' }, [`Status: ${it.status}`]),
  // // //     createElement('span', { class: 'dates' }, [`Start: ${it.start_date}`, `End: ${it.end_date}`])
  // // //   ]);
  // // //   container.appendChild(meta);
  
  // // //   const desc = createElement('p', { class: 'itinerary-desc' }, [`Description: ${it.description || 'N/A'}`]);
  // // //   container.appendChild(desc);
  
  // // //   if (!Array.isArray(it.days) || !it.days.length) {
  // // //     container.appendChild(createElement('p', { class: 'no-schedule' }, ['No schedule available.']));
  // // //     return container;
  // // //   }
  
  // // //   it.days.forEach((day, di) => {
  // // //     const dayDiv = createElement('div', { class: 'itinerary-day' }, []);
  // // //     const dayHeader = createElement('h3', { class: 'day-header' }, [`Day ${di + 1}: ${day.date}`]);
  // // //     dayDiv.appendChild(dayHeader);
  
  // // //     const visitsContainer = createElement('div', { class: 'visits-container' }, []);
  // // //     day.visits.forEach((visit, vi) => {
  // // //       const visitCard = createElement('div', { class: 'visit-card' }, []);
  
  // // //       if (visit.transport) {
  // // //         const transportBadge = createElement('span', { class: `transport ${visit.transport.toLowerCase()}` }, [visit.transport]);
  // // //         visitCard.appendChild(transportBadge);
  // // //       }
  
  // // //       const time = createElement('span', { class: 'visit-time' }, [`${visit.start_time} – ${visit.end_time}`]);
  // // //       const location = createElement('span', { class: 'visit-location' }, [visit.location]);
  
  // // //       const infoRow = createElement('div', { class: 'visit-info' }, [time, location]);
  // // //       visitCard.appendChild(infoRow);
  
  // // //       visitsContainer.appendChild(visitCard);
  // // //     });
  
  // // //     dayDiv.appendChild(visitsContainer);
  // // //     container.appendChild(dayDiv);
  // // //   });
  
  // // //   return container;
  // // // }
  

  // // // // function renderItineraryDetailsContent(it) {
  // // // //   const container = createElement('div', { class: 'itinerary-con' }, []);

  // // // //   const meta = createElement('p', {}, [
  // // // //     document.createTextNode(`Status: ${it.status} | Start: ${it.start_date} | End: ${it.end_date}`)
  // // // //   ]);
  // // // //   container.appendChild(meta);

  // // // //   const desc = createElement('p', {}, [`Description: ${it.description || 'N/A'}`]);
  // // // //   container.appendChild(desc);

  // // // //   if (!Array.isArray(it.days) || !it.days.length) {
  // // // //     container.appendChild(createElement('p', {}, ['No schedule available.']));
  // // // //     return container;
  // // // //   }

  // // // //   it.days.forEach((day, di) => {
  // // // //     const dayDiv = createElement('div', { class: 'itinerary-day' }, []);
  // // // //     const dayHeader = createElement('h3', {}, [`Day ${di + 1}: ${day.date}`]);
  // // // //     dayDiv.appendChild(dayHeader);

  // // // //     day.visits.forEach((visit, vi) => {
  // // // //       const visitDiv = createElement('div', { class: 'itinerary-visit' }, []);
  // // // //       if (vi > 0 && visit.transport) {
  // // // //         visitDiv.appendChild(createElement('p', {}, [`Transport: ${visit.transport}`]));
  // // // //       }
  // // // //       visitDiv.appendChild(createElement('p', {}, [`Time: ${visit.start_time} – ${visit.end_time}`]));
  // // // //       visitDiv.appendChild(createElement('p', {}, [`Location: ${visit.location}`]));
  // // // //       dayDiv.appendChild(visitDiv);
  // // // //     });

  // // // //     container.appendChild(dayDiv);
  // // // //   });

  // // // //   return container;
  // // // // }

  function viewItinerary(id) {
    openViewModal(id);
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
