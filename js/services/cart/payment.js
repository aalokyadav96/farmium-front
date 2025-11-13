import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { showPaymentModal } from "../pay/pay.js"; // adjust path if needed

// ------------------ Utilities ------------------
const formatINR = (val) =>
  Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

function calculateTotals(items = {}, discount = 0, delivery = 20, taxRate = 0.05) {
  const flatItems = Object.values(items).flat();
  const subtotal = flatItems.reduce(
    (acc, { price = 0, quantity = 0 }) => acc + price * quantity,
    0
  );
  const taxable = Math.max(0, subtotal - (Number(discount) || 0));
  const tax = Number((taxable * taxRate).toFixed(2));
  const total = Number((taxable + tax + delivery).toFixed(2));
  return { subtotal, discount: Number(discount) || 0, tax, delivery, total };
}

// ------------------ Renderers ------------------
function renderItems(items = {}) {
  const ul = createElement("ul", {});
  Object.entries(items).forEach(([cat, list]) => {
    (list || []).forEach(
      ({
        itemName = "Item",
        itemType,
        quantity = 0,
        unit = "",
        entityName,
        price = 0,
      }) => {
        const lineTotal = price * quantity;
        ul.appendChild(
          createElement("li", {}, [
            `${itemName} (${itemType || "N/A"}) – ${quantity} ${unit || ""}${
              entityName ? ` from ${entityName}` : ""
            } – `,
            createElement("span", { class: "price" }, [formatINR(lineTotal)]),
          ])
        );
      }
    );
  });
  return ul;
}

function renderTotals({ subtotal, discount, tax, delivery, total }, couponCode) {
  const nodes = [
    createElement("div", {}, [`Subtotal: ${formatINR(subtotal)}`]),
    ...(discount > 0
      ? [
          createElement("div", {}, [
            `Discount: −${formatINR(discount)} ${
              couponCode ? `(${couponCode})` : ""
            }`,
          ]),
        ]
      : []),
    createElement("div", {}, [`Tax (5%): ${formatINR(tax)}`]),
    createElement("div", {}, [`Delivery: ${formatINR(delivery)}`]),
    createElement("p", { class: "total" }, [`Total Amount: ${formatINR(total)}`]),
  ];
  return createElement("div", {}, nodes);
}

function renderPaymentMethodSelect(defaultId = "method") {
  return createElement("div", { class: "payment-method" }, [
    createElement("label", {}, [
      "Select Payment Method: ",
      createElement("select", { id: defaultId }, [
        createElement("option", { value: "cod" }, ["Cash on Delivery"]),
        createElement("option", { value: "upi" }, ["UPI"]),
        createElement("option", { value: "card" }, ["Credit/Debit Card"]),
        createElement("option", { value: "wallet" }, ["Wallet / Custom Payment"]),
      ]),
    ]),
  ]);
}

// ------------------ Payment Handler ------------------
async function handlePaymentMethod(method, sessionData) {
  if (!method) return { success: false, message: "No payment method selected." };

  method = method.toLowerCase();
  const response = { success: false, method, details: null, message: "" };

  try {
    switch (method) {
      case "cod":
        response.success = true;
        break;

      case "upi":
        response.success = true;
        response.details = { type: "upi", note: "UPI payment placeholder" };
        break;

      case "card":
        response.success = true;
        response.details = { type: "card", note: "Card payment placeholder" };
        break;

      case "wallet":
        const paymentResult = await showPaymentModal({
          entityType: "order",
          entityId: sessionData.orderId || "temp-order",
          entityName: "Your Order",
          amount: sessionData.total || sessionData.amount || 0,
        });

        if (!paymentResult?.success) {
          return {
            success: false,
            method: "wallet",
            message: "Wallet payment cancelled or failed.",
          };
        }

        response.success = true;
        response.method = paymentResult.method || "wallet";
        response.details = paymentResult;
        break;

      default:
        return { success: false, message: `Unsupported payment method: ${method}` };
    }

    return response;
  } catch (err) {
    console.error(`Payment error for method ${method}:`, err);
    return {
      success: false,
      method,
      message: err.message || "Unexpected payment error.",
    };
  }
}

