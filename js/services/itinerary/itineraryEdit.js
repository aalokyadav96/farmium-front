import { apiFetch } from "../../api/api.js";

async function editItinerary(isLoggedIn, divContainerNode, id) {
  divContainerNode.textContent = '';

  if (!isLoggedIn) {
    const msg = document.createElement('p');
    msg.textContent = 'Please log in to view and manage your itineraries.';
    divContainerNode.appendChild(msg);
    return;
  }

  // Fetch existing itinerary
  const itinerary = await apiFetch(`/itineraries/all/${id}`);

  // Keep track of how many days we've created (for unique IDs)
  let dayCount = 0;

  // --- Helper to make inputs/textareas with labels ---
  function createInputField({ name, type, placeholder, required, id, label, value, className }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-group';

    if (label) {
      const lbl = document.createElement('label');
      lbl.setAttribute('for', id);
      lbl.textContent = label;
      wrapper.appendChild(lbl);
    }

    const inp = type === 'textarea'
      ? document.createElement('textarea')
      : document.createElement('input');

    if (type !== 'textarea') inp.type = type;
    inp.name = name;
    inp.id = id;
    if (placeholder) inp.placeholder = placeholder;
    if (required) inp.required = true;
    if (value !== undefined) inp.value = value;
    if (className) inp.classList.add(className);

    wrapper.appendChild(inp);
    return wrapper;
  }

  // --- Transport dropdown for visits 2+ ---
  function createTransportDropdown(selected) {
    const grp = document.createElement('div');
    grp.className = 'form-group transport-group';
    const lbl = document.createElement('label');
    lbl.textContent = 'Transport from previous stop';
    const sel = document.createElement('select');
    sel.className = 'transport-mode';
    ['Airplane', 'Car', 'Train', 'Walking', 'Other'].forEach(mode => {
      const opt = document.createElement('option');
      opt.value = mode.toLowerCase();
      opt.textContent = mode;
      if (selected === mode.toLowerCase()) opt.selected = true;
      sel.appendChild(opt);
    });
    grp.append(lbl, sel);
    return grp;
  }

  // --- Add one visit block into a given daySection ---
  function createVisitEntry(daySection, visitData = {}) {
    const visitsContainer = daySection.querySelector('.visits-container');
    const idx = visitsContainer.children.length;
    const vd = document.createElement('div');
    vd.className = 'visit-entry';
    vd.dataset.visitIndex = idx;

    // transport only if not first
    if (idx > 0) {
      vd.appendChild(createTransportDropdown(visitData.transport));
    }

    vd.appendChild(createInputField({
      name: 'start_time',
      type: 'time',
      label: 'Start Time',
      required: true,
      id: `day${daySection.dataset.dayIndex}-visit${idx}-start`,
      value: visitData.start_time,
      className: 'start-time'
    }));

    vd.appendChild(createInputField({
      name: 'end_time',
      type: 'time',
      label: 'End Time',
      required: true,
      id: `day${daySection.dataset.dayIndex}-visit${idx}-end`,
      value: visitData.end_time,
      className: 'end-time'
    }));

    vd.appendChild(createInputField({
      name: 'location',
      type: 'text',
      label: 'Location',
      placeholder: 'Place to visit',
      required: true,
      id: `day${daySection.dataset.dayIndex}-visit${idx}-loc`,
      value: visitData.location,
      className: 'visit-location'
    }));

    const rem = document.createElement('button');
    rem.type = 'button';
    rem.textContent = 'Remove visit';
    rem.addEventListener('click', () => visitsContainer.removeChild(vd));
    vd.appendChild(rem);

    visitsContainer.appendChild(vd);
  }

  // --- Add one day block, optionally populated from dayData ---
  function createDaySection(dayData = {}) {
    const dayIdx = dayCount++;
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day-section';
    dayDiv.dataset.dayIndex = dayIdx;

    const hdr = document.createElement('h3');
    hdr.textContent = `Day ${dayIdx + 1}`;
    dayDiv.appendChild(hdr);

    // date picker
    dayDiv.appendChild(createInputField({
      name: 'date',
      type: 'date',
      label: 'Date',
      required: true,
      id: `day${dayIdx}-date`,
      className: 'day-date',
      value: dayData.date
    }));

    // container for visits
    const visitsContainer = document.createElement('div');
    visitsContainer.className = 'visits-container';
    dayDiv.appendChild(visitsContainer);

    // add/remove buttons
    const addV = document.createElement('button');
    addV.type = 'button';
    addV.textContent = 'Add Visit';
    addV.addEventListener('click', () => createVisitEntry(dayDiv));
    dayDiv.appendChild(addV);

    const removeD = document.createElement('button');
    removeD.type = 'button';
    removeD.textContent = 'Remove Day';
    removeD.addEventListener('click', () => dayDiv.remove());
    dayDiv.appendChild(removeD);

    // populate existing visits or at least one blank
    if (Array.isArray(dayData.visits) && dayData.visits.length) {
      dayData.visits.forEach(v => createVisitEntry(dayDiv, v));
    } else {
      createVisitEntry(dayDiv);
    }

    return dayDiv;
  }

  // --- Build the form ---
  const heading = document.createElement('h2');
  heading.textContent = 'Edit Itinerary';

  const form = document.createElement('form');
  form.id = 'editItineraryForm';
  form.className = 'create-section';

  // Hidden ID
  const hiddenId = document.createElement('input');
  hiddenId.type = 'hidden';
  hiddenId.name = 'itineraryid';
  hiddenId.value = itinerary.itineraryid;
  form.appendChild(hiddenId);

  // Basic fields
  const basics = [
    { name: 'name',        type: 'text',     label: 'Name',        id: 'it-name',       value: itinerary.name,        required: true },
    { name: 'description', type: 'textarea', label: 'Description', id: 'it-description',value: itinerary.description, required: true },
    { name: 'start_date',  type: 'date',     label: 'Start Date',  id: 'it-start',      value: itinerary.start_date,  required: true },
    { name: 'end_date',    type: 'date',     label: 'End Date',    id: 'it-end',        value: itinerary.end_date,    required: true }
  ];
  basics.forEach(f => {
    form.appendChild(createInputField(f));
    form.appendChild(document.createElement('br'));
  });

  // DAYS container + Add Day btn
  const daysContainer = document.createElement('div');
  daysContainer.id = 'daysContainerEdit';
  form.appendChild(daysContainer);

  const addDayBtn = document.createElement('button');
  addDayBtn.type = 'button';
  addDayBtn.textContent = 'Add Day';
  addDayBtn.addEventListener('click', () => daysContainer.appendChild(createDaySection()));
  form.appendChild(addDayBtn);
  form.appendChild(document.createElement('br'));

  // Pre-populate days
  if (Array.isArray(itinerary.days) && itinerary.days.length) {
    itinerary.days.forEach(d => daysContainer.appendChild(createDaySection(d)));
  } else {
    daysContainer.appendChild(createDaySection());
  }

  // Status dropdown
  const statusGroup = document.createElement('div');
  statusGroup.className = 'form-group';
  const statusLabel = document.createElement('label');
  statusLabel.setAttribute('for', 'status');
  statusLabel.textContent = 'Status';
  const statusSelect = document.createElement('select');
  statusSelect.name = 'status';
  statusSelect.id = 'status';
  ['Draft', 'Confirmed'].forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.toLowerCase();
    opt.textContent = s;
    if (itinerary.status.toLowerCase() === s.toLowerCase()) opt.selected = true;
    statusSelect.appendChild(opt);
  });
  statusGroup.append(statusLabel, statusSelect);
  form.appendChild(statusGroup);
  form.appendChild(document.createElement('br'));

  // Submit
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Update';
  form.appendChild(submitBtn);

  const message = document.createElement('p');
  message.id = 'message';
  form.appendChild(message);

  // --- Handle submit ---
  form.addEventListener('submit', async e => {
    e.preventDefault();
    submitBtn.disabled = true;
    message.textContent = '';

    // gather days
    const days = [];
    daysContainer.querySelectorAll('.day-section').forEach(dayDiv => {
      const date = dayDiv.querySelector('.day-date').value;
      if (!date) return;
      const visits = [];
      dayDiv.querySelectorAll('.visit-entry').forEach((vd, i) => {
        const loc = vd.querySelector('.visit-location').value.trim();
        const st  = vd.querySelector('.start-time').value;
        const en  = vd.querySelector('.end-time').value;
        if (!loc || !st || !en) return;
        const trSel = vd.querySelector('.transport-mode');
        const transport = trSel ? trSel.value : null;
        visits.push({ location: loc, start_time: st, end_time: en, transport });
      });
      if (visits.length) days.push({ date, visits });
    });

    if (days.length === 0) {
      message.textContent = 'At least one day with visits is required.';
      submitBtn.disabled = false;
      return;
    }

    // build payload
    const payload = {
      itineraryid:   itinerary.itineraryid,
      name:          form.elements['name'].value,
      description:   form.elements['description'].value,
      start_date:    form.elements['start_date'].value,
      end_date:      form.elements['end_date'].value,
      status:        form.elements['status'].value,
      days
    };

    try {
      await apiFetch(`/itineraries/${itinerary.itineraryid}`, 'PUT', JSON.stringify(payload));
      message.textContent = 'Itinerary updated successfully!';
      setTimeout(() => window.location.href = '/', 1000);
    } catch (err) {
      console.error(err);
      message.textContent = 'Error updating itinerary.';
      submitBtn.disabled = false;
    }
  });

  divContainerNode.append(heading, form);
}

