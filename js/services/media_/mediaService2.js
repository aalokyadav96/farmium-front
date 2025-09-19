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

let mediaItems = [];

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_VIDEO_DURATION = 600;

const lazyMediaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
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

function createActionButton(className, label, onClick) {
    const btn = createElement("button", { class: className }, [label]);
    btn.addEventListener("click", onClick);
    return btn;
}

// ------------------ Upload ------------------
async function uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal) {
    entityType = sanitizeID(entityType);
    entityId = sanitizeID(entityId);
    if (!isValidEntityType(entityType) || !entityId) return Notify("Invalid entity type or ID", { type: "error" });

    const fileInput = document.getElementById("mediaFile");
    const captionInput = document.getElementById("mediaCaption");
    const tagsInput = document.getElementById("mediaTags");

    const file = fileInput?.files?.[0];
    const caption = captionInput?.value || "";
    const tags = tagsInput?.value?.split(",").map(t => t.trim()).filter(Boolean) || [];

    if (file && file.size > MAX_FILE_SIZE) return Notify("File size exceeds 100MB", { type: "error" });

    if (file?.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = URL.createObjectURL(file);

        const valid = await new Promise(resolve => {
            video.onloadedmetadata = () => {
                if (video.duration > MAX_VIDEO_DURATION) {
                    Notify("Video exceeds 10 minutes", { type: "error" });
                    resolve(false);
                } else resolve(true);
            };
        });
        if (!valid) return;
    }

    const formData = new FormData();
    if (file) formData.append("media", file);
    formData.append("caption", caption);
    formData.append("tags", tags.join(","));

    try {
        const res = await apiFetch(`/media/${entityType}/${entityId}`, "POST", formData, { raw: true });
        if (res && (res.mediaid || res.type === "text")) {
            Notify("Post uploaded successfully!", { type: "success", duration: 3000, dismissible: true });
            modal.remove();
            document.body.style.overflow = "";
            displayNewMedia(isLoggedIn, res, mediaList, true);
        } else {
            Notify(`Failed to upload: ${res?.message || "Unknown error"}`, { type: "error" });
        }
    } catch (err) {
        Notify(`Upload error: ${err.message}`, { type: "error" });
    }
}

// ------------------ Delete ------------------
async function deleteMedia(mediaId, entityType, entityId) {
    entityType = sanitizeID(entityType);
    entityId = sanitizeID(entityId);
    mediaId = sanitizeID(mediaId);
    if (!isValidEntityType(entityType) || !entityId || !mediaId) return Notify("Invalid media/entity ID", { type: "error" });
    if (!confirm("Are you sure you want to delete this media?")) return;

    try {
        const response = await apiFetch(`/media/${entityType}/${entityId}/${mediaId}`, "DELETE", null, { raw: true });
        if (response.success) {
            Notify("Media deleted!", { type: "success" });
            const item = document.querySelector(`.delete-media-btn[data-media-id="${mediaId}"]`)?.parentElement;
            if (item) item.remove();
            mediaItems = mediaItems.filter(m => m.mediaid !== mediaId);
        } else Notify(`Delete failed: ${response?.message || "Unknown"}`, { type: "error" });
    } catch (err) {
        console.error(err);
        Notify("Error deleting media", { type: "error" });
    }
}

