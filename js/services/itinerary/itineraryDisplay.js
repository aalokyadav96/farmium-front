import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import Modal from "../../components/ui/Modal.mjs";
import { navigate } from "../../routes/index.js";
import { getState } from "../../state/state.js";
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
    const ul = createElement('ul', { class: 'itinerary-list' }, []);
    itineraries.forEach(it => ul.appendChild(createItineraryListItem(it)));
    listDiv.appendChild(ul);
  }

  function createItineraryListItem(it) {
    isCreator = getState("user") === it.user_id;

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
    const { modal, dialog, close } = Modal({
      title: "Loading Itinerary Details…",
      content: "Loading...",
      size: "large",
      closeOnOverlayClick: true,
      onClose: () => {},
    });
  
    try {
      const it = await apiFetch(`/itineraries/all/${id}`);
      const contentNode = renderItineraryDetailsContent(it);
  
      // Replace modal body content
      const body = dialog.querySelector(".modal-body");
      body.innerHTML = "";
      body.appendChild(contentNode);
  
      // Update modal title
      const titleEl = dialog.querySelector(".modal-header h3");
      titleEl.textContent = it.name;
    } catch {
      const body = dialog.querySelector(".modal-body");
      body.innerHTML = "";
      body.appendChild(document.createTextNode("Error loading itinerary details."));
    }
  }
   
  function renderItineraryDetailsContent(it) {
    const container = createElement('div', { class: 'itinerary-container' }, []);
  
    // Meta info
    const meta = createElement('div', { class: 'itinerary-meta' }, [
      createElement('span', { class: 'status' }, [`Status: ${it.status}`]),
      createElement('span', { class: 'dates' }, [`Start: ${it.start_date}`, ` End: ${it.end_date}`])
    ]);
    container.appendChild(meta);
  
    const desc = createElement('p', { class: 'itinerary-desc' }, [`Description: ${it.description || 'N/A'}`]);
    container.appendChild(desc);
  
    if (!Array.isArray(it.days) || !it.days.length) {
      container.appendChild(createElement('p', { class: 'no-schedule' }, ['No schedule available.']));
      return container;
    }
  
    it.days.forEach((day, di) => {
      const dayBlock = createElement('div', { class: 'day-block' }, []);
  
      // Day header
      const dayHeader = createElement('h2', { class: 'day-header' }, [`Day ${di + 1} — ${day.date}`]);
      dayBlock.appendChild(dayHeader);
  
      if (!day.visits || !day.visits.length) {
        dayBlock.appendChild(createElement('p', { class: 'no-visits' }, ['No visits scheduled.']));
      } else {
        day.visits.forEach((visit, vi) => {
          const visitCard = createElement('div', { class: 'visit-card' }, []);
  
          // Thumbnail (if link provided)
          if (visit.link) {
            const thumb = createElement('a', { href: visit.link }, [
              createElement('div', {
                class: 'visit-thumb',
                style: `background-image:url(${visit.thumbnail || ''})`
              }, [])
            ]);
            visitCard.appendChild(thumb);
          }
  
          // Visit details
          const details = createElement('div', { class: 'visit-details' }, [
            createElement('h3', { class: 'visit-location' }, [visit.location || 'No location']),
            createElement('p', { class: 'visit-time' }, [`${visit.start_time || ''} – ${visit.end_time || ''}`]),
            visit.channel_logo
              ? createElement('img', { class: 'channel-logo', src: visit.channel_logo }, [])
              : null
          ].filter(Boolean));
  
          visitCard.appendChild(details);
          dayBlock.appendChild(visitCard);
  
          // Transport indicator between visits
          if (vi < day.visits.length - 1 && visit.transport) {
            dayBlock.appendChild(
              createElement('div', { class: 'transport-separator' }, [
                createElement('span', { class: `transport-badge ${visit.transport.toLowerCase()}` }, [visit.transport])
              ])
            );
          }
        });
      }
  
      container.appendChild(dayBlock);
    });
  
    return container;
  }
  
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
