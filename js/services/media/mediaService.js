import { getState } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import VidPlay from '../../components/ui/VidPlay.mjs';
import Modal from '../../components/ui/Modal.mjs';
import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";

import { resolveImagePath, PictureType, EntityType } from "../../utils/imagePaths.js";
import { reportPost } from "../reporting/reporting.js";
import Sightbox from "../../components/ui/SightBox.mjs";
import { createFormGroup } from "../../components/createFormGroup.js";
import Imagex from "../../components/base/Imagex.js";

let mediaItems = []; // Global media array

/******************
 * Lazy Loading Observer
 ******************/
const lazyMediaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
            if (el.dataset.src) { el.src = el.dataset.src; delete el.dataset.src; }
            if (el.tagName === "VIDEO" && el.paused) el.load();
        } else if (el.tagName === "VIDEO" && !el.paused) {
            el.pause();
        }
    });
}, { rootMargin: "100px 0px", threshold: 0.1 });

/******************
 * Media Element Helpers
 ******************/
function createMediaElement(media, index) {
    if (!media.url) return null;

    if (media.type === "image") {
        const img = Imagex({
            "data-src": resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.url),
            loading: "lazy",
            alt: media.caption || "Media Image",
            class: "media-img",
            "data-index": index
        });
        lazyMediaObserver.observe(img);
        return img;
    } else if (media.type === "video") {
        const video = createElement("video", {
            class: "media-video",
            controls: false,
            poster: resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.mediaid}.jpg`),
            "data-src": resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url),
            "data-index": index
        });
        lazyMediaObserver.observe(video);
        return video;
    } else return null;
}

function createMediaActions(media, entityType, entityId, isLoggedIn) {
    const actionCon = createElement("div", { class: "hflex-sb pad10" });

    if (isLoggedIn && getState("user") === media.creatorid) {
        const deleteBtn = createActionButton("delete-media-btn", "Delete", async () => {
            try {
                await deleteMedia(media.mediaid, entityType, entityId);
                actionCon.parentElement.remove();
            } catch (err) {
                console.error("Failed to delete media:", err);
            }
        });
        actionCon.appendChild(deleteBtn);
    }

    const reportBtn = createActionButton("report-btn", "Report", () => {
        reportPost(media.mediaid, "media");
    });
    actionCon.appendChild(reportBtn);

    return actionCon;
}

function createActionButton(className, label, onClick) {
    const btn = createElement("button", { class: className }, [label]);
    btn.addEventListener("click", onClick);
    return btn;
}

/******************
 * Render Media Item
 ******************/
function renderMediaItem(media, index, isLoggedIn, entityType, entityId) {
    const mediaItem = createElement("div", { class: "media-item" });
    const mediaEl = createMediaElement(media, index);
    if (!mediaEl) return mediaItem;

    const caption = createElement("figcaption", {}, [media.caption || "No caption provided"]);
    mediaItem.appendChild(createElement("figure", {}, [mediaEl, caption]));
    mediaItem.appendChild(createMediaActions(media, entityType, entityId, isLoggedIn));

    return mediaItem;
}

/******************
 * Display Media Gallery
 ******************/
export async function displayMedia(content, entityType, entityId, isLoggedIn) {
    clearElement(content);
    content.appendChild(createElement("h2", {}, ["Media Gallery"]));

    const mediaData = await apiFetch(`/media/${entityType}/${entityId}`);
    const mediaList = createElement("div", { class: "hvflex medialist" });
    content.appendChild(mediaList);

    if (isLoggedIn) {
        const addMediaBtn = Button("Add Media", "add-media-btn", {
            click: () => showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList)
        });
        content.prepend(addMediaBtn);
    }

    if (!Array.isArray(mediaData) || !mediaData.length) {
        mediaList.appendChild(createElement("p", {}, ["No media available for this entity."]));
        return;
    }

    const imageUrls = [];
    const videoUrls = [];

    mediaData.forEach((media, index) => {
        const item = renderMediaItem(media, index, isLoggedIn, entityType, entityId);
        mediaList.appendChild(item);

        if (media.type === "image") imageUrls.push(resolveImagePath(EntityType.MEDIA, PictureType.PHOTO, media.url));
        else if (media.type === "video") videoUrls.push(resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url));
    });

    // Lightbox & Video Player
    mediaList.querySelectorAll(".media-img").forEach((img, i) => img.addEventListener("click", () => Sightbox(imageUrls, i)));
    mediaList.querySelectorAll(".media-video").forEach((video, i) => video.addEventListener("click", () => playVideo(videoUrls, i, entityId)));
}

/******************
 * Helper Functions
 ******************/
function clearElement(el) { while (el.firstChild) el.removeChild(el.firstChild); }

function playVideo(videos, index, videoid) {
    let poster = "#";
    let qualities = [];
    let subtitles = [];
    document.getElementById('app').appendChild(VidPlay(videos[index], poster, qualities, subtitles, videoid));
}

/******************
 * Media Upload Functions
 ******************/
async function uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal) {
    const fileInput = document.getElementById("mediaFile");
    const captionInput = document.getElementById("mediaCaption");
    const file = fileInput?.files?.[0];

    if (!file) return alert("Please select a file to upload.");

    const formData = new FormData();
    formData.append("media", file);
    formData.append("caption", captionInput?.value || "");

    try {
        const uploadResponse = await apiFetch(
            `/media/${entityType}/${entityId}`,
            "POST",
            formData,
            { raw: true }
        );

        if (uploadResponse?.mediaid) {
            Notify("Media uploaded successfully!", { type: "success", duration: 3000, dismissible: true });
            modal.remove();
            document.body.style.overflow = "";
            displayNewMedia(isLoggedIn, uploadResponse, mediaList);
        } else {
            alert(`Failed to upload media: ${uploadResponse?.message || "Unknown error"}`);
        }
    } catch (error) {
        alert(`Error uploading media: ${error.message}`);
    }
}

function displayNewMedia(isLoggedIn, mediaData, mediaList) {
    const mediaItem = renderMediaItem(mediaData, mediaItems.length, isLoggedIn, mediaData.entitytype, mediaData.entityid);
    mediaList.appendChild(mediaItem);
    mediaItems.push(mediaData);
}

async function deleteMedia(mediaId, entityType, entityId) {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
        const response = await apiFetch(`/media/${entityType}/${entityId}/${mediaId}`, 'DELETE');
        if (response.status === 204) {
            alert('Media deleted successfully!');
            mediaItems = mediaItems.filter((media) => media.mediaid !== mediaId);
            const mediaEl = document.querySelector(`.delete-media-btn[data-media-id="${mediaId}"]`)?.parentElement;
            if (mediaEl) mediaEl.remove();
        } else {
            const errorData = await response.json();
            alert(`Failed to delete media: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error deleting media:', error);
        alert('An error occurred while deleting the media.');
    }
}