function renderMediaItem(media, index, isLoggedIn, entityType, entityId, mediaList) {
    const mediaItem = createElement("div", { class: "media-item" });
    const figureContent = [];

    // Media content
    if (media.type === "text") {
        figureContent.push(createElement("p", { class: "text-post" }, [media.caption || ""]));

    } else if (media.type === "image") {
        const img = createElement("img", {
            "data-src": resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.url),
            loading: "lazy",
            alt: media.caption || "Media",
            class: "media-img",
            "data-index": index
        });
        lazyMediaObserver.observe(img);
        figureContent.push(img, createElement("figcaption", {}, [media.caption || ""]));

        // Show sightbox for single image
        img.addEventListener("click", () => {
            const fullUrl = resolveImagePath(EntityType.MEDIA, PictureType.PHOTO, media.url);
            Sightbox(fullUrl, "image");
        });

    } else if (media.type === "video") {
        const video = createElement("video", {
            class: "media-video",
            controls: false,
            poster: resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.thumbnailUrl),
            "data-src": resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url),
            "data-index": index
        });
        lazyMediaObserver.observe(video);
        figureContent.push(video, createElement("figcaption", {}, [media.caption || ""]));

        // Show sightbox for single video
        video.addEventListener("click", () => {
            const videoUrl = resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url);
            Sightbox(videoUrl, "video");
        });
    }

    mediaItem.appendChild(createElement("figure", {}, figureContent));

    // Tags
    if (media.tags?.length) {
        mediaItem.appendChild(
            createElement("div", { class: "tags" },
                media.tags.map(tag => createElement("span", { class: "tag" }, [tag]))
            )
        );
    }

    // Actions dropdown (More menu)
    const isCreator = isLoggedIn && getState("user") === media.creatorid;
    if (isLoggedIn) {
        const moreButton = createElement("button", { class: "more-btn" }, ["⋯"]);
        const dropdown = createElement("div", { class: "dropdown hidden" });

        // Report
        const reportBtn = createElement("button", { class: "report-btn" }, ["Report"]);
        reportBtn.addEventListener("click", () => {
            dropdown.classList.add("hidden");
            reportPost(media.mediaid, "media");
        });
        dropdown.appendChild(reportBtn);

        if (isCreator) {
            // Delete
            const deleteBtn = createElement("button", { class: "delete-btn" }, ["Delete"]);
            deleteBtn.addEventListener("click", async () => {
                dropdown.classList.add("hidden");
                await deleteMedia(media.mediaid, entityType, entityId);
                mediaItem.remove();
            });
            dropdown.appendChild(deleteBtn);

            // Edit
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

        // Close dropdown on outside click or ESC
        document.addEventListener("click", () => dropdown.classList.add("hidden"));
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") dropdown.classList.add("hidden"); });

        mediaItem.appendChild(moreWrapper);
    }

    return mediaItem;
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
        const url = resolveImagePath(EntityType.MEDIA, existingMedia.type === "image" ? PictureType.PHOTO : PictureType.VIDEO, existingMedia.url);
        if (existingMedia.type === "image") previewDiv.appendChild(createElement("img", { src: url, style: "max-width:100%" }));
        else if (existingMedia.type === "video") previewDiv.appendChild(createElement("video", { src: url, controls: true, style: "max-width:100%" }));
    }

    const uploadButton = Button("Post", "uploadMediaBtn", {
        click: () => {
            uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal);
            uploadButton.style.display = "none";
        }
    }, "btn btn-primary");

    content.append(fileGroup, captionGroup, tagsGroup, previewDiv, uploadButton);

    const modal = Modal({ title: existingMedia ? "Edit Media" : `Create Post for ${entityType}`, content, onClose: () => modal.remove() });

    fileGroup.querySelector("input").addEventListener("change", (e) => {
        const file = e.target.files[0];
        previewDiv.replaceChildren();
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (file.type.startsWith("image/")) previewDiv.appendChild(createElement("img", { src: url, style: "max-width:100%" }));
        else if (file.type.startsWith("video/")) previewDiv.appendChild(createElement("video", { src: url, controls: true, style: "max-width:100%" }));
    });
}

// ------------------ Display ------------------
function displayNewMedia(isLoggedIn, mediaData, mediaList, prepend = false) {
    mediaItems.push(mediaData);
    const item = renderMediaItem(mediaData, mediaItems.length - 1, isLoggedIn, mediaData.entitytype, mediaData.entityid, mediaList);
    if (prepend) mediaList.prepend(item);
    else mediaList.appendChild(item);
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

    // Show latest first
    mediaData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    mediaData.forEach((media, index) => {
        mediaItems.push(media);
        mediaList.appendChild(renderMediaItem(media, index, isLoggedIn, entityType, entityId, mediaList));
    });
}

