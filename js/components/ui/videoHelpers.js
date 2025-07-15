export const createVideoElement = (src, resolutions, poster) => {
    const video = document.createElement("video");
    video.className = "video-player";
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
  
    const baseSrc = src.replace(/-\d{3,4}p.mp4/, "");
    const defaultSrc = resolutions
      ? determineInitialSource(baseSrc, resolutions)
      : src;
  
    video.src = defaultSrc;
    // const poster = src.replace(/-\d{3,4}p.mp4/, ".jpg");
    video.poster = poster;
  
    return video;
  };
  
  export const applyVideoAttributes = (video, attrs = {}) => {
    Object.entries(attrs).forEach(([key, value]) => {
      video[key] = value;
    });
  };
  
  export const togglePlayOnClick = (video) => {
    video.addEventListener("click", function () {
      this.paused ? this.play() : this.pause();
    });
  };
  
  const determineInitialSource = (baseSrc, availableResolutions) => {
    const stored = localStorage.getItem("videoQuality");
    const fallback = `${baseSrc}-${Math.min(...availableResolutions, 480)}p.mp4`;
    if (!stored) return fallback;
 
    const cleaned = stored.replace("p", "");
    console.log("cleaned",cleaned);
    const selected = cleaned === "original" ? `${baseSrc}.mp4` : `${baseSrc}-${cleaned}p.mp4`;
    console.log("selected",selected);
    return selected;
  };
  