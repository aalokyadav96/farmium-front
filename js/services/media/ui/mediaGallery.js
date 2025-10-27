import { createElement } from "../../../components/createElement.js";
import { fetchMedia } from "../api/mediaApi.js";
import { showMediaUploadForm } from "./mediaUploadForm.js";
import Notify from "../../../components/ui/Notify.mjs";
import {
  lazyMediaObserver,
  clear,
  groupMedia,
  createAddMediaButton,
  createMediaActions,
  confirmDelete
} from "../mediaCommon.js";
import { resolveImagePath, PictureType, EntityType } from "../../../utils/imagePaths.js";
import Imagex from "../../../components/base/Imagex.js";
import { handleTranslationToggle } from "../../fanmade/translate.js";
import Sightbox from "../../../components/ui/Sightbox_zoom.mjs";
import LightBox from "../../../components/ui/Lightbox.mjs";
import { generateVideoPlayer } from "../../../components/ui/vidpopHelpers.js";

/* ------------------------------------------------------
   BUILD MEDIA FRAGMENT
------------------------------------------------------ */
function buildMediaFragment(mediaData, entityType, entityId, isLoggedIn, prefix = "media") {
  const frag = document.createDocumentFragment();
  const grouped = groupMedia(mediaData);

  grouped.forEach(group => {
    const wrapper = createElement("div", { class: `${prefix}-group` });

    group.forEach((media, i) => {
      if (!media.url) return;

      const figure = createElement("figure", {
        class: `${prefix}-item`,
        "data-id": media.mediaid
      });

      const thumbSrc = resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.url}.jpg`);
      const captionText = media.caption || "";
      const mediaEl = buildMediaElement(media, thumbSrc, i, prefix);
      const caption = createElement("figcaption", { class: `${prefix}-caption` }, [captionText]);

      const translation = buildTranslationSection(captionText);
      const actions = createMediaActions(media, entityType, entityId, isLoggedIn, confirmDelete, prefix);

      figure.append(mediaEl, caption);
      if (translation) figure.append(...translation);
      figure.append(actions);

      wrapper.append(figure);
    });

    frag.append(wrapper);
  });

  return frag;
}

/* ------------------------------------------------------
   MEDIA ELEMENT BUILDER
------------------------------------------------------ */
function buildMediaElement(media, thumbSrc, index, prefix) {
  if (media.type === "image") {
    const img = Imagex({
      "data-src": thumbSrc,
      classes: `${prefix}-img`,
      "data-index": index
    });
    img.addEventListener("click", () => Sightbox(thumbSrc, "image"));
    lazyMediaObserver.observe(img);
    return img;
  }

  if (media.type === "video") {
    const videoSrc = resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, `${media.url}${media.extn || ".mp4"}`);
    const img = Imagex({
      src: thumbSrc,
      classes: `${prefix}-img`,
      "data-index": index
    });

    let vidEl = createElement("div",{},[]);
    
  generateVideoPlayer(videoSrc, thumbSrc, [], [], media.url).then(videoPlayer => {
    vidEl.appendChild(videoPlayer);
  });

    // const vidEl = VideoPlayer({
    //   src: videoSrc,
    //   poster: thumbSrc,
    //   controls: false,
    //   autoplay: false,
    //   muted: true,
    //   loop: false,
    //   theme: "light",
    //   subtitles: [],
    //   availableResolutions: []
    // }, `video-${index}`);

    img.addEventListener("click", () => {
      const container = createElement("div", { class: "lightbox-video-container" }, [vidEl]);
      LightBox(container);
    });

    return img;
  }

  return createElement("div", { class: `${prefix}-unsupported` }, [`Unsupported media type: ${media.type}`]);
}

/* ------------------------------------------------------
   TRANSLATION TOGGLE BUILDER
------------------------------------------------------ */
function buildTranslationSection(captionText) {
  if (!captionText) return null;

  const translationBox = createElement("div", {
    class: "translation-container",
    style: "display:none;"
  });

  const toggle = createElement("span", {
    class: "translate-toggle",
    "data-state": "original"
  }, ["See Translation"]);

  toggle.addEventListener("click", async (e) => {
    e.stopPropagation();
    await handleTranslationToggle(toggle, captionText, translationBox);
  });

  return [toggle, translationBox];
}

/* ------------------------------------------------------
   DISPLAY MEDIA GALLERY
------------------------------------------------------ */
export async function displayMedia(content, entityType, entityId, isLoggedIn) {
  clear(content);

  const title = createElement("h2", {}, ["Media Gallery"]);
  const loader = createElement("p", { class: "loading" }, ["Loading media..."]);
  const list = createElement("div", { class: "media-list" });

    const addBtn = createAddMediaButton(isLoggedIn, entityType, entityId, list, showMediaUploadForm);
    if (addBtn) content.append(addBtn);

  // Append upfront to minimize layout shifts
  content.append(title, loader, list);

  try {
    const mediaData = await fetchMedia(entityType, entityId);
    loader.remove();

    if (!Array.isArray(mediaData) || mediaData.length === 0) {
      content.append(createElement("p", {}, ["No media available."]));
      const addBtn = createAddMediaButton(isLoggedIn, entityType, entityId, list, showMediaUploadForm);
      if (addBtn) content.append(addBtn);
      return;
    }

    const frag = buildMediaFragment(mediaData, entityType, entityId, isLoggedIn, "media");
    list.append(frag);

    // Reserved for delegated interactions (context menu, etc.)
    list.addEventListener("click", e => {
      const img = e.target.closest(".media-img");
      if (img) return;
    });

  } catch (err) {
    console.error("Media fetch error:", err);
    loader.replaceWith(
      createElement("p", { class: "error" }, ["Failed to load media."])
    );
  }
}
