import { createUserControls } from "../farm/displayFarmHelpers.js";
import NoLink from "../../../components/base/NoLink";
import { createElement } from "../../../components/createElement";
import { apiFetch } from "../../../api/api";
import { navigate } from "../../../routes";
import Imagex from "../../../components/base/Imagex";
import { resolveImagePath, PictureType, EntityType } from "../../../utils/imagePaths.js";
import Notify from "../../../components/ui/Notify.mjs";

/**
 * Displays detailed crop listings in a professional layout.
 * 
 * @param {HTMLElement} content
 * @param {string} cropID
 * @param {boolean} isLoggedIn
 */
export async function displayCrop(content, cropID, isLoggedIn) {
  const container = createElement('div', { class: "croppage" });
  content.replaceChildren(container);

  try {
    const resp = await apiFetch(`/crops/crop/${cropID}?page=1&limit=5`);

    if (!resp.success || !Array.isArray(resp.listings) || resp.listings.length === 0) {
      Notify('No listings found for this crop.', { type: 'error', dismissible: true });
      return;
    }

    // Header section
    const header = createElement('header', { class: 'crop-header' }, [
      NoLink(`${resp.name} (${resp.category})`, "", {
        click: () => navigate(`/aboutcrop/${cropID}`)
      }),
      createElement('p', { class: 'crop-meta' }, [
        `Total Listings: ${resp.total}`
      ])
    ]);

    // Listings wrapper
    const listingsWrapper = createElement('section', { class: 'crop-listings' });

    resp.listings.forEach(listing => {
      const imageSrc = resolveImagePath(EntityType.CROP, PictureType.THUMB, listing.banner);
      const farmName = listing.farmName || "Unnamed Farm";

      // Left side: image
      const imageSection = createElement('div', { class: 'listing-image' }, [
        Imagex({ src: imageSrc, alt: listing.breed || farmName, loading: "lazy" })
      ]);

      // Right side: details
      const detailsSection = createElement('div', { class: 'listing-details' }, [
        createElement('h3', { class: 'farm-link' }, [
          createElement('a', { events: { click: () => navigate(`/farm/${listing.farmid}`) } }, [farmName])
        ]),
        createElement('p', {}, [`Breed: ${listing.breed || 'Not specified'}`]),
        createElement('p', {}, [`Location: ${listing.location || 'Unknown'}`]),
        createElement('p', {}, [`Price per Kg: ₹${listing.pricePerKg ?? 'N/A'}`]),
        createElement('p', {}, [`Available: ${listing.availableQtyKg ?? 'N/A'} Kg`]),
        createElement('p', {}, [`Harvest Date: ${listing.harvestDate ? new Date(listing.harvestDate).toLocaleDateString() : 'N/A'}`])
      ]);

      // Controls
      const cropData = {
        name: resp.name,
        cropid: listing.cropid,
        pricePerKg: listing.pricePerKg,
        unit: "kg",
        breed: listing.breed,
      };

      const controls = createUserControls(
        cropData,
        farmName,
        listing.farmid,
        isLoggedIn,
        listing.availableQtyKg,
        listing.cropid
      );

      const controlsSection = createElement('div', { class: 'listing-controls' }, controls);

      // Combine
      const card = createElement('div', { class: 'listing-card', id: `farm-${listing.farmid}-${listing.cropid}` }, [
        imageSection,
        createElement('div', { class: 'listing-content' }, [
          detailsSection,
          controlsSection
        ])
      ]);

      listingsWrapper.appendChild(card);
    });

    // Append to page
    container.append(header, listingsWrapper);

  } catch (err) {
    Notify(err.message || "Failed to load crop details.", { type: 'error', dismissible: true });
  }
}
