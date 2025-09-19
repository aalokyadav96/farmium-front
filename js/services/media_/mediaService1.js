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

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_VIDEO_DURATION = 600; // 10 min

let mediaItems = []; // globally scoped

// -------------------- Utility Functions --------------------

function sanitizeID(id) {
    return String(id || "").trim();
}

function isValidEntityType(type) {
    return ["event", "place", "user", "post", "artist"].includes(type);
}

function createActionButton(className, label, onClick) {
    const btn = createElement("button", { class: className }, [label]);
    btn.addEventListener("click", onClick);
    return btn;
}

function clearElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
}

// -------------------- Media Upload --------------------

async function uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal) {
    entityType = sanitizeID(entityType);
    entityId = sanitizeID(entityId);

    if (!isValidEntityType(entityType) || !entityId) {
        Notify("Invalid entity type or ID", { type: "error" });
        return;
    }

    const fileInput = document.getElementById("mediaFile");
    const captionInput = document.getElementById("mediaCaption");

    const tagSong = document.getElementById("tagSong");
    const tagEvent = document.getElementById("tagEvent");
    const tagMerch = document.getElementById("tagMerch");

    const file = fileInput?.files?.[0];
    const caption = captionInput?.value || "";

    const tags = [];
    if (tagSong?.value) tags.push(`song:${tagSong.value}`);
    if (tagEvent?.value) tags.push(`event:${tagEvent.value}`);
    if (tagMerch?.value) tags.push(`merch:${tagMerch.value}`);

    if (file && file.size > MAX_FILE_SIZE) {
        Notify("File size exceeds maximum allowed 100 MB", { type: "error" });
        return;
    }

    // Video duration check (client-side estimate for validation)
    if (file?.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = URL.createObjectURL(file);

        await new Promise((resolve) => {
            video.onloadedmetadata = () => {
                if (video.duration > MAX_VIDEO_DURATION) {
                    Notify(`Video exceeds maximum duration of 10 minutes`, { type: "error" });
                    resolve(false);
                } else {
                    resolve(true);
                }
            };
        });
    }

    const formData = new FormData();
    if (file) formData.append("media", file);
    formData.append("caption", caption);
    formData.append("tags", tags.join(","));

    try {
        const uploadResponse = await apiFetch(`/media/${entityType}/${entityId}`, "POST", formData, { raw: true });

        if (uploadResponse && (uploadResponse.mediaid || uploadResponse.type === "text")) {
            Notify("Post uploaded successfully!", { type: "success", duration: 3000, dismissible: true });
            modal.remove();
            document.body.style.overflow = "";
            displayNewMedia(isLoggedIn, uploadResponse, mediaList);
        } else {
            Notify(`Failed to upload post: ${uploadResponse?.message || "Unknown error"}`, { type: "error" });
        }
    } catch (error) {
        Notify(`Error uploading post: ${error.message}`, { type: "error" });
    }
}

// -------------------- Delete Media --------------------

async function deleteMedia(mediaId, entityType, entityId) {
    entityType = sanitizeID(entityType);
    entityId = sanitizeID(entityId);
    mediaId = sanitizeID(mediaId);

    if (!isValidEntityType(entityType) || !entityId || !mediaId) {
        Notify("Invalid media or entity ID", { type: "error" });
        return;
    }

    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
        const response = await apiFetch(`/media/${entityType}/${entityId}/${mediaId}`, 'DELETE', null, { raw: true });

        if (response.success) {
            Notify('Media deleted successfully!', { type: "success" });
            const mediaItem = document.querySelector(`.delete-media-btn[data-media-id="${mediaId}"]`)?.parentElement;
            if (mediaItem) mediaItem.remove();
            mediaItems = mediaItems.filter((m) => m.mediaid !== mediaId);
        } else {
            Notify(`Failed to delete media: ${response?.message || "Unknown error"}`, { type: "error" });
        }
    } catch (error) {
        console.error('Error deleting media:', error);
        Notify('An error occurred while deleting the media.', { type: "error" });
    }
}

// -------------------- Display Media --------------------

const lazyMediaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
            if (el.dataset.src) {
                el.src = el.dataset.src;
                delete el.dataset.src;
            }
            if (el.tagName === "VIDEO" && el.paused) el.load();
        } else {
            if (el.tagName === "VIDEO" && !el.paused) el.pause();
        }
    });
}, { rootMargin: "100px 0px", threshold: 0.1 });

