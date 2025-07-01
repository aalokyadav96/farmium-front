import { constrainPan, updateTransform } from "./transformController.js";
import { debounce } from "./utils.js";

let isDragging = false, startX = 0, startY = 0;

export function setupGestures(video, changeZoom) {
  const onWheel = (e) => {
    e.preventDefault();
    changeZoom(e.deltaY, e, video);
  };

  const onMouseDown = (e) => {
    if (video.style.transform.includes("scale(1)")) return;
    e.preventDefault();
    isDragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    constrainPan(video);
    updateTransform(video);
  };

  const onMouseUp = () => isDragging = false;

  video.addEventListener("wheel", onWheel, { passive: false });
  video.addEventListener("mousedown", onMouseDown);
  video.addEventListener("mousemove", onMouseMove);
  video.addEventListener("mouseup", onMouseUp);
  video.addEventListener("mouseleave", onMouseUp);

  setupTouch(video);
}

function setupTouch(video) {
  video.addEventListener("touchstart", onTouchStart, { passive: false });
  video.addEventListener("touchmove", onTouchMove, { passive: false });
  video.addEventListener("touchend", () => isDragging = false);

  function onTouchStart(event) {
    if (event.touches.length === 1) {
      isDragging = true;
      startX = event.touches[0].clientX - panX;
      startY = event.touches[0].clientY - panY;
    }
  }

  function onTouchMove(event) {
    if (!isDragging || event.touches.length !== 1) return;
    panX = event.touches[0].clientX - startX;
    panY = event.touches[0].clientY - startY;
    constrainPan(video);
    updateTransform(video);
  }
}
