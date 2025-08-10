export const createVideoElement = (src, resolutions, poster) => {
  const video = document.createElement("video");
  video.className = "video-player";
  video.crossOrigin = "anonymous";
  video.preload = "metadata";

  const baseSrc = src.replace(/-\d{3,4}p\.mp4$/, "").replace(/\.mp4$/, "");
  const defaultSrc = resolutions
    ? determineInitialSource(baseSrc, resolutions)
    : src;

  video.src = defaultSrc;
  video.poster = poster || `${baseSrc}.jpg`;

  return video;
};

  
export const applyVideoAttributes = (video, attrs = {}) => {
  Object.entries(attrs).forEach(([key, value]) => {
    if (key in video) video[key] = value;
  });
};

export const togglePlayOnClick = (video) => {
  video.addEventListener("click", () => {
    video.paused ? video.play() : video.pause();
  });
};

  
const determineInitialSource = (baseSrc, availableResolutions) => {
  const stored = localStorage.getItem("videoQuality");
  const lowestAvailable = Math.min(...availableResolutions);
  const fallback = `${baseSrc}-${lowestAvailable}p.mp4`;

  if (!stored) return fallback;

  const cleaned = stored.replace("p", "");
  const selected = cleaned === "original"
    ? `${baseSrc}.mp4`
    : `${baseSrc}-${cleaned}p.mp4`;

  return selected;
};

  