export { editItinerary };

// import { apiFetch } from "../../api/api.js";

// async function editItinerary(isLoggedIn, divContainerNode, id) {
//     // Clear previous content
//     divContainerNode.textContent = '';

//     if (!isLoggedIn) {
//         const message = document.createElement('p');
//         message.textContent = 'Please log in to view and manage your itineraries.';
//         divContainerNode.appendChild(message);
//         return;
//     }
    
//     const itinerary = await apiFetch(`/itineraries/all/${id}`);

//     const heading = document.createElement('h2');
//     heading.textContent = 'Edit Itinerary';

//     const form = document.createElement('form');
//     form.id = 'editItineraryForm';
//     form.className = "create-section";

//     const itineraryId = document.createElement('input');
//     itineraryId.type = 'hidden';
//     itineraryId.id = 'itineraryId';
//     form.appendChild(itineraryId);

//     const fields = [
//         { name: 'name', type: 'text', placeholder: 'Itinerary Name', required: true, label: "Itinerary Name", id: "it-name", value: itinerary.name, },
//         { name: 'description', type: 'textarea', placeholder: 'Description', required: true, label: "Description", id: "it-description", value: itinerary.description, },
//         { name: 'start_date', type: 'date', required: true , label: "Start Date", id: "it-start_date", value: itinerary.start_date,},
//         { name: 'end_date', type: 'date', required: true, label: "End Date", id: "it-end_date", value: itinerary.end_date, },
//         { name: 'locations', type: 'text', placeholder: 'Locations (comma-separated)', required: true, label: "Locations", id: "it-locations", value: itinerary.locations, }
//     ];

