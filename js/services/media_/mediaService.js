import { getState } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import VidPlay from "../../components/ui/VidPlay.mjs";
import Modal from "../../components/ui/Modal.mjs";
import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";
import { resolveImagePath, PictureType, EntityType } from "../../utils/imagePaths.js";
import { reportPost } from "../reporting/reporting.js";
import Sightbox from "../../components/ui/SightBox.mjs";
import { createFormGroup } from "../../components/createFormGroup.js";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_VIDEO_DURATION = 600;

const MEDIA_TYPES = { IMAGE: "image", VIDEO: "video", TEXT: "text" };
const NOTIFY_TYPES = { ERROR: "error", SUCCESS: "success" };

const lazyMediaObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        const el = entry.target;
        if (entry.isIntersecting) {
            if (el.dataset.src) {
                el.src = el.dataset.src;
                delete el.dataset.src;
            }
            if (el.tagName === "VIDEO" && el.paused) el.load();
        } else if (el.tagName === "VIDEO" && !el.paused) {
            el.pause();
        }
    });
}, { rootMargin: "100px 0px", threshold: 0.1 });

function sanitizeID(id) { return String(id || "").trim(); }
function isValidEntityType(type) { return ["event", "place", "user", "post", "artist"].includes(type); }
function clearElement(el) { while (el.firstChild) el.removeChild(el.firstChild); }

function showError(msg) { Notify(msg, { type: NOTIFY_TYPES.ERROR }); }
function showSuccess(msg) { Notify(msg, { type: NOTIFY_TYPES.SUCCESS, duration: 3000, dismissible: true }); }

async function validateMedia(file) {
    if (!file) return { valid: true };

    if (file.size > MAX_FILE_SIZE) return { valid: false, message: "File size exceeds 100MB" };

    if (file.type.startsWith("video/")) {
        const duration = await new Promise((resolve) => {
            const v = document.createElement("video");
            v.preload = "metadata";
            v.src = URL.createObjectURL(file);
            v.onloadedmetadata = () => resolve(v.duration);
        });
        if (duration > MAX_VIDEO_DURATION) return { valid: false, message: "Video exceeds 10 minutes" };
    }

    return { valid: true };
}

// ------------------ Upload ------------------
async function uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal, existingMedia = null) {
    entityType = sanitizeID(entityType);
    entityId = sanitizeID(entityId);
    if (!isValidEntityType(entityType) || !entityId) return showError("Invalid entity type or ID");

    const fileInput = document.getElementById("mediaFile");
    const captionInput = document.getElementById("mediaCaption");
    const tagsInput = document.getElementById("mediaTags");

    const file = fileInput?.files?.[0];
    const caption = captionInput?.value || "";
    const tags = tagsInput?.value?.split(",").map((t) => t.trim()).filter(Boolean) || [];

    const validation = await validateMedia(file);
    if (!validation.valid) return showError(validation.message);

    const formData = new FormData();
    if (file) formData.append("media", file);
    formData.append("caption", caption);
    formData.append("tags", tags.join(","));

    try {
        const method = existingMedia ? "PUT" : "POST";
        const url = existingMedia
            ? `/media/${entityType}/${entityId}/${existingMedia.mediaid}`
            : `/media/${entityType}/${entityId}`;

        const res = await apiFetch(url, method, formData, { raw: true });

        if (res && (res.mediaid || res.type === MEDIA_TYPES.TEXT)) {
            showSuccess(existingMedia ? "Post updated!" : "Post uploaded successfully!");
            modal.remove();
            document.body.style.overflow = "";
            if (existingMedia) {
                // Replace in DOM
                const oldItem = document.querySelector(`[data-media-id="${existingMedia.mediaid}"]`);
                if (oldItem) oldItem.replaceWith(renderMediaItem(res, 0, isLoggedIn, entityType, entityId, mediaList));
            } else {
                addMediaItem([], res, mediaList, isLoggedIn, entityType, entityId, true);
            }
        } else {
            showError(`Failed: ${res?.message || "Unknown error"}`);
        }
    } catch (err) {
        showError(`Upload error: ${err.message}`);
    }
}

