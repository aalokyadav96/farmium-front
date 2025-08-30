import { createElement } from "../../../components/createElement";
import { apiFetch } from "../../../api/api"; // fixed import
import { guessCategoryFromName } from "./displayCropshelpers";
import { renderCropInterface } from "./displayCropsUI";

export async function displayCrops(content, isLoggedIn) {
  const contentContainer = createElement("div", { class: "cropspage" });
  content.replaceChildren(contentContainer);

  // Always show heading
  contentContainer.appendChild(createElement("h2", {}, ["All Crops"]));

  let categorized = {};

  try {
    const response = await apiFetch("/crops/types");

    if (!response || typeof response !== "object") {
      throw new Error("Invalid response from server");
    }

    const { cropTypes } = response;
    if (!Array.isArray(cropTypes)) {
      throw new Error("`cropTypes` is not an array");
    }

    // Categorize crops
    cropTypes.forEach(crop => {
      if (!crop.name) return;
      const category = guessCategoryFromName(crop.name);
      if (!categorized[category]) categorized[category] = [];
      categorized[category].push({
        ...crop,
        imageUrl: crop.imageUrl || "placeholder.jpg",
        category,
        tags: Array.isArray(crop.tags) ? crop.tags : [],
        seasonMonths: Array.isArray(crop.seasonMonths) ? crop.seasonMonths : []
      });
    });

  } catch (err) {
    console.error("Error fetching crops:", err);
    categorized["Error"] = [];
  }

  // Render interface even if some categories are empty
  renderCropInterface(contentContainer, categorized);
}

// // import { createElement } from "../../../components/createElement";
// // import { apiFetch } from "../../../api/api";
// // import { guessCategoryFromName } from "./displayCropshelpers";
// // import { renderCropInterface } from "./displayCropsUI";

// // export async function displayCrops(content, isLoggedIn) {
// //   const contentContainer = createElement("div", { class: "cropspage" });
// //   content.replaceChildren(contentContainer);

// //   // Always render the heading
// //   contentContainer.appendChild(createElement("h2", {}, ["All Crops"]));

// //   let categorized = {};

// //   try {
// //     const response = await apiFetch("/crops/types");

// //     if (!response || typeof response !== "object") {
// //       throw new Error("Invalid response from server");
// //     }

// //     const { cropTypes } = response;

// //     if (!Array.isArray(cropTypes)) {
// //       throw new Error("`cropTypes` is not an array");
// //     }

// //     if (cropTypes.length === 0) {
// //       // Show a message but continue rendering the rest of the page
// //       contentContainer.appendChild(
// //         createElement("p", {}, ["No crops available."])
// //       );
// //     }

// //     cropTypes.forEach(crop => {
// //       if (!crop.name) return;

// //       const category = guessCategoryFromName(crop.name);
// //       if (!categorized[category]) categorized[category] = [];

// //       categorized[category].push({
// //         ...crop,
// //         imageUrl: crop.imageUrl || "placeholder.jpg",
// //         category,
// //         tags: Array.isArray(crop.tags) ? crop.tags : [],
// //         seasonMonths: Array.isArray(crop.seasonMonths) ? crop.seasonMonths : []
// //       });
// //     });

// //     // Render interface only if there’s data
// //     if (Object.keys(categorized).length) {
// //       renderCropInterface(contentContainer, categorized);
// //     }

// //   } catch (err) {
// //     console.error("Error fetching crops:", err);

// //     // Display error but keep heading visible and allow rest of page to render
// //     contentContainer.appendChild(
// //       createElement(
// //         "p",
// //         { class: "error" },
// //         [`Failed to load crops: ${err.message || "Unknown error"}`]
// //       )
// //     );
// //   }

// //   // Rest of the page can render here after crops section
// //   const restOfPage = createElement("div", { class: "rest-of-page" });
// //   restOfPage.appendChild(
// //     createElement("p", {}, ["Other page content goes here."])
// //   );
// //   renderCropInterface(contentContainer, categorized);
// //   content.appendChild(restOfPage);
// // }

// // // import { createElement } from "../../../components/createElement";
// // // import { apiFetch } from "../../../api/api"; // fixed import
// // // import { guessCategoryFromName } from "./displayCropshelpers";
// // // import { renderCropInterface } from "./displayCropsUI";

// // // export async function displayCrops(content, isLoggedIn) {
// // //   const contentContainer = createElement("div", { class: "cropspage" });
// // //   content.replaceChildren(contentContainer);

// // //   // Render heading immediately
// // //   contentContainer.appendChild(createElement("h2", {}, ["All Crops"]));

// // //   let categorized = {};

// // //   try {
// // //     const response = await apiFetch("/crops/types"); // fixed fetch call

// // //     if (!response || typeof response !== "object") {
// // //       throw new Error("Invalid response from server");
// // //     }

// // //     const { cropTypes } = response;
// // //     if (!Array.isArray(cropTypes)) {
// // //       throw new Error("`cropTypes` is not an array");
// // //     }

// // //     cropTypes.forEach(crop => {
// // //       if (!crop.name) return;

