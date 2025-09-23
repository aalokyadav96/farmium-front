import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { showPaymentModal } from "../pay/pay.js"; // adjust path

export function displayPayment(container, sessionData) {
  container.replaceChildren();

  container.appendChild(createElement("h2", {}, ["Payment Summary"]));
  const summary = createElement("div", { class: "payment-details" });

  // Calculate totals from session (trusted backend data)
  let subtotal = 0;
  Object.values(sessionData.items).flat().forEach(({ price, quantity }) => {
    subtotal += price * quantity;
  });

  const discount = +sessionData.discount || 0; // ✅ take discount directly from session
  const tax = +((subtotal - discount) * 0.05).toFixed(2);
  const delivery = 20;
  const total = +(subtotal - discount + tax + delivery).toFixed(2);

  // Shipping address
  summary.appendChild(createElement("h3", {}, ["Shipping Address"]));
  summary.appendChild(createElement("p", {}, [sessionData.address || "N/A"]));

  // Items
  summary.appendChild(createElement("h3", {}, ["Items"]));
  const ul = createElement("ul", {});
  Object.entries(sessionData.items).flatMap(([cat, items]) =>
    items.forEach(({ itemName, itemType, quantity, unit, entityName, price }) => {
      const lineTotal = price * quantity;
      ul.appendChild(createElement("li", {}, [
        `${itemName} (${itemType || "N/A"}) – ${quantity} ${unit || ""}${entityName ? ` from ${entityName}` : ""} – `,
        createElement("span", { class: "price" }, [`₹${lineTotal.toFixed(2)}`])
      ]));
    })
  );
  summary.appendChild(ul);

  // Totals section
  summary.appendChild(createElement("div", {}, [`Subtotal: ₹${subtotal.toFixed(2)}`]));
  if (discount > 0) {
    summary.appendChild(
      createElement("div", {}, [
        `Discount: −₹${discount.toFixed(2)} ${sessionData.couponCode ? `(${sessionData.couponCode})` : ""}`
      ])
    );
  }
  summary.appendChild(createElement("div", {}, [`Tax (5%): ₹${tax.toFixed(2)}`]));
  summary.appendChild(createElement("div", {}, [`Delivery: ₹${delivery.toFixed(2)}`]));
  summary.appendChild(createElement("p", { class: "total" }, [`Total Amount: ₹${total.toFixed(2)}`]));

  container.appendChild(summary);

  // Payment method selection (with fallback)
  const paymentMethod = createElement("div", { class: "payment-method" }, [
    createElement("label", {}, [
      "Select Payment Method: ",
      createElement("select", { id: "method" }, [
        createElement("option", { value: "cod" }, ["Cash on Delivery"]),
        createElement("option", { value: "upi" }, ["UPI"]),
        createElement("option", { value: "card" }, ["Credit/Debit Card"]),
        createElement("option", { value: "wallet" }, ["Wallet / Custom Payment"]),
      ])
    ])
  ]);
  container.appendChild(paymentMethod);

  // Confirm button
  const confirmBtn = createElement("button", { class: "primary-button" }, ["Confirm Order"]);
  confirmBtn.onclick = async () => {
    confirmBtn.disabled = true;
    confirmBtn.replaceChildren("Processing...");

    try {
      const method = document.getElementById("method").value;
      let paymentMethodUsed = method;

      if (method === "wallet") {
        // Open wallet/custom modal
        const paymentResult = await showPaymentModal({
          entityType: "order",
          entityId: sessionData.orderId || "temp-order",
          entityName: "Your Order"
        });

        if (!paymentResult?.success) {
          confirmBtn.disabled = false;
          confirmBtn.replaceChildren("Confirm Order");
          return; // cancelled/failed
        }

        paymentMethodUsed = paymentResult.method;
      }

      // Place order
      confirmBtn.replaceChildren("Placing order...");
      const payload = {
        ...sessionData,
        paymentMethod: paymentMethodUsed,
        subtotal,
        discount,
        tax,
        delivery,
        total
      };

      const result = await apiFetch("/order", "POST", JSON.stringify(payload));
      if (!result?.orderId) throw new Error("Invalid response from server");

      container.replaceChildren(
        createElement("div", { class: "success-message" }, [
          "🎉 Order placed successfully!",
          createElement("br"),
          createElement("strong", {}, ["Order ID:"]),
          ` ${result.orderId}`
        ])
      );

      const downloadBtn = createElement("button", { class: "secondary-button" }, ["Download Receipt"]);
      downloadBtn.onclick = () => {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `order_${result.orderId}.json`;
        link.click();
      };
      container.appendChild(downloadBtn);

    } catch (err) {
      console.error(err);
      container.replaceChildren(createElement("div", { class: "error" }, ["❌ Failed to place order."]));
    }
  };
  container.appendChild(confirmBtn);
}
