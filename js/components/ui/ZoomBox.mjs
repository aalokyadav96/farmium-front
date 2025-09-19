import "../../../css/ui/ZoomBox.css";
import { 
    createOverlay,
    createImageElement,
    createVideoElement,
    applyDarkMode,
    preloadImages,
    updateTransform,
    smoothZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    createNavigationButtons,
    createCloseButton,
    createZoomButtons,
    handleKeyboard
} from "./zoomboxHelpers.js";
import { dispatchZoomBoxEvent } from "../../utils/eventDispatcher.js";

// detect type by extension
function getMediaType(src) {
    const lower = src.toLowerCase();
    if (/\.(mp4|webm|ogg|mov|avi|mkv)$/.test(lower)) return "video";
    return "image"; // fallback for now
}

const createZoomBox = (mediaItems, initialIndex = 0) => {
    if (document.getElementById("zoombox")) return;

    const state = {
        zoomLevel: 1,
        panX: 0,
        panY: 0,
        angle: 0,
        flip: false,
        isDragging: false,
        startX: 0,
        startY: 0,
        velocityX: 0,
        velocityY: 0,
        lastTap: 0,
        currentIndex: initialIndex
    };

    const zoombox = createOverlay();
    zoombox.id = "zoombox";
    applyDarkMode(zoombox);

    const content = document.createElement("div");
    content.className = "zoombox-content";
    content.setAttribute("tabindex", "-1");

    // --- Media renderer ---
    const renderMedia = (index) => {
        content.querySelectorAll("img, video").forEach(el => el.remove());

        const src = mediaItems[index];
        const type = getMediaType(src);

        let element;
        if (type === "video") {
            element = createVideoElement(src);
        } else {
            element = createImageElement(src);

            // zoom & pan only for images
            element.addEventListener("wheel", (e) => smoothZoom(e, element, state, zoombox), { passive: false });
            element.addEventListener("mousedown", (e) => handleMouseDown(e, state));
            document.addEventListener("mousemove", (e) => handleMouseMove(e, state, element));
            document.addEventListener("mouseup", () => handleMouseUp(state, element));
        }

        content.insertBefore(element, content.querySelector(".zoombox-close"));
        dispatchZoomBoxEvent("imagechange", { index, src });
    };

    // initial media
    const initialSrc = mediaItems[state.currentIndex];
    const initialType = getMediaType(initialSrc);
    let mediaElement = initialType === "video"
        ? createVideoElement(initialSrc)
        : createImageElement(initialSrc);

    if (initialType === "image") {
        mediaElement.addEventListener("wheel", (e) => smoothZoom(e, mediaElement, state, zoombox), { passive: false });
        mediaElement.addEventListener("mousedown", (e) => handleMouseDown(e, state));
        document.addEventListener("mousemove", (e) => handleMouseMove(e, state, mediaElement));
        document.addEventListener("mouseup", () => handleMouseUp(state, mediaElement));
        preloadImages(mediaItems, state.currentIndex);
    }

    content.appendChild(mediaElement);

    // navigation
    if (mediaItems.length > 1) {
        const [prevBtn, nextBtn] = createNavigationButtons(
            mediaItems,
            mediaElement,
            state,
            preloadImages,
            updateTransform,
            renderMedia
        );
        content.appendChild(prevBtn);
        content.appendChild(nextBtn);
    }

    // zoom buttons (images only)
    if (initialType === "image") {
        const zoomButtons = createZoomButtons(mediaElement, state, zoombox);
        zoombox.appendChild(zoomButtons);
    }

    // ---- Closing logic ----
    const closeZoomBox = () => {
        const box = document.getElementById("zoombox");
        if (!box) return;

        box.style.opacity = "0";
        setTimeout(() => {
            if (box.parentNode) {
                box.remove();
            }
            document.removeEventListener("keydown", onKeyDown);
            dispatchZoomBoxEvent("close");
        }, 300);
    };

    // close button
    const closeBtn = createCloseButton(closeZoomBox);
    content.appendChild(closeBtn);

    zoombox.appendChild(content);
    document.getElementById("app").appendChild(zoombox);

    // keyboard
    const onKeyDown = (e) => {
        if (e.key === "Escape") {
            closeZoomBox();
        } else {
            handleKeyboard(e, mediaItems, mediaElement, state, preloadImages, updateTransform, closeZoomBox, renderMedia);
        }
    };
    document.addEventListener("keydown", onKeyDown);

    requestAnimationFrame(() => {
        zoombox.style.opacity = "1";
        content.focus();
        dispatchZoomBoxEvent("open", { index: state.currentIndex });
    });
};

export default createZoomBox;