// ------------------ Video Playback ------------------
function playVideo(videos, index, videoid) {
    let poster = "#", qualities = [], subtitles = [];
    document.getElementById("app").appendChild(VidPlay(videos[index], poster, qualities, subtitles, videoid));
}

export { renderMediaItem, showMediaUploadForm, uploadMedia, displayNewMedia, deleteMedia };

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

// const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
// const MAX_VIDEO_DURATION = 600; // 10 min

// let mediaItems = []; // globally scoped

// // -------------------- Utility Functions --------------------
// function sanitizeID(id) {
//     return String(id || "").trim();
// }

// function isValidEntityType(type) {
//     return ["event", "place", "user", "post", "artist"].includes(type);
// }

// function createActionButton(className, label, onClick) {
//     const btn = createElement("button", { class: className }, [label]);
//     btn.addEventListener("click", onClick);
//     return btn;
// }

// function clearElement(el) {
//     while (el.firstChild) el.removeChild(el.firstChild);
// }

// // -------------------- Lazy Observer --------------------
// const lazyMediaObserver = new IntersectionObserver((entries) => {
//     entries.forEach(entry => {
//         const el = entry.target;
//         if (entry.isIntersecting) {
//             if (el.dataset.src) {
//                 el.src = el.dataset.src;
//                 delete el.dataset.src;
//             }
//             if (el.tagName === "VIDEO" && el.paused) el.load();
//         } else {
//             if (el.tagName === "VIDEO" && !el.paused) el.pause();
//         }
//     });
// }, { rootMargin: "100px 0px", threshold: 0.1 });

// // -------------------- Upload Media --------------------
// async function uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal) {
//     entityType = sanitizeID(entityType);
//     entityId = sanitizeID(entityId);

//     if (!isValidEntityType(entityType) || !entityId) {
//         Notify("Invalid entity type or ID", { type: "error" });
//         return;
//     }

//     const fileInput = document.getElementById("mediaFile");
//     const captionInput = document.getElementById("mediaCaption");
//     const tagsInput = document.getElementById("mediaTags");

//     const file = fileInput?.files?.[0];
//     const caption = captionInput?.value || "";
//     const tags = tagsInput?.value?.split(",").map(t => t.trim()).filter(Boolean) || [];

//     if (file && file.size > MAX_FILE_SIZE) {
//         Notify("File size exceeds maximum allowed 100 MB", { type: "error" });
//         return;
//     }

//     if (file?.type.startsWith("video/")) {
//         const video = document.createElement("video");
//         video.preload = "metadata";
//         video.src = URL.createObjectURL(file);

//         const valid = await new Promise((resolve) => {
//             video.onloadedmetadata = () => {
//                 if (video.duration > MAX_VIDEO_DURATION) {
//                     Notify(`Video exceeds maximum duration of 10 minutes`, { type: "error" });
//                     resolve(false);
//                 } else {
//                     resolve(true);
//                 }
//             };
//         });
//         if (!valid) return;
//     }

//     const formData = new FormData();
//     if (file) formData.append("media", file);
//     formData.append("caption", caption);
//     formData.append("tags", tags.join(","));

//     try {
//         const uploadResponse = await apiFetch(`/media/${entityType}/${entityId}`, "POST", formData, { raw: true });

//         if (uploadResponse && (uploadResponse.mediaid || uploadResponse.type === "text")) {
//             Notify("Post uploaded successfully!", { type: "success", duration: 3000, dismissible: true });
//             modal.remove();
//             document.body.style.overflow = "";
//             displayNewMedia(isLoggedIn, uploadResponse, mediaList);
//         } else {
//             Notify(`Failed to upload post: ${uploadResponse?.message || "Unknown error"}`, { type: "error" });
//         }
//     } catch (error) {
//         Notify(`Error uploading post: ${error.message}`, { type: "error" });
//     }
// }

