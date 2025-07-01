// import { apiFetch } from "../../api/api.js";
// import Button from "../../components/base/Button.js";
// import { createElement } from "../../components/createElement.js";

// // Entry function
// export function displayPayment(container, sessionData) {
//   container.replaceChildren();

//   container.appendChild(createElement("h2", {}, ["Payment Summary"]));
//   container.appendChild(renderSummary(sessionData));

//   const methodSelect = renderPaymentMethod();
//   container.appendChild(methodSelect.form);

//   const confirmBtn = renderConfirmButton(container, sessionData, methodSelect.select);
//   container.appendChild(confirmBtn);
// }

// // --- Helper: Summary Section ---
// function renderSummary(sessionData) {
//   return createElement("div", { className: "payment-details" }, [
//     createElement("h3", {}, ["Shipping Address"]),
//     createElement("p", {}, [sessionData.address]),

//     createElement("h3", {}, ["Items"]),
//     createElement("ul", {}, Object.entries(sessionData.items).flatMap(([_, items]) =>
//       items.map(({ item, quantity, unit, price }) =>
//         createElement("li", {}, [
//           `${item} – ${quantity} ${unit} – `,
//           createElement("span", { className: "price" }, [`₹${price}`])
//         ])
//       )
//     )),

//     createElement("p", { className: "total" }, [`Total Amount: ₹${sessionData.total}`])
//   ]);
// }

// // --- Helper: Payment Method Form ---
// function renderPaymentMethod() {
//   const select = createElement("select", { id: "method" }, [
//     createElement("option", { value: "cod" }, ["Cash on Delivery"]),
//     createElement("option", { value: "upi" }, ["UPI"]),
//     createElement("option", { value: "card" }, ["Credit/Debit Card"])
//   ]);

//   const form = createElement("div", { className: "payment-method" }, [
//     createElement("label", {}, ["Select Payment Method: ", select])
//   ]);

//   return { form, select };
// }

// // --- Helper: Confirm Button ---
// function renderConfirmButton(container, sessionData, methodSelect) {
//   return Button("Confirm Order", "cnfrmord", {
//     onclick: async function handleConfirm() {
//       this.disabled = true;
//       this.replaceChildren("Placing order...");

//       try {
//         const result = await placeOrder(sessionData, methodSelect.value);
//         showSuccess(container, result);
//       } catch (err) {
//         console.error("Order placement failed", err);
//         container.replaceChildren(
//           createElement("div", { className: "error" }, ["❌ Failed to place order. Please try again."])
//         );
//       }
//     }
//   }, "primary-button");
// }

// // --- Helper: API call ---
// async function placeOrder(data, method) {
//   const res = await apiFetch("/order", "POST", JSON.stringify({
//     ...data,
//     paymentMethod: method
//   }));

//   if (!res || !res.orderId) throw new Error("Failed to place order");
//   return res;
// }

// // --- Helper: Success UI ---
// function showSuccess(container, result) {
//   container.replaceChildren(
//     createElement("div", { className: "success-message" }, [
//       "🎉 Order placed successfully!",
//       createElement("br"),
//       createElement("strong", {}, ["Order ID:"]),
//       ` ${result.orderId || "(not available)"}`,
//       createElement("br"),
//       createElement("strong", {}, ["Expected Delivery:"]),
//       " within 2–3 working days"
//     ])
//   );

//   const downloadBtn = Button("Download Receipt", "dwnrct", {
//     onclick: () => {
//       const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
//       const link = document.createElement("a");
//       link.href = URL.createObjectURL(blob);
//       link.download = `order_${result.orderId || "receipt"}.json`;
//       link.click();
//     }
//   }, "secondary-button");

//   container.appendChild(downloadBtn);
// }

// // import { apiFetch } from "../../api/api.js";
// // import Button from "../../components/base/Button.js";
// // import { createElement } from "../../components/createElement.js";

// // export function displayPayment(container, sessionData) {
// //   container.replaceChildren();

// //   // Heading
// //   const heading = createElement("h2", {}, ["Payment Summary"]);
// //   container.appendChild(heading);

// //   // Summary Breakdown
// //   const summary = createElement("div", { className: "payment-details" }, [
// //     createElement("h3", {}, ["Shipping Address"]),
// //     createElement("p", {}, [sessionData.address]),
// //     createElement("h3", {}, ["Items"]),
// //     createElement("ul", {}, Object.entries(sessionData.items).flatMap(([category, items]) =>
// //       items.map(({ item, quantity, unit, price }) =>
// //         createElement("li", {}, [
// //           `${item} – ${quantity} ${unit} – `,
// //           createElement("span", { className: "price" }, [`₹${price}`])
// //         ])
// //       )
// //     )),
// //     createElement("p", { className: "total" }, [`Total Amount: ₹${sessionData.total}`])
// //   ]);
// //   container.appendChild(summary);

// //   // Payment Method Select
// //   const methodSelect = createElement("select", { id: "method" }, [
// //     createElement("option", { value: "cod" }, ["Cash on Delivery"]),
// //     createElement("option", { value: "upi" }, ["UPI"]),
// //     createElement("option", { value: "card" }, ["Credit/Debit Card"])
// //   ]);

// //   const paymentForm = createElement("div", { className: "payment-method" }, [
// //     createElement("label", {}, [
// //       "Select Payment Method: ",
// //       methodSelect
// //     ])
// //   ]);
// //   container.appendChild(paymentForm);

