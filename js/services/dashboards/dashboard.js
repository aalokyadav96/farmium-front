import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";

// Dummy apiFetch
export async function apiFetch(endpoint, method = "GET") {
  await new Promise(r => setTimeout(r, 100)); // simulate latency

  const dummy = {
    "/user/farms": [
      { id: 1, name: "Green Meadows", location: "Valley Town", status: "Open" },
      { id: 2, name: "Sunny Acres",   location: "River Side",   status: "Closed" },
    ],
    "/user/products": [
      { id: 1, name: "Tomatoes",   stock: 120, price: "$2.50/lb" },
      { id: 2, name: "Corn",       stock:  80, price: "$1.80/ear" },
    ],
    "/user/events": [
      { id: 1, name: "Farmers Market",  date: "2025-07-10T10:00:00Z" },
      { id: 2, name: "Harvest Festival", date: "2025-06-15T12:00:00Z" },
    ]
  };

  if (method !== "GET") throw new Error("Mock only GET");
  if (endpoint in dummy) return dummy[endpoint];
  throw new Error(`Unknown endpoint: ${endpoint}`);
}

export async function displayDash(contentContainer, isLoggedIn) {
  if (!isLoggedIn) {
    contentContainer.textContent = "You must be logged in to view the dashboard.";
    return;
  }

  // 1) Fetch all data in parallel
  const [farms, products, events] = await Promise.all([
    apiFetch("/user/farms"),
    apiFetch("/user/products"),
    apiFetch("/user/events")
  ]);

  // 2) Build & attach layout
  const { wrapper, sidebar, main } = createLayout();
  contentContainer.replaceChildren(wrapper);

  // 3) Create nav buttons
  const summaryBtn = Button("Summary", "", {
    click: () => renderSummary(main, { farms, products, events })
  });
  const farmsBtn   = Button("Farms",   "", {
    click: () => renderFarmDashboard(main, farms)
  });
  const productsBtn= Button("Products","", {
    click: () => renderProductDashboard(main, products)
  });
  const eventsBtn  = Button("Events",  "", {
    click: () => renderEventsDashboard(main, events)
  });

  sidebar.append(summaryBtn, farmsBtn, productsBtn, eventsBtn);

  // 4) Show initial summary view
  renderSummary(main, { farms, products, events });
}


/* —————————————————————————
   Layout & Helpers
————————————————————————— */

function createLayout() {
  const wrapper = createElement("div", { className: "dashboard-wrapper" });
  const sidebar = createElement("div", { className: "dashboard-sidebar" });
  const main    = createElement("div", { className: "dashboard-main" });
  wrapper.append(sidebar, main);
  return { wrapper, sidebar, main };
}

function clearMain(main) {
  main.replaceChildren();
}

function createStatCard(title, value, note) {
  const card = createElement("div", { className: "stat-card" });
  card.append(
    createElement("h3", {}, [title]),
    createElement("p", { className: "stat-value" }, [String(value)]),
    note
      ? createElement("small", { className: "stat-note" }, [note])
      : null
  );
  return card;
}


/* —————————————————————————
   Renderers
————————————————————————— */

function renderSummary(main, { farms, products, events }) {
  clearMain(main);

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.date) > now).length;
  const past     = events.length - upcoming;

  const statsContainer = createElement("div", { className: "summary-stats" });
  statsContainer.append(
    createStatCard("Farms",     farms.length,      null),
    createStatCard("Products",  products.length,   null),
    createStatCard("Upcoming Events", upcoming, `${past} past`)
  );

  main.append(createElement("h2", {}, ["Dashboard Summary"]), statsContainer);
}

function renderFarmDashboard(main, farms) {
  clearMain(main);
  main.append(createElement("h2", {}, ["Your Farms"]));
  farms.forEach(f => {
    const row = createElement("div", { className: "farm-row" });
    row.append(
      createElement("strong", {}, [f.name]),
      createElement("span", {}, [`Location: ${f.location}`]),
      createElement("em", {}, [`Status: ${f.status}`]),
      // edit/delete buttons as an example:
      Button("Edit",  "", { click: () => alert(`Edit ${f.id}`) }, "small"),
      Button("Delete","", { click: () => alert(`Delete ${f.id}`) }, "small danger")
    );
    main.append(row);
  });
}