// // -------------------- Delete Media --------------------
// async function deleteMedia(mediaId, entityType, entityId) {
//     entityType = sanitizeID(entityType);
//     entityId = sanitizeID(entityId);
//     mediaId = sanitizeID(mediaId);

//     if (!isValidEntityType(entityType) || !entityId || !mediaId) {
//         Notify("Invalid media or entity ID", { type: "error" });
//         return;
//     }

//     if (!confirm('Are you sure you want to delete this media?')) return;

//     try {
//         const response = await apiFetch(`/media/${entityType}/${entityId}/${mediaId}`, 'DELETE', null, { raw: true });

//         if (response.success) {
//             Notify('Media deleted successfully!', { type: "success" });
//             const mediaItem = document.querySelector(`.delete-media-btn[data-media-id="${mediaId}"]`)?.parentElement;
//             if (mediaItem) mediaItem.remove();
//             mediaItems = mediaItems.filter((m) => m.mediaid !== mediaId);
//         } else {
//             Notify(`Failed to delete media: ${response?.message || "Unknown error"}`, { type: "error" });
//         }
//     } catch (error) {
//         console.error('Error deleting media:', error);
//         Notify('An error occurred while deleting the media.', { type: "error" });
//     }
// }

// // -------------------- Render Media Item --------------------
// function renderMediaItem(media, index, isLoggedIn, entityType, entityId, mediaList) {
//     const mediaItem = createElement("div", { class: "media-item" });
//     const figureContent = [];

//     if (media.type === "text") {
//         figureContent.push(createElement("p", { class: "text-post" }, [media.caption || ""]));
//     } else if (media.type === "image") {
//         const img = createElement("img", {
//             "data-src": resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.url),
//             loading: "lazy",
//             alt: media.caption || "Media Image",
//             class: "media-img",
//             "data-index": index
//         });
//         lazyMediaObserver.observe(img);
//         figureContent.push(img, createElement("figcaption", {}, [media.caption || ""]));
//     } else if (media.type === "video") {
//         const video = createElement("video", {
//             class: "media-video",
//             controls: false,
//             poster: media.thumbnailUrl || resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.mediaid}.jpg`),
//             "data-src": resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url),
//             "data-index": index
//         });
//         lazyMediaObserver.observe(video);
//         figureContent.push(video, createElement("figcaption", {}, [media.caption || ""]));
//     }

//     mediaItem.appendChild(createElement("figure", {}, figureContent));

//     if (media.tags?.length) {
//         mediaItem.appendChild(createElement("div", { class: "tags" },
//             media.tags.map(tag => createElement("span", { class: "tag" }, [tag]))
//         ));
//     }

//     if (isLoggedIn && getState("user") === media.creatorid) {
//         const deleteBtn = createActionButton("delete-media-btn", "Delete", async () => {
//             await deleteMedia(media.mediaid, entityType, entityId);
//             mediaItem.remove();
//         });
//         const editBtn = createActionButton("edit-media-btn", "Edit", () => {
//             showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList, media);
//         });
//         mediaItem.appendChild(deleteBtn);
//         mediaItem.appendChild(editBtn);
//     }

//     const reportBtn = createActionButton("report-btn", "Report", () => reportPost(media.mediaid, "media"));
//     mediaItem.appendChild(reportBtn);

//     return mediaItem;
// }

// // -------------------- Show Media Upload Form --------------------
// function showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList, existingMedia = null) {
//     const content = createElement("div", { id: "mediaform" });

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
//         placeholder: "Write something...",
//         value: existingMedia?.caption || ""
//     });

