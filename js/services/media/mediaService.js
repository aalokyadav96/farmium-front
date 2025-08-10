import { SRC_URL, state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import SnackBar from "../../components/ui/Snackbar.mjs";
// import Lightbox from '../../components/ui/Lightbox.mjs';
import VidPlay from '../../components/ui/VidPlay.mjs';
import Modal from '../../components/ui/Modal.mjs';
import { Button } from "../../components/base/Button.js";
import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";

import { resolveImagePath, PictureType, EntityType } from "../../utils/imagePaths.js";
import { reportPost } from "../reporting/reporting.js";
import Sightbox from "../../components/ui/SightBox.mjs";


let mediaItems = []; // Ensure this is globally scoped


// Upload media to the server
async function uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal) {
    const fileInput = document.getElementById("mediaFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file to upload.");
        return;
    }

    const formData = new FormData();
    formData.append("media", file);

    try {
        // Upload media through the API
        const uploadResponse = await apiFetch(`/media/${entityType}/${entityId}`, "POST", formData);

        if (uploadResponse && uploadResponse.mediaid) {  // Check if the response contains an 'id'
            SnackBar("Media uploaded successfully!");
            modal.remove();
            document.body.style.overflow = "";
            displayNewMedia(isLoggedIn, uploadResponse, mediaList);
        } else {
            alert(`Failed to upload media: ${uploadResponse?.message || 'Unknown error'}`);
        }

    } catch (error) {
        alert(`Error uploading media: ${error.message}`);
    }
}


async function deleteMedia(mediaId, entityType, entityId) {
    if (confirm('Are you sure you want to delete this media?')) {
        try {
            const response = await apiFetch(`/media/${entityType}/${entityId}/${mediaId}`, 'DELETE');

            if (response.status === 204) { // Handle the 204 No Content status
                alert('Media deleted successfully!');

                // Find and remove the media item from the DOM
                const mediaItem = document.querySelector(`.delete-media-btn[data-media-id="${mediaId}"]`).parentElement;
                if (mediaItem) {
                    mediaItem.remove();
                }

                // Optionally update global mediaItems array if used
                mediaItems = mediaItems.filter((media) => media.mediaid !== mediaId);
            } else {
                const errorData = await response.json();
                alert(`Failed to delete media: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting media:', error);
            alert('An error occurred while deleting the media.');
        }
    }
}


function addMediaEventListeners(isLoggedIn, entityType) {

    // Event delegation for upload button
    document.addEventListener("click", (event) => {
        const target = event.target;

        if (target.id === "uploadMediaBtn") {
            const entityId = target.getAttribute("data-entity-id");
            uploadMedia(isLoggedIn, entityType, entityId);
        }
    });

}


// Display newly uploaded media in the list
function displayNewMedia(isLoggedIn, mediaData, mediaList) {
    const isCreator = isLoggedIn && state.user === mediaData.creatorid;
    const mediaItem = createElement("div", { class: "imgcon" });

    let mediaElement;

    if (mediaData.type === "image") {
        const img = createElement("img", {
            src: resolveImagePath(EntityType.MEDIA, PictureType.PHOTO, mediaData.url),
            alt: mediaData.caption || "Media",
            loading: "lazy",
            style: "max-width: 160px; max-height: 240px; height: auto; width: auto;",
            "data-index": mediaItems.length,
        });
        mediaElement = img;
    } else if (mediaData.type === "video") {
        const videoSrc = resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, mediaData.url);

        const video = createElement("video", {
            controls: true,
            style: "max-width: 160px; max-height: 240px;",
        }, [
            createElement("source", {
                src: videoSrc,
                type: "video/mp4",
            }),
            "Your browser does not support the video tag."
        ]);

        mediaElement = video;
    }

    mediaItem.appendChild(createElement("h3", {}, [mediaData.caption || "No caption provided"]));
    mediaItem.appendChild(mediaElement);

    if (isCreator) {
        const deleteBtn = createElement("button", {
            class: "delete-media-btn",
            "data-media-id": mediaData.mediaid,
            "data-entity-id": mediaData.entityid,
        }, ["Delete"]);
        mediaItem.appendChild(deleteBtn);
    }

    mediaList.appendChild(mediaItem);
    mediaItems.push(mediaData);
}

// Observer for lazy loading and video auto-pause
const lazyMediaObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        const el = entry.target;

        if (entry.isIntersecting) {
            // Load when visible
            if (el.dataset.src) {
                el.src = el.dataset.src;
                delete el.dataset.src;
            }
            // Start buffering if video
            if (el.tagName === "VIDEO" && el.paused) {
                el.load();
            }
        } else {
            // Pause videos when out of view
            if (el.tagName === "VIDEO" && !el.paused) {
                el.pause();
            }
        }
    });
}, {
    rootMargin: "100px 0px",
    threshold: 0.1
});

function renderMediaItem(media, index, isLoggedIn, entityType, entityId) {
    const mediaItem = createElement("div", { class: "media-item" });

    if (!media.url) {
        console.warn(`Media item missing URL (ID: ${media.mediaid || "unknown"})`);
        return mediaItem;
    }

    let figureContent;

    if (media.type === "image") {
        const img = createElement("img", {
            "data-src": resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.url),
            loading: "lazy",
            alt: media.caption || "Media Image",
            class: "media-img",
            "data-index": index
        });
        lazyMediaObserver.observe(img);

        const caption = createElement("figcaption", {}, [media.caption || "No caption provided"]);
        figureContent = [img, caption];

    } else if (media.type === "video") {
        const video = createElement("video", {
            class: "media-video",
            controls: false,
            poster: resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.mediaid}.jpg`),
            "data-src": resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url),
            "data-index": index
        });
        lazyMediaObserver.observe(video);

        const caption = createElement("figcaption", {}, [media.caption || "No caption provided"]);
        figureContent = [video, caption];

    } else {
        console.warn(`Unsupported media type: ${media.type}`);
        return mediaItem;
    }

    mediaItem.appendChild(createElement("figure", {}, figureContent));

    // Creator-only delete
    if (isLoggedIn && state.user === media.creatorid) {
        const deleteBtn = createActionButton("delete-media-btn", "Delete", async () => {
            try {
                await deleteMedia(media.mediaid, entityType, entityId);
                mediaItem.remove();
            } catch (err) {
                console.error("Failed to delete media:", err);
            }
        });
        mediaItem.appendChild(deleteBtn);
    }

    // Report button
    const reportBtn = createActionButton("report-btn", "Report", () => {
        reportPost(media.meidaid, "media");
    });
    mediaItem.appendChild(reportBtn);

    return mediaItem;
}

