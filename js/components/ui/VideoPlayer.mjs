import "../../../css/ui/VideoPlayer.css";
import Vidpop from "./Vidpop.mjs";
import { createIconButton } from "../../utils/svgIconButton";
import { maximizeSVG } from "../svgs.js";
// ---- Video Helpers ----
const createVideoElement = (src, resolutions, poster) => {
  const video = document.createElement("video");
  video.setAttribute("class", "video-player");
  video.crossOrigin = "anonymous";
  video.preload = "metadata";
  video.setAttribute("playsinline", ""); // ✅ always plays inline

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
  selector.setAttribute("class", "quality-selector buttonx");

  const allQualities = [1440, 1080, 720, 480, 360, 240, 144];
  const available = allQualities.filter(q => availableResolutions.includes(q));

  const stored = localStorage.getItem("videoQuality") || `${Math.min(...availableResolutions)}`;

  available.forEach((quality) => {
    const option = document.createElement("option");
    option.setAttribute("value", `${baseSrc}-${quality}.mp4`);
    option.appendChild(document.createTextNode(`${quality}p`));
    if (parseInt(stored) === quality) {
      option.setAttribute("selected", "true");
    }
    selector.appendChild(option);
  });

  const switchQuality = (target) => {
    const selectedSrc = target.value;
    const selectedQuality = selectedSrc.split("-").pop().replace(".mp4", "");
    const currentTime = video.currentTime;
    const wasPaused = video.paused;

    localStorage.setItem("videoQuality", selectedQuality);
    video.src = selectedSrc;

    video.addEventListener(
      "loadedmetadata",
      () => {
        video.currentTime = currentTime;
        if (!wasPaused) video.play();
      },
      { once: true }
    );
  };

  selector.addEventListener("change", (e) => switchQuality(e.target));
  selector.addEventListener("click", (e) => {
    if (e.target.tagName === "OPTION") switchQuality(selector);
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
  container.setAttribute("class", `video-container theme-${theme}`);
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", "Video Player Container");

  const controlsContainer = document.createElement("div");
  controlsContainer.setAttribute("class", "hflex-sb vcon");

  const videocon = document.createElement("div");
  videocon.setAttribute("class", "videocon");

  const baseSrc = src.replace(/\.mp4$/, "");
  const video = createVideoElement(src, availableResolutions, poster);

  applyVideoAttributes(video, { controls, muted, loop });
  if (autoplay) {
    // ✅ Use IntersectionObserver to control autoplay
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {}); // suppress autoplay errors
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 } // at least 50% visible
    );
    observer.observe(video);
  }

  togglePlayOnClick(video);

  let availableQualities = [];
  if (availableResolutions?.length) {
    const { selector, qualities } = createQualitySelector(video, baseSrc, availableResolutions);
    if (selector) controlsContainer.appendChild(selector);
    availableQualities = qualities;
  }

  const theaterButton = createIconButton({
    classSuffix: "bonw",
    svgMarkup: maximizeSVG,
    onClick: () => {
      Vidpop(video.currentSrc, "video", videoId, {
        poster,
        theme,
        qualities: availableQualities.map(q => ({
          label: `${q}p`,
          src: `${baseSrc}-${q}.mp4`
        })),
      });
    },
    label: ""
  });

  video.setAttribute("aria-label", "Video Player");
  theaterButton.setAttribute("title", "Activate Theater Mode");

  controlsContainer.appendChild(theaterButton);
  videocon.appendChild(video);
  videocon.appendChild(controlsContainer);
  container.appendChild(videocon);

  return container;
};

export default VideoPlayer;
