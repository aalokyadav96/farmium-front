import "../../../css/ui/VidBox.css";
const VidBox = (video, options = {}) => {
  // Ensure video is inside a container
  const container = video.parentElement || document.body;

  // Dark mode auto-detection
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    container.classList.add("dark-mode");
  }

  // Transformation state
  let zoomLevel = 1;
  let panX = 0, panY = 0;
  let isDragging = false;
  let startX = 0, startY = 0;
  let velocityX = 0, velocityY = 0;
  let lastTap = 0;
  let initialPinchDistance = null, initialZoom = 1;
  let angle = 0, flip = false;

  // --- Update transformation ---
  const updateTransform = () => {
    video.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel * (flip ? -1 : 1)}, ${zoomLevel}) rotate(${angle}deg)`;
  };

  // Smoothed zoom handling
  const smoothZoom = (delta, event) => {
    const { videoWidth: naturalW, videoHeight: naturalH } = video;

    const prevZoom = zoomLevel;
    zoomLevel *= delta > 0 ? 0.9 : 1.1; // Exponential zoom for a natural feel
    zoomLevel = Math.max(1, Math.min(zoomLevel, Math.min(naturalW / video.clientWidth, naturalH / video.clientHeight)));

    // Cursor-based zoom positioning
    const rect = video.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;

    const zoomFactor = zoomLevel / prevZoom;
    panX -= (cursorX - panX) * (zoomFactor - 1);
    panY -= (cursorY - panY) * (zoomFactor - 1);

    video.style.transformOrigin = `${(cursorX / rect.width) * 100}% ${(cursorY / rect.height) * 100}%`;
    updateTransform();
  };

  const onWheel = (event) => {
    event.preventDefault();
    requestAnimationFrame(() => smoothZoom(event.deltaY, event));
  };

  // Flip Video
  const flipVideo = () => {
    flip = !flip;
    updateTransform();
  };

  // --- Touch Handlers for Pinch-to-Zoom and Double-Tap ---
  const onTouchStart = (event) => {
    if (event.touches.length === 2) {
      // Pinch start
      initialPinchDistance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );
      initialZoom = zoomLevel;
    } else if (event.touches.length === 1) {
      // Double-Tap to Zoom
      const currentTime = Date.now();
      if (currentTime - lastTap < 300) {
        zoomLevel = zoomLevel === 1 ? 2 : 1;
        panX = 0;
        panY = 0;
        updateTransform();
        event.preventDefault();
      }
      lastTap = currentTime;

      // Begin Panning
      isDragging = true;
      startX = event.touches[0].clientX - panX;
      startY = event.touches[0].clientY - panY;
    }
  };

  const onTouchMove = (event) => {
    if (event.touches.length === 2 && initialPinchDistance) {
      // Pinch-to-Zoom
      const newDistance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY
      );

      const scaleFactor = newDistance / initialPinchDistance;
      zoomLevel = Math.max(1, Math.min(3, initialZoom * scaleFactor));

      updateTransform();
    } else if (isDragging) {
      // Panning
      const dx = event.touches[0].clientX - startX;
      const dy = event.touches[0].clientY - startY;
      panX = dx;
      panY = dy;
      updateTransform();
    }
  };

  const onTouchEnd = () => {
    initialPinchDistance = null;
    isDragging = false;
  };

  // --- Mouse Handlers for Panning ---
  const onMouseDown = (event) => {
    if (zoomLevel <= 1) return;
    event.preventDefault();
    isDragging = true;
    startX = event.clientX - panX;
    startY = event.clientY - panY;
  };

  const onMouseMove = (event) => {
    if (!isDragging) return;
    event.preventDefault();
    panX = event.clientX - startX;
    panY = event.clientY - startY;
    updateTransform();
  };

  const onMouseUp = () => {
    isDragging = false;
  };

  // --- Keyboard Shortcuts ---
  const onKeyDown = (event) => {
    switch (event.key) {
      case "+":
        zoomLevel = Math.min(3, zoomLevel * 1.1);
        updateTransform();
        break;
      case "-":
        zoomLevel = Math.max(1, zoomLevel / 1.1);
        updateTransform();
        break;
      case "r":
        angle = (angle + 90) % 360;
        updateTransform();
        break;
      case "h":
        flipVideo();
        break;
    }
  };

  // --- Attach Event Listeners ---
  video.addEventListener("wheel", onWheel, { passive: false });
  video.addEventListener("mousedown", onMouseDown);
  video.addEventListener("mousemove", onMouseMove);
  video.addEventListener("mouseup", onMouseUp);
  video.addEventListener("mouseleave", onMouseUp);
  video.addEventListener("touchstart", onTouchStart, { passive: false });
  video.addEventListener("touchmove", onTouchMove, { passive: false });
  video.addEventListener("touchend", onTouchEnd);
  document.addEventListener("keydown", onKeyDown);
};

export default VidBox;