function createActionButton(className, label, onClick) {
    const btn = createElement("button", { class: className }, [label]);
    btn.addEventListener("click", onClick);
    return btn;
}

export async function displayMedia(content, entityType, entityId, isLoggedIn) {
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

    if (!Array.isArray(mediaData) || mediaData.length === 0) {
        mediaList.appendChild(createElement("p", {}, ["No media available for this entity."]));
        return;
    }

    const imageUrls = [];
    const videoUrls = [];

    mediaData.forEach((media, index) => {
        const item = renderMediaItem(media, index, isLoggedIn, entityType, entityId);
        mediaList.appendChild(item);

        if (media.type === "image") {
            imageUrls.push(resolveImagePath(EntityType.MEDIA, PictureType.PHOTO, media.url));
        } else if (media.type === "video") {
            videoUrls.push(resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url));
        }
    });

    // Lightbox for images
    mediaList.querySelectorAll(".media-img").forEach((img, i) => {
        img.addEventListener("click", () => Sightbox(imageUrls, i));
    });

    // Video player for videos
    mediaList.querySelectorAll(".media-video").forEach((video, i) => {
        video.addEventListener("click", () => playVideo(videoUrls, i, entityId));
    });
}

function clearElement(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
}

// // IntersectionObserver for lazy loading media
// const lazyMediaObserver = new IntersectionObserver((entries, observer) => {
//     entries.forEach(entry => {
//         if (entry.isIntersecting) {
//             const el = entry.target;

//             if (el.tagName === "IMG" && el.dataset.src) {
//                 el.src = el.dataset.src;
//                 delete el.dataset.src;
//             }

//             if (el.tagName === "VIDEO" && el.dataset.src) {
//                 el.src = el.dataset.src;
//                 delete el.dataset.src;
//             }

//             observer.unobserve(el);
//         }
//     });
// }, {
//     rootMargin: "100px 0px", // start loading a bit before visible
//     threshold: 0.1
// });

// function renderMediaItem(media, index, isLoggedIn, entityType, entityId) {
//     const mediaItem = createElement("div", { class: "media-item" });

//     if (!media.url) {
//         console.warn(`Media item missing URL (ID: ${media.id || "unknown"})`);
//         return mediaItem;
//     }

//     let figureContent;

//     if (media.type === "image") {
//         const img = createElement("img", {
//             "data-src": resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.url),
//             loading: "lazy",
//             alt: media.caption || "Media Image",
//             class: "media-img",
//             "data-index": index
//         });
//         lazyMediaObserver.observe(img);

//         const caption = createElement("figcaption", {}, [media.caption || "No caption provided"]);
//         figureContent = [img, caption];

//     } else if (media.type === "video") {
//         const video = createElement("video", {
//             class: "media-video",
//             controls: false,
//             poster: resolveImagePath(EntityType.MEDIA, PictureType.THUMB, `${media.id}.jpg`),
//             "data-src": resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url),
//             "data-index": index
//         });
//         lazyMediaObserver.observe(video);

