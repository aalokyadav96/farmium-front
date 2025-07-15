import { createElement } from "../../components/createElement";
import { apiFetch } from "../../api/api";

export function displayPayment(container, sessionData) {
  container.replaceChildren();

  // Heading
  container.appendChild(createElement("h2", {}, ["Payment Summary"]));

  // Summary Details
  const summary = createElement("div", { class: "payment-details" });

  let subtotal = 0;
  const itemList = [];

  Object.values(sessionData.items).flat().forEach(({ price, quantity }) => {
    subtotal += price * quantity;
  });

  const tax = +((subtotal * 0.05).toFixed(2));
  const delivery = 20;
  const total = +(subtotal + tax + delivery).toFixed(2);

  // Address
  summary.appendChild(createElement("h3", {}, ["Shipping Address"]));
  summary.appendChild(createElement("p", {}, [sessionData.address || "N/A"]));

  // Item list
  summary.appendChild(createElement("h3", {}, ["Items"]));

  const ul = createElement("ul", {});
  Object.entries(sessionData.items).flatMap(([category, items]) =>
    items.forEach(({ item, quantity, unit, price }) => {
      const lineTotal = price * quantity;
      ul.appendChild(
        createElement("li", {}, [
          `${item || "Unnamed"} – ${quantity} ${unit || ""} – `,
          createElement("span", { class: "price" }, [`₹${lineTotal.toFixed(2)}`]),
        ])
      );
    })
  );
  summary.appendChild(ul);

  // Summary Lines
  summary.appendChild(
    createElement("div", { class: "summary-line" }, [`Subtotal: ₹${subtotal.toFixed(2)}`])
  );
  summary.appendChild(
    createElement("div", { class: "summary-line" }, [`Tax (5%): ₹${tax.toFixed(2)}`])
  );
  summary.appendChild(
    createElement("div", { class: "summary-line" }, [`Delivery: ₹${delivery.toFixed(2)}`])
  );
  summary.appendChild(
    createElement("p", { class: "total" }, [`Total Amount: ₹${total.toFixed(2)}`])
  );

  container.appendChild(summary);

  // Payment Method
  const paymentMethod = createElement("div", { class: "payment-method" }, [
    createElement("label", {}, [
      "Select Payment Method: ",
      createElement("select", { id: "method" }, [
        createElement("option", { value: "cod" }, ["Cash on Delivery"]),
        createElement("option", { value: "upi" }, ["UPI"]),
        createElement("option", { value: "card" }, ["Credit/Debit Card"]),
      ]),
    ]),
  ]);
  container.appendChild(paymentMethod);

  // Confirm Button
  const confirmBtn = createElement("button", { class: "primary-button" }, ["Confirm Order"]);

  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.replaceChildren("Placing order...");

    try {
      const method = document.getElementById("method").value;
      const payload = { ...sessionData, paymentMethod: method, total };

      const result = await apiFetch("/order", "POST", JSON.stringify(payload));

      if (!result || !result.orderId) throw new Error("Invalid response from server");

      container.replaceChildren(
        createElement("div", { class: "success-message" }, [
          "🎉 Order placed successfully!",
          createElement("br"),
          createElement("strong", {}, ["Order ID:"]),
          ` ${result.orderId}`,
          createElement("br"),
          createElement("strong", {}, ["Expected Delivery:"]),
          " within 2–3 working days",
        ])
      );

      const downloadBtn = createElement("button", { class: "secondary-button" }, ["Download Receipt"]);
      downloadBtn.onclick = () => {
        const blob = new Blob([JSON.stringify(result, null, 2)], {
          type: "application/json",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `order_${result.orderId}.json`;
        link.click();
      };

      container.appendChild(downloadBtn);
    } catch (err) {
      console.error("Order placement failed", err);
      container.replaceChildren(
        createElement("div", { class: "error" }, ["❌ Failed to place order. Please try again."])
      );
    }
  };

  container.appendChild(confirmBtn);
}

// import { apiFetch } from "../../api/api";

// export function displayPayment(container, sessionData) {
//   container.innerHTML = "";

//   // Heading
//   const heading = document.createElement("h2");
//   heading.textContent = "Payment Summary";
//   container.appendChild(heading);

//   // Summary Breakdown
//   const summary = document.createElement("div");
//   summary.className = "payment-details";

//   // Calculate totals again to ensure correctness (defensive)
//   let subtotal = 0;
//   Object.values(sessionData.items).flat().forEach(({ price, quantity }) => {
//     subtotal += price * quantity;
//   });
//   const tax = +((subtotal) * 0.05).toFixed(2);
//   const delivery = 20;
//   const total = +(subtotal + tax + delivery).toFixed(2);

//   summary.innerHTML = `
//     <h3>Shipping Address</h3>
//     <p>${sessionData.address}</p>
//     <h3>Items</h3>
//     <ul>
//       ${Object.entries(sessionData.items).flatMap(([category, items]) =>
//         items.map(({ item, quantity, unit, price }) => {
//           const lineTotal = price * quantity;
//           return `<li>${item || "Unnamed"} – ${quantity} ${unit || ""} – 
//             <span class="price">₹${lineTotal.toFixed(2)}</span></li>`;
//         })
//       ).join("")}
//     </ul>
//     <div class="summary-line">Subtotal: ₹${subtotal.toFixed(2)}</div>
//     <div class="summary-line">Tax (5%): ₹${tax.toFixed(2)}</div>
//     <div class="summary-line">Delivery: ₹${delivery.toFixed(2)}</div>
//     <p class="total">Total Amount: ₹${total.toFixed(2)}</p>
//   `;
//   container.appendChild(summary);

//   // Payment Method Select
//   const paymentForm = document.createElement("div");
//   paymentForm.className = "payment-method";
//   paymentForm.innerHTML = `
//     <label>
//       Select Payment Method:
//       <select id="method">
//         <option value="cod">Cash on Delivery</option>
//         <option value="upi">UPI</option>
//         <option value="card">Credit/Debit Card</option>
//       </select>
//     </label>
//   `;
//   container.appendChild(paymentForm);

//   // Confirm Button
//   const confirm = document.createElement("button");
//   confirm.textContent = "Confirm Order";
//   confirm.className = "primary-button";

//   confirm.onclick = async () => {
//     confirm.disabled = true;
//     confirm.textContent = "Placing order...";

//     try {
//       const method = document.getElementById("method").value;
//       const payload = { ...sessionData, paymentMethod: method, total };

//       const result = await apiFetch("/order", "POST", JSON.stringify(payload));

//       if (!result || !result.orderId) throw new Error("Invalid response from server");

//       container.innerHTML = `
//         <div class="success-message">
//           🎉 Order placed successfully!
//           <br>
//           <strong>Order ID:</strong> ${result.orderId}
//           <br>
//           <strong>Expected Delivery:</strong> within 2–3 working days
//         </div>
//       `;

//       const downloadBtn = document.createElement("button");
//       downloadBtn.textContent = "Download Receipt";
//       downloadBtn.className = "secondary-button";
//       downloadBtn.onclick = () => {
//         const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
//         const link = document.createElement("a");
//         link.href = URL.createObjectURL(blob);
//         link.download = `order_${result.orderId}.json`;
//         link.click();
//       };
//       container.appendChild(downloadBtn);
//     } catch (err) {
//       console.error("Order placement failed", err);
//       container.innerHTML = `<div class="error">❌ Failed to place order. Please try again.</div>`;
//     }
//   };

//   container.appendChild(confirm);
// }