// ------------------ Result Renderers ------------------
function renderSuccess(container, result) {
  container.replaceChildren();

  const successBox = createElement("div", { class: "success-message" }, [
    "🎉 Order placed successfully!",
    createElement("br"),
  ]);

  // Farm Orders section
  if (Array.isArray(result.farmOrders) && result.farmOrders.length > 0) {
    successBox.appendChild(createElement("h3", {}, ["Farm Orders:"]));
    result.farmOrders.forEach((fo, idx) => {
      const farmName =
        fo?.items?.crops?.[0]?.entityName || fo.farmid || "Unknown Farm";
      const total =
        fo?.items?.crops?.reduce(
          (sum, i) => sum + (i.price || 0) * (i.quantity || 0),
          0
        ) || 0;

      successBox.appendChild(
        createElement("p", {}, [
          `#${idx + 1} `,
          createElement("strong", {}, [fo.orderid]),
          ` (${fo.status}) – ${farmName} – ${formatINR(total)}`,
        ])
      );
    });
  }

  // General order section
  if (result.order) {
    const o = result.order;
    const total = o.total || 0;
    successBox.appendChild(createElement("h3", {}, ["General Order:"]));
    successBox.appendChild(
      createElement("p", {}, [
        createElement("strong", {}, [o.orderId]),
        ` (${o.status}) – ${formatINR(total)}`,
      ])
    );
  }

  container.appendChild(successBox);

  // Download receipts
  const downloadBtn = createElement("button", { class: "secondary-button" }, [
    "Download All Receipts",
  ]);
  downloadBtn.onclick = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const link = createElement("a", {
      href: URL.createObjectURL(blob),
      download: `orders_${Date.now()}.json`,
    });
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 1000);
  };
  container.appendChild(downloadBtn);

  // Smooth scroll to view
  container.scrollIntoView({ behavior: "smooth" });
}

function renderError(container, message = "❌ Failed to place order.") {
  container.replaceChildren(createElement("div", { class: "error" }, [message]));
}

// ------------------ Confirm Button ------------------
function renderConfirmButton(container, sessionData, totals) {
  const btn = createElement("button", { class: "primary-button", type: "button" }, [
    "Confirm Order",
  ]);

  async function resetButton() {
    btn.disabled = false;
    btn.replaceChildren("Confirm Order");
  }

  btn.onclick = async () => {
    btn.disabled = true;
    btn.replaceChildren("Processing...");

    try {
      const method = document.getElementById("method")?.value;
      if (!method) {
        await resetButton();
        return;
      }

      const methodResult = await handlePaymentMethod(method, {
        ...sessionData,
        total: totals.total,
      });
      if (!methodResult.success) {
        console.warn(methodResult.message || "Payment failed or cancelled.");
        await resetButton();
        return;
      }

      btn.replaceChildren("Placing order...");

      const payload = {
        ...sessionData,
        paymentMethod: methodResult.method,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        delivery: totals.delivery,
        total: totals.total,
        paymentDetails: methodResult.details || null,
      };

      const result = await apiFetch("/order", "POST", JSON.stringify(payload));

      if (!result?.success)
        throw new Error(result?.message || "Invalid response from server.");

      renderSuccess(container, result);
    } catch (err) {
      console.error(err);
      renderError(container, err?.message || "❌ Failed to place order.");
    }
  };

  return btn;
}

// ------------------ Main Entry ------------------
export function displayPayment(container, sessionData = {}) {
  container.replaceChildren();
  container.appendChild(createElement("h2", {}, ["Payment Summary"]));

  const summary = createElement("div", { class: "payment-details" });
  const totals = calculateTotals(sessionData.items || {}, sessionData.discount || 0);

  summary.appendChild(createElement("h3", {}, ["Shipping Address"]));
  summary.appendChild(createElement("p", {}, [sessionData.address || "N/A"]));

  summary.appendChild(createElement("h3", {}, ["Items"]));
  summary.appendChild(renderItems(sessionData.items));

  summary.appendChild(renderTotals(totals, sessionData.couponCode));
  container.appendChild(summary);

  const paymentMethodNode = renderPaymentMethodSelect();
  container.appendChild(paymentMethodNode);

  const confirmBtn = renderConfirmButton(container, sessionData, totals);
  container.appendChild(confirmBtn);
}

