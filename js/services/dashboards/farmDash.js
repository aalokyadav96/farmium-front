import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import {apiFetch} from "../../api/api.js";

// // Replace mock version with real fetch (if not already done)
// export function apiFetch(endpoint, method = "GET", body = null, options = {}) {
//   return fetch(endpoint, {
//     method,
//     headers: {
//       "Content-Type": "application/json",
//       ...(options.headers || {}),
//     },
//     body: body ? JSON.stringify(body) : null,
//   })
//     .then((res) => {
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       return res.json();
//     });
// }

export function displayDash(contentContainer, isLoggedIn, farmId) {
  contentContainer.replaceChildren();

  if (!isLoggedIn) {
    contentContainer.appendChild(
      createElement("p", {}, ["You must be logged in to view the dashboard."])
    );
    return;
  }

  contentContainer.appendChild(createElement("h2", {}, ["Farm Stats"]));

  farmId = "686563edef13fb432aec8ddd";

  apiFetch(`/farms/${farmId}`)
    .then((response) => {
      if (!response.success || !response.farm) throw new Error("No farm data");

      const farm = response.farm;
      const crops = farm.crops || [];

      const totalCrops = crops.length;
      const totalQuantity = crops.reduce((sum, c) => sum + (c.quantity || 0), 0);
      const totalValue = crops.reduce((sum, c) => sum + (c.quantity * c.price), 0);

      const uniqueCategories = new Set(crops.map(c => c.category)).size;
      const featuredCrops = crops.filter(c => c.featured).length;

      const statsSummary = createElement("div", { class: "stats-summary" }, [
        createElement("div", { class: "stat-card" }, [`Farm Name: ${farm.name}`]),
        createElement("div", { class: "stat-card" }, [`Total Crops: ${totalCrops}`]),
        createElement("div", { class: "stat-card" }, [`Crop Categories: ${uniqueCategories}`]),
        createElement("div", { class: "stat-card" }, [`Total Quantity: ${totalQuantity}`]),
        createElement("div", { class: "stat-card" }, [`Estimated Value: $${totalValue.toFixed(2)}`]),
        createElement("div", { class: "stat-card" }, [`Featured Crops: ${featuredCrops}`]),
      ]);

      contentContainer.appendChild(statsSummary);

      // Crop breakdown
      const cropSection = createElement("div", { class: "crop-distribution" }, [
        createElement("h3", {}, ["Crops"]),
      ]);

      if (crops.length === 0) {
        cropSection.appendChild(createElement("p", {}, ["No crops listed."]));
      } else {
        cropSection.appendChild(
          createElement(
            "ul",
            {},
            crops.map((crop) =>
              createElement("li", {}, [
                `${crop.name} – ${crop.quantity} ${crop.unit} @ $${crop.price}/${crop.unit}`,
              ])
            )
          )
        );
      }

      contentContainer.appendChild(cropSection);

      // Optional: Show contact + availability
      const extra = createElement("div", { class: "farm-extra" }, [
        createElement("h3", {}, ["Other Info"]),
        createElement("p", {}, [`Location: ${farm.location}`]),
        createElement("p", {}, [`Availability: ${farm.availabilityTiming}`]),
        createElement("p", {}, [`Contact: ${farm.contact || "N/A"}`]),
      ]);
      contentContainer.appendChild(extra);
    })
    .catch((err) => {
      console.error("Error loading farm stats:", err);
      contentContainer.appendChild(
        createElement("p", {}, ["Failed to load farm data."])
      );
    });
}


// import { createElement } from "../../components/createElement.js";
// import Button from "../../components/base/Button.js"; // still used for toggle

// export function apiFetch(endpoint, method = "GET", body = null, options = {}) {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       if (endpoint === "/farmer/farms" && method === "GET") {
//         resolve([
//           {
//             id: "farm1",
//             name: "Green Valley Farm",
//             location: "North Ridge",
//             size: 15,
//             crops: [
//               { name: "Tomatoes", quantity: 200, unit: "kg", price: 2.5 },
//               { name: "Carrots", quantity: 150, unit: "kg", price: 1.8 },
//             ],
//           },
//           {
//             id: "farm2",
//             name: "Sunnyfield",
//             location: "South Plains",
//             size: 10,
//             crops: [],
//           },
//         ]);
//       } else {
//         reject(new Error("Endpoint not found or method not supported"));
//       }
//     }, 300);
//   });
// }

