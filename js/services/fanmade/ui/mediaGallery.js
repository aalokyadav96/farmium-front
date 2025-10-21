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
} from "../../media/mediaCommon.js";
import { resolveImagePath, PictureType, EntityType } from "../../../utils/imagePaths.js";
import VideoPlayer from "../../../components/ui/VideoPlayer.mjs";
import Imagex from "../../../components/base/Imagex.js";
import {translateText} from "../translate.js";

/* ------------------------------------------------------
   BUILD FRAGMENT WITH MEDIA
------------------------------------------------------ */
function buildMediaFragment(mediaData, entityType, entityId, isLoggedIn, prefix = "media") {
  const frag = document.createDocumentFragment();

  for (const group of groupMedia(mediaData)) {
    const wrapper = createElement("div", { class: `${prefix}-group` });

    for (const [i, media] of group.entries()) {
      if (!media.url) continue;

      const figure = createElement("figure", { class: `${prefix}-item`, "data-id": media.mediaid });
      const thumbSrc = resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.url}.jpg`);
      let mediaEl;

      if (media.type === "image") {
        mediaEl = Imagex({
          "data-src": thumbSrc,
          classes: `${prefix}-img`,
          "data-index": i
        });
        lazyMediaObserver.observe(mediaEl);
      } else if (media.type === "video") {
        const videoSrc = resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, `${media.url}${media.extn || ".mp4"}`);
        mediaEl = VideoPlayer({
          src: videoSrc,
          poster: thumbSrc,
          controls: false,
          autoplay: false,
          muted: true,
          loop: false,
          theme: "light",
          subtitles: [],
          availableResolutions: []
        }, `video-${i}`);
      } else {
        mediaEl = createElement("div", { class: `${prefix}-unsupported` }, [`Unsupported media type: ${media.type}`]);
      }

      const captionText = media.caption || "";
      const caption = createElement("figcaption", { class: `${prefix}-caption` }, [captionText]);
      const translationBox = createElement("div", { class: "translation-container", style: "display:none;" });
      const toggle = captionText
        ? createElement("span", {
            class: "translate-toggle",
            "data-state": "original",
            events: {
              click: async (e) => {
                e.stopPropagation();
                await handleTranslationToggle(toggle, captionText, translationBox);
              }
            }
          }, ["See Translation"])
        : null;

      const actions = createMediaActions(media, entityType, entityId, isLoggedIn, confirmDelete, prefix);

      figure.append(mediaEl, caption);
      if (toggle) figure.append(toggle, translationBox);
      figure.append(actions);
      wrapper.append(figure);
    }

    frag.append(wrapper);
  }

  return frag;
}

/* ------------------------------------------------------
   DISPLAY GALLERY
------------------------------------------------------ */

export async function displayFanMedia(content, entityType, entityId, isLoggedIn) {
  clear(content);

  const title = createElement("h2", { class: "fanmade-title" }, ["Fanmade Gallery"]);
  const loader = createElement("p", { class: "loading" }, ["Loading media..."]);
  const list = createElement("div", { class: "fanmade-list" });
  content.append(title, loader);

  try {
    const mediaData = await fetchMedia(entityType, entityId);
    loader.remove();

    if (!Array.isArray(mediaData) || mediaData.length === 0) {
      content.append(createElement("p", {}, ["No media available."]));
      const addBtn = createAddMediaButton(isLoggedIn, entityType, entityId, list, showMediaUploadForm);
      if (addBtn) content.append(addBtn);
      return;
    }

    const frag = buildMediaFragment(mediaData, entityType, entityId, isLoggedIn, "fanmade");
    list.append(frag);

    const addBtn = createAddMediaButton(isLoggedIn, entityType, entityId, list, showMediaUploadForm);
    if (addBtn) content.append(addBtn);

    content.append(list);

    list.addEventListener("click", e => {
      const img = e.target.closest(".fanmade-img");
      if (img) return;
    });
  } catch (err) {
    console.error("Fan media fetch error:", err);
    loader.replaceWith(createElement("p", { class: "error" }, ["Failed to load fan media."]));
  }
}

// import { createElement } from "../../../components/createElement.js";
// import { fetchMedia } from "../api/mediaApi.js";
// import { showMediaUploadForm } from "./mediaUploadForm.js";
// import Notify from "../../../components/ui/Notify.mjs";
// import {
//   lazyMediaObserver,
//   clear,
//   groupMedia,
//   createAddMediaButton,
//   createMediaActions,
//   confirmDelete
// } from "../../media/mediaCommon.js";
// import { resolveImagePath, PictureType, EntityType } from "../../../utils/imagePaths.js";
// import VideoPlayer from "../../../components/ui/VideoPlayer.mjs";
// import Imagex from "../../../components/base/Imagex.js";

// /* ------------------------------------------------------
//    TRANSLATION HELPERS
// ------------------------------------------------------ */
// async function translateText(text) {
//   await new Promise(r => setTimeout(r, 300)); // simulate delay
//   return `[Translated] ${text}`;
// }

// async function handleTranslationToggle(toggle, originalText, container) {
//   const showing = toggle.dataset.state === "translated";

//   if (showing) {
//     container.style.display = "none";
//     toggle.dataset.state = "original";
//     toggle.firstChild.nodeValue = "See Translation";
//     return;
//   }

//   if (!container.firstChild) {
//     toggle.firstChild.nodeValue = "Translating...";
//     try {
//       const translated = await translateText(originalText);
//       container.append(createElement("p", { class: "translated-text" }, [translated]));
//     } catch {
//       Notify("Translation failed", { type: "error" });
//     }
//   }

//   container.style.display = "block";
//   toggle.dataset.state = "translated";
//   toggle.firstChild.nodeValue = "Hide Translation";
// }

// /* ------------------------------------------------------
//    BUILD FRAGMENT WITH VIDEO PLAYER INSIDE
// ------------------------------------------------------ */
// function buildFanMediaFragment(mediaData, entityType, entityId, isLoggedIn) {
//   const frag = document.createDocumentFragment();

//   for (const group of groupMedia(mediaData)) {
//     const wrapper = createElement("div", { class: "fanmade-group" });

//     for (const [i, media] of group.entries()) {
//       if (!media.url) continue;

//       const figure = createElement("figure", { class: "fanmade-item", "data-id": media.mediaid });
//       const classPrefix = "fanmade";
//       const thumbSrc = resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.url}.jpg`);
//       let mediaEl;

//       if (media.type === "image") {
//         mediaEl = Imagex({
//           "data-src": thumbSrc,
//           classes: `${classPrefix}-img`,
//           "data-index": i
//         });
//         lazyMediaObserver.observe(mediaEl);
//       } else if (media.type === "video") {
//         const videoSrc = resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, `${media.url}${media.extn || ".mp4"}`);
//         mediaEl = VideoPlayer({
//           src: videoSrc,
//           poster: thumbSrc,
//           controls: false,
//           autoplay: false,
//           muted: true,
//           loop: false,
//           theme: "light",
//           subtitles: [],
//           availableResolutions: []
//         }, `video-${i}`);
//       } else {
//         mediaEl = createElement("div", { class: `${classPrefix}-unsupported` }, [`Unsupported media type: ${media.type}`]);
//       }

//       const captionText = media.caption || "";
//       const caption = createElement("figcaption", { class: "fanmade-caption" }, [captionText]);
//       const translationBox = createElement("div", { class: "translation-container", style: "display:none;" });
//       const toggle = captionText
//         ? createElement("span", {
//             class: "translate-toggle",
//             "data-state": "original",
//             events: {
//               click: async (e) => {
//                 e.stopPropagation();
//                 await handleTranslationToggle(toggle, captionText, translationBox);
//               }
//             }
//           }, ["See Translation"])
//         : null;

//       const actions = createMediaActions(media, entityType, entityId, isLoggedIn, confirmDelete, classPrefix);

//       figure.append(mediaEl, caption);
//       if (toggle) figure.append(toggle, translationBox);
//       figure.append(actions);
//       wrapper.append(figure);
//     }

//     frag.append(wrapper);
//   }

//   return frag;
// }

// /* ------------------------------------------------------
//    MAIN ENTRY
// ------------------------------------------------------ */
// export async function displayFanMedia(content, entityType, entityId, isLoggedIn) {
//   clear(content);

//   const title = createElement("h2", { class: "fanmade-title" }, ["Fanmade Gallery"]);
//   const loader = createElement("p", { class: "loading" }, ["Loading media..."]);
//   const list = createElement("div", { class: "fanmade-list" });
//   content.append(title, loader);

//   try {
//     const mediaData = await fetchMedia(entityType, entityId);
//     loader.remove();

//     if (!Array.isArray(mediaData) || mediaData.length === 0) {
//       content.append(createElement("p", {}, ["No media available."]));
//       const addBtn = createAddMediaButton(isLoggedIn, entityType, entityId, list, showMediaUploadForm);
//       if (addBtn) content.append(addBtn);
//       return;
//     }

//     const frag = buildFanMediaFragment(mediaData, entityType, entityId, isLoggedIn);
//     list.append(frag);

//     const addBtn = createAddMediaButton(isLoggedIn, entityType, entityId, list, showMediaUploadForm);
//     if (addBtn) content.append(addBtn);

//     content.append(list);

//     // Inline media interactions (images only; videos already handled inside VideoPlayer)
//     list.addEventListener("click", e => {
//       const img = e.target.closest(".fanmade-img");
//       if (img) {
//         // Optional: implement inline modal for fanmade images if desired
//         return;
//       }
//     });
//   } catch (err) {
//     console.error("Fan media fetch error:", err);
//     loader.replaceWith(createElement("p", { class: "error" }, ["Failed to load fan media."]));
//   }
// }