// import { createElement } from "../../components/createElement.js";
// import { apiFetch } from "../../api/api.js";
// import { showPaymentModal } from "../pay/pay.js"; // adjust path if needed

// // ------------------ Utilities ------------------
// const formatINR = (val) =>
//   Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

// function calculateTotals(items = {}, discount = 0, delivery = 20, taxRate = 0.05) {
//   const flatItems = Object.values(items).flat();
//   const subtotal = flatItems.reduce((acc, { price = 0, quantity = 0 }) => acc + price * quantity, 0);
//   const taxable = Math.max(0, subtotal - (Number(discount) || 0));
//   const tax = Number((taxable * taxRate).toFixed(2));
//   const total = Number((taxable + tax + delivery).toFixed(2));
//   return { subtotal, discount: Number(discount) || 0, tax, delivery, total };
// }

// // ------------------ Renderers ------------------
// function renderItems(items = {}) {
//   const ul = createElement("ul", {});
//   Object.entries(items).forEach(([cat, list]) => {
//     (list || []).forEach(({ itemName = "Item", itemType, quantity = 0, unit = "", entityName, price = 0 }) => {
//       const lineTotal = price * quantity;
//       ul.appendChild(
//         createElement("li", {}, [
//           `${itemName} (${itemType || "N/A"}) – ${quantity} ${unit || ""}${entityName ? ` from ${entityName}` : ""} – `,
//           createElement("span", { class: "price" }, [formatINR(lineTotal)])
//         ])
//       );
//     });
//   });
//   return ul;
// }

// function renderTotals({ subtotal, discount, tax, delivery, total }, couponCode) {
//   const nodes = [
//     createElement("div", {}, [`Subtotal: ${formatINR(subtotal)}`]),
//     ...(discount > 0
//       ? [createElement("div", {}, [`Discount: −${formatINR(discount)} ${couponCode ? `(${couponCode})` : ""}`])]
//       : []),
//     createElement("div", {}, [`Tax (5%): ${formatINR(tax)}`]),
//     createElement("div", {}, [`Delivery: ${formatINR(delivery)}`]),
//     createElement("p", { class: "total" }, [`Total Amount: ${formatINR(total)}`])
//   ];
//   return createElement("div", {}, nodes);
// }

// function renderPaymentMethodSelect(defaultId = "method") {
//   return createElement("div", { class: "payment-method" }, [
//     createElement("label", {}, [
//       "Select Payment Method: ",
//       createElement("select", { id: defaultId }, [
//         createElement("option", { value: "cod" }, ["Cash on Delivery"]),
//         createElement("option", { value: "upi" }, ["UPI"]),
//         createElement("option", { value: "card" }, ["Credit/Debit Card"]),
//         createElement("option", { value: "wallet" }, ["Wallet / Custom Payment"])
//       ])
//     ])
//   ]);
// }

// // ------------------ Payment Handler ------------------
// // Returns a normalized object: { success: boolean, method?: string, details?: any, message?: string }
// async function handlePaymentMethod(method, sessionData) {
//   if (!method) return { success: false, message: "No payment method selected." };

//   method = method.toLowerCase();
//   const response = { success: false, method, details: null, message: "" };

//   try {
//     switch (method) {
//       case "cod":
//         response.success = true;
//         break;

//       case "upi":
//         // Placeholder for UPI integration (deeplink, QR, etc.)
//         response.success = true;
//         response.details = { type: "upi", note: "UPI payment placeholder" };
//         break;

//       case "card":
//         // Placeholder for card payment integration
//         response.success = true;
//         response.details = { type: "card", note: "Card payment placeholder" };
//         break;