// export function displayDash(contentContainer, isLoggedIn) {
//   contentContainer.replaceChildren();

//   if (!isLoggedIn) {
//     contentContainer.appendChild(
//       createElement("p", {}, ["You must be logged in to view the dashboard."])
//     );
//     return;
//   }

//   contentContainer.appendChild(createElement("h2", {}, ["Farmer Dashboard"]));

//   apiFetch("/farmer/farms")
//     .then((farms) => {
//       const allCrops = farms.flatMap(f => f.crops);
//       const totalFarms = farms.length;
//       const totalCropTypes = new Set(allCrops.map(c => c.name)).size;
//       const totalQuantity = allCrops.reduce((sum, c) => sum + c.quantity, 0);
//       const totalValue = allCrops.reduce((sum, c) => sum + (c.quantity * c.price), 0);

//       const statsSummary = createElement("div", { class: "stats-summary" }, [
//         createElement("div", { class: "stat-card" }, [`Total Farms: ${totalFarms}`]),
//         createElement("div", { class: "stat-card" }, [`Crop Types: ${totalCropTypes}`]),
//         createElement("div", { class: "stat-card" }, [`Total Quantity: ${totalQuantity} kg`]),
//         createElement("div", { class: "stat-card" }, [`Estimated Value: $${totalValue.toFixed(2)}`]),
//       ]);

//       contentContainer.appendChild(statsSummary);

//       // Crop distribution
//       const cropMap = {};
//       allCrops.forEach(crop => {
//         if (!cropMap[crop.name]) cropMap[crop.name] = 0;
//         cropMap[crop.name] += crop.quantity;
//       });

//       const cropDist = createElement("div", { class: "crop-distribution" }, [
//         createElement("h3", {}, ["Crop Distribution"]),
//         createElement(
//           "ul",
//           {},
//           Object.entries(cropMap).map(([name, qty]) =>
//             createElement("li", {}, [`${name}: ${qty} kg`])
//           )
//         ),
//       ]);
//       contentContainer.appendChild(cropDist);

//       // Region breakdown
//       const regionMap = {};
//       farms.forEach(farm => {
//         if (!regionMap[farm.location]) regionMap[farm.location] = 0;
//         regionMap[farm.location]++;
//       });

//       const regionStats = createElement("div", { class: "region-breakdown" }, [
//         createElement("h3", {}, ["Farms by Location"]),
//         createElement(
//           "ul",
//           {},
//           Object.entries(regionMap).map(([location, count]) =>
//             createElement("li", {}, [`${location}: ${count} farm(s)`])
//           )
//         ),
//       ]);
//       contentContainer.appendChild(regionStats);

//       // Recent activity (mocked)
//       const recentActivity = createElement("div", { class: "recent-activity" }, [
//         createElement("h3", {}, ["Recent Activity"]),
//         createElement("ul", {}, [
//           createElement("li", {}, ["Added 150kg Carrots to Green Valley Farm"]),
//           createElement("li", {}, ["Edited Sunnyfield farm"]),
//         ]),
//       ]);
//       contentContainer.appendChild(recentActivity);

//       // Toggleable farm list
//       const toggleBtn = Button(
//         "Show Farm List",
//         "toggle-farms",
//         {
//           click: () => {
//             const visible = farmList.style.display !== "none";
//             farmList.style.display = visible ? "none" : "block";
//             toggleBtn.textContent = visible ? "Show Farm List" : "Hide Farm List";
//           },
//         },
//         "toggle-button"
//       );

//       const farmList = createElement("div", { class: "farm-list" });
//       farmList.style.display = "none";

//       farms.forEach((farm) => {
//         const cropsList = farm.crops.length
//           ? createElement(
//             "ul",
//             {},
//             farm.crops.map((crop) =>
//               createElement("li", {}, [
//                 `${crop.name} - ${crop.quantity} ${crop.unit} @ $${crop.price}/${crop.unit}`,
//               ])
//             )
//           )
//           : createElement("p", {}, ["No crops listed."]);

