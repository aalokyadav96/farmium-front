import { createUserControls } from "../farm/displayFarm.helpers";
// import Button from "../../../components/base/Button";
import NoLink from "../../../components/base/NoLink";
import { createElement } from "../../../components/createElement";
import { apiFetch } from "../../../api/api";
import { navigate } from "../../../routes";


/**
 * Displays crop listings and allows adding to cart with +/- controls.
 *
 * @param {HTMLElement} content
 * @param {string} cropID
 * @param {boolean} isLoggedIn
 */
export async function displayCrop(content, cropID, isLoggedIn) {
  const contentContainer = createElement('div', { class: "croppage" }, []);
  while (content.firstChild) content.removeChild(content.firstChild);
  content.appendChild(contentContainer);

  const qs = new URLSearchParams({ page: 1, limit: 5 });

  try {
    const resp = await apiFetch(`/crops/crop/${cropID}?${qs}`);

    if (!resp.success || !Array.isArray(resp.listings) || resp.listings.length === 0) {
      renderError(contentContainer, 'No listings found', () => displayCrop(content, cropID, isLoggedIn));
      return;
    }

    // // const title = createElement('h2', {}, [`${resp.name} (${resp.category})`]);
    // const title = createElement('h2', {
    //   click: () => navigate(`/aboutcrop/${cropID}`)
    // }, [createElement('a', {"class":"nav-link", "href":`/aboutcrop/${cropID}`}, [`${resp.name} (${resp.category})`])]);

    // const wikiButton = Button("Crop Wiki", "", {
    //   click: () => navigate(`/aboutcrop/${cropID}`)
    // }, "buttonx action-btn");

    const title = NoLink(`${resp.name} (${resp.category})`, "", {
      click: ()=> {navigate(`/aboutcrop/${cropID}`);}
    });

    const meta = createElement('p', {}, [`Total Listings: ${resp.total}`]);
    const listingsContainer = createElement('div', { id: 'listings-container' });

    resp.listings.forEach(listing => {
      const cardChildren = [
        createElement('h3', {}, [
          createElement('a', {
            events: { click: () => navigate(`/farm/${listing.farmId}`) }
          }, [listing.farmName || 'Unnamed Farm'])
        ]),
        createElement('p', {}, [`Location: ${listing.location || 'Unknown'}`]),
        createElement('p', {}, [`Breed: ${listing.breed || 'Not specified'}`]),
        createElement('p', {}, [`Price per Kg: ₹${listing.pricePerKg ?? 'N/A'}`])
      ];

      if (listing.availableQtyKg !== undefined) {
        cardChildren.push(createElement('p', {}, [`Available: ${listing.availableQtyKg} Kg`]));
      }

      if (listing.harvestDate) {
        cardChildren.push(createElement('p', {}, [`Harvest Date: ${listing.harvestDate}`]));
      }

      if (Array.isArray(listing.tags) && listing.tags.length > 0) {
        cardChildren.push(createElement('p', {}, [`Tags: ${listing.tags.join(', ')}`]));
      } else {
        cardChildren.push(createElement('p', {}, ['Tags: None']));
      }

      // Controls for quantity and add to cart
      const cropData = {
        name: resp.name,
        unit: "kg",
        price: listing.pricePerKg
      };
      const controls = createUserControls(cropData, listing.farmName || "Unnamed Farm", listing.farmId, isLoggedIn, listing.availableQtyKg);
      cardChildren.push(...controls);

      const card = createElement('div', { id: `farm-${listing.farmId}` }, cardChildren);
      listingsContainer.appendChild(card);
    });

    contentContainer.appendChild(title);
    contentContainer.appendChild(meta);
    // contentContainer.appendChild(wikiButton);
    contentContainer.appendChild(listingsContainer);

  } catch (err) {
    renderError(contentContainer, err.message, () => displayCrop(content, cropID, isLoggedIn));
  }
}


// // export async function displayCrop(content, cropID, isLoggedIn) {
// //   let contentContainer = createElement('div', { "class": "croppage" }, []);

// //   content.innerHTML = "";
// //   content.appendChild(contentContainer);
// //   const qs = new URLSearchParams({
// //     page: 1,
// //     limit: 5
// //   });

// //   try {
// //     const resp = await apiFetch(`/crops/crop/${cropID}?${qs}`);

// //     if (!resp.success || !Array.isArray(resp.listings) || resp.listings.length === 0) {
// //       renderError(contentContainer, 'No listings found', () => displayCrop(contentContainer, cropID, isLoggedIn));
// //       return;
// //     }

// //     // Clear container
// //     while (contentContainer.firstChild) contentContainer.removeChild(contentContainer.firstChild);

// //     // Title
// //     const title = createElement('h2', {}, [`${resp.name} (${resp.category})`]);
// //     const meta = createElement('p', {}, [`Total Listings: ${resp.total}`]);
// //     const wikiButton = Button("Crop Wiki", "", {
// //       click: () => {
// //         navigate(`/aboutcrop/${cropID}`);
// //       }
// //     }, "buttonx action-btn");

// //     const listingsContainer = createElement('div', { id: 'listings-container' });