function renderProductDashboard(main, products) {
  clearMain(main);
  main.append(createElement("h2", {}, ["Your Products"]));
  products.forEach(p => {
    const row = createElement("div", { className: "product-row" });
    row.append(
      createElement("strong", {}, [p.name]),
      createElement("span", {}, [`Stock: ${p.stock}`]),
      createElement("span", {}, [`Price: ${p.price}`]),
      Button("Restock", "", { click: () => alert(`Restock ${p.id}`) }, "small"),
      Button("Remove",  "", { click: () => alert(`Remove ${p.id}`) }, "small danger")
    );
    main.append(row);
  });
}

function renderEventsDashboard(main, events) {
  clearMain(main);
  main.append(createElement("h2", {}, ["Your Events"]));
  events.forEach(e => {
    const date = new Date(e.date).toLocaleString();
    const row = createElement("div", { className: "event-row" });
    row.append(
      createElement("strong", {}, [e.name]),
      createElement("span", {}, [`Date: ${date}`]),
      Button("Details", "", { click: () => alert(`Event ID: ${e.id}`) }, "small")
    );
    main.append(row);
  });
}

// import { createElement } from "../../components/createElement.js";
// import Button from "../../components/base/Button.js";

// // Dummy apiFetch
// export async function apiFetch(endpoint, method = "GET", body = null, options = {}) {
//   await new Promise(resolve => setTimeout(resolve, 100)); // Simulate latency

//   const dummyData = {
//     "/user/farms": [
//       { id: 1, name: "Green Meadows", location: "Valley Town", status: "Open" },
//       { id: 2, name: "Sunny Acres", location: "River Side", status: "Closed" },
//     ],
//     "/user/products": [
//       { id: 1, name: "Tomatoes", stock: 120, price: "$2.50/lb" },
//       { id: 2, name: "Corn", stock: 80, price: "$1.80/ear" },
//     ],
//   };

//   if (method !== "GET") throw new Error("Mock only supports GET");

//   if (endpoint in dummyData) return dummyData[endpoint];

//   throw new Error(`Unknown API endpoint: ${endpoint}`);
// }

// export async function displayDash(contentContainer, isLoggedIn) {
//   if (!isLoggedIn) {
//     contentContainer.textContent = "You must be logged in to view the dashboard.";
//     return;
//   }

//   // Fetch dummy data
//   const [farms, products] = await Promise.all([
//     apiFetch("/user/farms"),
//     apiFetch("/user/products")
//   ]);

//   // Create layout
//   const { wrapper, sidebar, main } = createLayout();
//   contentContainer.replaceChildren(wrapper);

//   // Buttons
//   const farmBtn = Button("Farm Dashboard", "", {
//     click: () => renderFarmDashboard(main, farms)
//   });

//   const productBtn = Button("Product Dashboard", "", {
//     click: () => renderProductDashboard(main, products)
//   });

//   sidebar.append(farmBtn, productBtn);

//   // Initial view
//   renderFarmDashboard(main, farms);
// }


// /* ———————————————————————
//    UI layout creation
// ———————————————————————— */

// function createLayout() {
//   const wrapper = createElement("div", { className: "dashboard-wrapper" });
//   const sidebar = createElement("div", { className: "dashboard-sidebar" });
//   const main = createElement("div", { className: "dashboard-main" });

//   wrapper.append(sidebar, main);
//   return { wrapper, sidebar, main };
// }

// function clearMain(main) {
//   main.replaceChildren();
// }


// /* ———————————————————————
//    Renderers
// ———————————————————————— */

// function renderFarmDashboard(main, farms) {
//   clearMain(main);
//   main.append(createElement("h2", {}, ["Your Farms"]));

//   farms.forEach(farm => {
//     const row = createElement("div", { className: "farm-row" });
//     row.append(
//       createElement("span", {}, [farm.name]),
//       createElement("span", {}, [farm.location]),
//       createElement("span", {}, [farm.status])
//     );
//     main.append(row);
//   });
// }

