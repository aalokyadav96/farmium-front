
import { SRC_URL, apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";
import Gallery from "../../../components/ui/Gallery.mjs";
import { navigate } from "../../../routes/index.js";
import { getState } from "../../../state/state.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";

import { updateImageWithCrop } from "../../../utils/bannerEditor.js"; // adjust path
import {
  renderFarmDetails,
  renderCropSummary,
  renderCropEmojiMap,
  renderCrops,
} from "./displayFarm.helpers.js";
import { displayReviews } from "../../reviews/displayReviews.js";
import { farmChat } from "./farmchat.js";
import Imagex from "../../../components/base/Imagex.js";

export async function displayFarm(isLoggedIn, farmId, content) {
  const container = createElement("div", { class: "farmpage" }, []);
  content.innerHTML = "";
  content.appendChild(container);

  const res = await apiFetch(`/farms/${farmId}`);
  const farm = res?.farm;
  if (!res?.success || !farm) {
    container.textContent = "Farm not found.";
    return;
  }

  const isCreator = getState("user") === farm.createdBy;

  // ——— Header ———
  const header = createElement("div", { class: "farm-header" }, [
    Button("← Back", "back-btn", { click: () => navigate("/farms") }, "buttonx"),
    createElement("div", { class: "breadcrumbs" }, [
      "🏠 Home / 🌾 Farms / ", farm.name
    ])
  ]);

  // ——— Banner ———
  const banner = createElement("div", { class: "farm-banner" }, [
    Imagex({
      src: resolveImagePath(EntityType.FARM, PictureType.BANNER, farm.photo),
      alt: farm.name
    })
  ]);

  if (isCreator){
    // Add Banner Edit Button here
    const bannerEditButton = createElement("button", { class: "edit-banner-pic" }, ["Edit Banner"]);
    bannerEditButton.addEventListener("click", () => {
      updateImageWithCrop({
        entityType: EntityType.FARM,
        imageType: "banner",
        stateKey: "banner",
        stateEntityKey: "farm",
        previewElementId: "farm-banner-img",
        pictureType: PictureType.BANNER,
        entityId: farmId  // <-- pass placeid here
      });
    });
    
    banner.appendChild(bannerEditButton);
  }
  // ——— Farm Info ———
  const farmDetails = renderFarmDetails(farm, isCreator);
  const editFarm = createElement("div", {}, []); // Preserved editFarm div

  // ——— Crop Section Setup ———
  const cropsContainer = createElement("div", {
    class: "crop-list grid-view"
  });

  const layoutToggle = createElement("div", { class: "layout-toggle" }, [
    Button("🔲 Grid View", "grid-btn", {
      click: () => {
        cropsContainer.classList.remove("list-view");
        cropsContainer.classList.add("grid-view");
      }
    }, "buttonx"),
    Button("📃 List View", "list-btn", {
      click: () => {
        cropsContainer.classList.remove("grid-view");
        cropsContainer.classList.add("list-view");
      }
    }, "buttonx")
  ]);

  const cropHeader = createElement("h3", {}, ["🌾 Available Crops"]);

  const addCropButton = isCreator
    ? createElement("button", { class: "add-crop-btn" }, ["➕ Add Crop"])
    : null;

  if (addCropButton) {
    addCropButton.addEventListener("click", () => {
      container.textContent = "";
      import("../crop/createCrop.js").then(m => m.createCrop(farmId, container));
    });
  }

  // ——— Aside Column ———
  const summaryStats = renderCropSummary(farm.crops || []);
  const cropDistribution = renderCropEmojiMap(farm.crops || []);

  const reviewPlaceholder = createElement("div", { class: "review-block" }, [
    createElement("p", {}, ["⭐️⭐️⭐️⭐️☆ (4.2 avg based on 17 reviews)"]),
    Button("💬 Check reviews", "review-btn", {
      click: () => displayReviews(reviewPlaceholder, isCreator, isLoggedIn, "farm", farmId)
    }, "buttonx"),
    ...(isLoggedIn ? [
      Button("📨 Contact Farm", "contact-btn", {
        click: () => alert(`You can reach ${farm.owner} at ${farm.contact || "N/A"}`)
      }, "buttonx")
    ] : [])
  ]);

  const farmCTA = createElement("div", { class: "cta-block" }, [
    ...(isLoggedIn ? [
      Button("Schedule a visit", "cta-visit-btn", {
        click: () => alert("Scheduled"),
      }, "buttonx"),
      Button("Pre-order", "cta-pre-btn", {
        click: () => alert("Pre-ordered"),
      }, "buttonx"),
      Button("Chat", "cta-chat-btn", {
        click: () => farmChat(farm.createdBy, farm.farmId)
      }, "buttonx")
    ] : [
      createElement("p", {}, ["🔒 Log in to schedule a visit, pre-order, or chat with this farm."])
    ])
  ]);

  const asideColumn = createElement("aside", { class: "farm-aside" }, [
    farmCTA,
    summaryStats,
    cropDistribution,
    reviewPlaceholder
  ]);

  // ——— Main Column ———
  const mainColumnChildren = [
    banner,
    farmDetails,
    editFarm,
    ...(addCropButton ? [addCropButton] : []),
    cropHeader,
    layoutToggle,
    cropsContainer
  ];

  const mainColumn = createElement("div", { class: "farm-main" }, mainColumnChildren);
  const layoutWrapper = createElement("div", { class: "farm-layout" }, [mainColumn, asideColumn]);

  // ——— Gallery ———
  const imgarray = (farm.crops || []).map(crop => ({
    src: resolveImagePath(EntityType.CROP, PictureType.THUMB, crop.imageUrl),
    alt: crop.name || "Crop Image"
  }));

  const gallery = createElement("div", { class: "gallery-block" }, [
    Gallery(imgarray)
  ]);

  const chatcon = createElement("div", { class: "onechatcon" }, []);

  // ——— Final Assembly ———
  container.append(header, layoutWrapper, gallery, chatcon);

  // ——— Render Crops ———
  await renderCrops(farm, cropsContainer, farmId, container, isLoggedIn, null, isCreator);
}