function addMediaEventListeners(isLoggedIn, entityType) {
    document.addEventListener("click", (event) => {
        const target = event.target;
        if (target.id === "uploadMediaBtn") {
            const entityId = target.getAttribute("data-entity-id");
            uploadMedia(isLoggedIn, entityType, entityId);
        }
    });
}

/******************
 * Upload Form
 ******************/
function createPreviewElement(file) {
    if (!file) return null;
    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
        const img = createElement("img", { src: url, style: "max-width:100%" });
        return img;
    } else if (file.type.startsWith("video/")) {
        const video = createElement("video", { src: url, controls: true, style: "max-width:100%" });
        return video;
    }
    return null;
}

function showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList) {
    const content = createElement("div", { id: "mediaform" });

    const fileGroup = createFormGroup({ label: "Select Media", type: "file", id: "mediaFile", isRequired: true, additionalProps: { accept: "image/*,video/*" } });
    const captionGroup = createFormGroup({ label: "Caption", type: "text", id: "mediaCaption", placeholder: "Write a short caption..." });
    const previewDiv = createElement("div", { id: "mediaPreview" });

    const uploadButton = Button("Upload", "uploadMediaBtn", {
        click: () => { uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal); uploadButton.style.display = "none"; }
    }, "btn btn-primary");

    content.append(fileGroup, captionGroup, previewDiv, uploadButton);

    const modal = Modal({
        title: `Upload Media for ${entityType}`,
        content,
        onClose: () => modal.remove()
    });

    fileGroup.querySelector("input").addEventListener("change", (e) => {
        const file = e.target.files[0];
        previewDiv.replaceChildren();
        const previewEl = createPreviewElement(file);
        if (previewEl) previewDiv.appendChild(previewEl);
    });
}

/******************
 * Exports
 ******************/
export {
    renderMediaItem,
    showMediaUploadForm,
    uploadMedia,
    displayNewMedia,
    deleteMedia,
    addMediaEventListeners
};