//     const tagsGroup = createFormGroup({
//         label: "Tags (comma-separated)",
//         type: "text",
//         id: "mediaTags",
//         placeholder: "e.g., song:123,event:456,merch:789",
//         value: existingMedia?.tags?.join(",") || ""
//     });

//     const previewDiv = createElement("div", { id: "mediaPreview" });

//     if (existingMedia?.url) {
//         const url = resolveImagePath(EntityType.MEDIA, existingMedia.type === "image" ? PictureType.PHOTO : PictureType.VIDEO, existingMedia.url);
//         if (existingMedia.type === "image") previewDiv.appendChild(createElement("img", { src: url, style: "max-width:100%" }));
//         else if (existingMedia.type === "video") previewDiv.appendChild(createElement("video", { src: url, controls: true, style: "max-width:100%" }));
//     }

//     const uploadButton = Button("Post", "uploadMediaBtn", {
//         click: () => {
//             uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal);
//             uploadButton.style.display = "none";
//         }
//     }, "btn btn-primary");

//     content.append(fileGroup, captionGroup, tagsGroup, previewDiv, uploadButton);

//     const modal = Modal({
//         title: existingMedia ? `Edit Media` : `Create Post for ${entityType}`,
//         content,
//         onClose: () => modal.remove()
//     });

//     fileGroup.querySelector("input").addEventListener("change", (e) => {
//         const file = e.target.files[0];
//         previewDiv.replaceChildren();
//         if (!file) return;
//         const url = URL.createObjectURL(file);
//         if (file.type.startsWith("image/")) previewDiv.appendChild(createElement("img", { src: url, style: "max-width:100%" }));
//         else if (file.type.startsWith("video/")) previewDiv.appendChild(createElement("video", { src: url, controls: true, style: "max-width:100%" }));
//     });
// }

// // -------------------- Display Media --------------------
// export async function displayMedia(content, entityType, entityId, isLoggedIn) {
//     entityType = sanitizeID(entityType);
//     entityId = sanitizeID(entityId);

//     if (!isValidEntityType(entityType) || !entityId) {
//         Notify("Invalid entity type or ID", { type: "error" });
//         return;
//     }

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

//     if (!Array.isArray(mediaData) || !mediaData.length) {
//         mediaList.appendChild(createElement("p", {}, ["No media available for this entity."]));
//         return;
//     }

//     // Sort latest first
//     mediaData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//     mediaData.forEach((media, index) => {
//         mediaItems.push(media);
//         mediaList.appendChild(renderMediaItem(media, index, isLoggedIn, entityType, entityId, mediaList));
//     });
// }

// // -------------------- Display New Media --------------------
// function displayNewMedia(isLoggedIn, mediaData, mediaList) {
//     mediaItems.unshift(mediaData); // latest on top
//     const item = renderMediaItem(mediaData, 0, isLoggedIn, mediaData.entitytype, mediaData.entityid, mediaList);
//     mediaList.prepend(item);
// }

// // -------------------- Video Playback --------------------
// function playVideo(videos, index, videoid) {
//     const poster = "#";
//     const qualities = [];
//     const subtitles = [];
//     document.getElementById('app').appendChild(VidPlay(videos[index], poster, qualities, subtitles, videoid));
// }

// // -------------------- Event Listeners --------------------
// function addMediaEventListeners(isLoggedIn, entityType) {
//     document.addEventListener("click", (event) => {
//         const target = event.target;
//         if (target.id === "uploadMediaBtn") {
//             const entityId = target.getAttribute("data-entity-id");
//             uploadMedia(isLoggedIn, entityType, entityId);
//         }
//     });
// }

// export { renderMediaItem, showMediaUploadForm, uploadMedia, displayNewMedia, deleteMedia, addMediaEventListeners };

// // import { getState } from "../../state/state.js";
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

// // const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
// // const MAX_VIDEO_DURATION = 600; // 10 min

// // let mediaItems = []; // globally scoped

