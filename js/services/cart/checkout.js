import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { displayPayment } from "./payment.js";

function renderAddressForm(container, onSubmit) {
  const form = createElement("form", { class: "address-form" });

  form.append(
    createElement("h2", {}, ["Delivery Details"]),
    createElement("label", {}, [
      createElement("span", {}, ["Enter Address:"]),
      createElement("textarea", {
        required: true,
        placeholder: "Flat No, Street, City, State, ZIP",
        rows: 3,
        class: "address-input"
      })
    ]),
    createElement("label", {}, [
      createElement("span", {}, ["Coupon Code (optional):"]),
      createElement("input", {
        type: "text",
        class: "coupon-input",
        placeholder: "Enter coupon code"
      })
    ]),
    createElement("button", { type: "submit", class: "primary-button" }, ["Proceed to Checkout"])
  );

  const addressInput = form.querySelector(".address-input");
  const couponInput = form.querySelector(".coupon-input");

  form.onsubmit = (e) => {
    e.preventDefault();
    onSubmit(addressInput.value.trim(), couponInput.value.trim());
  };

  container.replaceChildren(form);
}

function calculateTotals(items, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = +((subtotal - discount) * 0.05).toFixed(2);
  const delivery = 20;
  return { subtotal, discount, tax, delivery, total: +(subtotal - discount + tax + delivery).toFixed(2) };
}

function buildSessionPayload(items, address, userId, total, couponCode = "", discount = 0) {
  const grouped = {};
  items.forEach(item => {
    grouped[item.category] = grouped[item.category] || [];
    grouped[item.category].push(item);
  });
  return { userId, address, items: grouped, total, couponCode, discount };
}

async function validateCoupon(couponCode, subtotal) {
  if (!couponCode) return { valid: false, discount: 0, message: "No coupon provided" };

  try {
    const res = await apiFetch("/coupon/validate", "POST", JSON.stringify({
      code: couponCode,
      cart: subtotal
    }));

    return {
      valid: res.valid,
      discount: Number(res.discount) || 0,
      message: res.message || (res.valid ? "Coupon applied" : "Coupon invalid")
    };
  } catch (err) {
    console.error("Coupon validation failed", err);
    return { valid: false, discount: 0, message: "Validation failed" };
  }
}

// async function validateCoupon(couponCode, subtotal) {
//   if (!couponCode) return { valid: false, discount: 0 };
//   try {
//     const res = await apiFetch(`/coupon/validate?code=${encodeURIComponent(couponCode)}&subtotal=${subtotal}`, "GET");
//     if (res.valid) {
//       return { valid: true, discount: +res.discount || 0 };
//     }
//   } catch (err) {
//     console.error("Coupon validation failed", err);
//   }
//   return { valid: false, discount: 0 };
// }

export async function displayCheckout(container, passedItems = null) {
  container.replaceChildren(createElement("p", { class: "loading" }, ["Loading your cart..."]));

  try {
    const items = passedItems || await apiFetch("/cart", "GET");
    if (!items.length) {
      container.replaceChildren(createElement("p", { class: "empty" }, ["Nothing to checkout"]));
      return;
    }

    renderAddressForm(container, async (address, couponCode) => {
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const { valid, discount } = await validateCoupon(couponCode, subtotal);

      const totals = calculateTotals(items, discount);

      const summarySection = createElement("section", { class: "checkout-summary" });
      summarySection.append(
        createElement("h2", {}, ["Checkout Summary"]),
        createElement("ul", {}, items.map(i =>
          createElement("li", {}, [
            `${i.itemName} (${i.itemType || "N/A"}) – ${i.quantity} ${i.unit || ""} ${i.entityName ? `from ${i.entityName}` : ""} `,
            createElement("span", {}, [`₹${i.price * i.quantity}`])
          ])
        )),
        createElement("div", {}, [`Subtotal: ₹${totals.subtotal}`]),
        couponCode
          ? createElement("div", { class: valid ? "coupon-valid" : "coupon-invalid" }, [
              valid ? `Discount: −₹${totals.discount}` : `Invalid coupon: ${couponCode}`
            ])
          : null,
        createElement("div", {}, [`Tax (5%): ₹${totals.tax}`]),
        createElement("div", {}, [`Delivery: ₹${totals.delivery}`]),
        createElement("div", { class: "total" }, [`Total: ₹${totals.total}`]),
        createElement("button", { id: "proceedPayment", class: "primary-button" }, ["Proceed to Payment"])
      );

      container.replaceChildren(summarySection);

      const proceedBtn = summarySection.querySelector("#proceedPayment");
      proceedBtn.onclick = async () => {
        proceedBtn.disabled = true;
        proceedBtn.textContent = "Creating payment session...";
        try {
          const payload = buildSessionPayload(items, address, items[0].userId || "anonymous", totals.total, couponCode, discount);
          const session = await apiFetch("/checkout/session", "POST", JSON.stringify(payload));
          displayPayment(container, session);
        } catch (err) {
          proceedBtn.disabled = false;
          proceedBtn.textContent = "Proceed to Payment";
          container.appendChild(createElement("div", { class: "error" }, ["Failed to create payment session."]));
          console.error(err);
        }
      };
    });

  } catch (err) {
    container.replaceChildren(createElement("div", { class: "error" }, ["Failed to load cart for checkout."]));
    console.error(err);
  }
}