// //   // Confirm Button
// //   const confirm = Button("Confirm Order", 'cnfrmord', {
// //     onclick: async () => {
// //       confirm.disabled = true;
// //       confirm.replaceChildren("Placing order...");

// //       try {
// //         const res = await apiFetch("/order", "POST", JSON.stringify({
// //           ...sessionData,
// //           paymentMethod: methodSelect.value
// //         }));

// //         if (!res || !res.orderId) throw new Error("Failed to place order");
// //         const result = res;

// //         container.replaceChildren(
// //           createElement("div", { className: "success-message" }, [
// //             "🎉 Order placed successfully!",
// //             createElement("br"),
// //             createElement("strong", {}, ["Order ID:"]),
// //             ` ${result.orderId || "(not available)"}`,
// //             createElement("br"),
// //             createElement("strong", {}, ["Expected Delivery:"]),
// //             " within 2-3 working days"
// //           ])
// //         );

// //         const downloadBtn = createElement("Download Receipt", "dwnrct", {
// //           className: "secondary-button",
// //           click: () => {
// //             const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
// //             const link = document.createElement("a");
// //             link.href = URL.createObjectURL(blob);
// //             link.download = `order_${result.orderId || "receipt"}.json`;
// //             link.click();
// //           }
// //         });

// //         container.appendChild(downloadBtn);
// //       } catch (err) {
// //         console.error("Order placement failed", err);
// //         container.replaceChildren(
// //           createElement("div", { className: "error" }, ["❌ Failed to place order. Please try again."])
// //         );
// //       }
// //     }
// //   },"primary-button");

// //   container.appendChild(confirm);
// // }

import { apiFetch } from "../../api/api";
export function displayPayment(container, sessionData) {
  container.innerHTML = "";

  // Heading
  const heading = document.createElement("h2");
  heading.textContent = "Payment Summary";
  container.appendChild(heading);

  // Summary Breakdown
  const summary = document.createElement("div");
  summary.className = "payment-details";

  summary.innerHTML = `
    <h3>Shipping Address</h3>
    <p>${sessionData.address}</p>
    <h3>Items</h3>
    <ul>
      ${Object.entries(sessionData.items).flatMap(([category, items]) =>
    items.map(
      ({ item, quantity, unit, price }) =>
        `<li>${item} – ${quantity} ${unit} – <span class="price">₹${price}</span></li>`
    )
  ).join("")}
    </ul>
    <p class="total">Total Amount: ₹${sessionData.total}</p>
  `;
  container.appendChild(summary);

  // Payment Method Select
  const paymentForm = document.createElement("div");
  paymentForm.className = "payment-method";
  paymentForm.innerHTML = `
    <label>
      Select Payment Method:
      <select id="method">
        <option value="cod">Cash on Delivery</option>
        <option value="upi">UPI</option>
        <option value="card">Credit/Debit Card</option>
      </select>
    </label>
  `;
  container.appendChild(paymentForm);

  // Confirm Button
  const confirm = document.createElement("button");
  confirm.textContent = "Confirm Order";
  confirm.className = "primary-button";

  confirm.onclick = async () => {
    confirm.disabled = true;
    confirm.textContent = "Placing order...";

    try {
      const res = await apiFetch("/order", "POST", JSON.stringify({
        ...sessionData,
        paymentMethod: document.getElementById("method").value
      }));

      if (res.status == "") throw new Error("Failed to place order");
      // const result = await res.json();
      const result = await res;

      container.innerHTML = `
        <div class="success-message">
          🎉 Order placed successfully!
          <br>
          <strong>Order ID:</strong> ${result.orderId || "(not available)"}
          <br>
          <strong>Expected Delivery:</strong> within 2-3 working days
        </div>
      `;

      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "Download Receipt";
      downloadBtn.className = "secondary-button";
      downloadBtn.onclick = () => {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `order_${result.orderId || "receipt"}.json`;
        link.click();
      };
      container.appendChild(downloadBtn);
    } catch (err) {
      console.error("Order placement failed", err);
      container.innerHTML = `<div class="error">❌ Failed to place order. Please try again.</div>`;
    }
  };

  container.appendChild(confirm);
}

// // // // export function displayPayment(container, sessionData) {
// // // //   container.innerHTML = "";

// // // //   const heading = document.createElement("h2");
// // // //   heading.textContent = "Payment Summary";
// // // //   container.appendChild(heading);

// // // //   const summary = document.createElement("pre");
// // // //   summary.textContent = JSON.stringify(sessionData, null, 2);
// // // //   container.appendChild(summary);

// // // //   const confirm = document.createElement("button");
// // // //   confirm.textContent = "Confirm Order";
// // // //   confirm.onclick = async () => {
// // // //     try {
// // // //       const res = await fetch("/order", {
// // // //         method: "POST",
// // // //         headers: { "Content-Type": "application/json" },
// // // //         body: JSON.stringify(sessionData)
// // // //       });

// // // //       if (!res.ok) throw new Error("Failed to place order");
// // // //       const result = await res.json();

// // // //       container.innerHTML = `<p>Order placed successfully: ${result.message}</p>`;
// // // //     } catch (err) {
// // // //       console.error("Order placement failed", err);
// // // //       container.innerHTML = "<p>Failed to place order.</p>";
// // // //     }
// // // //   };

// // // //   container.appendChild(confirm);
// // // // }
