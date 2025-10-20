import { createElement } from "../../../components/createElement.js";
import Button from "../../../components/base/Button.js";
import Imagex from "../../../components/base/Imagex.js";
import Notify from "../../../components/ui/Notify.mjs";
import { getState } from "../../../state/state.js";
import { resolveImagePath, PictureType, EntityType } from "../../../utils/imagePaths.js";
import { reportPost } from "../../reporting/reporting.js";
import Sightbox from "../../../components/ui/SightBox.mjs";
import { fetchMedia, deleteMedia } from "../api/mediaApi.js";
import { showMediaUploadForm } from "./mediaUploadForm.js";
import VideoPlayer from "../../../components/ui/VideoPlayer.mjs";

/* ------------------------------------------------------
   LAZY MEDIA OBSERVER (shared)
------------------------------------------------------ */
const lazyMediaObserver = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    if (!target.dataset.src) continue;
    if (isIntersecting) {
      target.src = target.dataset.src;
      delete target.dataset.src;
      if (target.tagName === "VIDEO") target.load();
      lazyMediaObserver.unobserve(target);
    } else if (target.tagName === "VIDEO") {
      target.pause();
    }
  }
}, { rootMargin: "150px 0px", threshold: 0.05 });

/* ------------------------------------------------------
   HELPERS
------------------------------------------------------ */
const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); };

const groupMedia = mediaData =>
  Object.values(mediaData.reduce((acc, m) => {
    const key = m.mediaGroupId || "ungrouped";
    (acc[key] ??= []).push(m);
    return acc;
  }, {}));

const createAddMediaButton = (isLoggedIn, entityType, entityId, list) => {
  if (!isLoggedIn) return null;
  return Button("Add Media", "", {
    click: () => showMediaUploadForm(isLoggedIn, entityType, entityId, list)
  }, "button-primary");
};

/* ------------------------------------------------------
   TRANSLATION LOGIC
------------------------------------------------------ */
async function translateText(text) {
  await new Promise(r => setTimeout(r, 300)); // simulate delay
  return text ? `[Translated] ${text}` : "";
}

async function handleTranslationToggle(toggleEl, originalText, container) {
  const showing = toggleEl.dataset.state === "translated";

  if (showing) {
    container.style.display = "none";
    toggleEl.dataset.state = "original";
    toggleEl.firstChild.nodeValue = "See Translation";
    return;
  }

  if (!container.firstChild) {
    toggleEl.firstChild.nodeValue = "Translating...";
    try {
      const translated = await translateText(originalText);
      const translatedEl = createElement("p", { class: "translated-text" }, [translated]);
      container.append(translatedEl);
    } catch (err) {
      Notify("Translation failed", { type: "error" });
      toggleEl.firstChild.nodeValue = "See Translation";
      return;
    }
  }

  container.style.display = "block";
  toggleEl.dataset.state = "translated";
  toggleEl.firstChild.nodeValue = "Hide Translation";
}

/* ------------------------------------------------------
   MAIN ENTRY
------------------------------------------------------ */
export async function displayMedia(content, entityType, entityId, isLoggedIn) {
  clear(content);

  const title = createElement("h2", { class: "fanmade-title" }, ["Media Gallery"]);
  const list = createElement("div", { class: "fanmade-list" });
  const loader = createElement("p", { class: "loading" }, ["Loading media..."]);
  content.append(title, loader);

  try {
    const mediaData = await fetchMedia(entityType, entityId);
    loader.remove();

    if (!Array.isArray(mediaData) || mediaData.length === 0) {
      content.append(createElement("p", {}, ["No media available."]));
      const addBtn = createAddMediaButton(isLoggedIn, entityType, entityId, list);
      if (addBtn) content.append(addBtn);
      return;
    }

    const addBtn = createAddMediaButton(isLoggedIn, entityType, entityId, list);
    if (addBtn) content.append(addBtn);

    const grouped = groupMedia(mediaData);
    const frag = document.createDocumentFragment();

    grouped
      .map(group => renderMediaGroup(group, isLoggedIn, entityType, entityId))
      .forEach(g => frag.append(g));

    list.append(frag);
    bindMediaInteractions(list);
    content.append(list);
  } catch (err) {
    console.error("Media fetch error:", err);
    loader.replaceWith(createElement("p", { class: "error" }, ["Failed to load media."]));
  }
}

/* ------------------------------------------------------
   RENDER GROUP
------------------------------------------------------ */
function renderMediaGroup(group, isLoggedIn, entityType, entityId) {
  const wrapper = createElement("div", { class: "fanmade-group" });
  const frag = document.createDocumentFragment();

  group
    .map((m, i) => renderMediaItem(m, i, isLoggedIn, entityType, entityId))
    .filter(Boolean)
    .forEach(el => frag.append(el));

  wrapper.append(frag);
  return wrapper;
}

