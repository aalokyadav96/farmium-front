import { SRC_URL, apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";
import Gallery from "../../../components/ui/Gallery.mjs";
import { navigate } from "../../../routes/index.js";
import { getState } from "../../../state/state.js";

import {
  renderFarmDetails,
  renderCropSummary,
  renderCropEmojiMap,
  renderCrops,
} from "./displayFarm.helpers.js";
import { displayReviews } from "../../reviews/displayReviews.js";

export async function displayFarm(isLoggedIn, farmId, container) {
  container.innerHTML = "";

  if (!isLoggedIn) {
    container.textContent = "Please log in to view this farm.";
    return;
  }

  const res = await apiFetch(`/farms/${farmId}`);
  const farm = res?.farm;
  if (!res?.success || !farm) {
    container.textContent = "Farm not found.";
    return;
  }

  const isCreator = getState("user") === farm.createdBy;

  // —— Header & Breadcrumbs ——
  const header = createElement("div", { class: "farm-header" }, [
    Button("← Back", "back-btn", {
      click: () => navigate("/farms")
    }, "buttonx"),
    createElement("div", { class: "breadcrumbs" }, [
      "🏠 Home / 🌾 Farms / ", farm.name
    ])
  ]);

  // —— Banner Image ——
  const banner = createElement("div", { class: "farm-banner" }, [
    createElement("img", {
      src: farm.photo ? SRC_URL + farm.photo : "/default-farm.jpg",
      alt: farm.name
    })
  ]);

  // —— Farm Info & Stats ——
  const farmDetails = renderFarmDetails(farm, isCreator);
  const summaryStats = renderCropSummary(farm.crops || []);
  const cropDistribution = renderCropEmojiMap(farm.crops || []);
  const reviewPlaceholder = createElement("div", { class: "review-block" }, [
    createElement("p", {}, ["⭐️⭐️⭐️⭐️☆ (4.2 avg based on 17 reviews)"]),
    Button("💬 Check reviews", "review-btn", {
      click: () => displayReviews(reviewPlaceholder, isCreator, isLoggedIn, "farm", farmId)
    }, "buttonx"),
    Button("📨 Contact Farm", "contact-btn", {
      click: () =>
        alert(`You can reach ${farm.owner} at ${farm.contact || "N/A"}`)
    }, "buttonx")
  ]);
  const farmCTA = createElement("div", { class: "cta-block" }, [
    Button("Schedule a visit", "cta-visit-btn", {
      click: () => alert("Sheduled"),
    }, "buttonx"),
    Button("Pre-order", "cta-pre-btn", {
      click: () => alert("hey"),
    }, "buttonx"),
  ]);

  const asideColumn = createElement("aside", { class: "farm-aside" }, [
    farmCTA,
    summaryStats,
    cropDistribution,
    reviewPlaceholder
  ]);

  // —— Crops Section ——
  let currentLayout = "grid";

  const cropHeader = createElement("h3", {}, ["🌾 Available Crops"]);

  const layoutToggle = createElement("div", { class: "layout-toggle" }, [
    Button("🔲 Grid View", "grid-btn", {
      click: () => {
        currentLayout = "grid";
        cropsContainer.classList.remove("list-view");
        cropsContainer.classList.add("grid-view");
      }
    }, "buttonx"),
    Button("📃 List View", "list-btn", {
      click: () => {
        currentLayout = "list";
        cropsContainer.classList.remove("grid-view");
        cropsContainer.classList.add("list-view");
      }
    }, "buttonx")
  ]);

  const cropsContainer = createElement("div", {
    class: "crop-list grid-view"
  });

  const addCropButton = createElement("button", { class: "add-crop-btn" }, ["➕ Add Crop"]);
  addCropButton.addEventListener("click", () => {
    if (isCreator) {
      container.textContent = "";
      import("../crop/createCrop.js").then(m => m.createCrop(farmId, container));
    } else {
      alert("Are you logged in as the farm owner?");
    }
  });

  /**/
  const imgarray = (farm.crops || []).map(crop => ({
    src: `${SRC_URL}${crop.imageUrl}`,
    alt: crop.name || "Crop Image"
  }));
  
  const gridGall = createElement("div", { class: "gallery-block" }, [
    Gallery(imgarray),
  ]);
  
  /**/

  const mainColumn = createElement("main", { class: "farm-main" }, [
    farmDetails,
    cropHeader,
    layoutToggle,
    cropsContainer,
    addCropButton
  ]);

  const layoutWrapper = createElement("div", { class: "farm-layout" }, [
    mainColumn,
    asideColumn
  ]);

  // container.append(header, banner, layoutWrapper);
  container.append(header, banner, layoutWrapper, gridGall);

  // —— Initial Crop Render ——
  await renderCrops(farm, cropsContainer, farmId, container, isLoggedIn, null, isCreator);
}
