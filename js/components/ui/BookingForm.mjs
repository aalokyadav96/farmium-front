import "../../../css/ui/BookingForm.css";

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

const BookingForm = (onSubmit) => {
  const form = document.createElement("form");
  form.className = "booking-form";

  const title = document.createElement("h3");
  title.textContent = "Book a Table";

  const nameInput = createInput({ type: "text", placeholder: "Your Name", name: "name", required: true });
  const dateInput = createInput({ type: "date", name: "date", required: true });
  const seatsInput = createInput({ type: "number", placeholder: "Number of Seats", name: "seats", min: 1, required: true });

  // Prevent past date selection
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;

  const messageBox = createMessageBox("booking-message");

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Book Now";

  form.append(title, nameInput, dateInput, seatsInput, submitButton, messageBox);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const date = dateInput.value;
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

    if (!seats || seats < 1) {
      messageBox.textContent = "Please select at least 1 seat.";
      messageBox.style.color = "crimson";
      return;
    }

    try {
      onSubmit({ name, date, seats });
      form.reset();
      messageBox.textContent = "Booking confirmed!";
      messageBox.style.color = "green";
    } catch {
      messageBox.textContent = "Booking failed. Try again.";
      messageBox.style.color = "crimson";
    }
  });

  return form;
};

export default BookingForm;

// import "../../../css/ui/BookingForm.css";

// const BookingForm = (onSubmit) => {
//   const form = document.createElement("form");
//   form.className = "booking-form";

//   const htwo = document.createElement("h3");
//   htwo.innerText = "Book a Table";

//   const nameInput = document.createElement("input");
//   nameInput.type = "text";
//   nameInput.placeholder = "Your Name";
//   nameInput.required = true;
//   nameInput.name = "name";

//   const dateInput = document.createElement("input");
//   dateInput.type = "date";
//   dateInput.required = true;
//   dateInput.name = "date";

//   // Prevent past dates
//   const today = new Date().toISOString().split("T")[0];
//   dateInput.min = today;

//   const seatsInput = document.createElement("input");
//   seatsInput.type = "number";
//   seatsInput.placeholder = "Number of Seats";
//   seatsInput.min = 1;
//   seatsInput.required = true;
//   seatsInput.name = "seats";

//   const message = document.createElement("div");
//   message.className = "booking-message"; // style this in CSS

//   const submitButton = document.createElement("button");
//   submitButton.type = "submit";
//   submitButton.textContent = "Book Now";

//   form.append(htwo, nameInput, dateInput, seatsInput, submitButton, message);

//   form.addEventListener("submit", (event) => {
//     event.preventDefault();

//     const name = nameInput.value.trim();
//     const date = dateInput.value;
//     const seats = parseInt(seatsInput.value, 10);

//     // Validation
//     if (!name || name.length < 2) {
//       message.innerText = "Please enter a valid name.";
//       message.style.color = "crimson";
//       return;
//     }

//     if (!date || new Date(date) < new Date(today)) {
//       message.innerText = "Please choose a valid future date.";
//       message.style.color = "crimson";
//       return;
//     }

//     if (!seats || seats < 1) {
//       message.innerText = "Please select at least 1 seat.";
//       message.style.color = "crimson";
//       return;
//     }

//     const bookingDetails = {
//       name,
//       date,
//       seats,
//     };

//     try {
//       onSubmit(bookingDetails);
//       form.reset();
//       message.innerText = "Booking confirmed!";
//       message.style.color = "green";
//     } catch (err) {
//       message.innerText = "Booking failed. Try again.";
//       message.style.color = "crimson";
//     }
//   });

//   return form;
// };

// export default BookingForm;