//         const caption = createElement("figcaption", {}, [media.caption || "No caption provided"]);
//         figureContent = [video, caption];

//     } else {
//         console.warn(`Unsupported media type: ${media.type}`);
//         return mediaItem;
//     }

//     mediaItem.appendChild(createElement("figure", {}, figureContent));

//     // Creator-only delete
//     if (isLoggedIn && state.user === media.creatorid) {
//         const deleteBtn = createActionButton("delete-media-btn", "Delete", async () => {
//             try {
//                 await deleteMedia(media.id, entityType, entityId);
//                 mediaItem.remove();
//             } catch (err) {
//                 console.error("Failed to delete media:", err);
//             }
//         });
//         mediaItem.appendChild(deleteBtn);
//     }

//     // Report button
//     const reportBtn = createActionButton("report-btn", "Report", () => {
//         reportPost(media.id, "media");
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

//     // Lightbox for images
//     mediaList.querySelectorAll(".media-img").forEach((img, i) => {
//         img.addEventListener("click", () => Sightbox(imageUrls, i));
//     });

//     // Video player for videos
//     mediaList.querySelectorAll(".media-video").forEach((video, i) => {
//         video.addEventListener("click", () => playVideo(videoUrls, i, entityId));
//     });
// }

// function clearElement(el) {
//     while (el.firstChild) el.removeChild(el.firstChild);
// }

// // // Render single media item
// // function renderMediaItem(media, index, isLoggedIn, entityType, entityId) {
// //     const mediaItem = createElement("div", { class: "media-item" });

// //     if (!media.url) {
// //         console.error("Invalid media URL");
// //         return mediaItem;
// //     }

// //     if (media.type === "image") {
// //         const img = createElement("img", {
// //             src: resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.url),
// //             loading: "lazy",
// //             alt: media.caption || "Media Image",
// //             class: "media-img",
// //             "data-index": index,
// //         });

// //         const caption = createElement("figcaption", {}, [media.caption || "No caption provided"]);
// //         const figure = createElement("figure", {}, [img, caption]);

// //         mediaItem.appendChild(figure);
// //     } else if (media.type === "video") {
// //         const video = createElement("video", {
// //             class: "media-video",
// //             controls: false,
// //             // poster: `${SRC_URL}/uploads/${media.id}.jpg`, // optionally use resolveImagePath if you want
// //             poster: resolveImagePath(EntityType.MEDIA, PictureType.THUMB, media.id + ".jpg"),
// //         });

// //         const caption = createElement("figcaption", {}, [media.caption || "No caption provided"]);
// //         const figure = createElement("figure", {}, [video, caption]);

// //         mediaItem.appendChild(figure);
// //     }

// //     // Creator-only delete
// //     if (isLoggedIn && state.user === media.creatorid) {
// //         const deleteButton = createElement("button", {
// //             class: "delete-media-btn",
// //             "data-media-id": media.id,
// //         }, ["Delete"]);

// //         deleteButton.addEventListener("click", async () => {
// //             try {
// //                 await deleteMedia(media.id, entityType, entityId);
// //                 mediaItem.remove();
// //             } catch (error) {
// //                 console.error("Failed to delete media:", error);
// //             }
// //         });

// //         mediaItem.appendChild(deleteButton);
// //     }

// //     // Report button
// //     const reportButton = createElement("button", {
// //         class: "report-btn"
// //     }, ["Report"]);

// //     reportButton.addEventListener("click", () => {
// //         reportPost(media.id, "media");
// //     });

// //     mediaItem.appendChild(reportButton);
// //     return mediaItem;
// // }



// // async function displayMedia(content, entityType, entityId, isLoggedIn) {
// //     content.innerHTML = ""; // Clear existing content
// //     content.appendChild(createElement("h2", "", ["Media Gallery"]));

// //     const response = await apiFetch(`/media/${entityType}/${entityId}`);
// //     const mediaData = response;

// //     const mediaList = createElement("div", { class: "hvflex" });
// //     content.appendChild(mediaList);

// //     if (isLoggedIn) {
// //         const addMediaButton = Button("Add Media", "add-media-btn", {
// //             click: () => showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList),
// //         });
// //         content.prepend(addMediaButton);
// //     }

// //     if (mediaData.length === 0) {
// //         mediaList.appendChild(
// //             createElement("p", {}, ["No media available for this entity."])
// //         );
// //     } else {
// //         const mediaCards = []; // For Lightbox
// //         const videoCards = []; // For VidPlay

// //         mediaData.forEach((media, index) => {
// //             const mediaItem = renderMediaItem(media, index, isLoggedIn, entityType, entityId);
// //             mediaList.appendChild(mediaItem);

