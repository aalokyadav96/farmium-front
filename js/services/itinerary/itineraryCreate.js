import { apiFetch } from "../../api/api.js";

let dayCount = 0;

function createInputField({ name, type, placeholder, required, id, label, className }) {
  const formGroup = document.createElement("div");
  formGroup.className = "form-group";

  if (label) {
    const labelElem = document.createElement("label");
    labelElem.setAttribute("for", id);
    labelElem.textContent = label;
    formGroup.appendChild(labelElem);
  }

  const input =
    type === "textarea" ? document.createElement("textarea") : document.createElement("input");
  if (type !== "textarea") input.type = type;
  input.name = name;
  input.id = id;
  input.placeholder = placeholder || "";
  input.required = !!required;
  if (className) input.classList.add(className);

  formGroup.appendChild(input);
  return formGroup;
}

function createTransportDropdown() {
  const group = document.createElement("div");
  group.className = "form-group transport-group";

  const label = document.createElement("label");
  label.textContent = "Transport from previous stop";

  const select = document.createElement("select");
  select.classList.add("transport-mode");
  ["Airplane", "Car", "Train", "Walking", "Other"].forEach((mode) => {
    const opt = document.createElement("option");
    opt.value = mode.toLowerCase();
    opt.textContent = mode;
    select.appendChild(opt);
  });

  group.appendChild(label);
  group.appendChild(select);
  return group;
}

function createVisitEntry(daySection) {
  // determine index of this new visit
  const visitsContainer = daySection.querySelector(".visits-container");
  const visitIdx = visitsContainer.children.length;

  const visitDiv = document.createElement("div");
  visitDiv.className = "visit-entry";
  visitDiv.dataset.visitIndex = visitIdx;

  // if not first visit, add transport selector
  if (visitIdx > 0) {
    visitDiv.appendChild(createTransportDropdown());
  }

  visitDiv.appendChild(
    createInputField({
      name: `startTime`,
      type: "time",
      label: "Start Time",
      required: true,
      className: "start-time",
      id: `day${daySection.dataset.dayIndex}-visit${visitIdx}-start`,
    })
  );
  visitDiv.appendChild(
    createInputField({
      name: `endTime`,
      type: "time",
      label: "End Time",
      required: true,
      className: "end-time",
      id: `day${daySection.dataset.dayIndex}-visit${visitIdx}-end`,
    })
  );
  visitDiv.appendChild(
    createInputField({
      name: `location`,
      type: "text",
      label: "Location",
      placeholder: "Place to visit",
      required: true,
      className: "visit-location",
      id: `day${daySection.dataset.dayIndex}-visit${visitIdx}-loc`,
    })
  );

  // remove-visit button
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "Remove visit";
  removeBtn.addEventListener("click", () => {
    visitsContainer.removeChild(visitDiv);
    // re-index remaining visits if desired...
  });
  visitDiv.appendChild(removeBtn);

  visitsContainer.appendChild(visitDiv);
}

function createDaySection() {
  const dayIdx = dayCount++;
  const dayDiv = document.createElement("div");
  dayDiv.className = "day-section";
  dayDiv.dataset.dayIndex = dayIdx;

  const header = document.createElement("h3");
  header.textContent = `Day ${dayIdx + 1}`;
  dayDiv.appendChild(header);

  // date for this day
  dayDiv.appendChild(
    createInputField({
      name: "dayDate",
      type: "date",
      label: "Date",
      required: true,
      id: `day${dayIdx}-date`,
      className: "day-date",
    })
  );

  // container for all visits
  const visitsContainer = document.createElement("div");
  visitsContainer.className = "visits-container";
  dayDiv.appendChild(visitsContainer);

  // "Add Visit" button
  const addVisitBtn = document.createElement("button");
  addVisitBtn.type = "button";
  addVisitBtn.textContent = "Add Visit";
  addVisitBtn.addEventListener("click", () => createVisitEntry(dayDiv));
  dayDiv.appendChild(addVisitBtn);

  // "Remove Day" button
  const removeDayBtn = document.createElement("button");
  removeDayBtn.type = "button";
  removeDayBtn.textContent = "Remove Day";
  removeDayBtn.addEventListener("click", () => {
    dayDiv.remove();
    // you might want to re-number remaining days here
  });
  dayDiv.appendChild(removeDayBtn);

  // automatically add the first visit slot
  createVisitEntry(dayDiv);

  return dayDiv;
}