// // // -------------------- Utility Functions --------------------

// // function sanitizeID(id) {
// //     return String(id || "").trim();
// // }

// // function isValidEntityType(type) {
// //     return ["event", "place", "user", "post", "artist"].includes(type);
// // }

// // function createActionButton(className, label, onClick) {
// //     const btn = createElement("button", { class: className }, [label]);
// //     btn.addEventListener("click", onClick);
// //     return btn;
// // }

// // function clearElement(el) {
// //     while (el.firstChild) el.removeChild(el.firstChild);
// // }

// // // -------------------- Media Upload --------------------

// // // -------------------- Media Upload --------------------
// // async function uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal) {
// //     entityType = sanitizeID(entityType);
// //     entityId = sanitizeID(entityId);

// //     if (!isValidEntityType(entityType) || !entityId) {
// //         Notify("Invalid entity type or ID", { type: "error" });
// //         return;
// //     }

// //     const fileInput = document.getElementById("mediaFile");
// //     const captionInput = document.getElementById("mediaCaption");
// //     const tagsInput = document.getElementById("mediaTags");

// //     const file = fileInput?.files?.[0];
// //     const caption = captionInput?.value || "";
// //     const tags = tagsInput?.value?.split(",").map(t => t.trim()).filter(Boolean) || [];

// //     if (file && file.size > MAX_FILE_SIZE) {
// //         Notify("File size exceeds maximum allowed 100 MB", { type: "error" });
// //         return;
// //     }

// //     if (file?.type.startsWith("video/")) {
// //         const video = document.createElement("video");
// //         video.preload = "metadata";
// //         video.src = URL.createObjectURL(file);

// //         const valid = await new Promise((resolve) => {
// //             video.onloadedmetadata = () => {
// //                 if (video.duration > MAX_VIDEO_DURATION) {
// //                     Notify(`Video exceeds maximum duration of 10 minutes`, { type: "error" });
// //                     resolve(false);
// //                 } else {
// //                     resolve(true);
// //                 }
// //             };
// //         });
// //         if (!valid) return;
// //     }

// //     const formData = new FormData();
// //     if (file) formData.append("media", file);
// //     formData.append("caption", caption);
// //     formData.append("tags", tags.join(","));

// //     try {
// //         const uploadResponse = await apiFetch(`/media/${entityType}/${entityId}`, "POST", formData, { raw: true });

// //         if (uploadResponse && (uploadResponse.mediaid || uploadResponse.type === "text")) {
// //             Notify("Post uploaded successfully!", { type: "success", duration: 3000, dismissible: true });
// //             modal.remove();
// //             document.body.style.overflow = "";
// //             displayNewMedia(isLoggedIn, uploadResponse, mediaList);
// //         } else {
// //             Notify(`Failed to upload post: ${uploadResponse?.message || "Unknown error"}`, { type: "error" });
// //         }
// //     } catch (error) {
// //         Notify(`Error uploading post: ${error.message}`, { type: "error" });
// //     }
// // }

// // // -------------------- Render Media Item --------------------
// // function renderMediaItem(media, index, isLoggedIn, entityType, entityId) {
// //     const mediaItem = createElement("div", { class: "media-item" });
// //     const figureContent = [];

// //     if (media.type === "text") {
// //         figureContent.push(createElement("p", { class: "text-post" }, [media.caption || ""]));
// //     } else if (media.type === "image") {
// //         const img = createElement("img", {
// //             "data-src": resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.url),
// //             loading: "lazy",
// //             alt: media.caption || "Media Image",
// //             class: "media-img",
// //             "data-index": index
// //         });
// //         lazyMediaObserver.observe(img);
// //         figureContent.push(img, createElement("figcaption", {}, [media.caption || ""]));
// //     } else if (media.type === "video") {
// //         const video = createElement("video", {
// //             class: "media-video",
// //             controls: false,
// //             poster: resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.mediaid}.jpg`),
// //             "data-src": resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url),
// //             "data-index": index
// //         });
// //         lazyMediaObserver.observe(video);
// //         figureContent.push(video, createElement("figcaption", {}, [media.caption || ""]));
// //     }