// function renderProductDashboard(main, products) {
//   clearMain(main);
//   main.append(createElement("h2", {}, ["Your Products"]));

//   products.forEach(prod => {
//     const row = createElement("div", { className: "product-row" });
//     row.append(
//       createElement("span", {}, [prod.name]),
//       createElement("span", {}, [`Stock: ${prod.stock}`]),
//       createElement("span", {}, [prod.price])
//     );
//     main.append(row);
//   });
// }

// // // import { apiFetch } from "../../api/api.js";
// // import { createElement } from "../../components/createElement.js";
// // import Button from "../../components/base/Button.js";

// // // Dummy apiFetch implementation
// // export async function apiFetch(endpoint, method = "GET", body = null, options = {}) {
// //     await new Promise(resolve => setTimeout(resolve, 100));

// //     const dummyData = {
// //         "/user/events": [
// //             { id: 1, name: "Farmers Market", date: "2025-07-10T10:00:00Z" },
// //             { id: 2, name: "Harvest Festival", date: "2025-06-15T12:00:00Z" },
// //         ],
// //         "/user/businesses": [
// //             { id: 1, name: "Green Grocers", location: "Downtown" },
// //             { id: 2, name: "Farm Fresh Outlet", location: "West Side" },
// //         ],
// //         "/user/farms": [
// //             { id: 1, crop: "Tomatoes", location: "Valley Farm" },
// //             { id: 2, crop: "Corn", location: "Highland Farm" },
// //         ],
// //     };

// //     if (method !== "GET") {
// //         throw new Error("This mock apiFetch only supports GET requests");
// //     }

// //     if (endpoint in dummyData) {
// //         return dummyData[endpoint];
// //     }

// //     throw new Error(`Unknown API endpoint: ${endpoint}`);
// // }

// // export async function displayDash(contentContainer, isLoggedIn) {
// //     if (!isLoggedIn) {
// //         contentContainer.textContent = "You must be logged in to view the dashboard.";
// //         return;
// //     }

// //     contentContainer.innerHTML = ""; // Clear existing content

// //     const dashboardTitle = createElement("h2", {}, ["Your Dashboard"]);
// //     const statsSection = createElement("div", { class: "dashboard-stats" }, []);

// //     try {
// //         const [events, businesses, farms] = await Promise.all([
// //             apiFetch("/user/events"),
// //             apiFetch("/user/businesses"),
// //             apiFetch("/user/farms"),
// //         ]);

// //         const eventStats = createStatCard("Events", events.length, [
// //             `Upcoming: ${events.filter(e => new Date(e.date) > new Date()).length}`,
// //             `Past: ${events.filter(e => new Date(e.date) <= new Date()).length}`,
// //         ]);

// //         const businessStats = createStatCard("Businesses", businesses.length,
// //             businesses.map(b => `${b.name} (${b.location})`)
// //         );

// //         const farmStats = createStatCard("Farms", farms.length,
// //             farms.map(f => `Selling: ${f.crop} at ${f.location}`)
// //         );

// //         statsSection.append(eventStats, businessStats, farmStats);
// //     } catch (err) {
// //         statsSection.append(
// //             createElement("p", {}, ["Failed to load dashboard data."])
// //         );
// //         console.error(err);
// //     }

// //     contentContainer.append(dashboardTitle, statsSection);
// // }

// // // Helper: Create a stat card
// // function createStatCard(title, count, lines = []) {
// //     const titleElem = createElement("h3", {}, [`${title} (${count})`]);
// //     const listItems = lines.map(line => createElement("li", {}, [line]));
// //     const list = createElement("ul", {}, listItems);
// //     return createElement("div", { class: "stat-card" }, [titleElem, list]);
// // }



// // // import { apiFetch } from "../../api/api.js";
// // // import { createElement } from "../../components/createElement.js";
// // // import Button from "../../components/base/Button.js";

// // // export function displayDash(contentContainer, isLoggedIn) {}