function createStatusDropdown() {
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.setAttribute("for", "status");
  label.textContent = "Status";

  const select = document.createElement("select");
  select.name = "status";
  select.id = "status";

  ["Draft", "Confirmed"].forEach((status) => {
    const option = document.createElement("option");
    option.value = status.toLowerCase();
    option.textContent = status;
    select.appendChild(option);
  });

  group.appendChild(label);
  group.appendChild(select);
  return group;
}

function createItinerary(isLoggedIn, divContainerNode) {
  divContainerNode.textContent = "";

  if (!isLoggedIn) {
    const message = document.createElement("p");
    message.textContent = "Please log in to view and manage your itineraries.";
    divContainerNode.appendChild(message);
    return;
  }

  const heading = document.createElement("h2");
  heading.textContent = "Create Itinerary";

  const form = document.createElement("form");
  form.id = "createItineraryForm";
  // form.className = "create-section";

  // Basic info
  [
    {
      name: "name",
      type: "text",
      placeholder: "Itinerary Name",
      required: true,
      id: "name",
      label: "Itinerary Name",
    },
    {
      name: "description",
      type: "textarea",
      placeholder: "Description",
      required: true,
      id: "description",
      label: "Description",
    },
    {
      name: "start_date",
      type: "date",
      required: true,
      id: "start_date",
      label: "Global Start Date",
    },
    {
      name: "end_date",
      type: "date",
      required: true,
      id: "end_date",
      label: "Global End Date",
    },
  ].forEach((fld) => {
    form.appendChild(createInputField(fld));
    // form.appendChild(document.createElement("br"));
  });

  // Days container + add‐day button
  const daysContainer = document.createElement("div");
  daysContainer.id = "daysContainer";
  form.appendChild(daysContainer);

  const addDayBtn = document.createElement("button");
  addDayBtn.type = "button";
  addDayBtn.textContent = "Add Day";
  addDayBtn.addEventListener("click", () => {
    daysContainer.appendChild(createDaySection());
  });
  form.appendChild(addDayBtn);
  form.appendChild(document.createElement("br"));
  form.appendChild(createStatusDropdown());
  form.appendChild(document.createElement("br"));

  // Submit
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Create";
  form.appendChild(submitButton);

  const message = document.createElement("p");
  message.id = "message";

  // initialize with one day
  daysContainer.appendChild(createDaySection());

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = "Creating…";
    message.textContent = "";
    message.className = "";

    // basic dates
    const start = form.elements["start_date"].value;
    const end = form.elements["end_date"].value;
    if (new Date(end) < new Date(start)) {
      message.textContent = "End date cannot be earlier than start date.";
      message.className = "message error";
      submitButton.disabled = false;
      submitButton.textContent = "Create";
      return;
    }

    // build days array
    const days = [];
    document.querySelectorAll(".day-section").forEach((dayDiv) => {
      const dayDate = dayDiv.querySelector(".day-date").value;
      if (!dayDate) return; // skip empty

      const visits = [];
      dayDiv.querySelectorAll(".visit-entry").forEach((visitDiv, idx) => {
        const loc = visitDiv.querySelector(".visit-location").value.trim();
        const st = visitDiv.querySelector(".start-time").value;
        const en = visitDiv.querySelector(".end-time").value;
        if (!loc || !st || !en) return; // skip incomplete

        const transportElem = visitDiv.querySelector(".transport-mode");
        const transport = transportElem ? transportElem.value : null;

        visits.push({ location: loc, start_time: st, end_time: en, transport });
      });

      if (visits.length > 0) {
        days.push({ date: dayDate, visits });
      }
    });

    if (days.length === 0) {
      message.textContent = "Please add at least one day with visits.";
      message.className = "message error";
      submitButton.disabled = false;
      submitButton.textContent = "Create";
      return;
    }

    const itineraryData = {
      name: form.elements["name"].value,
      description: form.elements["description"].value,
      start_date: start,
      end_date: end,
      status: form.elements["status"].value,
      days,
    };

    try {
      const response = await apiFetch("/itineraries", "POST", JSON.stringify(itineraryData));
      if (!response.InsertedID) throw new Error("Failed to create itinerary");

      message.textContent = "Itinerary created successfully!";
      message.className = "message success";
      // navigate("/itinerary");
      setTimeout(() => {
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("navigate", { detail: "/itinerary" }));
        } else {
          window.location.href = "/itinerary";
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      message.textContent = "Error creating itinerary.";
      message.className = "message error";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Create";
    }
  });

  divContainerNode.appendChild(heading);
  divContainerNode.appendChild(form);
  divContainerNode.appendChild(message);
}

export { createItinerary };
