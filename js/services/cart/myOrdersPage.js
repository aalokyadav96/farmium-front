import { createElement } from "../../components/createElement";
import { apiFetch } from "../../api/api"; // Adjust path as needed

export async function displayMyOrders(container, isLoggedIn) {
  container.replaceChildren();

  if (!isLoggedIn) {
    container.appendChild(
      createElement("p", {}, ["You must be logged in to view your orders."])
    );
    return;
  }

  const section = createElement("section", { class: "user-orders-page" }, [
    createElement("h2", {}, ["My Orders"]),
    buildUserOrderFilters(),
  ]);

  container.appendChild(section);

  try {
    const response = await apiFetch("/orders/mine");

    if (!response.success || !Array.isArray(response.orders)) {
      throw new Error("Invalid response");
    }

    const table = buildUserOrdersTable(response.orders);
    section.appendChild(table);
  } catch (err) {
    console.error("Failed to fetch user orders:", err);
    section.appendChild(
      createElement("p", {}, ["Failed to load orders. Please try again later."])
    );
  }
}
function buildUserOrderFilters() {
    return createElement("div", { class: "filters" }, [
      buildLabeledSelect("Status", [
        { value: "", label: "All" },
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
      ]),
      buildLabeledSelect("Crop Type", [
        { value: "", label: "All" },
        { value: "wheat", label: "Wheat" },
        { value: "rice", label: "Rice" },
      ]),
      createElement("label", {}, [
        "Date:",
        createElement("input", { type: "date" }),
      ]),
      createElement("button", { type: "button" }, ["Filter"]),
    ]);
  }
  function buildUserOrdersTable(orders) {
    return createElement("table", { class: "orders-table" }, [
      createElement("thead", {}, [
        createElement("tr", {}, [
          "Order ID", "Farmer Name", "Crop", "Qty", "Order Date",
          "Delivery Date", "Status", "Payment", "Actions"
        ].map((header) => createElement("th", {}, [header]))),
      ]),
      createElement("tbody", {}, orders.length === 0
        ? [createElement("tr", {}, [
            createElement("td", { colspan: 9 }, ["No orders found."])
          ])]
        : orders.map(buildUserOrderRow)
      ),
    ]);
  }
  function buildUserOrderRow(order) {
    return createElement("tr", {}, [
      createElement("td", {}, [order.id]),
      createElement("td", {}, [order.farmerName]),
      createElement("td", {}, [order.crop]),
      createElement("td", {}, [`${order.quantity} ${order.unit}`]),
      createElement("td", {}, [order.orderDate]),
      createElement("td", {}, [order.deliveryDate]),
      createElement("td", {}, [capitalize(order.status)]),
      createElement("td", {}, [capitalize(order.paymentStatus)]),
      createElement("td", {}, [
        createElement("button", {
          onclick: () => markAsPaid(order.id)
        }, ["Mark Paid"]),
        createElement("button", {
          onclick: () => contactFarmer(order.farmerContact)
        }, ["Contact"]),
        createElement("button", {
          onclick: () => downloadReceipt(order.id)
        }, ["Receipt"]),
      ]),
    ]);
  }
  function buildLabeledSelect(labelText, options, attrs = {}) {
    return createElement("label", {}, [
      labelText + ":",
      createElement(
        "select",
        attrs,
        options.map(({ value, label }) =>
          createElement("option", { value }, [label])
        )
      ),
    ]);
  }
  
  function capitalize(text) {
    return typeof text === "string"
      ? text.charAt(0).toUpperCase() + text.slice(1)
      : "";
  }
  
  // Placeholder action handlers
  function markAsPaid(orderId) {
    console.log("Marking order as paid:", orderId);
    // Call apiFetch(`/farmorders/${orderId}/mark-paid`, "POST")...
  }
  
  function contactFarmer(email) {
    console.log("Contacting farmer:", email);
    window.location.href = `mailto:${email}`;
  }
  
  function downloadReceipt(orderId) {
    console.log("Downloading receipt for:", orderId);
    // Simulate or call API for actual download
  }
//   {
//     "success": true,
//     "orders": [
//       {
//         "id": "#ORD2035",
//         "farmerName": "Rajveer Singh",
//         "farmerContact": "rajveer@example.com",
//         "crop": "Onions",
//         "quantity": 25,
//         "unit": "kg",
//         "orderDate": "2025-07-14",
//         "deliveryDate": "2025-07-18",
//         "status": "shipped",
//         "paymentStatus": "pending"
//       }
//     ]
//   }
          