//       case "wallet":
//         // Wallet / custom payment uses modal flow
//         const paymentResult = await showPaymentModal({
//           entityType: "order",
//           entityId: sessionData.orderId || "temp-order",
//           entityName: "Your Order",
//           amount: sessionData.total || sessionData.amount || 0
//         });

//         if (!paymentResult?.success) {
//           return { success: false, method: "wallet", message: "Wallet payment cancelled or failed." };
//         }

//         response.success = true;
//         response.method = paymentResult.method || "wallet";
//         response.details = paymentResult;
//         break;

//       default:
//         return { success: false, message: `Unsupported payment method: ${method}` };
//     }

//     return response;
//   } catch (err) {
//     console.error(`Payment error for method ${method}:`, err);
//     return { success: false, method, message: err.message || "Unexpected payment error." };
//   }
// }

// // ------------------ Result Renderers ------------------
// function renderSuccess(container, result) {
//   container.replaceChildren(
//     createElement("div", { class: "success-message" }, [
//       "🎉 Order placed successfully!",
//       createElement("br"),
//       createElement("strong", {}, ["Order ID:"]),
//       ` ${result.orderId}`
//     ])
//   );

//   const downloadBtn = createElement("button", { class: "secondary-button" }, ["Download Receipt"]);
//   downloadBtn.onclick = () => {
//     const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
//     const link = createElement("a", { href: URL.createObjectURL(blob), download: `order_${result.orderId}.json` }, []);
//     document.body.appendChild(link);
//     link.click();
//     setTimeout(() => {
//       URL.revokeObjectURL(link.href);
//       link.remove();
//     }, 1000);
//   };

//   container.appendChild(downloadBtn);
// }

// function renderError(container, message = "❌ Failed to place order.") {
//   container.replaceChildren(createElement("div", { class: "error" }, [message]));
// }

// // ------------------ Confirm Button ------------------
// function renderConfirmButton(container, sessionData, totals) {
//   const btn = createElement("button", { class: "primary-button", type: "button" }, ["Confirm Order"]);

//   async function resetButton() {
//     btn.disabled = false;
//     btn.replaceChildren("Confirm Order");
//   }

//   btn.onclick = async () => {
//     btn.disabled = true;
//     btn.replaceChildren("Processing...");

//     try {
//       const method = document.getElementById("method")?.value;
//       if (!method) {
//         await resetButton();
//         return;
//       }

//       const methodResult = await handlePaymentMethod(method, { ...sessionData, total: totals.total });
//       if (!methodResult.success) {
//         console.warn(methodResult.message || "Payment failed or cancelled.");
//         await resetButton();
//         return;
//       }

//       btn.replaceChildren("Placing order...");

//       const payload = {
//         ...sessionData,
//         paymentMethod: methodResult.method,
//         subtotal: totals.subtotal,
//         discount: totals.discount,
//         tax: totals.tax,
//         delivery: totals.delivery,
//         total: totals.total,
//         paymentDetails: methodResult.details || null
//       };

//       const result = await apiFetch("/order", "POST", JSON.stringify(payload));
//       if (!result?.orderId) throw new Error("Invalid response from server.");

//       renderSuccess(container, result);
//     } catch (err) {
//       console.error(err);
//       renderError(container, err?.message || "❌ Failed to place order.");
//     }
//   };

//   return btn;
// }

// // ------------------ Main Entry ------------------
// export function displayPayment(container, sessionData = {}) {
//   container.replaceChildren();
//   container.appendChild(createElement("h2", {}, ["Payment Summary"]));

//   const summary = createElement("div", { class: "payment-details" });
//   const totals = calculateTotals(sessionData.items || {}, sessionData.discount || 0);

//   summary.appendChild(createElement("h3", {}, ["Shipping Address"]));
//   summary.appendChild(createElement("p", {}, [sessionData.address || "N/A"]));

//   summary.appendChild(createElement("h3", {}, ["Items"]));
//   summary.appendChild(renderItems(sessionData.items));

//   summary.appendChild(renderTotals(totals, sessionData.couponCode));
//   container.appendChild(summary);

//   const paymentMethodNode = renderPaymentMethodSelect();
//   container.appendChild(paymentMethodNode);

