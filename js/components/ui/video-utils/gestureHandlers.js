import { constrainPan, updateTransform } from "./transformController.js";
// import { debounce } from "./utils.js";

let isDragging = false, startX = 0, startY = 0;

export function setupGestures(video, changeZoom) {
  const onWheel = (e) => {
    e.preventDefault();
    changeZoom(e.deltaY, e, video);
  };

  const onMouseDown = (e) => {
    if (zoomLevel === 1) return; // nothing to drag at scale 1
    e.preventDefault();
    isDragging = true;
    startX = e.clientX - panX;  // use global panX
    startY = e.clientY - panY;  // use global panY
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    panX = e.clientX - startX;  // update global panX
    panY = e.clientY - startY;  // update global panY
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
  video.addEventListener("touchstart", (event) => {
    if (event.touches.length === 1) {
      isDragging = true;
      startX = event.touches[0].clientX - panX; // use global
      startY = event.touches[0].clientY - panY;
    }
  }, { passive: false });

  video.addEventListener("touchmove", (event) => {
    if (!isDragging || event.touches.length !== 1) return;
    panX = event.touches[0].clientX - startX;
    panY = event.touches[0].clientY - startY;
    constrainPan(video);
    updateTransform(video);
  }, { passive: false });

  video.addEventListener("touchend", () => isDragging = false);
}