// //     // Build listings
// //     resp.listings.forEach(listing => {
// //       const card = createElement('div', { id: `farm-${listing.farmId}` }, [
// //         // createElement('h3', {}, [createElement('a', {"href":`/farm/${listing.farmId}`}, [listing.farmName || 'Unnamed Farm']),]),
// //         createElement('h3', {}, [createElement('a', { "events": { click: () => { navigate(`/farm/${listing.farmId}`) } } }, [listing.farmName || 'Unnamed Farm']),]),
// //         createElement('p', {}, [`Location: ${listing.location || 'Unknown'}`]),
// //         createElement('p', {}, [`Breed: ${listing.breed || 'Not specified'}`]),
// //         createElement('p', {}, [`Price per Kg: ₹${listing.pricePerKg ?? 'N/A'}`]),
// //         listing.availableQtyKg !== undefined ? createElement('p', {}, [`Available: ${listing.availableQtyKg} Kg`]) : null,
// //         listing.harvestDate ? createElement('p', {}, [`Harvest Date: ${listing.harvestDate}`]) : null,
// //         Array.isArray(listing.tags) && listing.tags.length > 0
// //           ? createElement('p', {}, [`Tags: ${listing.tags.join(', ')}`])
// //           : createElement('p', {}, ['Tags: None'])
// //       ].filter(Boolean)); // Remove null entries
// //       createUserControls(listing.cropID, listing.farmId, isLoggedIn);
// //       listingsContainer.appendChild(card);
// //     });

// //     // Append to container
// //     contentContainer.appendChild(title);
// //     contentContainer.appendChild(meta);
// //     contentContainer.appendChild(wikiButton);
// //     contentContainer.appendChild(listingsContainer);

// //   } catch (err) {
// //     renderError(contentContainer, err.message, () => displayCrop(contentContainer, cropID, isLoggedIn));
// //   }
// // }

// export async function displayCrop(content, cropID, isLoggedIn) {
//   const contentContainer = createElement('div', { "class": "croppage" }, []);
//   while (content.firstChild) content.removeChild(content.firstChild);
//   content.appendChild(contentContainer);

//   const qs = new URLSearchParams({
//     page: 1,
//     limit: 5
//   });

//   try {
//     const resp = await apiFetch(`/crops/crop/${cropID}?${qs}`);

//     if (!resp.success || !Array.isArray(resp.listings) || resp.listings.length === 0) {
//       renderError(contentContainer, 'No listings found', () => displayCrop(content, cropID, isLoggedIn));
//       return;
//     }

//     const title = createElement('h2', {}, [`${resp.name} (${resp.category})`]);
//     const meta = createElement('p', {}, [`Total Listings: ${resp.total}`]);
//     const wikiButton = Button("Crop Wiki", "", {
//       click: () => navigate(`/aboutcrop/${cropID}`)
//     }, "buttonx action-btn");

//     const listingsContainer = createElement('div', { id: 'listings-container' });

//     resp.listings.forEach(listing => {
//       const cardChildren = [
//         createElement('h3', {}, [
//           createElement('a', {
//             "events": { click: () => navigate(`/farm/${listing.farmId}`) }
//           }, [listing.farmName || 'Unnamed Farm'])
//         ]),
//         createElement('p', {}, [`Location: ${listing.location || 'Unknown'}`]),
//         createElement('p', {}, [`Breed: ${listing.breed || 'Not specified'}`]),
//         createElement('p', {}, [`Price per Kg: ₹${listing.pricePerKg ?? 'N/A'}`]),
//       ];

//       if (listing.availableQtyKg !== undefined) {
//         cardChildren.push(createElement('p', {}, [`Available: ${listing.availableQtyKg} Kg`]));
//       }

//       if (listing.harvestDate) {
//         cardChildren.push(createElement('p', {}, [`Harvest Date: ${listing.harvestDate}`]));
//       }

//       if (Array.isArray(listing.tags) && listing.tags.length > 0) {
//         cardChildren.push(createElement('p', {}, [`Tags: ${listing.tags.join(', ')}`]));
//       } else {
//         cardChildren.push(createElement('p', {}, ['Tags: None']));
//       }

//       // Input for quantity
//       const quantityInput = createElement('input', {
//         type: 'number',
//         min: 1,
//         max: listing.availableQtyKg,
//         placeholder: 'Quantity in Kg',
//         style: 'width: 120px; margin-right: 8px;'
//       });

//       // Add to Cart button
//       const addToCartBtn = Button('Add to Cart', '', {
//         click: () => {
//           const qty = parseFloat(quantityInput.value);
//           if (!qty || qty <= 0 || qty > listing.availableQtyKg) {
//             Toast(`Enter valid quantity (1 - ${listing.availableQtyKg})`, 'error');
//             return;
//           }

//           addToCart({
//             category: 'crops',
//             item: resp.name,
//             unit: 'kg',
//             farm: listing.farmName || 'Unnamed Farm',
//             quantity: qty,
//             price: listing.pricePerKg,
//             isLoggedIn
//           });
//         }
//       }, 'buttonx');

//       // Action wrapper
//       const actionRow = createElement('div', { style: 'margin-top: 10px;' }, [
//         quantityInput,
//         addToCartBtn
//       ]);

//       cardChildren.push(actionRow);

//       const card = createElement('div', { id: `farm-${listing.farmId}` }, cardChildren);

//       listingsContainer.appendChild(card);
//     });

//     contentContainer.appendChild(title);
//     contentContainer.appendChild(meta);
//     contentContainer.appendChild(wikiButton);
//     contentContainer.appendChild(listingsContainer);

//   } catch (err) {
//     renderError(contentContainer, err.message, () => displayCrop(content, cropID, isLoggedIn));
//   }
// }

function renderError(container, msg, retryFn) {
  while (container.firstChild) container.removeChild(container.firstChild);

  const message = createElement('p', {}, [`Error: ${msg}`]);
  const retryBtn = createElement('button', { onclick: retryFn }, ['Retry']);

  container.appendChild(message);
  container.appendChild(retryBtn);
}
