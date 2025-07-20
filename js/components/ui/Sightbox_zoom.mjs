import "../../../css/ui/Sightbox.css";

const Sightbox = (mediaSrc, mediaType = "image") => {
  const sightbox = document.createElement("div");
  sightbox.className = "sightbox";

  const overlay = document.createElement("div");
  overlay.className = "sightbox-overlay";
  overlay.addEventListener("click", () => sightbox.remove());

  const content = document.createElement("div");
  content.className = "sightbox-content";

  let mediaElement;
  if (mediaType === "image") {
    mediaElement = document.createElement("img");
    mediaElement.src = mediaSrc;
    mediaElement.alt = "Sightbox Image";
    mediaElement.className = "zoomable-image";

    // === ZOOM VARIABLES ===
    let scale = 1;
    let minScale = 1;
    let maxScale = 3;
    let zoomLevels = [1, 1.5, 2, 3]; // Available zoom levels
    let currentZoomIndex = 0;
    let offsetX = 0, offsetY = 0;
    let startX = 0, startY = 0;
    let isDragging = false;
    let lastTap = 0;
    let lastTouchTime = 0;
    let velocityX = 0, velocityY = 0;
    let lastMoveX = 0, lastMoveY = 0;
    let isMomentumActive = false;

    // === ZOOM LEVEL DISPLAY ===
    const zoomLabel = document.createElement("div");
    zoomLabel.className = "zoom-label";
    zoomLabel.textContent = `Zoom: ${scale}x`;
    
    // === RESET ZOOM BUTTON ===
    const resetZoomButton = document.createElement("button");
    resetZoomButton.className = "reset-zoom-btn";
    resetZoomButton.textContent = "Reset Zoom";
    resetZoomButton.addEventListener("click", () => {
      scale = 1;
      offsetX = 0;
      offsetY = 0;
      applyTransform(true);
    });

    // === DOUBLE TAP TO ZOOM ===
    mediaElement.addEventListener("touchend", (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;

      if (tapLength < 300 && tapLength > 0) { // Double tap detected
        currentZoomIndex = (currentZoomIndex + 1) % zoomLevels.length;
        scale = zoomLevels[currentZoomIndex];
        applyTransform();
      }
      lastTap = currentTime;
    });

    // === TOUCH DRAG (Momentum Flick) ===
    mediaElement.addEventListener("touchstart", (e) => {
      if (scale === 1) return;
      isDragging = true;
      isMomentumActive = false;
      startX = e.touches[0].clientX - offsetX;
      startY = e.touches[0].clientY - offsetY;
      lastMoveX = startX;
      lastMoveY = startY;
      velocityX = 0;
      velocityY = 0;
    });

    mediaElement.addEventListener("touchmove", (e) => {
      if (!isDragging || scale === 1) return;
      e.preventDefault(); // Prevent page scroll

      let touchX = e.touches[0].clientX;
      let touchY = e.touches[0].clientY;
      
      velocityX = touchX - lastMoveX;
      velocityY = touchY - lastMoveY;
      lastMoveX = touchX;
      lastMoveY = touchY;

      offsetX = touchX - startX;
      offsetY = touchY - startY;

      applyTransform();
    });

    mediaElement.addEventListener("touchend", () => {
      isDragging = false;

      // Start momentum effect
      if (Math.abs(velocityX) > 5 || Math.abs(velocityY) > 5) {
        isMomentumActive = true;
        requestAnimationFrame(momentumMove);
      }
      applyTransform(true);
    });

    function momentumMove() {
      if (!isMomentumActive) return;
      
      offsetX += velocityX * 0.9;
      offsetY += velocityY * 0.9;

      velocityX *= 0.9;
      velocityY *= 0.9;

      applyTransform();

      if (Math.abs(velocityX) > 0.5 || Math.abs(velocityY) > 0.5) {
        requestAnimationFrame(momentumMove);
      } else {
        isMomentumActive = false;
      }
    }

    // === PINCH TO ZOOM ===
    let initialDistance = 0;
    mediaElement.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        initialDistance = getPinchDistance(e.touches);
      }
    });

    mediaElement.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        let newDistance = getPinchDistance(e.touches);
        let scaleChange = (newDistance / initialDistance);

        scale = Math.min(maxScale, Math.max(minScale, scale * scaleChange));
        zoomLabel.textContent = `Zoom: ${scale.toFixed(1)}x`;
        initialDistance = newDistance;
        applyTransform();
      }
    });

    // === APPLY TRANSFORM ===
    function applyTransform(snapBack = false) {
      if (snapBack) {
        offsetX = Math.min(Math.max(offsetX, -mediaElement.width * (scale - 1) / 2), mediaElement.width * (scale - 1) / 2);
        offsetY = Math.min(Math.max(offsetY, -mediaElement.height * (scale - 1) / 2), mediaElement.height * (scale - 1) / 2);
      }
      mediaElement.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      mediaElement.style.transition = snapBack ? "transform 0.3s ease-out" : "none";
      zoomLabel.textContent = `Zoom: ${scale.toFixed(1)}x`;
    }

    // === UTILITY FUNCTION FOR PINCH DISTANCE ===
    function getPinchDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    content.appendChild(mediaElement);
    content.appendChild(zoomLabel);
    content.appendChild(resetZoomButton);
  }

  const closeButton = document.createElement("button");
  closeButton.className = "sightbox-close";
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => sightbox.remove());

  sightbox.appendChild(overlay);
  sightbox.appendChild(content);
  content.appendChild(closeButton);

  document.getElementById('app').appendChild(sightbox);

  return sightbox;
};

export default Sightbox;