//   const confirmBtn = renderConfirmButton(container, sessionData, totals);
//   container.appendChild(confirmBtn);
// }

// // import { createElement } from "../../components/createElement.js";
// // import { apiFetch } from "../../api/api.js";
// // import { showPaymentModal } from "../pay/pay.js"; // adjust path if needed

// // // Utilities
// // const formatINR = (val) =>
// //   Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

// // function calculateTotals(items = {}, discount = 0, delivery = 20, taxRate = 0.05) {
// //   const flatItems = Object.values(items).flat();
// //   const subtotal = flatItems.reduce((acc, { price = 0, quantity = 0 }) => acc + price * quantity, 0);
// //   const taxable = Math.max(0, subtotal - (Number(discount) || 0));
// //   const tax = Number((taxable * taxRate).toFixed(2));
// //   const total = Number((taxable + tax + delivery).toFixed(2));
// //   return { subtotal, discount: Number(discount) || 0, tax, delivery, total };
// // }

// // // Renderers
// // function renderItems(items = {}) {
// //   const ul = createElement("ul", {});
// //   Object.entries(items).forEach(([cat, list]) => {
// //     (list || []).forEach(({ itemName = "Item", itemType, quantity = 0, unit = "", entityName, price = 0 }) => {
// //       const lineTotal = price * quantity;
// //       ul.appendChild(
// //         createElement("li", {}, [
// //           `${itemName} (${itemType || "N/A"}) – ${quantity} ${unit || ""}${entityName ? ` from ${entityName}` : ""} – `,
// //           createElement("span", { class: "price" }, [formatINR(lineTotal)])
// //         ])
// //       );
// //     });
// //   });
// //   return ul;
// // }

// // function renderTotals({ subtotal, discount, tax, delivery, total }, couponCode) {
// //   const nodes = [
// //     createElement("div", {}, [`Subtotal: ${formatINR(subtotal)}`]),
// //     ...(discount > 0
// //       ? [createElement("div", {}, [`Discount: −${formatINR(discount)} ${couponCode ? `(${couponCode})` : ""}`])]
// //       : []),
// //     createElement("div", {}, [`Tax (5%): ${formatINR(tax)}`]),
// //     createElement("div", {}, [`Delivery: ${formatINR(delivery)}`]),
// //     createElement("p", { class: "total" }, [`Total Amount: ${formatINR(total)}`])
// //   ];
// //   return createElement("div", {}, nodes);
// // }

// // function renderPaymentMethodSelect(defaultId = "method") {
// //   return createElement("div", { class: "payment-method" }, [
// //     createElement("label", {}, [
// //       "Select Payment Method: ",
// //       createElement("select", { id: defaultId }, [
// //         createElement("option", { value: "cod" }, ["Cash on Delivery"]),
// //         createElement("option", { value: "upi" }, ["UPI"]),
// //         createElement("option", { value: "card" }, ["Credit/Debit Card"]),
// //         createElement("option", { value: "wallet" }, ["Wallet / Custom Payment"])
// //       ])
// //     ])
// //   ]);
// // }

// // // // Payment method handler — extend here for new payment flows
// // // // Returns { success: boolean, method?: string, details?: any }
// // // async function handlePaymentMethod(method, sessionData) {
// // //   if (!method) return { success: false };

// // //   // Simple pass-through for basic methods (COD, UPI, Card)
// // //   if (method === "cod" || method === "upi" || method === "card") {
// // //     // future: add UPI deeplink, card tokenization, 3DS flow, etc.
// // //     return { success: true, method };
// // //   }

// // //   if (method === "wallet") {
// // //     // Wallet / custom payment uses modal flow
// // //     try {
// // //       const paymentResult = await showPaymentModal({
// // //         entityType: "order",
// // //         entityId: sessionData.orderId || "temp-order",
// // //         entityName: "Your Order",
// // //         amount: sessionData.amount // optional - modal can use
// // //       });