// // //       const category = guessCategoryFromName(crop.name);
// // //       if (!categorized[category]) categorized[category] = [];

// // //       categorized[category].push({
// // //         ...crop,
// // //         imageUrl: crop.imageUrl || "placeholder.jpg",
// // //         category,
// // //         tags: Array.isArray(crop.tags) ? crop.tags : [],
// // //         seasonMonths: Array.isArray(crop.seasonMonths) ? crop.seasonMonths : []
// // //       });
// // //     });

// // //     renderCropInterface(contentContainer, categorized);

// // //   } catch (err) {
// // //     console.error("Error fetching crops:", err);

// // //     // Keep the heading visible and add the error below it
// // //     contentContainer.appendChild(
// // //       createElement(
// // //         "p",
// // //         { class: "error" },
// // //         [`Failed to load crops: ${err.message || "Unknown error"}`]
// // //       )
// // //     );
// // //   }
// // // }

// // // // import { createElement } from "../../../components/createElement";
// // // // import { apigFetch } from "../../../api/api";
// // // // import { guessCategoryFromName } from "./displayCropshelpers";
// // // // import { renderCropInterface } from "./displayCropsUI";

// // // // export async function displayCrops(content, isLoggedIn) {
// // // //   const contentContainer = createElement("div", { class: "cropspage" });
// // // //   content.replaceChildren(contentContainer);

// // // //   contentContainer.appendChild(createElement("h2", {}, ["All Crops"]));

// // // //   let categorized = {};

// // // //   try {
// // // //     const response = await apigFetch("/crops/types");

// // // //     // Validate response
// // // //     if (!response || typeof response !== "object") {
// // // //       throw new Error("Invalid response from server");
// // // //     }

// // // //     const { cropTypes } = response;
// // // //     if (!Array.isArray(cropTypes)) {
// // // //       throw new Error("`cropTypes` is not an array");
// // // //     }

// // // //     // if (!cropTypes.length) {
// // // //       // contentContainer.appendChild(
// // // //         // createElement("p", {}, ["No crops available."])
// // // //       // );
// // // //       // return; 
// // // //     // }

// // // //     cropTypes.forEach(crop => {
// // // //       if (!crop.name) return; // skip invalid crop entries

// // // //       const category = guessCategoryFromName(crop.name);
// // // //       if (!categorized[category]) categorized[category] = [];

// // // //       categorized[category].push({
// // // //         ...crop,
// // // //         imageUrl: crop.imageUrl || "placeholder.jpg",
// // // //         category,
// // // //         tags: Array.isArray(crop.tags) ? crop.tags : [],
// // // //         seasonMonths: Array.isArray(crop.seasonMonths) ? crop.seasonMonths : []
// // // //       });
// // // //     });

// // // //     // Render the interface if there is data
// // // //     // if (Object.keys(categorized).length) {
// // // //       renderCropInterface(contentContainer, categorized);
// // // //     // } else {
// // // //     //   contentContainer.appendChild(
// // // //     //     createElement("p", {}, ["No crops available."])
// // // //     //   );
// // // //     // }

// // // //   } catch (err) {
// // // //     console.error("Error fetching crops:", err);
// // // //     contentContainer.replaceChildren(
// // // //       createElement(
// // // //         "p",
// // // //         { class: "error" },
// // // //         [`Failed to load crops: ${err.message || "Unknown error"}`]
// // // //       )
// // // //     );
// // // //   }
// // // // }


// import { createElement } from "../../../components/createElement";
// import { apigFetch } from "../../../api/api";
// import { guessCategoryFromName } from "./displayCropshelpers";
// import { renderCropInterface } from "./displayCropsUI";

// export async function displayCrops(content, isLoggedIn) {
//   const contentContainer = createElement("div", { class: "cropspage" });
//   content.replaceChildren(contentContainer);

//   contentContainer.appendChild(createElement("h2", {}, ["All Crops"]));

//   let categorized = {};

//   try {
//     const response = await apigFetch("/crops/types");

//     // Validate response
//     if (!response || typeof response !== "object") {
//       throw new Error("Invalid response from server");
//     }

//     const { cropTypes } = response;
//     if (!Array.isArray(cropTypes)) {
//       throw new Error("`cropTypes` is not an array");
//     }

//     cropTypes.forEach(crop => {
//       if (!crop.name) return; // skip invalid crop entries

//       const category = guessCategoryFromName(crop.name);
//       if (!categorized[category]) categorized[category] = [];

//       categorized[category].push({
//         ...crop,
//         imageUrl: crop.imageUrl || "placeholder.jpg",
//         category,
//         tags: Array.isArray(crop.tags) ? crop.tags : [],
//         seasonMonths: Array.isArray(crop.seasonMonths) ? crop.seasonMonths : []
//       });
//     });

//     // Render the interface if there is data
//       renderCropInterface(contentContainer, categorized);

//   } catch (err) {
//     console.error("Error fetching crops:", err);
//     contentContainer.replaceChildren(
//       createElement(
//         "p",
//         { class: "error" },
//         [`Failed to load crops: ${err.message || "Unknown error"}`]
//       )
//     );
//   }
// }
