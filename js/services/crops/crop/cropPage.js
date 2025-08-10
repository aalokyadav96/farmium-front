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