// ------------------ Delete ------------------
async function deleteMedia(mediaId, entityType, entityId, mediaItem) {
    entityType = sanitizeID(entityType);
    entityId = sanitizeID(entityId);
    mediaId = sanitizeID(mediaId);
    if (!isValidEntityType(entityType) || !entityId || !mediaId) return showError("Invalid media/entity ID");
    if (!confirm("Are you sure you want to delete this media?")) return;

    try {
        const response = await apiFetch(`/media/${entityType}/${entityId}/${mediaId}`, "DELETE", null, { raw: true });
        if (response.success) {
            showSuccess("Media deleted!");
            if (mediaItem) {
                const el = mediaItem.querySelector("img, video");
                if (el) lazyMediaObserver.unobserve(el);
                mediaItem.remove();
            }
        } else showError(`Delete failed: ${response?.message || "Unknown"}`);
    } catch (err) {
        console.error(err);
        showError("Error deleting media");
    }
}

// ------------------ Render ------------------
function renderMediaItem(media, index, isLoggedIn, entityType, entityId, mediaList) {
    const mediaItem = createElement("div", { class: "media-item", "data-media-id": media.mediaid });
    const figureContent = [];

    if (media.type === MEDIA_TYPES.TEXT) {
        figureContent.push(createElement("p", { class: "text-post" }, [media.caption || ""]));

    } else if (media.type === MEDIA_TYPES.IMAGE) {
        const img = createElement("img", {
            "data-src": resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.url),
            loading: "lazy",
            alt: media.caption || "Media item",
            class: "media-img",
            "data-index": index
        });
        lazyMediaObserver.observe(img);
        figureContent.push(img, createElement("figcaption", {}, [media.caption || ""]));

        img.addEventListener("click", () => {
            const fullUrl = resolveImagePath(EntityType.MEDIA, PictureType.PHOTO, media.url);
            Sightbox(fullUrl, "image");
        });

    } else if (media.type === MEDIA_TYPES.VIDEO) {
        const video = createElement("video", {
            class: "media-video",
            controls: false,
            poster: resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.thumbnailUrl),
            "data-src": resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url),
            "data-index": index
        });
        lazyMediaObserver.observe(video);
        figureContent.push(video, createElement("figcaption", {}, [media.caption || ""]));

        video.addEventListener("click", () => {
            const videoUrl = resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url);
            Sightbox(videoUrl, "video");
        });
    }

    mediaItem.appendChild(createElement("figure", {}, figureContent));

    if (media.tags?.length) {
        mediaItem.appendChild(
            createElement("div", { class: "tags" },
                media.tags.map((tag) => createElement("span", { class: "tag" }, [tag]))
            )
        );
    }

    const isCreator = isLoggedIn && getState("user") === media.creatorid;
    if (isLoggedIn) {
        const moreButton = createElement("button", { class: "more-btn", "aria-label": "More options" }, ["⋯"]);
        const dropdown = createElement("div", { class: "dropdown hidden" });

        const reportBtn = createElement("button", { class: "report-btn" }, ["Report"]);
        reportBtn.addEventListener("click", () => {
            dropdown.classList.add("hidden");
            reportPost(media.mediaid, "media");
        });
        dropdown.appendChild(reportBtn);

        if (isCreator) {
            const deleteBtn = createElement("button", { class: "delete-btn" }, ["Delete"]);
            deleteBtn.addEventListener("click", async () => {
                dropdown.classList.add("hidden");
                await deleteMedia(media.mediaid, entityType, entityId, mediaItem);
            });
            dropdown.appendChild(deleteBtn);

            const editBtn = createElement("button", { class: "edit-btn" }, ["Edit"]);
            editBtn.addEventListener("click", () => {
                dropdown.classList.add("hidden");
                showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList, media);
            });
            dropdown.appendChild(editBtn);
        }

        const moreWrapper = createElement("div", { class: "more-wrapper" }, [moreButton, dropdown]);

        moreButton.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("hidden");
        });

        mediaItem.appendChild(moreWrapper);
    }

    return mediaItem;
}

