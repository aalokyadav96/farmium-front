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
  renderCrops,createSortDropdown,
} from "./displayFarmHelpers.js";
import { displayReviews } from "../../reviews/displayReviews.js";
import { farmChat } from "./farmchat.js";
import Imagex from "../../../components/base/Imagex.js";
import NoLink from "../../../components/base/NoLink.js";

export async function displayFarm(isLoggedIn, farmId, content) {
  const container = createElement("div", { class: "farmpage" }, []);
  content.replaceChildren(container);

  const res = await apiFetch(`/farms/${farmId}`);
  const farm = res?.farm;
  if (!res?.success || !farm) {
    container.textContent = "Farm not found.";
    return;
  }

  const isCreator = getState("user") === farm.createdBy;

  // ——— Header ———
  const header = createElement("div", { class: "farm-header" }, [
    createElement("div", { class: "breadcrumbs" }, [
      NoLink("🏠 Home", "", { click: () => navigate("/") }),
      " / ",
      NoLink("🌾 Farms", "", { click: () => navigate("/farms") }),
      " / ",
      createElement("span", {}, [farm.name])
    ])
  ]);

  // ——— Banner ———
  const banner = createElement("div", { class: "farm-banner" }, [
    Imagex({
      src: resolveImagePath(EntityType.FARM, PictureType.BANNER, farm.photo),
      alt: farm.name,
      id: "farm-banner-img"
    })
  ]);

  if (isCreator) {
    const bannerEditButton = createElement("button", { class: "edit-banner-pic" }, ["Edit Banner"]);
    bannerEditButton.addEventListener("click", () => {
      updateImageWithCrop({
        entityType: EntityType.FARM,
        imageType: "banner",
        stateKey: "banner",
        stateEntityKey: "farm",
        previewElementId: "farm-banner-img",
        pictureType: PictureType.BANNER,
        entityId: farmId
      });
    });
    banner.appendChild(bannerEditButton);
  }

  // ——— Farm Info ———
  const farmDetails = renderFarmDetails(farm, isCreator);

  // ——— Crop Section ———
  const cropsContainer = createElement("div", { class: "crop-list grid-view" });
  const cropHeader = createElement("div", { class: "crop-header" }, [
    createElement("h3", {}, ["🌾 Available Crops"]),
    createSortDropdown(sortBy => renderCrops(farm, cropsContainer, farmId, mainColumn, editcon, isLoggedIn, sortBy, isCreator))
  ]);

  const addCropButton = isCreator
    ? Button("Add Crop", "add-crop-btn", {
        click: () => {
          container.textContent = "";
          import("../crop/createCrop.js").then(m => m.createCrop(farmId, container));
        }
      }, "buttonx")
    : null;

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
    ] : [
      Button("🔒 Log in to interact", "", { click: () => navigate("/login") }, "buttonx")
    ])
  ]);

  const farmCTA = createElement("div", { class: "cta-block" }, [
    ...(isLoggedIn ? [
      Button("Schedule a visit", "cta-visit-btn", { click: () => alert("Scheduled") }, "buttonx"),
      Button("Pre-order", "cta-pre-btn", { click: () => alert("Pre-ordered") }, "buttonx"),
      ...(isCreator ? [] : [
        Button("Chat", "cta-chat-btn", { click: () => farmChat(farm.createdBy, farm.farmId) }, "buttonx")
      ])
    ] : [])
  ]);

  const asideColumn = createElement("aside", { class: "farm-aside" }, [
    farmCTA,
    summaryStats,
    cropDistribution,
    reviewPlaceholder
  ]);

  // ——— Main Column ———
  const mainColumn = createElement("div", { class: "farm-main" }, [
    banner,
    farmDetails,
    ...(addCropButton ? [addCropButton] : []),
    cropHeader,
    cropsContainer
  ]);

  const layoutWrapper = createElement("div", { class: "farm-layout" }, [mainColumn, asideColumn]);

  // ——— Gallery ———
  const gallery = createElement("div", { class: "gallery-block" }, []);
  if (farm.gallery?.length) {
    const imgs = farm.gallery.map(img => ({
      src: resolveImagePath(EntityType.FARM, PictureType.GALLERY, img),
      alt: farm.name
    }));
    gallery.appendChild(Gallery(imgs));
  }

  // ——— Final Assembly ———
  container.append(header, layoutWrapper, gallery, createElement("div", { class: "onechatcon" }));

  const editcon = createElement("div", {}, []);
  mainColumn.appendChild(editcon);

  // Render Crops
  await renderCrops(farm, cropsContainer, farmId, mainColumn, editcon, isLoggedIn, "name", isCreator);
}


