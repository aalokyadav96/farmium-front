import "../../../css/ui/VideoPlayer.css";
import Vidpop from "./Vidpop.mjs";
import { Button } from "../base/Button";

// ---- Video Helpers ----
const createVideoElement = (src, resolutions, poster) => {
  const video = document.createElement("video");
  video.className = "video-player";
  video.crossOrigin = "anonymous";
  video.preload = "metadata";

  const baseSrc = src.replace(/\.mp4$/, "");
  const defaultSrc = resolutions ? determineInitialSource(baseSrc, resolutions) : src;
  video.src = defaultSrc;
  video.poster = poster || `${baseSrc}.jpg`;

  return video;
};

const applyVideoAttributes = (video, attrs = {}) => {
  Object.entries(attrs).forEach(([key, value]) => {
    if (key in video) video[key] = value;
  });
};

const togglePlayOnClick = (video) => {
  video.addEventListener("click", () => {
    video.paused ? video.play() : video.pause();
  });
};

const determineInitialSource = (baseSrc, availableResolutions) => {
  const stored = localStorage.getItem("videoQuality");
  const qualityNum = stored ? Number(stored) : null;
  const lowestAvailable = Math.min(...availableResolutions);
  const fallback = `${baseSrc}-${lowestAvailable}.mp4`;

  return qualityNum && availableResolutions.includes(qualityNum)
    ? `${baseSrc}-${qualityNum}.mp4`
    : fallback;
};

// ---- Quality Selector ----
export const createQualitySelector = (video, baseSrc, availableResolutions) => {
  const selector = document.createElement("select");
  selector.className = "quality-selector buttonx";

  const allQualities = [1440, 1080, 720, 480, 360, 240, 144];
  const available = allQualities.filter(q => availableResolutions.includes(q));

  const stored = localStorage.getItem("videoQuality") || `${Math.min(...availableResolutions)}`;

  available.forEach((quality) => {
    const option = document.createElement("option");
    option.value = `${baseSrc}-${quality}.mp4`;
    option.textContent = `${quality}p`;
    option.selected = parseInt(stored) === quality;
    selector.appendChild(option);
  });

  selector.addEventListener("change", (event) => {
    const selectedSrc = event.target.value;
    const selectedQuality = selectedSrc.split("-").pop().replace(".mp4", "");
    localStorage.setItem("videoQuality", selectedQuality);
    video.src = selectedSrc;
    video.play();
  });

  return { selector, qualities: available };
};

// ---- Main VideoPlayer Component ----
const VideoPlayer = (
  { src, poster, controls = true, autoplay = false, muted = true, theme = "light", loop = false },
  videoId,
  availableResolutions
) => {
  const container = document.createElement("div");
  container.className = `video-container theme-${theme}`;
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", "Video Player Container");

  const controlsContainer = document.createElement("div");
  controlsContainer.className = "hflex-sb vcon";

  const videocon = document.createElement("div");
  videocon.className = "videocon";

  const baseSrc = src.replace(/\.mp4$/, "");
  const video = createVideoElement(src, availableResolutions, poster);
  applyVideoAttributes(video, { controls, autoplay, muted, loop });
  togglePlayOnClick(video);

  let availableQualities = [];
  if (availableResolutions?.length) {
    const { selector, qualities } = createQualitySelector(video, baseSrc, availableResolutions);
    if (selector) controlsContainer.appendChild(selector);
    availableQualities = qualities;
  }

  const theaterButton = Button(
    "Wide Screen",
    "theater",
    {
      click: () =>
        Vidpop(src, "video", videoId, {
          poster,
          theme,
          qualities: availableQualities.map(q => ({ label: `${q}p`, src: `${baseSrc}-${q}.mp4` })),
        }),
    },
    "buttonx"
  );

  video.setAttribute("aria-label", "Video Player");
  theaterButton.setAttribute("title", "Activate Theater Mode");

  controlsContainer.appendChild(theaterButton);
  videocon.appendChild(video);
  videocon.appendChild(controlsContainer);
  container.appendChild(videocon);

  return container;
};

export default VideoPlayer;


// import "../../../css/ui/VideoPlayer.css";
// import Vidpop from "./Vidpop.mjs";
// import { Button } from "../base/Button";

// const VideoPlayer = (
//   { src, poster, controls = true, autoplay = false, muted = true, theme = "light", loop = false },
//   videoId,
//   availableResolutions
// ) => {