// //     mediaItem.appendChild(createElement("figure", {}, figureContent));
// //     if (media.tags?.length) {
// //         mediaItem.appendChild(createElement("div", { class: "tags" },
// //             media.tags.map(tag => createElement("span", { class: "tag" }, [tag]))
// //         ));
// //     }

// //     if (isLoggedIn && getState("user") === media.creatorid) {
// //         const deleteBtn = createActionButton("delete-media-btn", "Delete", async () => {
// //             await deleteMedia(media.mediaid, entityType, entityId);
// //             mediaItem.remove();
// //         });
// //         const editBtn = createActionButton("edit-media-btn", "Edit", () => {
// //             showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList, media);
// //         });
// //         mediaItem.appendChild(deleteBtn);
// //         mediaItem.appendChild(editBtn);
// //     }

// //     const reportBtn = createActionButton("report-btn", "Report", () => reportPost(media.mediaid, "media"));
// //     mediaItem.appendChild(reportBtn);

// //     return mediaItem;
// // }

// // // -------------------- Show Media Upload Form (for new or edit) --------------------
// // function showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList, existingMedia = null) {
// //     const content = createElement("div", { id: "mediaform" });

// //     const fileGroup = createFormGroup({
// //         label: "Select Media (optional)",
// //         type: "file",
// //         id: "mediaFile",
// //         isRequired: false,
// //         additionalProps: { accept: "image/*,video/*" }
// //     });

// //     const captionGroup = createFormGroup({
// //         label: "Caption / Text Post",
// //         type: "text",
// //         id: "mediaCaption",
// //         placeholder: "Write something...",
// //         value: existingMedia?.caption || ""
// //     });

// //     const tagsGroup = createFormGroup({
// //         label: "Tags (comma-separated)",
// //         type: "text",
// //         id: "mediaTags",
// //         placeholder: "e.g., song:123,event:456,merch:789",
// //         value: existingMedia?.tags?.join(",") || ""
// //     });

// //     const previewDiv = createElement("div", { id: "mediaPreview" });

// //     if (existingMedia?.url) {
// //         const url = resolveImagePath(EntityType.MEDIA, existingMedia.type === "image" ? PictureType.PHOTO : PictureType.VIDEO, existingMedia.url);
// //         if (existingMedia.type === "image") previewDiv.appendChild(createElement("img", { src: url, style: "max-width:100%" }));
// //         else if (existingMedia.type === "video") previewDiv.appendChild(createElement("video", { src: url, controls: true, style: "max-width:100%" }));
// //     }

// //     const uploadButton = Button("Post", "uploadMediaBtn", {
// //         click: () => {
// //             uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal);
// //             uploadButton.style.display = "none";
// //         }
// //     }, "btn btn-primary");

// //     content.append(fileGroup, captionGroup, tagsGroup, previewDiv, uploadButton);

// //     const modal = Modal({
// //         title: existingMedia ? `Edit Media` : `Create Post for ${entityType}`,
// //         content,
// //         onClose: () => modal.remove()
// //     });

// //     fileGroup.querySelector("input").addEventListener("change", (e) => {
// //         const file = e.target.files[0];
// //         previewDiv.replaceChildren();
// //         if (!file) return;
// //         const url = URL.createObjectURL(file);
// //         if (file.type.startsWith("image/")) previewDiv.appendChild(createElement("img", { src: url, style: "max-width:100%" }));
// //         else if (file.type.startsWith("video/")) previewDiv.appendChild(createElement("video", { src: url, controls: true, style: "max-width:100%" }));
// //     });
// // }


// // // -------------------- Delete Media --------------------

