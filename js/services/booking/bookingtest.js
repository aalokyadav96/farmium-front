import { createElement } from "../../components/createElement";
import { apiFetch } from "../../api/api";
import { Button } from "../../components/base/Button.js";

export function displayBooking(isLoggedIn, container) {
  const entityType = "event-seat";
  const entityId = "concert-8899";
  const group = "vip";
  const userId = "user-001";

  let currentBooked = null;

  const slotsDiv = createElement("div", { id: "slots" });
  const statusDiv = createElement("div", { id: "status" });

  const refreshSlots = () => {
    apiFetch(`/availability/${entityType}/${entityId}/${group}`)
      .then(data => {
        slotsDiv.replaceChildren();
        currentBooked = null;

        data.available.forEach(slotId => {
          const btn = Button(
            `Seat ${slotId}`,
            `slot-${slotId}`,
            {
              click: () => {
                apiFetch("/book", "POST", {
                  entityType,
                  entityId,
                  group,
                  userId
                }).then(res => {
                  currentBooked = res.booked;
                  statusDiv.textContent = `✅ Booked seat ${res.booked}`;
                  refreshSlots();
                }).catch(err => {
                  statusDiv.textContent = `❌ Booking failed: ${err.message}`;
                });
              }
            },
            "slot-btn"
          );
          slotsDiv.appendChild(btn);
        });

        if (data.available.length === 0) {
          statusDiv.textContent = "⚠️ No available seats";
        }
      })
      .catch(() => {
        statusDiv.textContent = "⚠️ Error loading slots";
      });
  };

  const cancelBtn = Button("Cancel Booking", "cancel-btn", {
    click: () => {
      if (!currentBooked) {
        statusDiv.textContent = "⚠️ No booking to cancel";
        return;
      }
      apiFetch(`/book/${entityType}/${entityId}/${currentBooked}?userId=${userId}`, "DELETE")
        .then(res => {
          statusDiv.textContent = `❎ Cancelled seat ${res.cancelled}`;
          currentBooked = null;
          refreshSlots();
        })
        .catch(err => {
          statusDiv.textContent = `❌ Cancel failed: ${err.message}`;
        });
    }
  });

  const slotInput = createElement("input", {
    type: "text",
    id: "slot-input",
    placeholder: "e.g. A1-A5",
    style: "margin-right:10px"
  });

  const createSlotBtn = Button("Create Slots", "create-slot-btn", {
    click: () => {
      const range = slotInput.value.trim();
      if (!range) {
        statusDiv.textContent = "❌ Provide valid slot range";
        return;
      }
      apiFetch("/slots", "POST", {
        entityType,
        entityId,
        group,
        range: [range] // backend expects array of strings
      }).then(() => {
        statusDiv.textContent = `✅ Slots ${range} created`;
        refreshSlots();
      }).catch(err => {
        statusDiv.textContent = `❌ Slot creation failed: ${err.message}`;
      });
    }
  });

  const refreshBtn = Button("Refresh", "refresh-btn", { click: refreshSlots });

  const ui = createElement("div", {}, [
    createElement("h3", {}, [`Booking - ${group.toUpperCase()} seats`]),
    createElement("div", {}, [slotInput, createSlotBtn]),
    refreshBtn,
    cancelBtn,
    slotsDiv,
    statusDiv
  ]);

  container.appendChild(ui);
  refreshSlots();

  const socket = new WebSocket(`ws://localhost:4000/ws/booking/${entityType}/${entityId}`);
  socket.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.type === "update") {
      refreshSlots();
    }
  };
}
