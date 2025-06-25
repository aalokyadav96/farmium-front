import "../../../css/ui/ZoomBox.css";
import { 
    createOverlay,
    createImageElement,
    applyDarkMode,
    preloadImages,
    updateTransform,
    smoothZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    // handleTouchStart,
    // handleTouchMove,
    // handleTouchEnd,
    createNavigationButtons,
    createCloseButton,
    createZoomButtons,         // new: zoom in/out buttons
    handleKeyboard 
} from "./zoomboxHelpers.js";
import { dispatchZoomBoxEvent } from "../../utils/eventDispatcher.js";

const createZoomBox = (images, initialIndex = 0) => {
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

    // Create the main overlay and content container
    const zoombox = createOverlay();
    applyDarkMode(zoombox);
    const content = document.createElement("div");
    content.className = "zoombox-content";

    // Create the image element and insert it
    const img = createImageElement(images[state.currentIndex]);
    content.appendChild(img);
    preloadImages(images, state.currentIndex);

    // Function to update image on navigation
    const updateImage = (index) => {
        state.currentIndex = (index + images.length) % images.length;
        img.src = images[state.currentIndex];
        state.zoomLevel = 1;
        state.panX = 0;
        state.panY = 0;
        preloadImages(images, state.currentIndex);
        updateTransform(img, state);
        dispatchZoomBoxEvent("imagechange", { index: state.currentIndex, src: images[state.currentIndex] });
    };

    // Attach zoom event (mouse wheel)
    img.addEventListener("wheel", (e) => smoothZoom(e, img, state, zoombox), { passive: false });

    // Attach mouse events for desktop dragging/panning
    img.addEventListener("mousedown", (e) => handleMouseDown(e, state));
    document.addEventListener("mousemove", (e) => handleMouseMove(e, state, img));
    document.addEventListener("mouseup", () => handleMouseUp(state, img));

    // // Attach touch events for mobile
    // img.addEventListener("touchstart", (e) => handleTouchStart(e, state, img, zoombox), { passive: false });
    // img.addEventListener("touchmove", (e) => handleTouchMove(e, state, img, zoombox), { passive: false });
    // img.addEventListener("touchend", (e) => handleTouchEnd(e, state, img));

    // Create navigation buttons if more than one image
    if (images.length > 1) {
        const [prevBtn, nextBtn] = createNavigationButtons(images, img, state, preloadImages, updateTransform);
        content.appendChild(prevBtn);
        content.appendChild(nextBtn);
    }

    // Create zoom in/out buttons and attach them to the overlay
    const zoomButtons = createZoomButtons(img, state, zoombox);
    // The zoom buttons are absolutely positioned inside the container via CSS
    zoombox.appendChild(zoomButtons);

    // Close button for the ZoomBox
    const closeZoomBox = () => {
        zoombox.style.opacity = "0";
        setTimeout(() => zoombox.remove(), 300);
        // The close event is dispatched in createCloseButton helper.
    };
    const closeBtn = createCloseButton(closeZoomBox);
    content.appendChild(closeBtn);

    zoombox.appendChild(content);
    document.getElementById("app").appendChild(zoombox);

    // Fade in the overlay and dispatch an open event
    requestAnimationFrame(() => {
        zoombox.style.opacity = "1";
        dispatchZoomBoxEvent("open", { index: state.currentIndex });
    });

    history.pushState({ zoomboxOpen: true }, "");
    window.addEventListener("popstate", (event) => {
        if (event.state && event.state.zoomboxOpen) {
            closeZoomBox();
        }
    });

    // Attach keyboard handling (for navigation, zooming, rotation, etc.)
    document.addEventListener("keydown", (e) =>
        handleKeyboard(e, images, img, state, preloadImages, updateTransform, closeZoomBox)
    );
};

export default createZoomBox;


/* --------------------------
   Example Event Listeners
   -------------------------- */
document.addEventListener("zoombox:open", (e) => {
    console.log("ZoomBox opened at image:", e.detail.index);
});

document.addEventListener("zoombox:zoom", (e) => {
    console.log("Zoom level changed to:", e.detail.level);
});

document.addEventListener("zoombox:imagechange", (e) => {
    console.log("Switched to image:", e.detail.index, e.detail.src);
});

document.addEventListener("zoombox:rotate", (e) => {
    console.log("Image rotated. Angle is now:", e.detail.angle);
});

document.addEventListener("zoombox:flip", (e) => {
    console.log("Image flipped. flip state:", e.detail.flip);
});

document.addEventListener("zoombox:close", () => {
    console.log("ZoomBox closed");
});