// // async function deleteMedia(mediaId, entityType, entityId) {
// //     entityType = sanitizeID(entityType);
// //     entityId = sanitizeID(entityId);
// //     mediaId = sanitizeID(mediaId);

// //     if (!isValidEntityType(entityType) || !entityId || !mediaId) {
// //         Notify("Invalid media or entity ID", { type: "error" });
// //         return;
// //     }

// //     if (!confirm('Are you sure you want to delete this media?')) return;

// //     try {
// //         const response = await apiFetch(`/media/${entityType}/${entityId}/${mediaId}`, 'DELETE', null, { raw: true });

// //         if (response.success) {
// //             Notify('Media deleted successfully!', { type: "success" });
// //             const mediaItem = document.querySelector(`.delete-media-btn[data-media-id="${mediaId}"]`)?.parentElement;
// //             if (mediaItem) mediaItem.remove();
// //             mediaItems = mediaItems.filter((m) => m.mediaid !== mediaId);
// //         } else {
// //             Notify(`Failed to delete media: ${response?.message || "Unknown error"}`, { type: "error" });
// //         }
// //     } catch (error) {
// //         console.error('Error deleting media:', error);
// //         Notify('An error occurred while deleting the media.', { type: "error" });
// //     }
// // }

// // // -------------------- Display Media --------------------

// // const lazyMediaObserver = new IntersectionObserver((entries) => {
// //     entries.forEach(entry => {
// //         const el = entry.target;
// //         if (entry.isIntersecting) {
// //             if (el.dataset.src) {
// //                 el.src = el.dataset.src;
// //                 delete el.dataset.src;
// //             }
// //             if (el.tagName === "VIDEO" && el.paused) el.load();
// //         } else {
// //             if (el.tagName === "VIDEO" && !el.paused) el.pause();
// //         }
// //     });
// // }, { rootMargin: "100px 0px", threshold: 0.1 });


// // function displayNewMedia(isLoggedIn, mediaData, mediaList) {
// //     mediaItems.push(mediaData);
// //     const item = renderMediaItem(mediaData, mediaItems.length - 1, isLoggedIn, mediaData.entitytype, mediaData.entityid);
// //     mediaList.appendChild(item);
// // }

// // // -------------------- Media Gallery --------------------

// // export async function displayMedia(content, entityType, entityId, isLoggedIn) {
// //     entityType = sanitizeID(entityType);
// //     entityId = sanitizeID(entityId);

// //     if (!isValidEntityType(entityType) || !entityId) {
// //         Notify("Invalid entity type or ID", { type: "error" });
// //         return;
// //     }

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

// //     if (!Array.isArray(mediaData) || !mediaData.length) {
// //         mediaList.appendChild(createElement("p", {}, ["No media available for this entity."]));
// //         return;
// //     }

// //     mediaData.forEach((media, index) => {
// //         mediaItems.push(media);
// //         mediaList.appendChild(renderMediaItem(media, index, isLoggedIn, entityType, entityId));
// //     });
// // }

// // // -------------------- Video Playback --------------------

// // function playVideo(videos, index, videoid) {
// //     const poster = "#";
// //     const qualities = [];
// //     const subtitles = [];
// //     document.getElementById('app').appendChild(VidPlay(videos[index], poster, qualities, subtitles, videoid));
// // }

// // // -------------------- Media Upload Form --------------------

// // // -------------------- Event Listeners --------------------

// // function addMediaEventListeners(isLoggedIn, entityType) {
// //     document.addEventListener("click", (event) => {
// //         const target = event.target;
// //         if (target.id === "uploadMediaBtn") {
// //             const entityId = target.getAttribute("data-entity-id");
// //             uploadMedia(isLoggedIn, entityType, entityId);
// //         }
// //     });
// // }

// // export { renderMediaItem, showMediaUploadForm, uploadMedia, displayNewMedia, deleteMedia, addMediaEventListeners, /*displayMedia*/ };
