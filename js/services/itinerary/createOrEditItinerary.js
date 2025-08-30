import { apiFetch } from "../../api/api.js";
import Button from "../../components/base/Button.js";

let dayCount = 0;

// --- Input / textarea helper ---
function createInputField({ name, type, placeholder, required, id, label, value, className }) {
  const formGroup = document.createElement("div");
  formGroup.className = "form-group";

  if (label) {
    const lbl = document.createElement("label");
    lbl.setAttribute("for", id);
    lbl.textContent = label;
    formGroup.appendChild(lbl);
  }

  const input = type === "textarea" ? document.createElement("textarea") : document.createElement("input");
  if (type !== "textarea") input.type = type;
  input.name = name;
  input.id = id;
  input.placeholder = placeholder || "";
  input.required = !!required;
  if (value !== undefined) input.value = value;
  if (className) input.classList.add(className);

  formGroup.appendChild(input);
  return formGroup;
}

// --- Transport selector for visits after the first ---
function createTransportDropdown(selected) {
  const grp = document.createElement("div");
  grp.className = "form-group transport-group";

  const lbl = document.createElement("label");
  lbl.textContent = "Transport from previous stop";

  const sel = document.createElement("select");
  sel.className = "transport-mode";
  ["Airplane", "Car", "Train", "Walking", "Other"].forEach(mode => {
    const opt = document.createElement("option");
    opt.value = mode.toLowerCase();
    opt.textContent = mode;
    if (selected === mode.toLowerCase()) opt.selected = true;
    sel.appendChild(opt);
  });

  grp.append(lbl, sel);
  return grp;
}

// --- Single visit entry ---
function createVisitEntry(daySection, visitData = {}) {
  const visitsContainer = daySection.querySelector(".visits-container");
  const idx = visitsContainer.children.length;
  const vd = document.createElement("div");
  vd.className = "visit-entry";
  vd.dataset.visitIndex = idx;

  if (idx > 0) vd.appendChild(createTransportDropdown(visitData.transport));

  vd.appendChild(createInputField({
    name: "start_time",
    type: "time",
    label: "Start Time",
    required: true,
    id: `day${daySection.dataset.dayIndex}-visit${idx}-start`,
    value: visitData.start_time,
    className: "start-time"
  }));

  vd.appendChild(createInputField({
    name: "end_time",
    type: "time",
    label: "End Time",
    required: true,
    id: `day${daySection.dataset.dayIndex}-visit${idx}-end`,
    value: visitData.end_time,
    className: "end-time"
  }));

  vd.appendChild(createInputField({
    name: "location",
    type: "text",
    label: "Location",
    placeholder: "Place to visit",
    required: true,
    id: `day${daySection.dataset.dayIndex}-visit${idx}-loc`,
    value: visitData.location,
    className: "visit-location"
  }));

  // const removeBtn = document.createElement("button");
  // removeBtn.type = "button";
  // removeBtn.textContent = "Remove visit";
  // removeBtn.addEventListener("click", () => visitsContainer.removeChild(vd));
  
  const removeBtn = Button("Remove visit", "rmb-it-btn", {
    click: () => {
      visitsContainer.removeChild(vd);
    }
  },"buttonx secondary");
  vd.appendChild(removeBtn);

  visitsContainer.appendChild(vd);
}

// --- Single day section ---
function createDaySection(dayData = {}) {
  const dayIdx = dayCount++;
  const dayDiv = document.createElement("div");
  dayDiv.className = "day-section";
  dayDiv.dataset.dayIndex = dayIdx;

  const header = document.createElement("h3");
  header.textContent = `Day ${dayIdx + 1}`;
  dayDiv.appendChild(header);

  dayDiv.appendChild(createInputField({
    name: "dayDate",
    type: "date",
    label: "Date",
    required: true,
    id: `day${dayIdx}-date`,
    className: "day-date",
    value: dayData.date
  }));

  const visitsContainer = document.createElement("div");
  visitsContainer.className = "visits-container";
  dayDiv.appendChild(visitsContainer);

  // const addVisitBtn = document.createElement("button");
  // addVisitBtn.type = "button";
  // addVisitBtn.textContent = "Add Visit";
  // addVisitBtn.addEventListener("click", () => createVisitEntry(dayDiv));
  const addVisitBtn = Button("Add visit", "add-it-btn", {
    click: () => {
      createVisitEntry(dayDiv);
    }
  },"buttonx");
  dayDiv.appendChild(addVisitBtn);

  // const removeDayBtn = document.createElement("button");
  // removeDayBtn.type = "button";
  // removeDayBtn.textContent = "Remove Day";
  // removeDayBtn.addEventListener("click", () => dayDiv.remove());
  const removeDayBtn =  Button("Remove Day", "rem-it-day-btn", {
    click: () => {
      dayDiv.remove();
    }
  },"buttonx secondary");
  dayDiv.appendChild(removeDayBtn);

  if (Array.isArray(dayData.visits) && dayData.visits.length) {
    dayData.visits.forEach(v => createVisitEntry(dayDiv, v));
  } else {
    createVisitEntry(dayDiv);
  }

  return dayDiv;
}

// --- Status dropdown ---
function createStatusDropdown(selected) {
  const grp = document.createElement("div");
  grp.className = "form-group";
  const lbl = document.createElement("label");
  lbl.setAttribute("for", "status");
  lbl.textContent = "Status";

  const sel = document.createElement("select");
  sel.name = "status";
  sel.id = "status";
  ["Draft", "Confirmed"].forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.toLowerCase();
    opt.textContent = s;
    if (selected === s.toLowerCase()) opt.selected = true;
    sel.appendChild(opt);
  });

  grp.append(lbl, sel);
  return grp;
}