// // //       // Expecting modal to return { success: boolean, method: "wallet-..." , details: {...} }
// // //       if (!paymentResult?.success) return { success: false };
// // //       return { success: true, method: paymentResult.method || "wallet", details: paymentResult };
// // //     } catch (err) {
// // //       console.error("Wallet payment error:", err);
// // //       return { success: false };
// // //     }
// // //   }

// // //   // Unknown method
// // //   return { success: false };
// // // }

// // // Handles all payment method logic.
// // // Returns a normalized object: { success: boolean, method?: string, details?: any, message?: string }
// // async function handlePaymentMethod(method, sessionData) {
// //   if (!method) return { success: false, message: "No payment method selected." };

// //   // Normalize method name (e.g. "UPI" → "upi")
// //   method = method.toLowerCase();

// //   // Base response template
// //   const response = { success: false, method, details: null };

// //   try {
// //     switch (method) {
// //       case "cod":
// //         // Cash on Delivery – no further validation needed
// //         response.success = true;
// //         break;

// //       case "upi":
// //         // UPI – extend here for UPI deeplink / QR / intent-based flows
// //         // Example: await openUpiPayment(sessionData.total, sessionData.orderId)
// //         response.success = true;
// //         response.details = { type: "upi", note: "Basic UPI payment placeholder" };
// //         break;

// //       case "card":
// //         // Card – extend here for card tokenization, 3DS authentication, etc.
// //         // Example: const cardRes = await handleCardPayment(sessionData)
// //         response.success = true;
// //         response.details = { type: "card", note: "Basic card payment placeholder" };
// //         break;

// //       case "wallet":
// //         // Wallet / custom payment uses modal flow
// //         const paymentResult = await showPaymentModal({
// //           entityType: "order",
// //           entityId: sessionData.orderId || "temp-order",
// //           entityName: "Your Order",
// //           amount: sessionData.total || sessionData.amount || 0
// //         });

// //         if (!paymentResult?.success) {
// //           return { success: false, method: "wallet", message: "Wallet payment cancelled or failed." };
// //         }

// //         response.success = true;
// //         response.method = paymentResult.method || "wallet";
// //         response.details = paymentResult;
// //         break;

// //       default:
// //         return { success: false, message: `Unsupported payment method: ${method}` };
// //     }

// //     return response;
// //   } catch (err) {
// //     console.error(`Payment error for method ${method}:`, err);
// //     return { success: false, method, message: err.message || "Unexpected payment error" };
// //   }
// // }


// // // Success / Failure renderers
// // function renderSuccess(container, result) {
// //   container.replaceChildren(
// //     createElement("div", { class: "success-message" }, [
// //       "🎉 Order placed successfully!",
// //       createElement("br"),
// //       createElement("strong", {}, ["Order ID:"]),
// //       ` ${result.orderId}`
// //     ])
// //   );

// //   const downloadBtn = createElement("button", { class: "secondary-button" }, ["Download Receipt"]);
// //   downloadBtn.onclick = () => {
// //     const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
// //     const link = createElement("a", { href: URL.createObjectURL(blob), download: `order_${result.orderId}.json` }, []);
// //     // Link must be in DOM for some browsers to click; append, click, remove
// //     document.body.appendChild(link);
// //     link.click();
// //     // revoke after short delay
// //     setTimeout(() => {
// //       URL.revokeObjectURL(link.href);
// //       link.remove();
// //     }, 1000);
// //   };

// //   container.appendChild(downloadBtn);
// // }

// // function renderError(container, message = "❌ Failed to place order.") {
// //   container.replaceChildren(createElement("div", { class: "error" }, [message]));
// // }

// // // Confirm button factory
// // function renderConfirmButton(container, sessionData, totals) {
// //   const btn = createElement("button", { class: "primary-button", type: "button" }, ["Confirm Order"]);

// //   async function resetButton() {
// //     btn.disabled = false;
// //     btn.replaceChildren("Confirm Order");
// //   }

// //   btn.onclick = async () => {
// //     btn.disabled = true;
// //     btn.replaceChildren("Processing...");

// //     try {
// //       const method = document.getElementById("method")?.value;
// //       if (!method) {
// //         await resetButton();
// //         return;
// //       }