// // // // import { apiFetch } from "../../api/api.js";
// // // // import { createElement } from "../../components/createElement.js";
// // // // import Button from "../../components/base/Button.js";

// // // // export function displayDash(contentContainer, isLoggedIn) {
// // // //   // 1) Prepare data (swap out for real API calls later)
// // // //   const farms    = getDummyFarms();
// // // //   const products = getDummyProducts();

// // // //   // 2) Build the layout & attach it immediately
// // // //   const { wrapper, sidebar, main } = createLayout();
// // // //   contentContainer.replaceChildren(wrapper);

// // // //   // 3) Create & wire up buttons, then append them
// // // //   const farmBtn = createNavButton("Farm Dashboard", () => renderFarmDashboard(main, farms));
// // // //   const prodBtn = createNavButton("Product Dashboard", () => renderProductDashboard(main, products));
// // // //   sidebar.append(farmBtn, prodBtn);

// // // //   // 4) Show initial view
// // // //   renderFarmDashboard(main, farms);
// // // // }


// // // // /* ————————————————————
// // // //    Layout & UI factories
// // // //    ———————————————————— */

// // // // function createLayout() {
// // // //   const wrapper = createElement("div", { className: "dashboard-wrapper" },[]);
// // // //   const sidebar = createElement("div", { className: "dashboard-sidebar" },[]);
// // // //   const main    = createElement("div", { className: "dashboard-main" },[]);
// // // //   wrapper.append(sidebar, main);
// // // //   return { wrapper, sidebar, main };
// // // // }

// // // // function createNavButton(label, onClick) {
// // // //   // Use your Button signature: Button(title, id, events, classes, styles)
// // // //   return Button(
// // // //     label,            // title
// // // //     "",               // id
// // // //     { click: onClick }, // events
// // // //     "",               // classes
// // // //     {}                // styles
// // // //   );
// // // // }

// // // // function clearMain(main) {
// // // //   main.replaceChildren();
// // // // }


// // // // /* ————————————————————
// // // //    Renderers
// // // //    ———————————————————— */

// // // // function renderFarmDashboard(main, farms) {
// // // //   clearMain(main);
// // // //   main.append(createElement("h2", { textContent: "Your Farms" },[]));

// // // //   farms.forEach(farm => {
// // // //     const row = createElement("div", { className: "farm-row" },[]);
// // // //     row.append(
// // // //       createElement("span", { textContent: farm.name },[]),
// // // //       createElement("span", { textContent: farm.location },[]),
// // // //       createElement("span", { textContent: farm.status },[])
// // // //     );
// // // //     main.append(row);
// // // //   });
// // // // }

// // // // function renderProductDashboard(main, products) {
// // // //   clearMain(main);
// // // //   main.append(createElement("h2", { textContent: "Your Products" },[]));

// // // //   products.forEach(prod => {
// // // //     const row = createElement("div", { className: "product-row" },[]);
// // // //     row.append(
// // // //       createElement("span", { textContent: prod.name },[]),
// // // //       createElement("span", { textContent: `Stock: ${prod.stock}` },[]),
// // // //       createElement("span", { textContent: prod.price },[])
// // // //     );
// // // //     main.append(row);
// // // //   });
// // // // }


// // // // /* ————————————————————
// // // //    Dummy Data (swap to apiFetch later)
// // // //    ———————————————————— */

// // // // function getDummyFarms() {
// // // //   return [
// // // //     { id: 1, name: "Green Meadows",  location: "Valley Town",  status: "Open"   },
// // // //     { id: 2, name: "Sunny Acres",    location: "River Side",   status: "Closed" },
// // // //     { id: 3, name: "Highland Farms", location: "Mountain View",status: "Open"   },
// // // //   ];
// // // // }

// // // // function getDummyProducts() {
// // // //   return [
// // // //     { id: 1, name: "Tomatoes",  stock: 120, price: "$2.50/lb" },
// // // //     { id: 2, name: "Sweet Corn",stock:  80, price: "$1.80/ear"},
// // // //     { id: 3, name: "Lettuce",   stock: 200, price: "$1.20/head"},
// // // //   ];
// // // // }
