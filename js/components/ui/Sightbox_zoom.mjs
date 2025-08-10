import { createZoomableMedia } from "./ZoomableMedia.js";

const Sightbox = (src, type = "image") => {
  if (document.getElementById("sightbox")) return;

  const sightbox = document.createElement("div");
  sightbox.id = "sightbox";
  sightbox.className = "sightbox";

  const overlay = document.createElement("div");
  overlay.className = "sightbox-overlay";
  overlay.addEventListener("click", closeSightbox);

  const content = document.createElement("div");
  content.className = "sightbox-content";
  content.setAttribute("tabindex", "-1");
  content.focus();

  const zoomable = createZoomableMedia(src, type);
  content.appendChild(zoomable);

  const closeBtn = document.createElement("button");
  closeBtn.className = "sightbox-close";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", closeSightbox);

  content.appendChild(closeBtn);
  sightbox.appendChild(overlay);
  sightbox.appendChild(content);
  document.getElementById("app").appendChild(sightbox);

  function closeSightbox() {
    sightbox.remove();
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") closeSightbox();
  }

  document.addEventListener("keydown", onKeyDown);
};

export default Sightbox;

// import "../../../css/ui/Sightbox.css";

// const Sightbox = (mediaSrc, mediaType = "image") => {
//   if (document.getElementById("sightbox")) return; // Prevent duplicates

//   const sightbox = document.createElement("div");
//   sightbox.id = "sightbox";
//   sightbox.className = "sightbox";

//   const overlay = document.createElement("div");
//   overlay.className = "sightbox-overlay";
//   overlay.addEventListener("click", closeSightbox);

//   const content = document.createElement("div");
//   content.className = "sightbox-content";
//   content.setAttribute("tabindex", "-1");
//   content.focus();

//   let mediaElement;
//   let transformState = {
//     scale: 1,
//     offsetX: 0,
//     offsetY: 0,
//     isDragging: false,
//     isPinching: false,
//     startX: 0,
//     startY: 0,
//     velocityX: 0,
//     velocityY: 0,
//     lastMoveX: 0,
//     lastMoveY: 0,
//     momentum: false,
//     pinchDistance: 0,
//     zoomLevels: [1, 1.5, 2, 3],
//     zoomIndex: 0
//   };

//   const zoomLabel = document.createElement("div");
//   zoomLabel.className = "zoom-label";

//   const resetZoomBtn = document.createElement("button");
//   resetZoomBtn.className = "reset-zoom-btn";
//   resetZoomBtn.textContent = "Reset Zoom";
//   resetZoomBtn.addEventListener("click", () => {
//     transformState.scale = 1;
//     transformState.offsetX = 0;
//     transformState.offsetY = 0;
//     applyTransform(true);
//   });

//   if (mediaType === "image") {
//     mediaElement = document.createElement("img");
//     mediaElement.src = mediaSrc;
//     mediaElement.alt = "Zoomable image";
//     mediaElement.className = "zoomable-image";

//     // === Double tap zoom ===
//     let lastTap = 0;
//     mediaElement.addEventListener("touchend", (e) => {
//       const now = Date.now();
//       if (now - lastTap < 300) {
//         transformState.zoomIndex = (transformState.zoomIndex + 1) % transformState.zoomLevels.length;
//         transformState.scale = transformState.zoomLevels[transformState.zoomIndex];
//         applyTransform();
//       }
//       lastTap = now;
//     });

//     // === Pinch start ===
//     mediaElement.addEventListener("touchstart", (e) => {
//       if (e.touches.length === 2) {
//         transformState.isPinching = true;
//         transformState.pinchDistance = getPinchDistance(e.touches);
//       } else if (transformState.scale > 1) {
//         transformState.isDragging = true;
//         transformState.startX = e.touches[0].clientX - transformState.offsetX;
//         transformState.startY = e.touches[0].clientY - transformState.offsetY;
//         transformState.velocityX = 0;
//         transformState.velocityY = 0;
//         transformState.lastMoveX = e.touches[0].clientX;
//         transformState.lastMoveY = e.touches[0].clientY;
//         transformState.momentum = false;
//       }
//     });

//     // === Pinch or drag move ===
//     mediaElement.addEventListener("touchmove", (e) => {
//       if (transformState.isPinching && e.touches.length === 2) {
//         e.preventDefault();
//         const newDistance = getPinchDistance(e.touches);
//         const scaleChange = newDistance / transformState.pinchDistance;
//         transformState.scale = Math.max(1, Math.min(3, transformState.scale * scaleChange));
//         transformState.pinchDistance = newDistance;
//         applyTransform();
//       } else if (transformState.isDragging && e.touches.length === 1) {
//         e.preventDefault();
//         const touchX = e.touches[0].clientX;
//         const touchY = e.touches[0].clientY;

//         transformState.velocityX = touchX - transformState.lastMoveX;
//         transformState.velocityY = touchY - transformState.lastMoveY;
//         transformState.lastMoveX = touchX;
//         transformState.lastMoveY = touchY;

