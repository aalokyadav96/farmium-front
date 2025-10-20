

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
   LAZY LOADING
------------------------------------------------------ */
const lazyObserver = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    if (!target.dataset.src) continue;
    if (isIntersecting) {
      target.src = target.dataset.src;
      delete target.dataset.src;
      if (target.tagName === "VIDEO") target.load();
      lazyObserver.unobserve(target);
    } else if (target.tagName === "VIDEO") {
      target.pause();
    }
  }
}, { rootMargin: "150px 0px", threshold: 0.05 });

/* ------------------------------------------------------
   HELPERS
------------------------------------------------------ */
const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); };

const groupMedia = media =>
  Object.values(media.reduce((acc, m) => {
    const key = m.mediaGroupId || "ungrouped";
    (acc[key] ??= []).push(m);
    return acc;
  }, {}));

const createAddMediaButton = (isLoggedIn, entityType, entityId, list) =>
  isLoggedIn
    ? Button("Add Media", "", {
        click: () => showMediaUploadForm(isLoggedIn, entityType, entityId, list)
      }, "button-primary")
    : null;

/* ------------------------------------------------------
   MAIN ENTRY
------------------------------------------------------ */
export async function displayMedia(content, entityType, entityId, isLoggedIn) {
  clear(content);

  const title = createElement("h2", {}, ["Media Gallery"]);
  const loader = createElement("p", { class: "loading" }, ["Loading media..."]);
  const list = createElement("div", { class: "media-list" });

  content.append(title, loader);

  try {
    const mediaData = await fetchMedia(entityType, entityId);
    loader.remove();

    if (!mediaData?.length) {
      content.append(
        createElement("p", {}, ["No media available."]),
        ...(isLoggedIn ? [createAddMediaButton(isLoggedIn, entityType, entityId, list)] : [])
      );
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const group of groupMedia(mediaData)) {
      fragment.append(renderMediaGroup(group, isLoggedIn, entityType, entityId));
    }

    const addBtn = createAddMediaButton(isLoggedIn, entityType, entityId, list);
    if (addBtn) content.append(addBtn);

    list.append(fragment);
    content.append(list);

    bindMediaInteractions(list);
  } catch (err) {
    console.error("Media fetch error:", err);
    loader.replaceWith(createElement("p", { class: "error" }, ["Failed to load media."]));
  }
}

/* ------------------------------------------------------
   RENDER GROUP
------------------------------------------------------ */
function renderMediaGroup(group, isLoggedIn, entityType, entityId) {
  const wrapper = createElement("div", { class: "media-group" });
  const fragment = document.createDocumentFragment();
  for (const [index, media] of group.entries()) {
    const item = renderMediaItem(media, index, isLoggedIn, entityType, entityId);
    if (item) fragment.append(item);
  }
  wrapper.append(fragment);
  return wrapper;
}

/* ------------------------------------------------------
   RENDER MEDIA ITEM
------------------------------------------------------ */
function renderMediaItem(media, index, isLoggedIn, entityType, entityId) {
  if (!media.url) return null;

  const figure = createElement("figure", { class: "media-item", "data-id": media.mediaid });
  const mediaEl = createMediaElement(media, index);

  if (mediaEl.tagName === "img" || mediaEl.dataset.type === "video") {
    lazyObserver.observe(mediaEl.tagName === "img" ? mediaEl : mediaEl.querySelector("img"));
  }

  const caption = createElement("figcaption", {}, [media.caption || ""]);
  const actions = createMediaActions(media, entityType, entityId, isLoggedIn);

  figure.append(mediaEl, caption, actions);
  return figure;
}

/* ------------------------------------------------------
   CREATE MEDIA ELEMENT
------------------------------------------------------ */
function createMediaElement(media, index) {
  const thumbSrc = resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.url}${media.extn}`);
  const isImage = media.type === "image";
console.log(thumbSrc);
  if (isImage) {
    const img = Imagex({
      src: thumbSrc,
      "data-src": thumbSrc,
      classes: "media-img",
      "data-index": index
    });
    // img.onerror = () => { img.src = "/assets/img/placeholder.jpg"; };
    return img;
  }

  const videoSrc = resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, `${media.url}${media.extn || ".mp4"}`);
  const thumb = Imagex({ src: thumbSrc, classes: "media-video-thumb", "data-index": index });
  const overlay = createElement("div", { class: "video-play-overlay" }, ["▶"]);
  const wrapper = createElement("div", {
    class: "video-wrapper",
    "data-src": videoSrc,
    "data-thumb": thumbSrc,
    "data-index": index,
    "data-type": "video"
  }, [thumb, overlay]);

  return wrapper;
}

/* ------------------------------------------------------
   MEDIA ACTIONS
------------------------------------------------------ */
function createMediaActions(media, entityType, entityId, isLoggedIn) {
  const actions = createElement("div", { class: "media-actions" });
  const user = getState("user");

  if (isLoggedIn && user === media.creatorid) {
    actions.append(Button("Delete", "", { click: () => confirmDelete(media.mediaid, entityType, entityId) }, "delete-media-btn"));
  }

  actions.append(Button("Report", "", { click: () => reportPost(media.mediaid, "media") }, "report-btn"));
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
      const item = document.querySelector(`.media-item[data-id="${mediaId}"]`);
      const parent = item?.parentElement;
      item?.remove();
      if (parent && !parent.querySelector(".media-item")) parent.remove();
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
   INTERACTIONS
------------------------------------------------------ */
function bindMediaInteractions(container) {
  // --- Image click ---
  container.querySelectorAll(".media-img").forEach(img => {
    img.addEventListener("click", () => Sightbox(img.src || img.dataset.src, "image"));
  });

  // --- Video click ---
  container.querySelectorAll(".video-wrapper").forEach(wrapper => {
    const { src: videoSrc, thumb, index } = wrapper.dataset;
    wrapper.addEventListener("click", () => handleVideoClick(wrapper, videoSrc, thumb, index, container));
  });
}

/* ------------------------------------------------------
   VIDEO CLICK HANDLER
------------------------------------------------------ */
function handleVideoClick(wrapper, videoSrc, thumb, index, container) {
  const existingVideo = wrapper.querySelector("video");
  if (existingVideo) {
    existingVideo.pause();
    existingVideo.remove();
    Sightbox(videoSrc, "video", index);
    return;
  }

  // Remove any other videos in play
  container.querySelectorAll(".video-wrapper video").forEach(v => v.remove());

  const player = VideoPlayer({
    src: videoSrc,
    poster: thumb,
    controls: false,
    autoplay: true,
    muted: true,
    loop: false,
    theme: "light",
    subtitles: [],
    availableResolutions: []
  }, `video-${index}`);

  clear(wrapper);
  wrapper.append(player);

  const videoEl = player.querySelector("video");
  videoEl?.addEventListener("ended", () => restoreVideoThumb(wrapper, thumb));
}

function restoreVideoThumb(wrapper, thumb) {
  clear(wrapper);
  const thumbImg = Imagex({ src: thumb, classes: "media-video-thumb" });
  const overlay = createElement("div", { class: "video-play-overlay" }, ["▶"]);
  wrapper.append(thumbImg, overlay);
}