// --- Build payload ---
function buildItineraryPayload(form, daysContainer, itineraryId) {
  const days = [];
  daysContainer.querySelectorAll(".day-section").forEach(dayDiv => {
    const date = dayDiv.querySelector(".day-date").value;
    if (!date) return;

    const visits = [];
    dayDiv.querySelectorAll(".visit-entry").forEach(vd => {
      const loc = vd.querySelector(".visit-location").value.trim();
      const st = vd.querySelector(".start-time").value;
      const en = vd.querySelector(".end-time").value;
      if (!loc || !st || !en) return;

      const trSel = vd.querySelector(".transport-mode");
      const transport = trSel ? trSel.value : null;
      visits.push({ location: loc, start_time: st, end_time: en, transport });
    });

    if (visits.length) days.push({ date, visits });
  });

  return {
    ...(itineraryId ? { itineraryid: itineraryId } : {}),
    name: form.elements["name"].value,
    description: form.elements["description"].value,
    start_date: form.elements["start_date"].value,
    end_date: form.elements["end_date"].value,
    status: form.elements["status"].value,
    days
  };
}

// --- Main render function ---
export async function renderItineraryForm(container, isLoggedIn, mode = "create", itinerary = null) {
  container.textContent = "";
  if (!isLoggedIn) {
    const msg = document.createElement("p");
    msg.textContent = "Please log in to view and manage your itineraries.";
    container.appendChild(msg);
    return;
  }

  dayCount = 0;
  const heading = document.createElement("h2");
  heading.textContent = mode === "edit" ? "Edit Itinerary" : "Create Itinerary";

  const form = document.createElement("form");
  form.className = "create-section";

  if (mode === "edit") {
    const hiddenId = document.createElement("input");
    hiddenId.type = "hidden";
    hiddenId.name = "itineraryid";
    hiddenId.value = itinerary.itineraryid;
    form.appendChild(hiddenId);
  }

  // Basic info
  const basics = [
    { name: "name",  id: "it-name", type: "text", label: "Name", required: true, value: itinerary?.name },
    { name: "description",  id: "it-description", type: "textarea", label: "Description", required: true, value: itinerary?.description },
    { name: "start_date",  id: "it-start_date", type: "date", label: "Start Date", required: true, value: itinerary?.start_date },
    { name: "end_date",  id: "it-end_date", type: "date", label: "End Date", required: true, value: itinerary?.end_date }
  ];
  basics.forEach(f => {
    form.appendChild(createInputField(f));
  });

  // Days
  const daysContainer = document.createElement("div");
  daysContainer.id = "daysContainer";
  form.appendChild(daysContainer);

  const addDayBtn = document.createElement("button");
  addDayBtn.type = "button";
  addDayBtn.textContent = "Add Day";
  addDayBtn.addEventListener("click", () => daysContainer.appendChild(createDaySection()));
  form.appendChild(addDayBtn);

  if (Array.isArray(itinerary?.days) && itinerary.days.length) {
    itinerary.days.forEach(d => daysContainer.appendChild(createDaySection(d)));
  } else {
    daysContainer.appendChild(createDaySection());
  }

  form.appendChild(createStatusDropdown(itinerary?.status || "draft"));

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = mode === "edit" ? "Update" : "Create";
  form.appendChild(submitBtn);

  const message = document.createElement("p");
  message.id = "message";
  form.appendChild(message);

  form.addEventListener("submit", async e => {
    e.preventDefault();
    submitBtn.disabled = true;
    message.textContent = "";

    const start = form.elements["start_date"].value;
    const end = form.elements["end_date"].value;
    if (new Date(end) < new Date(start)) {
      message.textContent = "End date cannot be earlier than start date.";
      message.className = "message error";
      submitBtn.disabled = false;
      return;
    }

    const payload = buildItineraryPayload(form, daysContainer, itinerary?.itineraryid);
    if (payload.days.length === 0) {
      message.textContent = "At least one day with visits is required.";
      submitBtn.disabled = false;
      return;
    }

    try {
      const url = mode === "edit" ? `/itineraries/${itinerary.itineraryid}` : "/itineraries";
      const method = mode === "edit" ? "PUT" : "POST";
      const response = await apiFetch(url, method, JSON.stringify(payload));

      message.textContent = mode === "edit" ? "Itinerary updated successfully!" : "Itinerary created successfully!";
      message.className = "message success";

      setTimeout(() => {
        window.dispatchEvent
          ? window.dispatchEvent(new CustomEvent("navigate", { detail: "/itinerary" }))
          : window.location.href = "/itinerary";
      }, 1000);
    } catch (err) {
      console.error(err);
      message.textContent = mode === "edit" ? "Error updating itinerary." : "Error creating itinerary.";
      message.className = "message error";
    } finally {
      submitBtn.disabled = false;
    }
  });

  container.append(heading, form);
}

// --- Exported wrappers ---
export function createItinerary(container, isLoggedIn) {
  renderItineraryForm(container, isLoggedIn, "create");
}

export async function editItinerary(container, isLoggedIn, id) {
  const itinerary = await apiFetch(`/itineraries/all/${id}`);
  renderItineraryForm(container, isLoggedIn, "edit", itinerary);
}