//         transformState.offsetX = touchX - transformState.startX;
//         transformState.offsetY = touchY - transformState.startY;

//         applyTransform();
//       }
//     });

//     // === End of drag / pinch ===
//     mediaElement.addEventListener("touchend", () => {
//       if (transformState.isDragging) {
//         transformState.isDragging = false;
//         if (Math.abs(transformState.velocityX) > 5 || Math.abs(transformState.velocityY) > 5) {
//           transformState.momentum = true;
//           requestAnimationFrame(momentumScroll);
//         }
//       }
//       transformState.isPinching = false;
//       applyTransform(true);
//     });

//     content.appendChild(mediaElement);
//     content.appendChild(zoomLabel);
//     content.appendChild(resetZoomBtn);
//   }

//   const closeBtn = document.createElement("button");
//   closeBtn.className = "sightbox-close";
//   closeBtn.textContent = "×";
//   closeBtn.addEventListener("click", closeSightbox);

//   // === Apply CSS transform ===
//   function applyTransform(snap = false) {
//     const el = mediaElement;
//     const s = transformState;
//     const limit = el.width * (s.scale - 1) / 2;

//     if (snap) {
//       s.offsetX = Math.max(-limit, Math.min(limit, s.offsetX));
//       s.offsetY = Math.max(-limit, Math.min(limit, s.offsetY));
//     }

//     el.style.transform = `translate(${s.offsetX}px, ${s.offsetY}px) scale(${s.scale})`;
//     el.style.transition = snap ? "transform 0.3s ease-out" : "none";
//     zoomLabel.textContent = `Zoom: ${s.scale.toFixed(1)}x`;
//   }

//   function momentumScroll() {
//     const s = transformState;
//     if (!s.momentum) return;

//     s.offsetX += s.velocityX * 0.9;
//     s.offsetY += s.velocityY * 0.9;
//     s.velocityX *= 0.9;
//     s.velocityY *= 0.9;
//     applyTransform();

//     if (Math.abs(s.velocityX) > 0.5 || Math.abs(s.velocityY) > 0.5) {
//       requestAnimationFrame(momentumScroll);
//     } else {
//       s.momentum = false;
//     }
//   }

//   function getPinchDistance(touches) {
//     const dx = touches[0].clientX - touches[1].clientX;
//     const dy = touches[0].clientY - touches[1].clientY;
//     return Math.sqrt(dx * dx + dy * dy);
//   }

//   function closeSightbox() {
//     sightbox.remove();
//     document.removeEventListener("keydown", escCloseListener);
//   }

//   function escCloseListener(e) {
//     if (e.key === "Escape") closeSightbox();
//   }

//   sightbox.appendChild(overlay);
//   sightbox.appendChild(content);
//   content.appendChild(closeBtn);

//   document.getElementById("app").appendChild(sightbox);
//   document.addEventListener("keydown", escCloseListener);

//   return sightbox;
// };

// export default Sightbox;

// // import "../../../css/ui/Sightbox.css";

// // const Sightbox = (mediaSrc, mediaType = "image") => {
// //   const sightbox = document.createElement("div");
// //   sightbox.className = "sightbox";

// //   const overlay = document.createElement("div");
// //   overlay.className = "sightbox-overlay";
// //   overlay.addEventListener("click", () => sightbox.remove());

// //   const content = document.createElement("div");
// //   content.className = "sightbox-content";

// //   let mediaElement;
// //   if (mediaType === "image") {
// //     mediaElement = document.createElement("img");
// //     mediaElement.src = mediaSrc;
// //     mediaElement.alt = "Sightbox Image";
// //     mediaElement.className = "zoomable-image";

// //     // === ZOOM VARIABLES ===
// //     let scale = 1;
// //     let minScale = 1;
// //     let maxScale = 3;
// //     let zoomLevels = [1, 1.5, 2, 3]; // Available zoom levels
// //     let currentZoomIndex = 0;
// //     let offsetX = 0, offsetY = 0;
// //     let startX = 0, startY = 0;
// //     let isDragging = false;
// //     let lastTap = 0;
// //     let lastTouchTime = 0;
// //     let velocityX = 0, velocityY = 0;
// //     let lastMoveX = 0, lastMoveY = 0;
// //     let isMomentumActive = false;

// //     // === ZOOM LEVEL DISPLAY ===
// //     const zoomLabel = document.createElement("div");
// //     zoomLabel.className = "zoom-label";
// //     zoomLabel.textContent = `Zoom: ${scale}x`;
    
// //     // === RESET ZOOM BUTTON ===
// //     const resetZoomButton = document.createElement("button");
// //     resetZoomButton.className = "reset-zoom-btn";
// //     resetZoomButton.textContent = "Reset Zoom";
// //     resetZoomButton.addEventListener("click", () => {
// //       scale = 1;
// //       offsetX = 0;
// //       offsetY = 0;
// //       applyTransform(true);
// //     });

