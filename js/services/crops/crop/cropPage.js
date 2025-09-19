import { createUserControls } from "../farm/displayFarmHelpers.js";
import NoLink from "../../../components/base/NoLink";
import { createElement } from "../../../components/createElement";
import { apigFetch } from "../../../api/api";
import { navigate } from "../../../routes";
import Imagex from "../../../components/base/Imagex";
import { resolveImagePath, PictureType, EntityType } from "../../../utils/imagePaths.js";
import Notify from "../../../components/ui/Notify.mjs";

/**
 * Displays crop listings and allows adding to cart with +/- controls.
 *
 * @param {HTMLElement} content
 * @param {string} cropID
 * @param {boolean} isLoggedIn
 */
export async function displayCrop(content, cropID, isLoggedIn) {
  const contentContainer = createElement('div', { class: "croppage" }, []);
  content.replaceChildren();
  content.appendChild(contentContainer);

  const qs = new URLSearchParams({ page: 1, limit: 5 });

  try {
    const resp = await apigFetch(`/crops/crop/${cropID}?${qs}`);

    if (!resp.success || !Array.isArray(resp.listings) || resp.listings.length === 0) {
      Notify('No listings found', { type: 'error', dismissible: true });
      return;
    }

    // Crop title with category
    const title = NoLink(`${resp.name} (${resp.category})`, "", {
      click: () => navigate(`/aboutcrop/${cropID}`)
    });

    const meta = createElement('p', {}, [`Total Listings: ${resp.total}`]);
    const listingsContainer = createElement('div', { id: 'listings-container' });

    resp.listings.forEach(listing => {
      const croppic = resolveImagePath(EntityType.CROP, PictureType.THUMB, listing.imageUrl);

      const cardChildren = [
        createElement('h3', {}, [
          createElement('a', { events: { click: () => navigate(`/farm/${listing.farmId}`) } }, [listing.farmName || 'Unnamed Farm'])
        ]),
        Imagex({ src: croppic, alt: listing.breed || listing.farmName, loading: "lazy" }),
        createElement('p', {}, [`Location: ${listing.location || 'Unknown'}`]),
        createElement('p', {}, [`Breed: ${listing.breed || 'Not specified'}`]),
        createElement('p', {}, [`Price per Kg: ₹${listing.pricePerKg ?? 'N/A'}`]),
        createElement('p', {}, [`Available: ${listing.availableQtyKg ?? 'N/A'} Kg`]),
        createElement('p', {}, [`Harvest Date: ${listing.harvestDate ? new Date(listing.harvestDate).toLocaleDateString() : 'N/A'}`])
      ];

      // Controls for quantity and add to cart
      const cropData = {
        name: resp.name,
        cropid: listing.cropid,
        pricePerKg: listing.pricePerKg,
        unit: "kg",
        breed: listing.breed,
      };
      const controls = createUserControls(cropData, listing.farmName || "Unnamed Farm", listing.farmId, isLoggedIn, listing.availableQtyKg, listing.cropid);
      cardChildren.push(...controls);

      const card = createElement('div', { id: `farm-${listing.farmId}-${listing.cropid}`, class: 'crop-card' }, cardChildren);
      listingsContainer.appendChild(card);
    });

    contentContainer.append(title, meta, listingsContainer);

  } catch (err) {
    Notify(err.message, { type: 'error', dismissible: true });
  }
}