// //             if (media.type === "image") {
// //                 mediaCards.push(
// //                     resolveImagePath(EntityType.MEDIA, PictureType.PHOTO, media.url)
// //                 );
// //             } else if (media.type === "video") {
// //                 videoCards.push(
// //                     resolveImagePath(EntityType.MEDIA, PictureType.VIDEO, media.url)
// //                 );
// //             }
// //         });

// //         // Add Lightbox functionality
// //         mediaList.querySelectorAll(".media-img").forEach((img, index) => {
// //             img.addEventListener("click", () => Sightbox(mediaCards, index));
// //         });

// //         // Add VidPlay functionality
// //         mediaList.querySelectorAll(".media-video").forEach((video, index) => {
// //             video.addEventListener("click", () => playVideo(videoCards, index, entityId));
// //         });
// //     }
// // }

// // // async function displayMedia(content, entityType, entityId, isLoggedIn) {
// // //     content.innerHTML = ""; // Clear existing content
// // //     content.appendChild(createElement('h2',"",["Media Gallery"]));
// // //     const response = await apiFetch(`/media/${entityType}/${entityId}`);
// // //     const mediaData = response;

// // //     const mediaList = createElement("div", { class: "hvflex" });
// // //     // const mediaList = createElement("div", { class: "grid-4" });
// // //     content.appendChild(mediaList);

// // //     // Add "Add Media" button for logged-in users
// // //     if (isLoggedIn) {
// // //         const addMediaButton = Button("Add Media", "add-media-btn", {
// // //             click: () => showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList),
// // //         });
// // //         content.prepend(addMediaButton);
// // //     }

// // //     if (mediaData.length === 0) {
// // //         mediaList.appendChild(
// // //             createElement("p", {},["No media available for this entity."])
// // //         );
// // //     } else {
// // //         const mediaCards = []; // For Lightbox
// // //         const videoCards = []; // For VidPlay

// // //         mediaData.forEach((media, index) => {
// // //             const mediaItem = renderMediaItem(media, index, isLoggedIn, entityType, entityId);
// // //             mediaList.appendChild(mediaItem);

// // //             if (media.type === "image") {
// // //                 mediaCards.push(`${SRC_URL}/uploads/${media.url}`);
// // //             } else if (media.type === "video") {
// // //                 videoCards.push(`${SRC_URL}/uploads/${media.url}`);
// // //             }
// // //         });

// // //         // Add Lightbox functionality
// // //         mediaList.querySelectorAll(".media-img").forEach((img, index) => {
// // //             img.addEventListener("click", () => Lightbox(mediaCards, index));
// // //         });

// // //         // Add VidPlay functionality
// // //         mediaList.querySelectorAll(".media-video").forEach((video, index) => {
// // //             video.addEventListener("click", () => playVideo(videoCards, index, entityId));
// // //         });

// // //     }
// // // }

/********
 * 
 * 
 * 
 * import GridxMasonary from "./GridxMasonary.mjs";
const items = Array.from({ length: 10 }, (_, i) => {
    const div = document.createElement("div");
    div.textContent = `Item ${i + 1}`;
    return div;
});
document.body.appendChild(GridxMasonary(items));
 * 
 */


function playVideo(videos, index, videoid) {
    // poster = `${SRC_URL}/uploads/${media.id}.jpg`;
    let poster = "#";
    let qualities = [];
    let subtitles = [];
    console.log("dfghdgbfh");
    // document.getElementById('app').appendChild(VidPlay(videos[index]));    
    document.getElementById('app').appendChild(VidPlay(videos[index], poster, qualities, subtitles, videoid));
}

/******************* */
// Show media upload form
function showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList) {
    // Create modal content
    const content = document.createElement("div");
    content.setAttribute("id", "mediaform");

    // Create and show modal
    const modal = Modal({
        title: `Upload Media for ${entityType}`,
        content,
        onClose: () => modal.remove(),
    });

    // const title = document.createElement("h3");
    // title.textContent = `Upload ${entityType} Media`;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "mediaFile";
    fileInput.accept = "image/*,video/*";

    const previewDiv = document.createElement("div");
    previewDiv.id = "mediaPreview";

    const uploadButton = Button("Upload", "uploadMediaBtn", {
        click: () => { uploadMedia(isLoggedIn, entityType, entityId, mediaList, modal); uploadButton.style.display = "none"; },
    });

    // content.appendChild(title);
    content.appendChild(fileInput);
    content.appendChild(previewDiv);
    content.appendChild(uploadButton);

}

/******************* */


// export { displayMedia, renderMediaItem, showMediaUploadForm, uploadMedia, displayNewMedia, deleteMedia, addMediaEventListeners };
export { renderMediaItem, showMediaUploadForm, uploadMedia, displayNewMedia, deleteMedia, addMediaEventListeners };
