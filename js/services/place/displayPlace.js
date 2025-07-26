import { state } from "../../state/state.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { renderPlaceDetails } from "./renderPlaceDetails.js";
import { displayMedia } from "../media/mediaService.js";
import Snackbar from "../../components/ui/Snackbar.mjs";
import { displayReviews } from "../reviews/displayReviews.js";
// import { createTabs } from "../../components/ui/createTabs.js";
import {persistTabs} from "../../utils/persistTabs.js";
import { displayPlaceInfo } from "./placeTabs.js";
import {
  displayPlaceNearby,
  displayPlaceMenu,
  displayPlaceRooms,
  displayPlaceFacilities,
  displayPlaceServices,
  displayPlaceProducts,
  displayPlaceExhibits,
  displayPlaceMembership,
  displayPlaceShows,
  displaySaloonSlots,
  displayPlaceEvents,
  displayPlaceDetailsFallback,
} from "./customTabs.js";

export default async function displayPlace(isLoggedIn, placeId, contentContainer) {
  if (!placeId || !contentContainer || !(contentContainer instanceof HTMLElement)) {
    console.error("Invalid arguments passed to displayPlace.");
    return;
  }

  try {
    const placeData = await apiFetch(`/places/place/${placeId}`);
    if (!placeData || typeof placeData !== "object") {
      throw new Error("Invalid place data received.");
    }

    const isCreator = isLoggedIn && state.user === placeData.createdBy;

    contentContainer.innerHTML = "";

    // ─── (Optional) Banner Section ──────────────────────────────────────────────
    // (You may uncomment this and style accordingly)
    
    // const bannerURL = placeData.banner
    //   ? `${SRC_URL}/placepic/${placeData.banner}`
    //   : "default-banner.jpg";
    
    // contentContainer.appendChild(
    //   createElement("div", { id: "place-banner" }, [
    //     createElement("img", {
    //       src: bannerURL,
    //       alt: placeData.name || "Place Banner",
    //       loading: "lazy",
    //     }),
    //   ])
    // );

    // ─── Creator Editable Details ───────────────────────────────────────────────
      const editSection = createElement("div", { class: "detail-section vflex" });
      try {
        renderPlaceDetails(isLoggedIn, editSection, placeData, isCreator);
        contentContainer.appendChild(editSection);
      } catch (err) {
        console.warn("Failed to render edit section:", err);
      }

    // ─── Tabs Setup ─────────────────────────────────────────────────────────────
    const tabs = [];

    // Always include Info tab
    tabs.push({
      title: "Info",
      id: "info-tab",
      render: (container) => {
        try {
          displayPlaceInfo(container, placeData, isCreator);
        } catch (err) {
          container.textContent = "Failed to load info.";
          console.warn("Info tab failed:", err);
        }
      },
    });

    const categoryRaw = placeData.category || "";
    const category = categoryRaw.trim().toLowerCase();

    // ─── Category-Specific Tabs ─────────────────────────────────────────────────
    if (category === "restaurant" || category === "café" || category === "cafe") {
      tabs.push({
        title: "Menu",
        id: "menu-tab",
        render: (container) => displayPlaceMenu(container, placeId, isCreator, isLoggedIn),
      });
    } else if (category === "hotel") {
      tabs.push({
        title: "Rooms",
        id: "rooms-tab",
        render: (container) => displayPlaceRooms(container, placeId, isCreator),
      });
    } else if (category === "park") {
      tabs.push({
        title: "Facilities",
        id: "facilities-tab",
        render: (container) => displayPlaceFacilities(container, placeId, isCreator),
      });
    } else if (category === "business") {
      tabs.push({
        title: "Services",
        id: "services-tab",
        render: (container) => displayPlaceServices(container, placeId, isCreator),
      });
    } else if (category === "shop") {
      tabs.push({
        title: "Products",
        id: "products-tab",
        render: (container) => displayPlaceProducts(container, placeId, isCreator, isLoggedIn),
      });
    } else if (category === "museum") {
      tabs.push({
        title: "Exhibits",
        id: "exhibits-tab",
        render: (container) => displayPlaceExhibits(container, placeId, isCreator),
      });
    } else if (category === "gym") {
      tabs.push({
        title: "Membership",
        id: "membership-tab",
        render: (container) => displayPlaceMembership(container, placeId, isCreator, isLoggedIn),
      });
    } else if (category === "theater") {
      tabs.push({
        title: "Shows",
        id: "shows-tab",
        render: (container) => displayPlaceShows(container, placeId, isCreator, isLoggedIn),
      });
    } else if (category === "saloon") {
      tabs.push({
        title: "Slots",
        id: "slots-tab",
        render: (container) => displaySaloonSlots(container, placeId),
      });
    } else if (category === "arena") {
      tabs.push({
        title: "Events",
        id: "events-tab",
        render: (container) => displayPlaceEvents(container, placeId, isCreator, isLoggedIn),
      });
    } else {
      tabs.push({
        title: "Details",
        id: "details-tab",
        render: (container) => displayPlaceDetailsFallback(container, categoryRaw, placeId),
      });
    }

    // ─── Common Tabs ────────────────────────────────────────────────────────────
    tabs.push(
      {
        title: "Nearby",
        id: "nearby-tab",
        render: (container) => {
          try {
            displayPlaceNearby(container, placeId);
          } catch (err) {
            container.textContent = "Nearby places unavailable.";
            console.warn("Nearby tab failed:", err);
          }
        },
      },
      {
        title: "Gallery",
        id: "gallery-tab",
        render: (container) => {
          try {
            displayMedia(container, "place", placeId, isLoggedIn);
          } catch (err) {
            container.textContent = "Gallery could not load.";
            console.warn("Gallery tab failed:", err);
          }
        },
      },
      {
        title: "Reviews",
        id: "reviews-tab",
        render: (container) => {
          try {
            displayReviews(container, isCreator, isLoggedIn, "place", placeId);
          } catch (err) {
            container.textContent = "Reviews unavailable.";
            console.warn("Reviews tab failed:", err);
          }
        },
      }
    );

    // ─── Final Tab Rendering ────────────────────────────────────────────────────
    // placeTabs(contentContainer, tabs, `place-tabs:${placeId}`);
    persistTabs(contentContainer, tabs, `place-tabs:${placeId}`);

    // try {
    //   const tabsElement = createTabs(tabs);
    //   contentContainer.appendChild(tabsElement);
    // } catch (err) {
    //   console.warn("Tabs component failed to initialize:", err);
    // }

  } catch (err) {
    console.error("displayPlace error:", err);
    contentContainer.innerHTML = "";
    contentContainer.appendChild(
      createElement("h1", {}, [`Error loading place: ${err.message}`])
    );
    Snackbar("Failed to load place details. Please try again later.", 3000);
  }
}

// export function placeTabs(container, tabs, storageKey = null) {
//   try {
//       const activeTabId = storageKey ? localStorage.getItem(storageKey) : null;

//       const tabsElement = createTabs(tabs, storageKey, activeTabId, (newTabId) => {
//           if (storageKey) {
//               localStorage.setItem(storageKey, newTabId);
//           }
//       });

//       container.appendChild(tabsElement);
//   } catch (err) {
//       console.warn("Tabs component failed to initialize:", err);
//   }
// }