//     fields.forEach(field => {
//         const formGroup = document.createElement("div");
//         formGroup.className = "form-group";
//         let input;
//         if (field.type === 'textarea') {
//             input = document.createElement('textarea');
//         } else {
//             input = document.createElement('input');
//             input.type = field.type;
//         }
//         input.name = field.name;
//         input.id = field.id;
//         input.value = field.value;
//         if (field.placeholder) input.placeholder = field.placeholder;
//         if (field.required) input.required = true;
        
//     // Create label if applicable
//     if (field.label) {
//         const label = document.createElement("label");
//         label.setAttribute("for", field.id);
//         label.textContent = field.label;
//         formGroup.appendChild(label);
//     }

//         formGroup.appendChild(input);
//         form.appendChild(formGroup);
//         form.appendChild(document.createElement('br'));
//     });

//     // Status dropdown
//     const statusSelect = document.createElement('select');
//     statusSelect.name = 'status';
//     statusSelect.id = 'status';
//     ['Draft', 'Confirmed'].forEach(status => {
//         const option = document.createElement('option');
//         option.value = itinerary.status;
//         option.textContent = itinerary.status;
//         statusSelect.appendChild(option);
//     });
//     form.appendChild(statusSelect);
//     form.appendChild(document.createElement('br'));

//     // Submit button
//     const submitButton = document.createElement('button');
//     submitButton.type = 'submit';
//     submitButton.textContent = 'Update';
//     form.appendChild(submitButton);

//     const message = document.createElement('p');
//     message.id = 'message';

//     form.addEventListener('submit', async function (e) {
//         e.preventDefault();
//         const itineraryIdValue = itineraryId.value;
//         const formData = new FormData(this);

//         const updatedData = {
//             name: formData.get('name'),
//             description: formData.get('description'),
//             start_date: formData.get('start_date'),
//             end_date: formData.get('end_date'),
//             locations: formData.get('locations').split(',').map(loc => loc.trim()),
//             status: formData.get('status')
//         };

//         try {
//             const response = await apiFetch(`/itineraries/${itineraryIdValue}`, 'PUT', JSON.stringify(updatedData));
//             if (!response.ok) throw new Error('Failed to update itinerary');

//             message.textContent = 'Itinerary updated successfully!';
//             setTimeout(() => window.location.href = '/', 1000);
//         } catch (error) {
//             console.error(error);
//             message.textContent = 'Error updating itinerary.';
//         }
//     });

//     async function loadItinerary() {
//         const urlParams = new URLSearchParams(window.location.search);
//         const itineraryIdValue = urlParams.get('id');
//         if (!itineraryIdValue) {
//             message.textContent = 'No itinerary ID provided.';
//             return;
//         }

//         try {
//             const response = await apiFetch(`/itineraries/all/${itineraryIdValue}`, 'GET');
//             // if (!response.ok) throw new Error('Failed to fetch itinerary');

//             const itinerary = response;
//             itineraryId.value = itinerary.itineraryid;
//             document.getElementById('name').value = itinerary.name;
//             document.getElementById('description').value = itinerary.description;
//             document.getElementById('start_date').value = itinerary.start_date;
//             document.getElementById('end_date').value = itinerary.end_date;
//             document.getElementById('locations').value = itinerary.locations.join(', ');
//             document.getElementById('status').value = itinerary.status;
//         } catch (error) {
//             console.error(error);
//             message.textContent = 'Error loading itinerary details.';
//         }
//     }

//     divContainerNode.appendChild(heading);
//     divContainerNode.appendChild(form);
//     divContainerNode.appendChild(message);

//     loadItinerary();
// }

// export { editItinerary };
