import { createElement } from "../../../components/createElement";
import { apiFetch } from "../../../api/api";

export async function displayOrders(container) {
  container.replaceChildren();

  const section = createElement("section", { class: "orders-page" }, [
    createElement("h2", {}, ["Incoming Orders"]),
    buildFiltersSection(),
    buildBulkActionsSection(),
  ]);

  container.appendChild(section);

  try {
    const response = await apiFetch("/orders/incoming");

    if (!response.success || !Array.isArray(response.orders)) {
      throw new Error("Invalid response");
    }

    const table = buildOrdersTable(response.orders);
    section.appendChild(table);
  } catch (err) {
    console.error("Failed to fetch incoming orders:", err);
    section.appendChild(
      createElement("p", {}, ["Failed to load orders. Please try again later."])
    );
  }
}
function buildFiltersSection() {
    return createElement("div", { class: "filters" }, [
      buildLabeledSelect("Crop Type", [
        { value: "", label: "All" },
        { value: "wheat", label: "Wheat" },
        { value: "tomatoes", label: "Tomatoes" },
      ]),
      buildLabeledSelect("Delivery Status", [
        { value: "", label: "All" },
        { value: "pending", label: "Pending" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
      ]),
      buildLabeledSelect("Payment Status", [
        { value: "", label: "All" },
        { value: "paid", label: "Paid" },
        { value: "pending", label: "Pending" },
      ]),
      createElement("label", {}, [
        "Date:",
        createElement("input", { type: "date" }),
      ]),
      createElement("button", { type: "button" }, ["Apply Filters"]),
    ]);
  }
  function buildLabeledSelect(labelText, options) {
    return createElement("label", {}, [
      `${labelText}:`,
      createElement(
        "select",
        {},
        options.map((opt) =>
          createElement("option", { value: opt.value }, [opt.label])
        )
      ),
    ]);
  }
  function buildBulkActionsSection() {
    return createElement("div", { class: "bulk-actions" }, [
      createElement("button", { type: "button" }, ["Accept Selected"]),
      createElement("button", { type: "button" }, ["Reject Selected"]),
      createElement("button", { type: "button" }, ["Mark as Delivered"]),
    ]);
  }
  function buildOrdersTable(orderList) {
    return createElement("table", { class: "orders-table" }, [
      createElement("thead", {}, [
        createElement("tr", {}, [
          createElement("th", {}, [
            createElement("input", { type: "checkbox", id: "select-all" }),
          ]),
          ...[
            "Order ID", "Buyer Name", "Contact", "Crop", "Qty",
            "Order Date", "Delivery Date", "Address", "Payment", "Status", "Actions"
          ].map(header => createElement("th", {}, [header])),
        ]),
      ]),
      createElement("tbody", {}, orderList.length === 0
        ? [createElement("tr", {}, [
            createElement("td", { colspan: 12 }, ["No orders found."])
          ])]
        : orderList.map(buildOrderRow)
      ),
    ]);
  }
  function buildOrderRow(order) {
    return createElement("tr", {}, [
      createElement("td", {}, [
        createElement("input", { type: "checkbox", class: "select-order" }),
      ]),
      createElement("td", {}, [order.id]),
      createElement("td", {}, [order.buyer]),
      createElement("td", {}, [order.contact]),
      createElement("td", {}, [order.crop]),
      createElement("td", {}, [`${order.qty} ${order.unit}`]),
      createElement("td", {}, [order.orderDate]),
      createElement("td", {}, [order.deliveryDate]),
      createElement("td", {}, [order.address]),
      createElement("td", {}, [capitalize(order.payment)]),
      createElement("td", {}, [capitalize(order.status)]),
      createElement("td", {}, [
        createElement("button", {
          type: "button",
          onclick: () => contactBuyer(order.contact),
        }, ["Contact"]),
        createElement("button", {
          type: "button",
          onclick: () => markDelivered(order.id),
        }, ["Delivered"]),
        createElement("button", {
          type: "button",
          onclick: () => rejectOrder(order.id),
        }, ["Reject"]),
      ]),
    ]);
  }
  function capitalize(str) {
    return typeof str === "string"
      ? str.charAt(0).toUpperCase() + str.slice(1)
      : "";
  }
  
  function contactBuyer(email) {
    console.log("Contacting buyer:", email);
    window.location.href = `mailto:${email}`;
  }
  
  function markDelivered(orderId) {
    console.log("Marking delivered:", orderId);
    // apiFetch(`/farmorders/${orderId}/delivered`, "POST")
  }
  
  function rejectOrder(orderId) {
    console.log("Rejecting order:", orderId);
    // apiFetch(`/farmorders/${orderId}/reject`, "POST")
  }
            
// import { createElement } from "../../../components/createElement";


// // displayOrders(document.getElementById("content"));

// const sampleOrders = [
//   {
//     id: "#ORD1024",
//     buyer: "Meera Sharma",
//     contact: "meera@example.com",
//     crop: "Tomatoes",
//     qty: 50,
//     unit: "kg",
//     orderDate: "2025-07-14",
//     deliveryDate: "2025-07-16",
//     address: "Delhi, India",
//     payment: "Pending",
//     status: "Accepted"
//   }
// ];

// // buildOrdersTable(sampleOrders); // Replace empty list above if needed


// export function displayOrders(container) {
//     container.replaceChildren();

//     const ordersPage = createElement("section", { class: "orders-page" }, [
//         createElement("h2", {}, ["Incoming Orders"]),
//         buildFiltersSection(),
//         buildBulkActionsSection(),
//         // buildOrdersTable([]), // Placeholder empty list for now
//         buildOrdersTable(sampleOrders),
//     ]);

//     container.appendChild(ordersPage);
// }

// function buildFiltersSection() {
//     return createElement("div", { class: "filters" }, [
//         buildLabeledSelect("Crop Type", [
//             { value: "", label: "All" },
//             { value: "wheat", label: "Wheat" },
//             { value: "tomatoes", label: "Tomatoes" },
//         ]),
//         buildLabeledSelect("Delivery Status", [
//             { value: "", label: "All" },
//             { value: "pending", label: "Pending" },
//             { value: "shipped", label: "Shipped" },
//             { value: "delivered", label: "Delivered" },
//         ]),
//         buildLabeledSelect("Payment Status", [
//             { value: "", label: "All" },
//             { value: "paid", label: "Paid" },
//             { value: "pending", label: "Pending" },
//         ]),
//         createElement("label", {}, [
//             "Date:",
//             createElement("input", { type: "date" }),
//         ]),
//         createElement("button", {}, ["Apply Filters"]),
//     ]);
// }

// function buildLabeledSelect(labelText, options) {
//     return createElement("label", {}, [
//         `${labelText}:`,
//         createElement(
//             "select",
//             {},
//             options.map((opt) =>
//                 createElement("option", { value: opt.value }, [opt.label])
//             )
//         ),
//     ]);
// }
// function buildBulkActionsSection() {
//     return createElement("div", { class: "bulk-actions" }, [
//         createElement("button", {}, ["Accept Selected"]),
//         createElement("button", {}, ["Reject Selected"]),
//         createElement("button", {}, ["Mark as Delivered"]),
//     ]);
// }
// function buildOrdersTable(orderList) {
//     const table = createElement("table", { class: "orders-table" }, [
//         createElement("thead", {}, [
//             createElement("tr", {}, [
//                 createElement("th", {}, [
//                     createElement("input", { type: "checkbox", id: "select-all" }),
//                 ]),
//                 ...[
//                     "Order ID",
//                     "Buyer Name",
//                     "Contact",
//                     "Crop",
//                     "Qty",
//                     "Order Date",
//                     "Delivery Date",
//                     "Address",
//                     "Payment",
//                     "Status",
//                     "Actions",
//                 ].map((header) => createElement("th", {}, [header])),
//             ]),
//         ]),
//         createElement("tbody", {}, orderList.length === 0
//             ? [createElement("tr", {}, [
//                 createElement("td", { colspan: 12 }, ["No orders found."])
//             ])]
//             : orderList.map(buildOrderRow)
//         ),
//     ]);

//     return table;
// }
// function buildOrderRow(order) {
//     return createElement("tr", {}, [
//         createElement("td", {}, [
//             createElement("input", { type: "checkbox", class: "select-order" }),
//         ]),
//         createElement("td", {}, [order.id]),
//         createElement("td", {}, [order.buyer]),
//         createElement("td", {}, [order.contact]),
//         createElement("td", {}, [order.crop]),
//         createElement("td", {}, [`${order.qty} ${order.unit}`]),
//         createElement("td", {}, [order.orderDate]),
//         createElement("td", {}, [order.deliveryDate]),
//         createElement("td", {}, [order.address]),
//         createElement("td", {}, [order.payment]),
//         createElement("td", {}, [order.status]),
//         createElement("td", {}, [
//             createElement("button", {}, ["Contact"]),
//             createElement("button", {}, ["Delivered"]),
//             createElement("button", {}, ["Reject"]),
//         ]),
//     ]);
// }
