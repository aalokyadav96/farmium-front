import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import Imagex from "../../components/base/Imagex.js";
import Notify from "../../components/ui/Notify.mjs";
import { getState } from "../../state/state.js";
import { reportPost } from "../reporting/reporting.js";
import { deleteMedia } from "./api/mediaApi.js";

export const lazyMediaObserver = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    if (!target.dataset.src) continue;
    if (isIntersecting) {
      target.src = target.dataset.src;
      delete target.dataset.src;
      if (target.tagName === "VIDEO") target.load();
      lazyMediaObserver.unobserve(target);
    } else if (target.tagName === "VIDEO") target.pause();
  }
}, { rootMargin: "150px 0px", threshold: 0.05 });

export const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); };

export const groupMedia = media =>
  Object.values(media.reduce((acc, m) => {
    const key = m.mediaGroupId || "ungrouped";
    (acc[key] ??= []).push(m);
    return acc;
  }, {}));

export const createAddMediaButton = (isLoggedIn, entityType, entityId, list, showUploadForm, classes = "button-primary") =>
  isLoggedIn
    ? Button("Add Media", "", {
      click: () => showUploadForm(isLoggedIn, entityType, entityId, list)
    }, classes)
    : null;


export function createMediaActions(media, entityType, entityId, isLoggedIn, deleteHandler, classPrefix = "media") {
  const actions = createElement("div", { class: `${classPrefix}-actions` });
  const user = getState("user");

  if (isLoggedIn && user === media.creatorid) {
    actions.append(Button("Delete", "", {
      click: () => deleteHandler(media.mediaid, entityType, entityId)
    }, `delete-${classPrefix}-btn`));
  }

  actions.append(Button("Report", "", {
    click: () => reportPost(media.mediaid, "media")
  }, "report-btn"));

  return actions;
}

export async function confirmDelete(mediaId, entityType, entityId, itemSelector = ".media-item") {
  if (!confirm("Delete this media?")) return;

  try {
    const res = await deleteMedia(mediaId, entityType, entityId);
    if (res.success === true) {
      const item = document.querySelector(`${itemSelector}[data-id="${mediaId}"]`);
      const parent = item?.parentElement;
      item?.remove();
      if (parent && !parent.querySelector(itemSelector)) parent.remove();
      Notify("Media deleted.", { type: "success" });
    } else {
      Notify("Failed to delete media.", { type: "error" });
    }
  } catch (err) {
    console.error(err);
    Notify("Error deleting media.", { type: "error" });
  }
}


function restoreVideoThumb(wrapper, thumb, classPrefix) {
  clear(wrapper);
  const thumbImg = Imagex({ src: thumb, classes: `${classPrefix}-video-thumb` });
  const overlay = createElement("div", { class: "video-play-overlay" }, ["▶"]);
  wrapper.append(thumbImg, overlay);
}
