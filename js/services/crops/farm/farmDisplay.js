import { SRC_URL, apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";
import Gallery from "../../../components/ui/Gallery.mjs";
import { navigate } from "../../../routes/index.js";
import { getState } from "../../../state/state.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { updateImageWithCrop } from "../../../utils/bannerEditor.js";
import { renderFarmDetails, renderCropSummary, renderCropEmojiMap, renderCrops, createSortDropdown } from "./displayFarmHelpers.js";
import { displayReviews } from "../../reviews/displayReviews.js";
import { farmChat } from "./farmchat.js";
import Imagex from "../../../components/base/Imagex.js";
import NoLink from "../../../components/base/NoLink.js";
import { persistTabs } from "../../../utils/persistTabs.js";
import { displayNotices } from "../../notices/notices.js";
import { displayFanMedia } from "../../fanmade/ui/mediaGallery.js";
import { renderWeatherDetails } from "../weather/weather.js";
// import { persistTabs } from "../../../components/ui/createTabs.js"; // your reference file


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

  // ——— Aside Column ———
  const summaryStats = renderCropSummary(farm.crops || []);
  const cropDistribution = renderCropEmojiMap(farm.crops || []);
  const reviewPlaceholder = createElement("div", { class: "review-block" }, [
    createElement("p", {}, ["⭐️⭐️⭐️⭐️☆ (4.2 avg based on 17 reviews)"]),
    Button("💬 Check reviews", "review-btn", {
      click: () => displayReviews(reviewPlaceholder, isCreator, isLoggedIn, "farm", farmId)
    }, "buttonx"),
  ]);

  const farmCTA = createElement("div", { class: "cta-block" }, [
    ...(isLoggedIn && !isCreator ? [
      Button("Schedule a visit", "cta-visit-btn", { click: () => alert("Scheduled") }, "buttonx"),
      Button("Pre-order", "cta-pre-btn", { click: () => alert("Pre-ordered") }, "buttonx"),
      Button("Chat", "cta-chat-btn", { click: () => farmChat(farm.createdBy, farmId) }, "buttonx")
    ] : []),
    ...(isCreator ? [
      Button("Button For Creator", "cta-creator-btn", { click: () => alert("add more features here") }, "buttonx")
    ] : [])
  ]);

  // const farmDetails = renderFarmDetails(farm, isCreator);
  const weatherWidget = renderWeatherDetails(farm, isCreator);
  const asideColumn = createElement("aside", { class: "farm-aside" }, [
    weatherWidget,
    farmCTA,
    summaryStats,
    cropDistribution,
    reviewPlaceholder
  ]);

  // ——— Tabs Setup ———
  const mainColumn = createElement("div", { class: "farm-main" });
  const editcon = createElement("div", {}, []);
  mainColumn.appendChild(banner);
  mainColumn.appendChild(editcon);

  const tabs = [];

  tabs.push({
    title: "Info",
    id: "info-tab",
    render: (tabContainer) => {
      const farmDetails = renderFarmDetails(farm, isCreator);
      tabContainer.appendChild(farmDetails);
    },
  });

  tabs.push({
    title: "Crops",
    id: "crops-tab",
    render: async (tabContainer) => {
      const cropsContainer = createElement("div", { class: "crop-list grid-view" });
      const cropHeader = createElement("div", { class: "crop-header" }, [
        createElement("h3", {}, ["🌾 Available Crops"]),
        createSortDropdown(sortBy => renderCrops(farm, cropsContainer, farmId, mainColumn, editcon, isLoggedIn, sortBy, isCreator))
      ]);

      if (isCreator) {
        const addCropButton = Button("Add Crop", "add-crop-btn", {
          click: () => {
            container.textContent = "";
            import("../crop/createCrop.js").then(m => m.createCrop(farmId, container));
          }
        }, "buttonx");
        tabContainer.append(addCropButton);
      }

      tabContainer.append(cropHeader, cropsContainer);
      await renderCrops(farm, cropsContainer, farmId, mainColumn, editcon, isLoggedIn, "name", isCreator);
    }
  });

  // Inside tabs[]
  tabs.push({
    title: "Notices",
    id: "notices-tab",
    render: (tabContainer) => {
      displayNotices("farm", farmId, tabContainer, isCreator);
    }
  });
  tabs.push({
    title: "Gallery",
    id: "gallery-tab",
    render: (tabContainer) => {
      displayFanMedia(tabContainer, "farm", farmId, isCreator);
    }
  });
  tabs.push({
    title: "Reviews",
    id: "reviews-tab",
    render: (tabContainer) => {
      displayReviews(tabContainer, isCreator, isLoggedIn, "farm", farmId);
    }
  });

  // Persist tabs in localStorage so user's last opened tab stays active
  persistTabs(mainColumn, tabs, `farm-tabs:${farmId}`);

  // ——— Final Assembly ———
  const layoutWrapper = createElement("div", { class: "farm-layout" }, [mainColumn, asideColumn]);
  container.append(header, layoutWrapper, createElement("div", { class: "onechatcon" }));
}