/* ------------------------------------------------------
   RENDER MEDIA ITEM
------------------------------------------------------ */
function renderMediaItem(media, index, isLoggedIn, entityType, entityId) {
  if (!media.url) return null;

  const figure = createElement("figure", { class: "fanmade-item", "data-id": media.mediaid });
  const mediaEl = createMediaElement(media, index);

  if (media.type === "image" && mediaEl.tagName === "IMG") {
    lazyMediaObserver.observe(mediaEl);
  }

  const captionText = media.caption || "";
  const caption = createElement("figcaption", { class: "fanmade-caption" }, [captionText]);
  const translationContainer = createElement("div", { class: "translation-container", style: "display:none;" });
  const translateToggle = captionText
    ? createElement("span", {
        class: "translate-toggle",
        "data-state": "original",
        events: {
          click: async (e) => {
            e.stopPropagation();
            await handleTranslationToggle(translateToggle, captionText, translationContainer);
          }
        }
      }, ["See Translation"])
    : null;

  const actions = createMediaActions(media, entityType, entityId, isLoggedIn);

  figure.append(mediaEl, caption);
  if (translateToggle) figure.append(translateToggle, translationContainer);
  figure.append(actions);
  return figure;
}

/* ------------------------------------------------------
   CREATE MEDIA ELEMENT
------------------------------------------------------ */
function createMediaElement(media, index) {
  const type = media.type;
  const thumbSrc = resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.url}.jpg`);

  if (type === "image") {
    return Imagex({ "data-src": thumbSrc, classes: "fanmade-img", "data-index": index });
  }

  if (type === "video") {
    const videoSrc = resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, `${media.url}${media.extn || ".mp4"}`);
    const overlay = createElement("div", { class: "video-play-overlay" }, ["▶"]);
    const thumb = Imagex({ src: thumbSrc, classes: "fanmade-video-thumb", "data-index": index });
    const wrapper = createElement("div", { class: "video-wrapper" }, [thumb, overlay]);
    Object.assign(wrapper.dataset, { src: videoSrc, thumb: thumbSrc, index, type });
    return wrapper;
  }

  return createElement("div", { class: "fanmade-unsupported" }, [`Unsupported media type: ${type}`]);
}

/* ------------------------------------------------------
   MEDIA ACTIONS
------------------------------------------------------ */
function createMediaActions(media, entityType, entityId, isLoggedIn) {
  const actions = createElement("div", { class: "fanmade-actions" });
  const currentUser = getState("user");

  if (isLoggedIn && currentUser === media.creatorid) {
    actions.append(Button("Delete", "", {
      click: () => confirmDelete(media.mediaid, entityType, entityId)
    }, "delete-fanmade-btn"));
  }

  actions.append(Button("Report", "", {
    click: () => reportPost(media.mediaid, "media")
  }, "report-btn"));

  return actions;
}

/* ------------------------------------------------------
   DELETE HANDLER
------------------------------------------------------ */
async function confirmDelete(mediaId, entityType, entityId) {
  if (!confirm("Delete this media?")) return;

  try {
    const res = await deleteMedia(mediaId, entityType, entityId);
    if (res.status === 204) {
      const item = document.querySelector(`.fanmade-item[data-id="${mediaId}"]`);
      const parent = item?.parentElement;
      if (item) {
        item.classList.add("fade-out");
        setTimeout(() => {
          item.remove();
          if (parent && !parent.querySelector(".fanmade-item")) parent.remove();
        }, 300);
      }
      Notify("Media deleted.", { type: "success" });
    } else {
      Notify("Failed to delete media.", { type: "error" });
    }
  } catch (err) {
    console.error(err);
    Notify("Error deleting media.", { type: "error" });
  }
}

/* ------------------------------------------------------
   MEDIA INTERACTIONS (delegated)
------------------------------------------------------ */
function bindMediaInteractions(container) {
  container.addEventListener("click", (e) => {
    const img = e.target.closest(".fanmade-img");
    const vid = e.target.closest(".video-wrapper");

    if (img) {
      const src = img.src || img.dataset.src;
      Sightbox(src, "image");
      return;
    }

    if (vid) handleVideoClick(vid, container);
  });
}

function handleVideoClick(wrapper, container) {
  const { src: videoSrc, thumb, index } = wrapper.dataset;
  const existing = wrapper.querySelector("video");

  if (existing) {
    existing.pause();
    existing.remove();
    Sightbox(videoSrc, "video", index);
    return;
  }

  container.querySelectorAll(".video-wrapper video").forEach(v => v.remove());

  const player = VideoPlayer({
    src: videoSrc,
    poster: thumb,
    controls: true,
    autoplay: true,
    muted: true,
    loop: false,
    theme: "light",
    subtitles: [],
    availableResolutions: []
  }, `video-${index}`);

  wrapper.innerHTML = "";
  wrapper.append(player);

  const videoEl = player.querySelector("video");
  if (videoEl) {
    videoEl.addEventListener("ended", () => restoreVideoThumb(wrapper, thumb));
  }
}

function restoreVideoThumb(wrapper, thumb) {
  wrapper.innerHTML = "";
  const thumbImg = Imagex({ src: thumb, classes: "fanmade-video-thumb" });
  const overlay = createElement("div", { class: "video-play-overlay" }, ["▶"]);
  wrapper.append(thumbImg, overlay);
}
