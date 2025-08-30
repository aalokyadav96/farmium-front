import { state } from "../../state/state.js";
import { SRC_URL, apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { renderPlaceDetails } from "./renderPlaceDetails.js";
import { displayMedia } from "../media/mediaService.js";
import { displayReviews } from "../reviews/displayReviews.js";
import { persistTabs } from "../../utils/persistTabs.js";
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
import Notify from "../../components/ui/Notify.mjs";

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

    // ─── Place Header Section with Meta Actions ────────────────────────────────
    const headerSection = createElement("div", {
      class: "place-header"
    });

    const titleRow = createElement("div", {
      style: "display:flex;align-items:center;justify-content:space-between;"
    });

    const heading = createElement("h1", {}, [placeData.name || "Unnamed"]);
    titleRow.appendChild(heading);

    // Verified Badge
    if (isCreator) {
      titleRow.appendChild(createElement("span", {
        style: "margin-left:8px;padding:2px 6px;background:#28a745;color:#fff;font-size:0.8rem;border-radius:4px;"
      }, ["Verified Owner"]));
    }

    // Actions (Bookmark, Share, Map)
    const actions = createElement("div", {
      style: "display:flex;gap:8px;align-items:center;"
    });

    // Bookmark
    const bookmarked = getBookmarks().includes(placeId);
    const bookmarkBtn = createElement("button", {
      title: "Bookmark this place",
      onclick: () => {
        toggleBookmark(placeId);
        bookmarkBtn.textContent = getBookmarks().includes(placeId) ? "★" : "☆";
      },
      style: "font-size:20px;cursor:pointer;border:none;background:none;"
    }, [bookmarked ? "★" : "☆"]);

    // Share
    const shareBtn = createElement("button", {
      title: "Share",
      onclick: () => {
        navigator.clipboard.writeText(location.href);
        Notify("Link copied to clipboard", {type: "success", duration: 3000, dismissible: true});
      },
      style: "cursor:pointer;font-size:16px;border:none;background:none;"
    }, ["🔗"]);

    // Open in Map
    const { lat, lng } = placeData.coordinates || {};
    if (lat && lng) {
      const mapBtn = createElement("a", {
        href: `https://maps.google.com/?q=${lat},${lng}`,
        target: "_blank",
        rel: "noopener noreferrer",
        title: "Open in Maps",
        style: "font-size:16px;text-decoration:none;"
      }, ["🗺️"]);
      actions.appendChild(mapBtn);
    }

    actions.appendChild(bookmarkBtn);
    actions.appendChild(shareBtn);
    titleRow.appendChild(actions);
    headerSection.appendChild(titleRow);
    contentContainer.appendChild(headerSection);

    // ─── Editable Details ───────────────────────────────────────────────────────
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

    // ─── Category-Specific Tabs ─────────────────────────────────────────────────
    const categoryRaw = placeData.category || "";
    const category = categoryRaw.trim().toLowerCase();

    const categoryTabs = {
      restaurant: () => displayPlaceMenu,
      café: () => displayPlaceMenu,
      cafe: () => displayPlaceMenu,
      hotel: () => displayPlaceRooms,
      park: () => displayPlaceFacilities,
      business: () => displayPlaceServices,
      shop: () => displayPlaceProducts,
      museum: () => displayPlaceExhibits,
      gym: () => displayPlaceMembership,
      theater: () => displayPlaceShows,
      saloon: () => displaySaloonSlots,
      arena: () => displayPlaceEvents,
    };

    if (categoryTabs[category]) {
      const tabName = category.charAt(0).toUpperCase() + category.slice(1);
      tabs.push({
        title: category === "cafe" || category === "café" ? "Menu" : tabName,
        id: `${category}-tab`,
        render: (container) => categoryTabs[category]()(container, placeId, isCreator, isLoggedIn)
      });
    } else {
      tabs.push({
        title: "Details",
        id: "details-tab",
        render: (container) => displayPlaceDetailsFallback(container, categoryRaw, placeId)
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
          }
        },
      }
    );

    // ─── Final Tab Rendering ────────────────────────────────────────────────────
    persistTabs(contentContainer, tabs, `place-tabs:${placeId}`);

  } catch (err) {
    console.error("displayPlace error:", err);
    contentContainer.innerHTML = "";
    contentContainer.appendChild(
      createElement("h1", {}, [`Error loading place: ${err.message}`])
    );
    Notify("Failed to load place details. Please try again later.", {type: "error", duration: 3000, dismissible: true});
  }
}

// ─── Bookmark Utility Functions ─────────────────────────────────────────────────

function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem("bookmarked_places") || "[]");
  } catch {
    return [];
  }
}

function toggleBookmark(placeId) {
  let bookmarks = getBookmarks();
  if (bookmarks.includes(placeId)) {
    bookmarks = bookmarks.filter(id => id !== placeId);
  } else {
    bookmarks.push(placeId);
  }
  localStorage.setItem("bookmarked_places", JSON.stringify(bookmarks));
}