// ------------------ Helpers ------------------
function addMediaItem(mediaItems, media, mediaList, isLoggedIn, entityType, entityId, prepend = false) {
    mediaItems.push(media);
    const item = renderMediaItem(media, mediaItems.length - 1, isLoggedIn, entityType, entityId, mediaList);
    if (prepend) mediaList.prepend(item);
    else mediaList.appendChild(item);
}

// ------------------ Show Form ------------------
function showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList, existingMedia = null) {
    const content = createElement("div", { id: "mediaform" });

    const fileGroup = createFormGroup({
        label: "Select Media (optional)",
        type: "file",
        id: "mediaFile",
        isRequired: false,
        additionalProps: { accept: "image/*,video/*" }
    });

    const captionGroup = createFormGroup({
        label: "Caption / Text Post",
        type: "text",
        id: "mediaCaption",
        placeholder: "Write something...",
        value: existingMedia?.caption || ""
    });

    const tagsGroup = createFormGroup({
        label: "Tags (comma-separated)",
        type: "text",
        id: "mediaTags",
        placeholder: "song:123,event:456,merch:789",
        value: existingMedia?.tags?.join(",") || ""
    });

    const previewDiv = createElement("div", { id: "mediaPreview" });
    if (existingMedia?.url) {
        const url = resolveImagePath(EntityType.MEDIA,
            existingMedia.type === MEDIA_TYPES.IMAGE ? PictureType.PHOTO : PictureType.VIDEO,
            existingMedia.url
        );
        if (existingMedia.type === MEDIA_TYPES.IMAGE) previewDiv.appendChild(createElement("img", { src: url, style: "max-width:100%" }));
        else if (existingMedia.type === MEDIA_TYPES.VIDEO) previewDiv.appendChild(createElement("video", { src: url, controls: true, style: "max-width:100%" }));
    }

    let uploadButton;
    const modal = Modal({
        title: existingMedia ? "Edit Media" : `Create Post for ${entityType}`,
        content,
        onClose: () => modal.remove()
    });

    uploadButton = Button(existingMedia ? "Update" : "Post", "uploadMediaBtn", {
        click: () => {
            uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal, existingMedia);
            uploadButton.style.display = "none";
        }
    }, "btn btn-primary");

    content.append(fileGroup, captionGroup, tagsGroup, previewDiv, uploadButton);

    fileGroup.querySelector("input").addEventListener("change", (e) => {
        const file = e.target.files[0];
        previewDiv.replaceChildren();
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (file.type.startsWith("image/")) previewDiv.appendChild(createElement("img", { src: url, style: "max-width:100%" }));
        else if (file.type.startsWith("video/")) previewDiv.appendChild(createElement("video", { src: url, controls: true, style: "max-width:100%" }));
    });
}

// ------------------ Main Display ------------------
export async function displayMedia(content, entityType, entityId, isLoggedIn) {
    clearElement(content);
    content.appendChild(createElement("h2", {}, ["Media Gallery"]));

    const mediaList = createElement("div", { class: "hvflex medialist" });
    if (isLoggedIn) {
        const addBtn = Button("Add Media", "add-media-btn", { click: () => showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList) });
        content.prepend(addBtn);
    }
    content.appendChild(mediaList);

    let mediaData = await apiFetch(`/media/${entityType}/${entityId}`);
    if (!Array.isArray(mediaData) || mediaData.length === 0) {
        mediaList.appendChild(createElement("p", {}, ["No media available."]));
        return;
    }

    const mediaItems = [];
    mediaData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .forEach((media) => addMediaItem(mediaItems, media, mediaList, isLoggedIn, entityType, entityId));
}

// ------------------ Video Playback ------------------
function playVideo(videos, index, videoid) {
    let poster = "#", qualities = [], subtitles = [];
    document.getElementById("app").appendChild(VidPlay(videos[index], poster, qualities, subtitles, videoid));
}

export { renderMediaItem, showMediaUploadForm, uploadMedia, addMediaItem, deleteMedia };