// //     // === DOUBLE TAP TO ZOOM ===
// //     mediaElement.addEventListener("touchend", (e) => {
// //       const currentTime = new Date().getTime();
// //       const tapLength = currentTime - lastTap;

// //       if (tapLength < 300 && tapLength > 0) { // Double tap detected
// //         currentZoomIndex = (currentZoomIndex + 1) % zoomLevels.length;
// //         scale = zoomLevels[currentZoomIndex];
// //         applyTransform();
// //       }
// //       lastTap = currentTime;
// //     });

// //     // === TOUCH DRAG (Momentum Flick) ===
// //     mediaElement.addEventListener("touchstart", (e) => {
// //       if (scale === 1) return;
// //       isDragging = true;
// //       isMomentumActive = false;
// //       startX = e.touches[0].clientX - offsetX;
// //       startY = e.touches[0].clientY - offsetY;
// //       lastMoveX = startX;
// //       lastMoveY = startY;
// //       velocityX = 0;
// //       velocityY = 0;
// //     });

// //     mediaElement.addEventListener("touchmove", (e) => {
// //       if (!isDragging || scale === 1) return;
// //       e.preventDefault(); // Prevent page scroll

// //       let touchX = e.touches[0].clientX;
// //       let touchY = e.touches[0].clientY;
      
// //       velocityX = touchX - lastMoveX;
// //       velocityY = touchY - lastMoveY;
// //       lastMoveX = touchX;
// //       lastMoveY = touchY;

// //       offsetX = touchX - startX;
// //       offsetY = touchY - startY;

// //       applyTransform();
// //     });

// //     mediaElement.addEventListener("touchend", () => {
// //       isDragging = false;

// //       // Start momentum effect
// //       if (Math.abs(velocityX) > 5 || Math.abs(velocityY) > 5) {
// //         isMomentumActive = true;
// //         requestAnimationFrame(momentumMove);
// //       }
// //       applyTransform(true);
// //     });

// //     function momentumMove() {
// //       if (!isMomentumActive) return;
      
// //       offsetX += velocityX * 0.9;
// //       offsetY += velocityY * 0.9;

// //       velocityX *= 0.9;
// //       velocityY *= 0.9;

// //       applyTransform();

// //       if (Math.abs(velocityX) > 0.5 || Math.abs(velocityY) > 0.5) {
// //         requestAnimationFrame(momentumMove);
// //       } else {
// //         isMomentumActive = false;
// //       }
// //     }

// //     // === PINCH TO ZOOM ===
// //     let initialDistance = 0;
// //     mediaElement.addEventListener("touchstart", (e) => {
// //       if (e.touches.length === 2) {
// //         initialDistance = getPinchDistance(e.touches);
// //       }
// //     });

// //     mediaElement.addEventListener("touchmove", (e) => {
// //       if (e.touches.length === 2) {
// //         e.preventDefault();
// //         let newDistance = getPinchDistance(e.touches);
// //         let scaleChange = (newDistance / initialDistance);

// //         scale = Math.min(maxScale, Math.max(minScale, scale * scaleChange));
// //         zoomLabel.textContent = `Zoom: ${scale.toFixed(1)}x`;
// //         initialDistance = newDistance;
// //         applyTransform();
// //       }
// //     });

// //     // === APPLY TRANSFORM ===
// //     function applyTransform(snapBack = false) {
// //       if (snapBack) {
// //         offsetX = Math.min(Math.max(offsetX, -mediaElement.width * (scale - 1) / 2), mediaElement.width * (scale - 1) / 2);
// //         offsetY = Math.min(Math.max(offsetY, -mediaElement.height * (scale - 1) / 2), mediaElement.height * (scale - 1) / 2);
// //       }
// //       mediaElement.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
// //       mediaElement.style.transition = snapBack ? "transform 0.3s ease-out" : "none";
// //       zoomLabel.textContent = `Zoom: ${scale.toFixed(1)}x`;
// //     }

// //     // === UTILITY FUNCTION FOR PINCH DISTANCE ===
// //     function getPinchDistance(touches) {
// //       const dx = touches[0].clientX - touches[1].clientX;
// //       const dy = touches[0].clientY - touches[1].clientY;
// //       return Math.sqrt(dx * dx + dy * dy);
// //     }

// //     content.appendChild(mediaElement);
// //     content.appendChild(zoomLabel);
// //     content.appendChild(resetZoomButton);
// //   }

// //   const closeButton = document.createElement("button");
// //   closeButton.className = "sightbox-close";
// //   closeButton.textContent = "×";
// //   closeButton.addEventListener("click", () => sightbox.remove());

// //   sightbox.appendChild(overlay);
// //   sightbox.appendChild(content);
// //   content.appendChild(closeButton);

// //   document.getElementById('app').appendChild(sightbox);

// //   return sightbox;
// // };

// // export default Sightbox;
