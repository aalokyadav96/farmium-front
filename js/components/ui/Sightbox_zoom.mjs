import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";

const Sightbox = (src, type = "image") => {
  if (document.getElementById("sightbox")) return;

  const overlay = createElement("div", {
    id: "sightbox-overlay",
    styles: {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.7)",
      zIndex: "9998"
    },
    events: { click: closeSightbox }
  });

  const zoomable = createZoomableMedia(src, type);

  const closeBtn = Button("×", "sightbox-close", { click: closeSightbox }, "", {
    position: "absolute",
    top: "10px",
    right: "10px",
    fontSize: "24px",
    border: "none",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    zIndex: "10001"
  });

  const content = createElement("div", {
    id: "sightbox-content",
    styles: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "#000",
      padding: "10px",
      borderRadius: "6px",
      maxWidth: "90%",
      maxHeight: "90%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "9999"
    },
    attributes: { tabindex: "-1" }
  }, [zoomable, closeBtn]);

  const sightbox = createElement("div", {
    id: "sightbox",
    styles: { zIndex: "9997" }
  }, [overlay, content]);

  document.getElementById("app").appendChild(sightbox);

  content.focus();

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

export const createZoomableMedia = (src, type = "image") => {
  const state = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    isPinching: false,
    startX: 0,
    startY: 0,
    velocityX: 0,
    velocityY: 0,
    lastMoveX: 0,
    lastMoveY: 0,
    momentum: false,
    pinchDistance: 0,
    zoomLevels: [1, 1.5, 2, 3],
    zoomIndex: 0,
  };

  const zoomLabel = createElement("div", {
    styles: {
      position: "absolute",
      bottom: "10px",
      left: "10px",
      padding: "4px 8px",
      background: "rgba(0,0,0,0.5)",
      color: "#fff",
      fontSize: "14px",
      borderRadius: "4px"
    }
  });

  const resetZoomBtn = Button("Reset Zoom", "reset-zoom-btn", {
    click: () => {
      state.scale = 1;
      state.offsetX = 0;
      state.offsetY = 0;
      applyTransform(true);
    }
  }, "", {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    fontSize: "14px",
    padding: "4px 8px",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer"
  });

  let mediaEl;
  if (type === "image") {
    mediaEl = createElement("img", {
      attributes: { src, alt: "Zoomable Image" },
      styles: {
        maxWidth: "100%",
        maxHeight: "100%",
        transition: "transform 0.3s ease-out",
        cursor: "grab"
      }
    });
  } else if (type === "video") {
    mediaEl = createElement("video", {
      attributes: { src, controls: true },
      styles: {
        maxWidth: "100%",
        maxHeight: "100%",
        transition: "transform 0.3s ease-out",
        background: "#000"
      }
    });
  }

  const container = createElement("div", {
    styles: {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, [mediaEl, zoomLabel, resetZoomBtn]);

  // === Core Logic ===
  let lastTap = 0;

  mediaEl.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      state.zoomIndex = (state.zoomIndex + 1) % state.zoomLevels.length;
      state.scale = state.zoomLevels[state.zoomIndex];
      applyTransform();
    }
    lastTap = now;
  });

  mediaEl.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      state.isPinching = true;
      state.pinchDistance = getPinchDistance(e.touches);
    } else if (state.scale > 1) {
      state.isDragging = true;
      state.startX = e.touches[0].clientX - state.offsetX;
      state.startY = e.touches[0].clientY - state.offsetY;
      state.velocityX = 0;
      state.velocityY = 0;
      state.lastMoveX = e.touches[0].clientX;
      state.lastMoveY = e.touches[0].clientY;
      state.momentum = false;
    }
  });

  mediaEl.addEventListener("touchmove", (e) => {
    if (state.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const newDist = getPinchDistance(e.touches);
      const scaleChange = newDist / state.pinchDistance;
      state.scale = Math.max(1, Math.min(3, state.scale * scaleChange));
      state.pinchDistance = newDist;
      applyTransform();
    } else if (state.isDragging && e.touches.length === 1) {
      e.preventDefault();
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      state.velocityX = x - state.lastMoveX;
      state.velocityY = y - state.lastMoveY;
      state.lastMoveX = x;
      state.lastMoveY = y;
      state.offsetX = x - state.startX;
      state.offsetY = y - state.startY;
      applyTransform();
    }
  });

  mediaEl.addEventListener("touchend", () => {
    if (state.isDragging) {
      state.isDragging = false;
      if (Math.abs(state.velocityX) > 5 || Math.abs(state.velocityY) > 5) {
        state.momentum = true;
        requestAnimationFrame(momentumScroll);
      }
    }
    state.isPinching = false;
    applyTransform(true);
  });

  function applyTransform(snap = false) {
    const limit = mediaEl.offsetWidth * (state.scale - 1) / 2;
    if (snap) {
      state.offsetX = Math.max(-limit, Math.min(limit, state.offsetX));
      state.offsetY = Math.max(-limit, Math.min(limit, state.offsetY));
    }

    mediaEl.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.scale})`;
    mediaEl.style.transition = snap ? "transform 0.3s ease-out" : "none";
    zoomLabel.textContent = `Zoom: ${state.scale.toFixed(1)}x`;
  }

  function momentumScroll() {
    if (!state.momentum) return;

    state.offsetX += state.velocityX * 0.9;
    state.offsetY += state.velocityY * 0.9;
    state.velocityX *= 0.9;
    state.velocityY *= 0.9;
    applyTransform();

    if (Math.abs(state.velocityX) > 0.5 || Math.abs(state.velocityY) > 0.5) {
      requestAnimationFrame(momentumScroll);
    } else {
      state.momentum = false;
    }
  }

  function getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  return container;
};
