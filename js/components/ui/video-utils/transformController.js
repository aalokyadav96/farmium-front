let zoomLevel = 1, panX = 0, panY = 0, angle = 0, flip = false;
const minZoom = 1, maxZoom = 8;

const updateTransform = (video) => {
  video.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel}) rotate(${angle}deg) ${flip ? "scaleX(-1)" : ""}`;
};

const changeZoom = (delta, event, video) => {
  const rect = video.getBoundingClientRect();
  const cursorX = event ? event.clientX - rect.left : rect.width / 2;
  const cursorY = event ? event.clientY - rect.top : rect.height / 2;
  const prevZoom = zoomLevel;

  zoomLevel *= delta > 0 ? 0.95 : 1.05;
  zoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel));
  const zoomFactor = zoomLevel / prevZoom;

  panX -= (cursorX - rect.width / 2) * (zoomFactor - 1);
  panY -= (cursorY - rect.height / 2) * (zoomFactor - 1);
  constrainPan(video);
  updateTransform(video);
};

const constrainPan = (video) => {
  const rect = video.getBoundingClientRect();
  const maxPanX = (rect.width * (zoomLevel - 1)) / 2;
  const maxPanY = (rect.height * (zoomLevel - 1)) / 2;

  panX = Math.min(maxPanX, Math.max(-maxPanX, panX));
  panY = Math.min(maxPanY, Math.max(-maxPanY, panY));
};

const flipVideo = (video) => {
  flip = !flip;
  updateTransform(video);
};

const rotateVideo = (video, degrees = 90) => {
  angle = (angle + degrees) % 360;
  video.style.width = "100vh";
  updateTransform(video);
};

const resetRotation = (video) => {
  angle = 0;
  video.style.width = "";
  updateTransform(video);
};

export {
  changeZoom,
  updateTransform,
  flipVideo,
  rotateVideo,
  resetRotation,
  constrainPan,
};