//   // ---- Helpers ----
//   const createVideoElement = (src, resolutions, poster) => {
//     const video = document.createElement("video");
//     video.setAttribute("class", "video-player");
//     video.crossOrigin = "anonymous";
//     video.preload = "metadata";

//     const baseSrc = src.replace(/\.mp4$/, "");
//     const defaultSrc = resolutions
//       ? determineInitialSource(baseSrc, resolutions)
//       : src;

//     video.src = defaultSrc;
//     video.poster = poster || `${baseSrc}.jpg`;

//     return video;
//   };

//   const applyVideoAttributes = (video, attrs = {}) => {
//     Object.entries(attrs).forEach(([key, value]) => {
//       if (key in video) video[key] = value;
//     });
//   };

//   const togglePlayOnClick = (video) => {
//     video.addEventListener("click", () => {
//       video.paused ? video.play() : video.pause();
//     });
//   };

//   const determineInitialSource = (baseSrc, availableResolutions) => {
//     const stored = localStorage.getItem("videoQuality");
//     const qualityNum = stored ? Number(stored) : null;
//     const lowestAvailable = Math.min(...availableResolutions);
//     const fallback = `${baseSrc}-${lowestAvailable}.mp4`;

//     if (qualityNum && availableResolutions.includes(qualityNum)) {
//       return `${baseSrc}-${qualityNum}.mp4`;
//     }
//     return fallback;
//   };

//   // ---- Layout ----
//   const container = document.createElement("div");
//   container.setAttribute("class", `video-container theme-${theme}`);
//   container.setAttribute("role", "region");
//   container.setAttribute("aria-label", "Video Player Container");

//   const controlsContainer = document.createElement("div");
//   controlsContainer.setAttribute("class", "hflex-sb vcon");

//   const videocon = document.createElement("div");
//   videocon.setAttribute("class", "videocon");

//   const baseSrc = src.replace(/\.mp4$/, "");
//   const video = createVideoElement(src, availableResolutions, poster);
//   applyVideoAttributes(video, { controls, autoplay, muted, loop });
//   togglePlayOnClick(video);

//   let availableQualities = [];

//   if (availableResolutions && availableResolutions.length > 0) {
//     const { selector, qualities } = createQualitySelector(video, baseSrc, availableResolutions);
//     if (selector) controlsContainer.appendChild(selector);
//     availableQualities = qualities;
//   } else {
//     availableQualities = [];
//   }

//   const theaterButton = Button(
//     "Wide Screen",
//     "theater",
//     {
//       click: () =>
//         Vidpop(src, "video", videoId, {
//           poster,
//           theme,
//           qualities: availableQualities.map((q) => ({
//             label: `${q}p`,
//             src: `${baseSrc}-${q}.mp4`,
//           })),
//         }),
//     },
//     "buttonx"
//   );

//   video.setAttribute("aria-label", "Video Player");
//   theaterButton.setAttribute("title", "Activate Theater Mode");

//   controlsContainer.appendChild(theaterButton);
//   videocon.appendChild(video);
//   container.appendChild(videocon);
//   container.appendChild(controlsContainer);

//   return container;
// };

// export const createQualitySelector = (video, baseSrc, availableResolutions) => {
//   const selector = document.createElement("select");
//   selector.setAttribute("class", "quality-selector buttonx");

//   const allQualities = [1440, 1080, 720, 480, 360, 240, 144];
//   const available = allQualities.filter(q => availableResolutions.includes(q));

//   const stored = localStorage.getItem("videoQuality") || `${Math.min(...availableResolutions)}`;

//   available.forEach((quality) => {
//     const label = `${quality}p`;
//     const value = `${baseSrc}-${quality}.mp4`;

//     const option = document.createElement("option");
//     option.value = value;
//     option.textContent = label;

//     const match = parseInt(stored) === quality;
//     option.selected = match;
//     selector.appendChild(option);
//   });

//   selector.addEventListener("change", (event) => {
//     const selectedSrc = event.target.value;
//     const selectedQuality = selectedSrc.split("-").pop().replace(".mp4", "");

//     localStorage.setItem("videoQuality", selectedQuality);
//     video.src = selectedSrc;
//     video.play();
//   });

//   return {
//     selector,
//     qualities: available
//   };
// };

// export default VideoPlayer;