// //       const methodResult = await handlePaymentMethod(method, sessionData);
// //       if (!methodResult.success) {
// //         // cancelled/failed in payment flow (e.g., wallet modal closed)
// //         await resetButton();
// //         return;
// //       }

// //       btn.replaceChildren("Placing order...");

// //       const payload = {
// //         ...sessionData,
// //         paymentMethod: methodResult.method,
// //         subtotal: totals.subtotal,
// //         discount: totals.discount,
// //         tax: totals.tax,
// //         delivery: totals.delivery,
// //         total: totals.total,
// //         paymentDetails: methodResult.details || null
// //       };

// //       const result = await apiFetch("/order", "POST", JSON.stringify(payload));
// //       if (!result?.orderId) throw new Error("Invalid response from server");

// //       renderSuccess(container, result);
// //     } catch (err) {
// //       console.error(err);
// //       renderError(container, typeof err === "string" ? err : "❌ Failed to place order.");
// //     }
// //   };

// //   return btn;
// // }

// // // Public API
// // export function displayPayment(container, sessionData = {}) {
// //   container.replaceChildren();
// //   container.appendChild(createElement("h2", {}, ["Payment Summary"]));

// //   // Summary wrapper
// //   const summary = createElement("div", { class: "payment-details" });

// //   // Totals (trusted backend data; discount taken from session)
// //   const totals = calculateTotals(sessionData.items || {}, sessionData.discount || 0);

// //   // Shipping address
// //   summary.appendChild(createElement("h3", {}, ["Shipping Address"]));
// //   summary.appendChild(createElement("p", {}, [sessionData.address || "N/A"]));

// //   // Items
// //   summary.appendChild(createElement("h3", {}, ["Items"]));
// //   summary.appendChild(renderItems(sessionData.items));

// //   // Totals section
// //   summary.appendChild(renderTotals(totals, sessionData.couponCode));
// //   container.appendChild(summary);

// //   // Payment method select
// //   const paymentMethodNode = renderPaymentMethodSelect();
// //   container.appendChild(paymentMethodNode);

// //   // Confirm button
// //   const confirmBtn = renderConfirmButton(container, sessionData, totals);
// //   container.appendChild(confirmBtn);
// // }

// // // import { createElement } from "../../components/createElement.js";
// // // import { apiFetch } from "../../api/api.js";
// // // import { showPaymentModal } from "../pay/pay.js"; // adjust path

// // // export function displayPayment(container, sessionData) {
// // //   container.replaceChildren();

// // //   container.appendChild(createElement("h2", {}, ["Payment Summary"]));
// // //   const summary = createElement("div", { class: "payment-details" });

// // //   // Calculate totals from session (trusted backend data)
// // //   let subtotal = 0;
// // //   Object.values(sessionData.items).flat().forEach(({ price, quantity }) => {
// // //     subtotal += price * quantity;
// // //   });

// // //   const discount = +sessionData.discount || 0; // ✅ take discount directly from session
// // //   const tax = +((subtotal - discount) * 0.05).toFixed(2);
// // //   const delivery = 20;
// // //   const total = +(subtotal - discount + tax + delivery).toFixed(2);

// // //   // Shipping address
// // //   summary.appendChild(createElement("h3", {}, ["Shipping Address"]));
// // //   summary.appendChild(createElement("p", {}, [sessionData.address || "N/A"]));

// // //   // Items
// // //   summary.appendChild(createElement("h3", {}, ["Items"]));
// // //   const ul = createElement("ul", {});
// // //   Object.entries(sessionData.items).flatMap(([cat, items]) =>
// // //     items.forEach(({ itemName, itemType, quantity, unit, entityName, price }) => {
// // //       const lineTotal = price * quantity;
// // //       ul.appendChild(createElement("li", {}, [
// // //         `${itemName} (${itemType || "N/A"}) – ${quantity} ${unit || ""}${entityName ? ` from ${entityName}` : ""} – `,
// // //         createElement("span", { class: "price" }, [`₹${lineTotal.toFixed(2)}`])
// // //       ]));
// // //     })
// // //   );
// // //   summary.appendChild(ul);

