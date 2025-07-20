import "../../../css/ui/BookingManagerUI.css";

function createInput({ type, placeholder, name, required = false, min }) {
  const input = document.createElement("input");
  input.type = type;
  input.placeholder = placeholder;
  input.name = name;
  if (required) input.required = true;
  if (min !== undefined) input.min = min;
  return input;
}

function createMessageBox(className = "form-message") {
  const box = document.createElement("div");
  box.className = className;
  return box;
}

const BookingManagerUI = (onSlotActions, fetchBookingsByDate) => {
  const container = document.createElement("div");
  container.className = "booking-manager";

  const title = document.createElement("h3");
  title.textContent = "Manage Booking Slots";

  const dateInput = createInput({ type: "date", name: "slot-date", required: true });
  const timeInput = createInput({ type: "time", name: "slot-time", required: true });
  const capacityInput = createInput({ type: "number", placeholder: "Capacity", name: "slot-capacity", min: 1, required: true });

  const addButton = document.createElement("button");
  addButton.textContent = "Add Slot";

  const messageBox = createMessageBox("manager-message");

  const slotList = document.createElement("ul");
  slotList.className = "slot-list";

  const bookingCalendar = document.createElement("div");
  bookingCalendar.className = "booking-calendar";

  const updateSlotList = (slots) => {
    slotList.innerHTML = "";
    if (!slots.length) {
      slotList.appendChild(document.createElement("li")).textContent = "No slots for selected date.";
      return;
    }

    slots.forEach(slot => {
      const li = document.createElement("li");
      li.textContent = `⏰ ${slot.time} - Seats: ${slot.capacity}`;

      const editBtn = document.createElement("button");
      editBtn.textContent = "✏️";
      editBtn.onclick = () => {
        timeInput.value = slot.time;
        capacityInput.value = slot.capacity;
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️";
      deleteBtn.onclick = () => {
        onSlotActions.delete(dateInput.value, slot.time);
        loadSlots();
      };

      li.append(editBtn, deleteBtn);
      slotList.appendChild(li);
    });
  };

  const loadSlots = () => {
    const selectedDate = dateInput.value;
    updateSlotList(onSlotActions.get(selectedDate) || []);

    const bookings = fetchBookingsByDate(selectedDate) || [];
    bookingCalendar.innerHTML = `<h4>📅 Bookings for ${selectedDate}</h4>`;
    if (!bookings.length) {
      bookingCalendar.innerHTML += "<p>No bookings yet.</p>";
    } else {
      const ul = document.createElement("ul");
      bookings.forEach(b => {
        const li = document.createElement("li");
        li.textContent = `🪑 ${b.time} — ${b.name} (${b.seats} seats)`;
        ul.appendChild(li);
      });
      bookingCalendar.appendChild(ul);
    }
  };

  dateInput.addEventListener("change", loadSlots);

  addButton.addEventListener("click", () => {
    const date = dateInput.value;
    const time = timeInput.value;
    const capacity = parseInt(capacityInput.value, 10);

    if (!date || !time || capacity < 1) {
      messageBox.textContent = "Invalid input.";
      messageBox.style.color = "crimson";
      return;
    }

    const success = onSlotActions.add(date, time, capacity);
    if (success) {
      messageBox.textContent = "Slot added.";
      messageBox.style.color = "green";
      timeInput.value = "";
      capacityInput.value = "";
      loadSlots();
    } else {
      messageBox.textContent = "Slot exists or error.";
      messageBox.style.color = "crimson";
    }
  });

  container.append(
    title,
    dateInput,
    timeInput,
    capacityInput,
    addButton,
    messageBox,
    slotList,
    bookingCalendar
  );

  return container;
};

export default BookingManagerUI;

// import "../../../css/ui/BookingManagerUI.css";

// const BookingManagerUI = (onSlotActions, fetchBookingsByDate) => {
//   const container = document.createElement("div");
//   container.className = "booking-manager";

//   const title = document.createElement("h3");
//   title.innerText = "Manage Booking Slots";

//   const dateInput = document.createElement("input");
//   dateInput.type = "date";
//   dateInput.required = true;

//   const timeInput = document.createElement("input");
//   timeInput.type = "time";
//   timeInput.required = true;

//   const capacityInput = document.createElement("input");
//   capacityInput.type = "number";
//   capacityInput.placeholder = "Capacity";
//   capacityInput.min = 1;
//   capacityInput.required = true;

//   const addButton = document.createElement("button");
//   addButton.textContent = "Add Slot";

//   const message = document.createElement("div");
//   message.className = "manager-message";

//   const slotList = document.createElement("ul");
//   slotList.className = "slot-list";

//   const bookingCalendar = document.createElement("div");
//   bookingCalendar.className = "booking-calendar";

//   const updateSlotList = (slots) => {
//     slotList.innerHTML = "";

//     if (!slots.length) {
//       const li = document.createElement("li");
//       li.innerText = "No slots for selected date.";
//       slotList.appendChild(li);
//       return;
//     }

//     slots.forEach((slot, index) => {
//       const li = document.createElement("li");
//       li.innerText = `⏰ ${slot.time} - Seats: ${slot.capacity}`;

//       const editBtn = document.createElement("button");
//       editBtn.innerText = "✏️";
//       editBtn.onclick = () => {
//         timeInput.value = slot.time;
//         capacityInput.value = slot.capacity;
//       };

//       const deleteBtn = document.createElement("button");
//       deleteBtn.innerText = "🗑️";
//       deleteBtn.onclick = () => {
//         onSlotActions.delete(dateInput.value, slot.time);
//         loadSlots(); // reload after deletion
//       };

//       li.append(editBtn, deleteBtn);
//       slotList.appendChild(li);
//     });
//   };

//   const loadSlots = () => {
//     const selectedDate = dateInput.value;
//     const slots = onSlotActions.get(selectedDate) || [];
//     updateSlotList(slots);

//     // Also load calendar bookings
//     const bookings = fetchBookingsByDate(selectedDate) || [];
//     bookingCalendar.innerHTML = `<h4>📅 Bookings for ${selectedDate}</h4>`;
//     if (!bookings.length) {
//       bookingCalendar.innerHTML += "<p>No bookings yet.</p>";
//     } else {
//       const ul = document.createElement("ul");
//       bookings.forEach(b => {
//         const li = document.createElement("li");
//         li.innerText = `🪑 ${b.time} — ${b.name} (${b.seats} seats)`;
//         ul.appendChild(li);
//       });
//       bookingCalendar.appendChild(ul);
//     }
//   };

//   dateInput.addEventListener("change", loadSlots);

//   addButton.addEventListener("click", () => {
//     const date = dateInput.value;
//     const time = timeInput.value;
//     const capacity = parseInt(capacityInput.value);

//     if (!date || !time || capacity < 1) {
//       message.innerText = "Invalid input.";
//       message.style.color = "crimson";
//       return;
//     }

//     const success = onSlotActions.add(date, time, capacity);
//     if (success) {
//       message.innerText = "Slot added.";
//       message.style.color = "green";
//       timeInput.value = "";
//       capacityInput.value = "";
//       loadSlots();
//     } else {
//       message.innerText = "Slot exists or error.";
//       message.style.color = "crimson";
//     }
//   });

//   container.append(
//     title,
//     dateInput,
//     timeInput,
//     capacityInput,
//     addButton,
//     message,
//     slotList,
//     bookingCalendar
//   );

//   return container;
// };

// export default BookingManagerUI;
