import "../../../css/ui/BookingForm.css";
import Notify from "./Notify.mjs";

function getTempSlots() {
    let res = [
        { "id": "lunch-1", "label": "12:00 – 13:00" },
        { "id": "lunch-2", "label": "13:00 – 14:00" },
      ];      
    return res;
}

function createInput({ type, placeholder, name, required = false, min }) {
  const input = document.createElement("input");
  input.type = type;
  input.placeholder = placeholder;
  input.name = name;
  if (required) input.required = true;
  if (min !== undefined) input.min = min;
  return input;
}

function createSelect({ name, required = false }) {
  const select = document.createElement("select");
  select.name = name;
  if (required) select.required = true;
  return select;
}

function createMessageBox(className = "form-message") {
  const box = document.createElement("div");
  box.className = className;
  return box;
}

const BookingForm = (onSubmit) => {
  const form = document.createElement("form");
  form.className = "booking-form";

  // Title
  const title = document.createElement("h3");
  title.textContent = "Book a Table";

  // Name
  const nameInput = createInput({
    type: "text",
    placeholder: "Your Name",
    name: "name",
    required: true,
  });

  // Date
  const dateInput = createInput({
    type: "date",
    name: "date",
    required: true,
  });
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;

  // Time slot
  const slotSelect = createSelect({ name: "slot", required: true });
  slotSelect.disabled = true;
  const placeholderOpt = document.createElement("option");
  placeholderOpt.value = "";
  placeholderOpt.textContent = "Select a time slot";
  placeholderOpt.disabled = true;
  placeholderOpt.selected = true;
  slotSelect.append(placeholderOpt);

  // Seats
  const seatsInput = createInput({
    type: "number",
    placeholder: "Number of Seats",
    name: "seats",
    min: 1,
    required: true,
  });

  const messageBox = createMessageBox("booking-message");

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Book Now";

  form.append(
    title,
    nameInput,
    dateInput,
    slotSelect,
    seatsInput,
    submitButton,
    messageBox
  );

  // ————— Load slots with async/await —————
  dateInput.addEventListener("change", async () => {
    const selectedDate = dateInput.value;
    messageBox.textContent = "";
    slotSelect.disabled = true;

    // remove old options (keep placeholder)
    slotSelect.querySelectorAll("option:not([value=''])").forEach(o => o.remove());

    if (!selectedDate) return;

    try {
    //   const res = await fetch(`/api/slots?date=${selectedDate}`);
    //   if (!res.ok) throw new Error(`HTTP ${res.status}`);
    //   const slots = await res.json();

    let slots = getTempSlots();

      if (!Array.isArray(slots) || slots.length === 0) {
        messageBox.textContent = "No slots available for that date.";
        messageBox.style.color = "crimson";
        return;
      }

      for (const { id, label } of slots) {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = label;
        slotSelect.append(opt);
      }

      slotSelect.disabled = false;
    } catch (err) {
      console.error("Failed to load slots:", err);
      messageBox.textContent = "Could not load slots. Try again.";
      messageBox.style.color = "crimson";
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const date = dateInput.value;
    const slot = slotSelect.value;
    const seats = parseInt(seatsInput.value, 10);

    if (!name || name.length < 2) {
      messageBox.textContent = "Please enter a valid name.";
      messageBox.style.color = "crimson";
      return;
    }

    if (!date || new Date(date) < new Date(today)) {
      messageBox.textContent = "Please choose a valid future date.";
      messageBox.style.color = "crimson";
      return;
    }

    if (!slot) {
      messageBox.textContent = "Please select a time slot.";
      messageBox.style.color = "crimson";
      return;
    }

    if (!seats || seats < 1) {
      messageBox.textContent = "Please select at least 1 seat.";
      messageBox.style.color = "crimson";
      return;
    }

    try {
      onSubmit({ name, date, slot, seats });
      form.reset();
      slotSelect.disabled = true;
      slotSelect.selectedIndex = 0;
      messageBox.textContent = "Booking confirmed!";
      messageBox.style.color = "green";
      Notify("Booking confirmed",{type:"success",duration:3000, dismissible:true});
    } catch {
      messageBox.textContent = "Booking failed. Try again.";
      messageBox.style.color = "crimson";
    }
  });

  return form;
};

export default BookingForm;
