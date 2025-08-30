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
    createNavigationButtons,
    createCloseButton,
    createZoomButtons,
    handleKeyboard
} from "./zoomboxHelpers.js";
import { dispatchZoomBoxEvent } from "../../utils/eventDispatcher.js";

const createZoomBox = (images, initialIndex = 0) => {
    // 🛑 Guard: prevent multiple ZoomBoxes
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

    const img = createImageElement(images[state.currentIndex]);
    content.appendChild(img);
    preloadImages(images, state.currentIndex);

    // zoom & pan
    img.addEventListener("wheel", (e) => smoothZoom(e, img, state, zoombox), { passive: false });
    img.addEventListener("mousedown", (e) => handleMouseDown(e, state));
    document.addEventListener("mousemove", (e) => handleMouseMove(e, state, img));
    document.addEventListener("mouseup", () => handleMouseUp(state, img));

    // navigation
    if (images.length > 1) {
        const [prevBtn, nextBtn] = createNavigationButtons(images, img, state, preloadImages, updateTransform);
        content.appendChild(prevBtn);
        content.appendChild(nextBtn);
    }

    // zoom controls
    const zoomButtons = createZoomButtons(img, state, zoombox);
    zoombox.appendChild(zoomButtons);

    // ---- Closing logic ----
    const closeZoomBox = () => {
        const box = document.getElementById("zoombox");
        if (!box) return; // already closed

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

    // append content
    zoombox.appendChild(content);
    document.getElementById("app").appendChild(zoombox);

    // // close on overlay click
    // zoombox.addEventListener("click", (e) => {
    //     if (e.target === zoombox) {
    //         closeZoomBox();
    //     }
    // });

    // ---- Keyboard support ----
    const onKeyDown = (e) => {
        if (e.key === "Escape") {
            closeZoomBox();
        } else {
            handleKeyboard(e, images, img, state, preloadImages, updateTransform, closeZoomBox);
        }
    };
    document.addEventListener("keydown", onKeyDown);

    // open animation + event
    requestAnimationFrame(() => {
        zoombox.style.opacity = "1";
        content.focus();
        dispatchZoomBoxEvent("open", { index: state.currentIndex });
    });
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

// import "../../../css/ui/ZoomBox.css";
// import { 
//     createOverlay,
//     createImageElement,
//     applyDarkMode,
//     preloadImages,
//     updateTransform,
//     smoothZoom,
//     handleMouseDown,
//     handleMouseMove,
//     handleMouseUp,
//     createNavigationButtons,
//     createCloseButton,
//     createZoomButtons,
//     handleKeyboard
// } from "./zoomboxHelpers.js";
// import { dispatchZoomBoxEvent } from "../../utils/eventDispatcher.js";

// const createZoomBox = (images, initialIndex = 0) => {
//     // 🛑 Guard: prevent multiple ZoomBoxes
//     if (document.getElementById("zoombox")) return;

//     const state = {
//         zoomLevel: 1,
//         panX: 0,
//         panY: 0,
//         angle: 0,
//         flip: false,
//         isDragging: false,
//         startX: 0,
//         startY: 0,
//         velocityX: 0,
//         velocityY: 0,
//         lastTap: 0,
//         currentIndex: initialIndex
//     };

//     const zoombox = createOverlay();
//     zoombox.id = "zoombox";
//     applyDarkMode(zoombox);

//     const content = document.createElement("div");
//     content.className = "zoombox-content";
//     content.setAttribute("tabindex", "-1");

//     const img = createImageElement(images[state.currentIndex]);
//     content.appendChild(img);
//     preloadImages(images, state.currentIndex);

//     const updateImage = (index) => {
//         state.currentIndex = (index + images.length) % images.length;
//         img.src = images[state.currentIndex];
//         state.zoomLevel = 1;
//         state.panX = 0;
//         state.panY = 0;
//         preloadImages(images, state.currentIndex);
//         updateTransform(img, state);
//         dispatchZoomBoxEvent("imagechange", { index: state.currentIndex, src: images[state.currentIndex] });
//     };

//     // zoom & pan
//     img.addEventListener("wheel", (e) => smoothZoom(e, img, state, zoombox), { passive: false });
//     img.addEventListener("mousedown", (e) => handleMouseDown(e, state));
//     document.addEventListener("mousemove", (e) => handleMouseMove(e, state, img));
//     document.addEventListener("mouseup", () => handleMouseUp(state, img));

//     // navigation
//     if (images.length > 1) {
//         const [prevBtn, nextBtn] = createNavigationButtons(images, img, state, preloadImages, updateTransform);
//         content.appendChild(prevBtn);
//         content.appendChild(nextBtn);
//     }

//     // zoom controls
//     const zoomButtons = createZoomButtons(img, state, zoombox);
//     zoombox.appendChild(zoomButtons);

//     // ---- Closing logic ----
//     const closeZoomBox = () => {
//         const box = document.getElementById("zoombox");
//         if (!box) return; // already removed

//         box.style.opacity = "0";
//         setTimeout(() => {
//             if (box.parentNode) {
//                 box.remove();
//             }
//             document.removeEventListener("keydown", onKeyDown);
//             dispatchZoomBoxEvent("close");
//         }, 300);
//     };

//     // close button
//     const closeBtn = createCloseButton(closeZoomBox);
//     content.appendChild(closeBtn);

//     zoombox.appendChild(content);
//     document.getElementById("app").appendChild(zoombox);

//     // ---- Keyboard support ----
//     const onKeyDown = (e) => {
//         if (e.key === "Escape") {
//             closeZoomBox();
//         } else {
//             handleKeyboard(e, images, img, state, preloadImages, updateTransform, closeZoomBox);
//         }
//     };
//     document.addEventListener("keydown", onKeyDown);

//     // open animation + event
//     requestAnimationFrame(() => {
//         zoombox.style.opacity = "1";
//         content.focus();
//         dispatchZoomBoxEvent("open", { index: state.currentIndex });
//     });
// };

// export default createZoomBox;

// /* --------------------------
//    Example Event Listeners
//    -------------------------- */
// document.addEventListener("zoombox:open", (e) => {
//     console.log("ZoomBox opened at image:", e.detail.index);
// });

// document.addEventListener("zoombox:zoom", (e) => {
//     console.log("Zoom level changed to:", e.detail.level);
// });

// document.addEventListener("zoombox:imagechange", (e) => {
//     console.log("Switched to image:", e.detail.index, e.detail.src);
// });

// document.addEventListener("zoombox:rotate", (e) => {
//     console.log("Image rotated. Angle is now:", e.detail.angle);
// });

// document.addEventListener("zoombox:flip", (e) => {
//     console.log("Image flipped. flip state:", e.detail.flip);
// });

// document.addEventListener("zoombox:close", () => {
//     console.log("ZoomBox closed");
// });

// // import "../../../css/ui/ZoomBox.css";
// // import { 
// //     createOverlay,
// //     createImageElement,
// //     applyDarkMode,
// //     preloadImages,
// //     updateTransform,
// //     smoothZoom,
// //     handleMouseDown,
// //     handleMouseMove,
// //     handleMouseUp,
// //     createNavigationButtons,
// //     createCloseButton,
// //     createZoomButtons,
// //     handleKeyboard
// // } from "./zoomboxHelpers.js";
// // import { dispatchZoomBoxEvent } from "../../utils/eventDispatcher.js";

// // const createZoomBox = (images, initialIndex = 0) => {
// //     // 🛑 Guard: prevent multiple ZoomBoxes
// //     if (document.getElementById("zoombox")) return;

// //     const state = {
// //         zoomLevel: 1,
// //         panX: 0,
// //         panY: 0,
// //         angle: 0,
// //         flip: false,
// //         isDragging: false,
// //         startX: 0,
// //         startY: 0,
// //         velocityX: 0,
// //         velocityY: 0,
// //         lastTap: 0,
// //         currentIndex: initialIndex
// //     };

// //     const zoombox = createOverlay();
// //     zoombox.id = "zoombox"; // used for guard and lookup
// //     applyDarkMode(zoombox);

// //     const content = document.createElement("div");
// //     content.className = "zoombox-content";
// //     content.setAttribute("tabindex", "-1"); // for focus trap

// //     const img = createImageElement(images[state.currentIndex]);
// //     content.appendChild(img);
// //     preloadImages(images, state.currentIndex);

// //     const updateImage = (index) => {
// //         state.currentIndex = (index + images.length) % images.length;
// //         img.src = images[state.currentIndex];
// //         state.zoomLevel = 1;
// //         state.panX = 0;
// //         state.panY = 0;
// //         preloadImages(images, state.currentIndex);
// //         updateTransform(img, state);
// //         dispatchZoomBoxEvent("imagechange", { index: state.currentIndex, src: images[state.currentIndex] });
// //     };

// //     // zoom & pan
// //     img.addEventListener("wheel", (e) => smoothZoom(e, img, state, zoombox), { passive: false });
// //     img.addEventListener("mousedown", (e) => handleMouseDown(e, state));
// //     document.addEventListener("mousemove", (e) => handleMouseMove(e, state, img));
// //     document.addEventListener("mouseup", () => handleMouseUp(state, img));

// //     // navigation
// //     if (images.length > 1) {
// //         const [prevBtn, nextBtn] = createNavigationButtons(images, img, state, preloadImages, updateTransform);
// //         content.appendChild(prevBtn);
// //         content.appendChild(nextBtn);
// //     }

// //     // zoom controls
// //     const zoomButtons = createZoomButtons(img, state, zoombox);
// //     zoombox.appendChild(zoomButtons);

// //     // ---- Closing logic ----
// //     const cleanupAndClose = () => {
// //         const box = document.getElementById("zoombox");
// //         if (!box) return; // already removed

// //         box.style.opacity = "0";
// //         setTimeout(() => {
// //             if (box.parentNode) {
// //                 box.remove();
// //             }
// //             document.removeEventListener("keydown", onKeyDown);
// //             dispatchZoomBoxEvent("close");
// //         }, 300);
// //     };

// //     // manual close button
// //     const closeBtn = createCloseButton(() => history.back());
// //     content.appendChild(closeBtn);

// //     zoombox.appendChild(content);
// //     document.getElementById("app").appendChild(zoombox);

// //     // ---- Keyboard support ----
// //     const onKeyDown = (e) => {
// //         if (e.key === "Escape") {
// //             history.back(); // go back instead of calling close directly
// //         } else {
// //             handleKeyboard(e, images, img, state, preloadImages, updateTransform, () => history.back());
// //         }
// //     };
// //     document.addEventListener("keydown", onKeyDown);

// //     // ---- History integration ----
// //     requestAnimationFrame(() => {
// //         zoombox.style.opacity = "1";
// //         content.focus(); // 🔐 focus trap starts here
// //         dispatchZoomBoxEvent("open", { index: state.currentIndex });
// //     });

// //     // push state for open
// //     history.pushState({ zoomboxOpen: true }, "");

// //     // close on popstate
// //     window.addEventListener("popstate", (event) => {
// //         if (event.state && event.state.zoomboxOpen) {
// //             cleanupAndClose();
// //         }
// //     });
// // };

// // export default createZoomBox;

// // /* --------------------------
// //    Example Event Listeners
// //    -------------------------- */
// // document.addEventListener("zoombox:open", (e) => {
// //     console.log("ZoomBox opened at image:", e.detail.index);
// // });

// // document.addEventListener("zoombox:zoom", (e) => {
// //     console.log("Zoom level changed to:", e.detail.level);
// // });

// // document.addEventListener("zoombox:imagechange", (e) => {
// //     console.log("Switched to image:", e.detail.index, e.detail.src);
// // });

// // document.addEventListener("zoombox:rotate", (e) => {
// //     console.log("Image rotated. Angle is now:", e.detail.angle);
// // });

// // document.addEventListener("zoombox:flip", (e) => {
// //     console.log("Image flipped. flip state:", e.detail.flip);
// // });

// // document.addEventListener("zoombox:close", () => {
// //     console.log("ZoomBox closed");
// // });

// // // import "../../../css/ui/ZoomBox.css";
// // // import { 
// // //     createOverlay,
// // //     createImageElement,
// // //     applyDarkMode,
// // //     preloadImages,
// // //     updateTransform,
// // //     smoothZoom,
// // //     handleMouseDown,
// // //     handleMouseMove,
// // //     handleMouseUp,
// // //     createNavigationButtons,
// // //     createCloseButton,
// // //     createZoomButtons,
// // //     handleKeyboard
// // // } from "./zoomboxHelpers.js";
// // // import { dispatchZoomBoxEvent } from "../../utils/eventDispatcher.js";

// // // const createZoomBox = (images, initialIndex = 0) => {
// // //     // 🛑 Guard: prevent multiple ZoomBoxes
// // //     if (document.getElementById("zoombox")) return;

// // //     const state = {
// // //         zoomLevel: 1,
// // //         panX: 0,
// // //         panY: 0,
// // //         angle: 0,
// // //         flip: false,
// // //         isDragging: false,
// // //         startX: 0,
// // //         startY: 0,
// // //         velocityX: 0,
// // //         velocityY: 0,
// // //         lastTap: 0,
// // //         currentIndex: initialIndex
// // //     };

// // //     const zoombox = createOverlay();
// // //     zoombox.id = "zoombox"; // used for guard and lookup
// // //     applyDarkMode(zoombox);

// // //     const content = document.createElement("div");
// // //     content.className = "zoombox-content";
// // //     content.setAttribute("tabindex", "-1"); // for focus trap

// // //     const img = createImageElement(images[state.currentIndex]);
// // //     content.appendChild(img);
// // //     preloadImages(images, state.currentIndex);

// // //     const updateImage = (index) => {
// // //         state.currentIndex = (index + images.length) % images.length;
// // //         img.src = images[state.currentIndex];
// // //         state.zoomLevel = 1;
// // //         state.panX = 0;
// // //         state.panY = 0;
// // //         preloadImages(images, state.currentIndex);
// // //         updateTransform(img, state);
// // //         dispatchZoomBoxEvent("imagechange", { index: state.currentIndex, src: images[state.currentIndex] });
// // //     };

// // //     img.addEventListener("wheel", (e) => smoothZoom(e, img, state, zoombox), { passive: false });
// // //     img.addEventListener("mousedown", (e) => handleMouseDown(e, state));
// // //     document.addEventListener("mousemove", (e) => handleMouseMove(e, state, img));
// // //     document.addEventListener("mouseup", () => handleMouseUp(state, img));

// // //     if (images.length > 1) {
// // //         const [prevBtn, nextBtn] = createNavigationButtons(images, img, state, preloadImages, updateTransform);
// // //         content.appendChild(prevBtn);
// // //         content.appendChild(nextBtn);
// // //     }

// // //     const zoomButtons = createZoomButtons(img, state, zoombox);
// // //     zoombox.appendChild(zoomButtons);

// // //     const onKeyDown = (e) => {
// // //         if (e.key === "Escape") {
// // //             closeZoomBox();
// // //         } else {
// // //             handleKeyboard(e, images, img, state, preloadImages, updateTransform, closeZoomBox);
// // //         }
// // //     };

// // //     const closeZoomBox = () => {
// // //         zoombox.style.opacity = "0";
// // //         setTimeout(() => {
// // //             zoombox.remove();
// // //             document.removeEventListener("keydown", onKeyDown);
// // //             history.back(); // pop state when closing
// // //             dispatchZoomBoxEvent("close");
// // //         }, 300);
// // //     };

// // //     const closeBtn = createCloseButton(closeZoomBox);
// // //     content.appendChild(closeBtn);

// // //     zoombox.appendChild(content);
// // //     document.getElementById("app").appendChild(zoombox);

// // //     requestAnimationFrame(() => {
// // //         zoombox.style.opacity = "1";
// // //         content.focus(); // 🔐 focus trap starts here
// // //         dispatchZoomBoxEvent("open", { index: state.currentIndex });
// // //     });

// // //     history.pushState({ zoomboxOpen: true }, "");
// // //     window.addEventListener("popstate", (event) => {
// // //         if (event.state && event.state.zoomboxOpen) {
// // //             closeZoomBox();
// // //         }
// // //     });

// // //     document.addEventListener("keydown", onKeyDown);
// // // };

// // // export default createZoomBox;

// // // /* --------------------------
// // //    Example Event Listeners
// // //    -------------------------- */
// // // document.addEventListener("zoombox:open", (e) => {
// // //     console.log("ZoomBox opened at image:", e.detail.index);
// // // });

// // // document.addEventListener("zoombox:zoom", (e) => {
// // //     console.log("Zoom level changed to:", e.detail.level);
// // // });

// // // document.addEventListener("zoombox:imagechange", (e) => {
// // //     console.log("Switched to image:", e.detail.index, e.detail.src);
// // // });

// // // document.addEventListener("zoombox:rotate", (e) => {
// // //     console.log("Image rotated. Angle is now:", e.detail.angle);
// // // });

// // // document.addEventListener("zoombox:flip", (e) => {
// // //     console.log("Image flipped. flip state:", e.detail.flip);
// // // });

// // // document.addEventListener("zoombox:close", () => {
// // //     console.log("ZoomBox closed");
// // // });