// // //   // Totals section
// // //   summary.appendChild(createElement("div", {}, [`Subtotal: ₹${subtotal.toFixed(2)}`]));
// // //   if (discount > 0) {
// // //     summary.appendChild(
// // //       createElement("div", {}, [
// // //         `Discount: −₹${discount.toFixed(2)} ${sessionData.couponCode ? `(${sessionData.couponCode})` : ""}`
// // //       ])
// // //     );
// // //   }
// // //   summary.appendChild(createElement("div", {}, [`Tax (5%): ₹${tax.toFixed(2)}`]));
// // //   summary.appendChild(createElement("div", {}, [`Delivery: ₹${delivery.toFixed(2)}`]));
// // //   summary.appendChild(createElement("p", { class: "total" }, [`Total Amount: ₹${total.toFixed(2)}`]));

// // //   container.appendChild(summary);

// // //   // Payment method selection (with fallback)
// // //   const paymentMethod = createElement("div", { class: "payment-method" }, [
// // //     createElement("label", {}, [
// // //       "Select Payment Method: ",
// // //       createElement("select", { id: "method" }, [
// // //         createElement("option", { value: "cod" }, ["Cash on Delivery"]),
// // //         createElement("option", { value: "upi" }, ["UPI"]),
// // //         createElement("option", { value: "card" }, ["Credit/Debit Card"]),
// // //         createElement("option", { value: "wallet" }, ["Wallet / Custom Payment"]),
// // //       ])
// // //     ])
// // //   ]);
// // //   container.appendChild(paymentMethod);

// // //   // Confirm button
// // //   const confirmBtn = createElement("button", { class: "primary-button" }, ["Confirm Order"]);
// // //   confirmBtn.onclick = async () => {
// // //     confirmBtn.disabled = true;
// // //     confirmBtn.replaceChildren("Processing...");

// // //     try {
// // //       const method = document.getElementById("method").value;
// // //       let paymentMethodUsed = method;

// // //       if (method === "wallet") {
// // //         // Open wallet/custom modal
// // //         const paymentResult = await showPaymentModal({
// // //           entityType: "order",
// // //           entityId: sessionData.orderId || "temp-order",
// // //           entityName: "Your Order"
// // //         });

// // //         if (!paymentResult?.success) {
// // //           confirmBtn.disabled = false;
// // //           confirmBtn.replaceChildren("Confirm Order");
// // //           return; // cancelled/failed
// // //         }

// // //         paymentMethodUsed = paymentResult.method;
// // //       }

// // //       // Place order
// // //       confirmBtn.replaceChildren("Placing order...");
// // //       const payload = {
// // //         ...sessionData,
// // //         paymentMethod: paymentMethodUsed,
// // //         subtotal,
// // //         discount,
// // //         tax,
// // //         delivery,
// // //         total
// // //       };

// // //       const result = await apiFetch("/order", "POST", JSON.stringify(payload));
// // //       if (!result?.orderId) throw new Error("Invalid response from server");

// // //       container.replaceChildren(
// // //         createElement("div", { class: "success-message" }, [
// // //           "🎉 Order placed successfully!",
// // //           createElement("br"),
// // //           createElement("strong", {}, ["Order ID:"]),
// // //           ` ${result.orderId}`
// // //         ])
// // //       );

// // //       const downloadBtn = createElement("button", { class: "secondary-button" }, ["Download Receipt"]);
// // //       downloadBtn.onclick = () => {
// // //         const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
// // //         const link = document.createElement("a");
// // //         link.href = URL.createObjectURL(blob);
// // //         link.download = `order_${result.orderId}.json`;
// // //         link.click();
// // //       };
// // //       container.appendChild(downloadBtn);

// // //     } catch (err) {
// // //       console.error(err);
// // //       container.replaceChildren(createElement("div", { class: "error" }, ["❌ Failed to place order."]));
// // //     }
// // //   };
// // //   container.appendChild(confirmBtn);
// // // }