//         const farmCard = createElement("div", { class: "farm-card" }, [
//           createElement("h4", {}, [farm.name]),
//           createElement("p", {}, [`Location: ${farm.location}`]),
//           createElement("p", {}, [`Size: ${farm.size} acres`]),
//           createElement("h5", {}, ["Crops:"]),
//           cropsList,
//         ]);

//         farmList.appendChild(farmCard);
//       });

//       contentContainer.appendChild(toggleBtn);
//       contentContainer.appendChild(farmList);
//     })
//     .catch((err) => {
//       console.error("Failed to load farms:", err);
//       contentContainer.appendChild(
//         createElement("p", {}, ["Error loading dashboard."])
//       );
//     });
// }




// // import { createElement } from "../../components/createElement.js";
// // import Button from "../../components/base/Button.js"; // assuming default export

// // export function apiFetch(endpoint, method = "GET", body = null, options = {}) {
// //   return new Promise((resolve, reject) => {
// //     setTimeout(() => {
// //       if (endpoint === "/farmer/farms" && method === "GET") {
// //         resolve([
// //           {
// //             id: "farm1",
// //             name: "Green Valley Farm",
// //             location: "North Ridge",
// //             size: 15,
// //             crops: [
// //               { name: "Tomatoes", quantity: 200, unit: "kg", price: 2.5 },
// //               { name: "Carrots", quantity: 150, unit: "kg", price: 1.8 },
// //             ],
// //           },
// //           {
// //             id: "farm2",
// //             name: "Sunnyfield",
// //             location: "South Plains",
// //             size: 10,
// //             crops: [],
// //           },
// //         ]);
// //       } else {
// //         reject(new Error("Endpoint not found or method not supported"));
// //       }
// //     }, 300);
// //   });
// // }

// // export function displayDash(contentContainer, isLoggedIn) {
// //   contentContainer.replaceChildren();

// //   if (!isLoggedIn) {
// //     contentContainer.appendChild(
// //       createElement("p", {}, ["You must be logged in to view the dashboard."])
// //     );
// //     return;
// //   }

// //   contentContainer.appendChild(createElement("h2", {}, ["Farmer Dashboard"]));

// //   apiFetch("/farmer/farms")
// //     .then((farms) => {
// //       if (!farms.length) {
// //         contentContainer.appendChild(
// //           createElement("p", {}, ["No farms listed yet."])
// //         );
// //         return;
// //       }

// //       const farmList = createElement("div", { class: "farm-list" });

// //       farms.forEach((farm) => {
// //         const cropsList = farm.crops.length
// //           ? createElement(
// //               "ul",
// //               {},
// //               farm.crops.map((crop) =>
// //                 createElement("li", {}, [
// //                   `${crop.name} - ${crop.quantity} ${crop.unit} @ $${crop.price}/${crop.unit}`,
// //                 ])
// //               )
// //             )
// //           : createElement("p", {}, ["No crops listed."]);

// //         const editBtn = Button(
// //           "Edit Farm",
// //           `edit-${farm.id}`,
// //           {
// //             click: () => {
// //               alert(`Edit farm: ${farm.name}`);
// //               // replace with actual routing/logic
// //             },
// //           },
// //           "edit-button"
// //         );

// //         const farmCard = createElement("div", { class: "farm-card" }, [
// //           createElement("h3", {}, [farm.name]),
// //           createElement("p", {}, [`Location: ${farm.location}`]),
// //           createElement("p", {}, [`Size: ${farm.size} acres`]),
// //           createElement("h4", {}, ["Crops for Sale:"]),
// //           cropsList,
// //           editBtn,
// //         ]);

// //         farmList.appendChild(farmCard);
// //       });

// //       contentContainer.appendChild(farmList);
// //     })
// //     .catch((err) => {
// //       console.error("Failed to load farms:", err);
// //       contentContainer.appendChild(
// //         createElement("p", {}, ["Error loading dashboard."])
// //       );
// //     });
// // }