function renderMediaItem(media, index, isLoggedIn, entityType, entityId) {
    const mediaItem = createElement("div", { class: "media-item" });
    const figureContent = [];

    if (media.type === "text") {
        figureContent.push(createElement("p", { class: "text-post" }, [media.caption || ""]));
    } else if (media.type === "image") {
        const img = createElement("img", {
            "data-src": resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.url),
            loading: "lazy",
            alt: media.caption || "Media Image",
            class: "media-img",
            "data-index": index
        });
        lazyMediaObserver.observe(img);
        figureContent.push(img, createElement("figcaption", {}, [media.caption || ""]));
    } else if (media.type === "video") {
        const video = createElement("video", {
            class: "media-video",
            controls: false,
            poster: resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.mediaid}.jpg`),
            "data-src": resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url),
            "data-index": index
        });
        lazyMediaObserver.observe(video);
        figureContent.push(video, createElement("figcaption", {}, [media.caption || ""]));
    }

    mediaItem.appendChild(createElement("figure", {}, figureContent));
    if (media.tags?.length) {
        mediaItem.appendChild(createElement("div", { class: "tags" },
            media.tags.map(tag => createElement("span", { class: "tag" }, [tag]))
        ));
    }

    if (isLoggedIn && getState("user") === media.creatorid) {
        const deleteBtn = createActionButton("delete-media-btn", "Delete", async () => {
            await deleteMedia(media.mediaid, entityType, entityId);
            mediaItem.remove();
        });
        mediaItem.appendChild(deleteBtn);
    }

    const reportBtn = createActionButton("report-btn", "Report", () => reportPost(media.mediaid, "media"));
    mediaItem.appendChild(reportBtn);

    return mediaItem;
}

function displayNewMedia(isLoggedIn, mediaData, mediaList) {
    mediaItems.push(mediaData);
    const item = renderMediaItem(mediaData, mediaItems.length - 1, isLoggedIn, mediaData.entitytype, mediaData.entityid);
    mediaList.appendChild(item);
}

// -------------------- Media Gallery --------------------

export async function displayMedia(content, entityType, entityId, isLoggedIn) {
    entityType = sanitizeID(entityType);
    entityId = sanitizeID(entityId);

    if (!isValidEntityType(entityType) || !entityId) {
        Notify("Invalid entity type or ID", { type: "error" });
        return;
    }

    clearElement(content);
    content.appendChild(createElement("h2", {}, ["Media Gallery"]));

    const mediaData = await apiFetch(`/media/${entityType}/${entityId}`);
    const mediaList = createElement("div", { class: "hvflex" });

    if (isLoggedIn) {
        const addMediaBtn = Button("Add Media", "add-media-btn", {
            click: () => showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList)
        });
        content.prepend(addMediaBtn);
    }

    content.appendChild(mediaList);

    if (!Array.isArray(mediaData) || !mediaData.length) {
        mediaList.appendChild(createElement("p", {}, ["No media available for this entity."]));
        return;
    }

    mediaData.forEach((media, index) => {
        mediaItems.push(media);
        mediaList.appendChild(renderMediaItem(media, index, isLoggedIn, entityType, entityId));
    });
}

// -------------------- Video Playback --------------------

function playVideo(videos, index, videoid) {
    const poster = "#";
    const qualities = [];
    const subtitles = [];
    document.getElementById('app').appendChild(VidPlay(videos[index], poster, qualities, subtitles, videoid));
}

// -------------------- Media Upload Form --------------------

// function showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList) {
//     const content = createElement("div", { id: "mediaform" });

//     const fileGroup = createFormGroup({ label: "Select Media (optional)", type: "file", id: "mediaFile", isRequired: false, additionalProps: { accept: "image/*,video/*" } });
//     const captionGroup = createFormGroup({ label: "Caption / Text Post", type: "text", id: "mediaCaption", placeholder: "Write something..." });

//     const songSelect = createElement("select", { id: "tagSong" }, [
//         createElement("option", { value: "" }, ["Tag a Song"]),
//         createElement("option", { value: "123" }, ["Song #123"]),
//         createElement("option", { value: "456" }, ["Song #456"])
//     ]);
//     const eventSelect = createElement("select", { id: "tagEvent" }, [
//         createElement("option", { value: "" }, ["Tag an Event"]),
//         createElement("option", { value: "789" }, ["Event #789"]),
//         createElement("option", { value: "321" }, ["Event #321"])
//     ]);
//     const merchSelect = createElement("select", { id: "tagMerch" }, [
//         createElement("option", { value: "" }, ["Tag Merch"]),
//         createElement("option", { value: "654" }, ["Merch #654"]),
//         createElement("option", { value: "987" }, ["Merch #987"])
//     ]);

//     const tagsGroup = createElement("div", { class: "tags-select" }, [songSelect, eventSelect, merchSelect]);
//     const previewDiv = createElement("div", { id: "mediaPreview" });

//     const uploadButton = Button("Post", "uploadMediaBtn", {
//         click: () => {
//             uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal);
//             uploadButton.style.display = "none";
//         }
//     }, "btn btn-primary");

//     content.append(fileGroup, captionGroup, tagsGroup, previewDiv, uploadButton);

//     const modal = Modal({ title: `Create Post for ${entityType}`, content, onClose: () => modal.remove() });

//     fileGroup.querySelector("input").addEventListener("change", (e) => {
//         const file = e.target.files[0];
//         previewDiv.replaceChildren();
//         if (!file) return;
//         const url = URL.createObjectURL(file);
//         if (file.type.startsWith("image/")) {
//             previewDiv.appendChild(createElement("img", { src: url, style: "max-width:100%" }));
//         } else if (file.type.startsWith("video/")) {
//             const video = createElement("video", { src: url, controls: true, style: "max-width:100%" });
//             previewDiv.appendChild(video);
//         }
//     });
// }
function showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList) {
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
        placeholder: "Write something..." 
    });

    // Single input for comma-separated tags
    const tagsGroup = createFormGroup({ 
        label: "Tags (comma-separated)", 
        type: "text", 
        id: "mediaTags", 
        placeholder: "e.g., song:123,event:456,merch:789" 
    });

    const previewDiv = createElement("div", { id: "mediaPreview" });

    const uploadButton = Button("Post", "uploadMediaBtn", {
        click: () => {
            uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal);
            uploadButton.style.display = "none";
        }
    }, "btn btn-primary");

    content.append(fileGroup, captionGroup, tagsGroup, previewDiv, uploadButton);

    const modal = Modal({ 
        title: `Create Post for ${entityType}`, 
        content, 
        onClose: () => modal.remove() 
    });

    fileGroup.querySelector("input").addEventListener("change", (e) => {
        const file = e.target.files[0];
        previewDiv.replaceChildren();
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (file.type.startsWith("image/")) {
            previewDiv.appendChild(createElement("img", { src: url, style: "max-width:100%" }));
        } else if (file.type.startsWith("video/")) {
            const video = createElement("video", { src: url, controls: true, style: "max-width:100%" });
            previewDiv.appendChild(video);
        }
    });
}

// -------------------- Event Listeners --------------------

function addMediaEventListeners(isLoggedIn, entityType) {
    document.addEventListener("click", (event) => {
        const target = event.target;
        if (target.id === "uploadMediaBtn") {
            const entityId = target.getAttribute("data-entity-id");
            uploadMedia(isLoggedIn, entityType, entityId);
        }
    });
}

export { renderMediaItem, showMediaUploadForm, uploadMedia, displayNewMedia, deleteMedia, addMediaEventListeners, /*displayMedia*/ };

// import { getState } from "../../state/state.js";
// import { apiFetch } from "../../api/api.js";
// import VidPlay from '../../components/ui/VidPlay.mjs';
// import Modal from '../../components/ui/Modal.mjs';
// import { Button } from "../../components/base/Button.js";
// import { createElement } from "../../components/createElement.js";
// import Notify from "../../components/ui/Notify.mjs";

// import { resolveImagePath, PictureType, EntityType } from "../../utils/imagePaths.js";
// import { reportPost } from "../reporting/reporting.js";
// import Sightbox from "../../components/ui/SightBox.mjs";
// import { createFormGroup } from "../../components/createFormGroup.js";
// import Imagex from "../../components/base/Imagex.js";


// let mediaItems = []; // Ensure this is globally scoped

// // Upload media to the server
// async function uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal) {
//     const fileInput = document.getElementById("mediaFile");
//     const captionInput = document.getElementById("mediaCaption");

//     const tagSong = document.getElementById("tagSong");
//     const tagEvent = document.getElementById("tagEvent");
//     const tagMerch = document.getElementById("tagMerch");

//     const file = fileInput?.files?.[0];
//     const caption = captionInput?.value || "";

//     const tags = [];
//     if (tagSong?.value) tags.push(`song:${tagSong.value}`);
//     if (tagEvent?.value) tags.push(`event:${tagEvent.value}`);
//     if (tagMerch?.value) tags.push(`merch:${tagMerch.value}`);

//     const formData = new FormData();
//     if (file) {
//         formData.append("media", file);
//     }
//     formData.append("caption", caption);
//     formData.append("tags", JSON.stringify(tags));

//     try {
//         const uploadResponse = await apiFetch(
//             `/media/${entityType}/${entityId}`,
//             "POST",
//             formData,
//             { raw: true }
//         );

//         if (uploadResponse && (uploadResponse.mediaid || uploadResponse.type === "text")) {
//             Notify("Post uploaded successfully!", { type: "success", duration: 3000, dismissible: true });
//             modal.remove();
//             document.body.style.overflow = "";
//             displayNewMedia(isLoggedIn, uploadResponse, mediaList);
//         } else {
//             alert(`Failed to upload post: ${uploadResponse?.message || "Unknown error"}`);
//         }
//     } catch (error) {
//         alert(`Error uploading post: ${error.message}`);
//     }
// }


// async function deleteMedia(mediaId, entityType, entityId) {
//     if (confirm('Are you sure you want to delete this media?')) {
//         try {
//             const response = await apiFetch(`/media/${entityType}/${entityId}/${mediaId}`, 'DELETE');

//             if (response.status === 204) {
//                 alert('Media deleted successfully!');

//                 const mediaItem = document.querySelector(`.delete-media-btn[data-media-id="${mediaId}"]`).parentElement;
//                 if (mediaItem) {
//                     mediaItem.remove();
//                 }

//                 mediaItems = mediaItems.filter((media) => media.mediaid !== mediaId);
//             } else {
//                 const errorData = await response.json();
//                 alert(`Failed to delete media: ${errorData.message || 'Unknown error'}`);
//             }
//         } catch (error) {
//             console.error('Error deleting media:', error);
//             alert('An error occurred while deleting the media.');
//         }
//     }
// }


// function addMediaEventListeners(isLoggedIn, entityType) {
//     document.addEventListener("click", (event) => {
//         const target = event.target;

//         if (target.id === "uploadMediaBtn") {
//             const entityId = target.getAttribute("data-entity-id");
//             uploadMedia(isLoggedIn, entityType, entityId);
//         }
//     });
// }


// // Display newly uploaded media in the list
// function displayNewMedia(isLoggedIn, mediaData, mediaList) {
//     const isCreator = isLoggedIn && getState("user") === mediaData.creatorid;
//     const mediaItem = createElement("div", { class: "post-item" });

//     mediaItem.appendChild(createElement("h3", {}, [mediaData.caption || ""]));

//     let mediaElement;
//     if (mediaData.type === "image") {
//         mediaElement = createElement("img", {
//             src: resolveImagePath(EntityType.MEDIA, PictureType.PHOTO, mediaData.url),
//             alt: mediaData.caption || "Media",
//             style: "max-width: 160px; max-height: 240px;"
//         });
//     } else if (mediaData.type === "video") {
//         mediaElement = createElement("video", { controls: true, style: "max-width: 160px; max-height: 240px;" }, [
//             createElement("source", { src: resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, mediaData.url), type: "video/mp4" })
//         ]);
//     }
//     if (mediaElement) mediaItem.appendChild(mediaElement);

//     if (mediaData.tags && mediaData.tags.length > 0) {
//         const tagsDiv = createElement("div", { class: "tags" },
//             mediaData.tags.map(tag => createElement("span", { class: "tag" }, [tag]))
//         );
//         mediaItem.appendChild(tagsDiv);
//     }

//     if (isCreator) {
//         const deleteBtn = createElement("button", {
//             class: "delete-media-btn",
//             "data-media-id": mediaData.mediaid,
//             "data-entity-id": mediaData.entityid,
//         }, ["Delete"]);
//         mediaItem.appendChild(deleteBtn);
//     }

//     mediaList.appendChild(mediaItem);
//     mediaItems.push(mediaData);
// }


// // Observer for lazy loading and video auto-pause
// const lazyMediaObserver = new IntersectionObserver((entries, observer) => {
//     entries.forEach(entry => {
//         const el = entry.target;

//         if (entry.isIntersecting) {
//             if (el.dataset.src) {
//                 el.src = el.dataset.src;
//                 delete el.dataset.src;
//             }
//             if (el.tagName === "VIDEO" && el.paused) {
//                 el.load();
//             }
//         } else {
//             if (el.tagName === "VIDEO" && !el.paused) {
//                 el.pause();
//             }
//         }
//     });
// }, {
//     rootMargin: "100px 0px",
//     threshold: 0.1
// });

// function renderMediaItem(media, index, isLoggedIn, entityType, entityId) {
//     const mediaItem = createElement("div", { class: "media-item" });

//     if (!media.url && media.type !== "text") {
//         console.warn(`Media item missing URL (ID: ${media.mediaid || "unknown"})`);
//         return mediaItem;
//     }

//     let figureContent = [];

//     if (media.type === "text") {
//         const textBlock = createElement("p", { class: "text-post" }, [media.caption || ""]);
//         figureContent.push(textBlock);
//     } else if (media.type === "image") {
//         const img = createElement("img", {
//             "data-src": resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.url),
//             loading: "lazy",
//             alt: media.caption || "Media Image",
//             class: "media-img",
//             "data-index": index
//         });
//         lazyMediaObserver.observe(img);

//         const caption = createElement("figcaption", {}, [media.caption || ""]);
//         figureContent.push(img, caption);
//     } else if (media.type === "video") {
//         const video = createElement("video", {
//             class: "media-video",
//             controls: false,
//             poster: resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.mediaid}.jpg`),
//             "data-src": resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url),
//             "data-index": index
//         });
//         lazyMediaObserver.observe(video);

//         const caption = createElement("figcaption", {}, [media.caption || ""]);
//         figureContent.push(video, caption);
//     } else {
//         console.warn(`Unsupported media type: ${media.type}`);
//         return mediaItem;
//     }

//     mediaItem.appendChild(createElement("figure", {}, figureContent));

//     if (media.tags && Array.isArray(media.tags) && media.tags.length > 0) {
//         const tagsDiv = createElement("div", { class: "tags" },
//             media.tags.map(tag => createElement("span", { class: "tag" }, [tag]))
//         );
//         mediaItem.appendChild(tagsDiv);
//     }

//     if (isLoggedIn && getState("user") === media.creatorid) {
//         const deleteBtn = createActionButton("delete-media-btn", "Delete", async () => {
//             try {
//                 await deleteMedia(media.mediaid, entityType, entityId);
//                 mediaItem.remove();
//             } catch (err) {
//                 console.error("Failed to delete media:", err);
//             }
//         });
//         mediaItem.appendChild(deleteBtn);
//     }

//     const reportBtn = createActionButton("report-btn", "Report", () => {
//         reportPost(media.mediaid, "media");
//     });
//     mediaItem.appendChild(reportBtn);

//     return mediaItem;
// }


// function createActionButton(className, label, onClick) {
//     const btn = createElement("button", { class: className }, [label]);
//     btn.addEventListener("click", onClick);
//     return btn;
// }

// export async function displayMedia(content, entityType, entityId, isLoggedIn) {
//     clearElement(content);
//     content.appendChild(createElement("h2", {}, ["Media Gallery"]));

//     const mediaData = await apiFetch(`/media/${entityType}/${entityId}`);
//     const mediaList = createElement("div", { class: "hvflex" });

//     if (isLoggedIn) {
//         const addMediaBtn = Button("Add Media", "add-media-btn", {
//             click: () => showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList)
//         });
//         content.prepend(addMediaBtn);
//     }

//     content.appendChild(mediaList);

//     if (!Array.isArray(mediaData) || mediaData.length === 0) {
//         mediaList.appendChild(createElement("p", {}, ["No media available for this entity."]));
//         return;
//     }

//     const imageUrls = [];
//     const videoUrls = [];

//     mediaData.forEach((media, index) => {
//         const item = renderMediaItem(media, index, isLoggedIn, entityType, entityId);
//         mediaList.appendChild(item);

//         if (media.type === "image") {
//             imageUrls.push(resolveImagePath(EntityType.MEDIA, PictureType.PHOTO, media.url));
//         } else if (media.type === "video") {
//             videoUrls.push(resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url));
//         }
//     });

//     mediaList.querySelectorAll(".media-img").forEach((img, i) => {
//         img.addEventListener("click", () => Sightbox(imageUrls, i));
//     });

//     mediaList.querySelectorAll(".media-video").forEach((video, i) => {
//         video.addEventListener("click", () => playVideo(videoUrls, i, entityId));
//     });
// }

// function clearElement(el) {
//     while (el.firstChild) el.removeChild(el.firstChild);
// }


// function playVideo(videos, index, videoid) {
//     let poster = "#";
//     let qualities = [];
//     let subtitles = [];
//     document.getElementById('app').appendChild(VidPlay(videos[index], poster, qualities, subtitles, videoid));
// }

// /******************* */
// // Show media upload form
// function showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList) {
//     const content = document.createElement("div");
//     content.setAttribute("id", "mediaform");

//     const fileGroup = createFormGroup({
//         label: "Select Media (optional)",
//         type: "file",
//         id: "mediaFile",
//         isRequired: false,
//         additionalProps: { accept: "image/*,video/*" }
//     });

//     const captionGroup = createFormGroup({
//         label: "Caption / Text Post",
//         type: "text",
//         id: "mediaCaption",
//         placeholder: "Write something..."
//     });

//     // Tag dropdowns
//     const songSelect = createElement("select", { id: "tagSong" }, [
//         createElement("option", { value: "" }, ["Tag a Song"]),
//         createElement("option", { value: "123" }, ["Song #123"]),
//         createElement("option", { value: "456" }, ["Song #456"])
//     ]);

//     const eventSelect = createElement("select", { id: "tagEvent" }, [
//         createElement("option", { value: "" }, ["Tag an Event"]),
//         createElement("option", { value: "789" }, ["Event #789"]),
//         createElement("option", { value: "321" }, ["Event #321"])
//     ]);

//     const merchSelect = createElement("select", { id: "tagMerch" }, [
//         createElement("option", { value: "" }, ["Tag Merch"]),
//         createElement("option", { value: "654" }, ["Merch #654"]),
//         createElement("option", { value: "987" }, ["Merch #987"])
//     ]);

//     const tagsGroup = createElement("div", { class: "tags-select" }, [songSelect, eventSelect, merchSelect]);

//     const previewDiv = document.createElement("div");
//     previewDiv.id = "mediaPreview";

//     const uploadButton = Button("Post", "uploadMediaBtn", {
//         click: () => {
//             uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal);
//             uploadButton.style.display = "none";
//         }
//     }, "btn btn-primary");

//     content.append(fileGroup, captionGroup, tagsGroup, previewDiv, uploadButton);

//     const modal = Modal({
//         title: `Create Post for ${entityType}`,
//         content,
//         onClose: () => modal.remove()
//     });

//     fileGroup.querySelector("input").addEventListener("change", (e) => {
//         const file = e.target.files[0];
//         previewDiv.replaceChildren();
//         if (file) {
//             const url = URL.createObjectURL(file);
//             if (file.type.startsWith("image/")) {
//                 const img = document.createElement("img");
//                 img.src = url;
//                 img.style.maxWidth = "100%";
//                 previewDiv.appendChild(img);
//             } else if (file.type.startsWith("video/")) {
//                 const video = document.createElement("video");
//                 video.src = url;
//                 video.controls = true;
//                 video.style.maxWidth = "100%";
//                 previewDiv.appendChild(video);
//             }
//         }
//     });
// }


// /******************* */

// export { renderMediaItem, showMediaUploadForm, uploadMedia, displayNewMedia, deleteMedia, addMediaEventListeners };

// // import {  getState } from "../../state/state.js";
// // import { apiFetch } from "../../api/api.js";
// // import VidPlay from '../../components/ui/VidPlay.mjs';
// // import Modal from '../../components/ui/Modal.mjs';
// // import { Button } from "../../components/base/Button.js";
// // import { createElement } from "../../components/createElement.js";
// // import Notify from "../../components/ui/Notify.mjs";

// // import { resolveImagePath, PictureType, EntityType } from "../../utils/imagePaths.js";
// // import { reportPost } from "../reporting/reporting.js";
// // import Sightbox from "../../components/ui/SightBox.mjs";
// // import { createFormGroup } from "../../components/createFormGroup.js";
// // import Imagex from "../../components/base/Imagex.js";


// // let mediaItems = []; // Ensure this is globally scoped

// // // Upload media to the server
// // async function uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal) {
// //     const fileInput = document.getElementById("mediaFile");
// //     const captionInput = document.getElementById("mediaCaption");
// //     const tagsInput = document.getElementById("mediaTags");

// //     const file = fileInput?.files?.[0];
// //     const caption = captionInput?.value || "";
// //     const tags = tagsInput?.value ? tagsInput.value.split(",").map(t => t.trim()) : [];

// //     const formData = new FormData();
// //     if (file) {
// //         formData.append("media", file);
// //     }
// //     formData.append("caption", caption);
// //     formData.append("tags", JSON.stringify(tags));

// //     try {
// //         const uploadResponse = await apiFetch(
// //             `/media/${entityType}/${entityId}`,
// //             "POST",
// //             formData,
// //             { raw: true }
// //         );

// //         if (uploadResponse && (uploadResponse.mediaid || uploadResponse.type === "text")) {
// //             Notify("Post uploaded successfully!", {type:"success",duration:3000,dismissible:true});
// //             modal.remove();
// //             document.body.style.overflow = "";
// //             displayNewMedia(isLoggedIn, uploadResponse, mediaList);
// //         } else {
// //             alert(`Failed to upload post: ${uploadResponse?.message || "Unknown error"}`);
// //         }
// //     } catch (error) {
// //         alert(`Error uploading post: ${error.message}`);
// //     }
// // }



// // async function deleteMedia(mediaId, entityType, entityId) {
// //     if (confirm('Are you sure you want to delete this media?')) {
// //         try {
// //             const response = await apiFetch(`/media/${entityType}/${entityId}/${mediaId}`, 'DELETE');

// //             if (response.status === 204) { // Handle the 204 No Content status
// //                 alert('Media deleted successfully!');

// //                 // Find and remove the media item from the DOM
// //                 const mediaItem = document.querySelector(`.delete-media-btn[data-media-id="${mediaId}"]`).parentElement;
// //                 if (mediaItem) {
// //                     mediaItem.remove();
// //                 }

// //                 // Optionally update global mediaItems array if used
// //                 mediaItems = mediaItems.filter((media) => media.mediaid !== mediaId);
// //             } else {
// //                 const errorData = await response.json();
// //                 alert(`Failed to delete media: ${errorData.message || 'Unknown error'}`);
// //             }
// //         } catch (error) {
// //             console.error('Error deleting media:', error);
// //             alert('An error occurred while deleting the media.');
// //         }
// //     }
// // }


// // function addMediaEventListeners(isLoggedIn, entityType) {

// //     // Event delegation for upload button
// //     document.addEventListener("click", (event) => {
// //         const target = event.target;

// //         if (target.id === "uploadMediaBtn") {
// //             const entityId = target.getAttribute("data-entity-id");
// //             uploadMedia(isLoggedIn, entityType, entityId);
// //         }
// //     });

// // }


// // // Display newly uploaded media in the list
// // function displayNewMedia(isLoggedIn, mediaData, mediaList) {
// //     const isCreator = isLoggedIn && getState("user") === mediaData.creatorid;
// //     const mediaItem = createElement("div", { class: "post-item" });

// //     // Caption
// //     mediaItem.appendChild(createElement("h3", {}, [mediaData.caption || ""]));

// //     // Media (optional)
// //     let mediaElement;
// //     if (mediaData.type === "image") {
// //         mediaElement = createElement("img", {
// //             src: resolveImagePath(EntityType.MEDIA, PictureType.PHOTO, mediaData.url),
// //             alt: mediaData.caption || "Media",
// //             style: "max-width: 160px; max-height: 240px;"
// //         });
// //     } else if (mediaData.type === "video") {
// //         mediaElement = createElement("video", { controls: true, style: "max-width: 160px; max-height: 240px;" }, [
// //             createElement("source", { src: resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, mediaData.url), type: "video/mp4" })
// //         ]);
// //     }
// //     if (mediaElement) mediaItem.appendChild(mediaElement);

// //     // Tags
// //     if (mediaData.tags && mediaData.tags.length > 0) {
// //         const tagsDiv = createElement("div", { class: "tags" }, mediaData.tags.map(tag => 
// //             createElement("span", { class: "tag" }, [tag])
// //         ));
// //         mediaItem.appendChild(tagsDiv);
// //     }

// //     // Delete (if creator)
// //     if (isCreator) {
// //         const deleteBtn = createElement("button", {
// //             class: "delete-media-btn",
// //             "data-media-id": mediaData.mediaid,
// //             "data-entity-id": mediaData.entityid,
// //         }, ["Delete"]);
// //         mediaItem.appendChild(deleteBtn);
// //     }

// //     mediaList.appendChild(mediaItem);
// //     mediaItems.push(mediaData);
// // }


// // // Observer for lazy loading and video auto-pause
// // const lazyMediaObserver = new IntersectionObserver((entries, observer) => {
// //     entries.forEach(entry => {
// //         const el = entry.target;

// //         if (entry.isIntersecting) {
// //             // Load when visible
// //             if (el.dataset.src) {
// //                 el.src = el.dataset.src;
// //                 delete el.dataset.src;
// //             }
// //             // Start buffering if video
// //             if (el.tagName === "VIDEO" && el.paused) {
// //                 el.load();
// //             }
// //         } else {
// //             // Pause videos when out of view
// //             if (el.tagName === "VIDEO" && !el.paused) {
// //                 el.pause();
// //             }
// //         }
// //     });
// // }, {
// //     rootMargin: "100px 0px",
// //     threshold: 0.1
// // });

// // function renderMediaItem(media, index, isLoggedIn, entityType, entityId) {
// //     const mediaItem = createElement("div", { class: "media-item" });

// //     // Safety check
// //     if (!media.url && media.type !== "text") {
// //         console.warn(`Media item missing URL (ID: ${media.mediaid || "unknown"})`);
// //         return mediaItem;
// //     }

// //     let figureContent = [];

// //     // TEXT POST
// //     if (media.type === "text") {
// //         const textBlock = createElement("p", { class: "text-post" }, [media.caption || ""]);
// //         figureContent.push(textBlock);

// //     // IMAGE
// //     } else if (media.type === "image") {
// //         const img = createElement("img", {
// //             "data-src": resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.url),
// //             loading: "lazy",
// //             alt: media.caption || "Media Image",
// //             class: "media-img",
// //             "data-index": index
// //         });
// //         lazyMediaObserver.observe(img);

// //         const caption = createElement("figcaption", {}, [media.caption || ""]);
// //         figureContent.push(img, caption);

// //     // VIDEO
// //     } else if (media.type === "video") {
// //         const video = createElement("video", {
// //             class: "media-video",
// //             controls: false,
// //             poster: resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.mediaid}.jpg`),
// //             "data-src": resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url),
// //             "data-index": index
// //         });
// //         lazyMediaObserver.observe(video);

// //         const caption = createElement("figcaption", {}, [media.caption || ""]);
// //         figureContent.push(video, caption);

// //     } else {
// //         console.warn(`Unsupported media type: ${media.type}`);
// //         return mediaItem;
// //     }

// //     mediaItem.appendChild(createElement("figure", {}, figureContent));

// //     // TAGS
// //     if (media.tags && Array.isArray(media.tags) && media.tags.length > 0) {
// //         const tagsDiv = createElement("div", { class: "tags" }, 
// //             media.tags.map(tag => createElement("span", { class: "tag" }, [tag]))
// //         );
// //         mediaItem.appendChild(tagsDiv);
// //     }

// //     // CREATOR DELETE
// //     if (isLoggedIn && getState("user") === media.creatorid) {
// //         const deleteBtn = createActionButton("delete-media-btn", "Delete", async () => {
// //             try {
// //                 await deleteMedia(media.mediaid, entityType, entityId);
// //                 mediaItem.remove();
// //             } catch (err) {
// //                 console.error("Failed to delete media:", err);
// //             }
// //         });
// //         mediaItem.appendChild(deleteBtn);
// //     }

// //     // REPORT BUTTON
// //     const reportBtn = createActionButton("report-btn", "Report", () => {
// //         reportPost(media.mediaid, "media");
// //     });
// //     mediaItem.appendChild(reportBtn);

// //     return mediaItem;
// // }


// // function createActionButton(className, label, onClick) {
// //     const btn = createElement("button", { class: className }, [label]);
// //     btn.addEventListener("click", onClick);
// //     return btn;
// // }

// // export async function displayMedia(content, entityType, entityId, isLoggedIn) {
// //     clearElement(content);
// //     content.appendChild(createElement("h2", {}, ["Media Gallery"]));

// //     const mediaData = await apiFetch(`/media/${entityType}/${entityId}`);
// //     const mediaList = createElement("div", { class: "hvflex" });

// //     if (isLoggedIn) {
// //         const addMediaBtn = Button("Add Media", "add-media-btn", {
// //             click: () => showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList)
// //         });
// //         content.prepend(addMediaBtn);
// //     }

// //     content.appendChild(mediaList);

// //     if (!Array.isArray(mediaData) || mediaData.length === 0) {
// //         mediaList.appendChild(createElement("p", {}, ["No media available for this entity."]));
// //         return;
// //     }

// //     const imageUrls = [];
// //     const videoUrls = [];

// //     mediaData.forEach((media, index) => {
// //         const item = renderMediaItem(media, index, isLoggedIn, entityType, entityId);
// //         mediaList.appendChild(item);

// //         if (media.type === "image") {
// //             imageUrls.push(resolveImagePath(EntityType.MEDIA, PictureType.PHOTO, media.url));
// //         } else if (media.type === "video") {
// //             videoUrls.push(resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url));
// //         }
// //     });

// //     // Lightbox for images
// //     mediaList.querySelectorAll(".media-img").forEach((img, i) => {
// //         img.addEventListener("click", () => Sightbox(imageUrls, i));
// //     });

// //     // Video player for videos
// //     mediaList.querySelectorAll(".media-video").forEach((video, i) => {
// //         video.addEventListener("click", () => playVideo(videoUrls, i, entityId));
// //     });
// // }

// // function clearElement(el) {
// //     while (el.firstChild) el.removeChild(el.firstChild);
// // }


// // function playVideo(videos, index, videoid) {
// //     // poster = `${SRC_URL}/uploads/${media.id}.jpg`;
// //     let poster = "#";
// //     let qualities = [];
// //     let subtitles = [];
// //     console.log("dfghdgbfh");
// //     // document.getElementById('app').appendChild(VidPlay(videos[index]));    
// //     document.getElementById('app').appendChild(VidPlay(videos[index], poster, qualities, subtitles, videoid));
// // }

// // /******************* */
// // // Show media upload form


// // function showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList) {
// //     const content = document.createElement("div");
// //     content.setAttribute("id", "mediaform");

// //     // File input
// //     const fileGroup = createFormGroup({
// //         label: "Select Media (optional)",
// //         type: "file",
// //         id: "mediaFile",
// //         isRequired: false,
// //         additionalProps: { accept: "image/*,video/*" }
// //     });

// //     // Caption
// //     const captionGroup = createFormGroup({
// //         label: "Caption / Text Post",
// //         type: "text",
// //         id: "mediaCaption",
// //         placeholder: "Write something..."
// //     });

// //     // Tags input
// //     const tagsGroup = createFormGroup({
// //         label: "Tags (songs, events, merch)",
// //         type: "text",
// //         id: "mediaTags",
// //         placeholder: "e.g. song:123, event:456, merch:789"
// //     });

// //     const previewDiv = document.createElement("div");
// //     previewDiv.id = "mediaPreview";

// //     const uploadButton = Button("Post", "uploadMediaBtn", {
// //         click: () => {
// //             uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal);
// //             uploadButton.style.display = "none";
// //         }
// //     }, "btn btn-primary");

// //     content.append(fileGroup, captionGroup, tagsGroup, previewDiv, uploadButton);

// //     const modal = Modal({
// //         title: `Create Post for ${entityType}`,
// //         content,
// //         onClose: () => modal.remove()
// //     });

// //     // Show preview on file selection
// //     fileGroup.querySelector("input").addEventListener("change", (e) => {
// //         const file = e.target.files[0];
// //         previewDiv.replaceChildren();
// //         if (file) {
// //             const url = URL.createObjectURL(file);
// //             if (file.type.startsWith("image/")) {
// //                 const img = document.createElement("img");
// //                 img.src = url;
// //                 img.style.maxWidth = "100%";
// //                 previewDiv.appendChild(img);
// //             } else if (file.type.startsWith("video/")) {
// //                 const video = document.createElement("video");
// //                 video.src = url;
// //                 video.controls = true;
// //                 video.style.maxWidth = "100%";
// //                 previewDiv.appendChild(video);
// //             }
// //         }
// //     });
// // }


// // /******************* */


// // export { renderMediaItem, showMediaUploadForm, uploadMedia, displayNewMedia, deleteMedia, addMediaEventListeners };
