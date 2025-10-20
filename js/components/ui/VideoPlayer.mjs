import "../../../css/ui/VideoPlayer.css";
import Vidpop from "./Vidpop.mjs";
import { createIconButton } from "../../utils/svgIconButton";
import { maximizeSVG, muteSVG, vol2SVG, playSVG, pauseSVG } from "../svgs.js";
import { setupSubtitles } from "./vidpopHelpers/subtitles.js";
import { createElement } from "../../components/createElement";

// ---- Video Helpers ----
const determineInitialSource = (baseSrc, availableResolutions = []) => {
  if (!baseSrc || availableResolutions.length === 0) {
    console.warn("Invalid baseSrc or empty availableResolutions");
    return `${baseSrc || "video"}-360.mp4`;
  }

  const stored = localStorage.getItem("videoQuality");
  const qualityNum = stored ? Number(stored) : null;
  const validQualities = availableResolutions.filter(
    r => typeof r === "number" && !isNaN(r)
  );

  if (validQualities.length === 0) {
    return `${baseSrc}-360.mp4`;
  }

  const lowestAvailable = Math.min(...validQualities);
  const fallback = `${baseSrc}-${lowestAvailable}.mp4`;

  console.log("qualityNum:", qualityNum);

  if (qualityNum && validQualities.includes(qualityNum)) {
    return `${baseSrc}-${qualityNum}.mp4`;
  }

  return fallback;
};

// ---- Create Video Element ----
const createVideoElement = (src, resolutions, poster) => {
  const video = document.createElement("video");
  video.setAttribute("class", "video-player");
  video.preload = "metadata";
  video.setAttribute("playsinline", "");

  const baseSrc = src.replace(/\.(mp4|webm)$/, "");
  const defaultSrc = resolutions?.length
    ? determineInitialSource(baseSrc, resolutions)
    : src;

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
  const handler = () => (video.paused ? video.play() : video.pause());
  video.addEventListener("click", handler);
  return () => video.removeEventListener("click", handler);
};

// ---- Quality Selector ----
export const createQualitySelector = (video, baseSrc, availableResolutions) => {
  const selector = createElement("select", { class: "quality-selector buttonx" });

  const allQualities = [1440, 1080, 720, 480, 360, 240, 144];
  const available = allQualities.filter(q => availableResolutions.includes(q));
  const stored = localStorage.getItem("videoQuality") || `${Math.min(...available)}`;

  const fragment = document.createDocumentFragment();
  available.forEach((quality) => {
    const option = createElement("option", { value: `${baseSrc}-${quality}.mp4` }, [`${quality}p`]);
    if (parseInt(stored) === quality) option.setAttribute("selected", "true");
    fragment.appendChild(option);
  });
  selector.appendChild(fragment);

  const switchQuality = (target) => {
    const selectedSrc = target.value;
    const selectedQuality = selectedSrc.split("-").pop().replace(".mp4", "");
    const currentTime = video.currentTime;
    const wasPaused = video.paused;

    localStorage.setItem("videoQuality", selectedQuality);
    video.src = selectedSrc;

    const loadedHandler = () => {
      video.currentTime = currentTime;
      if (!wasPaused) video.play();
    };
    video.addEventListener("loadedmetadata", loadedHandler, { once: true });
  };

  const changeHandler = (e) => switchQuality(e.target);
  selector.addEventListener("change", changeHandler);

  return {
    selector,
    qualities: available,
    cleanup: () => selector.removeEventListener("change", changeHandler)
  };
};

// ---- Main VideoPlayer Component ----
const VideoPlayer = (
  { src, poster, controls = false, autoplay = false, muted = true, theme = "light", loop = false, subtitles = [], availableResolutions = [] },
  videoId,
) => {
  const container = createElement("div", {
    class: `video-container theme-${theme}`,
    role: "region",
    "aria-label": "Video Player Container"
  });

  const controlsContainer = createElement("div", { class: "hflex-sb vcon" });
  const controlsl = createElement("div", { class: "hflex" });
  const controlsr = createElement("div", { class: "hflex" });
  controlsContainer.append(controlsl, controlsr);

  const videocon = createElement("div", { class: "videocon" });

  const baseSrc = src.replace(/\.(mp4|webm)$/, "");
  const video = createVideoElement(src, availableResolutions, poster);

  applyVideoAttributes(video, { controls, muted, loop });

  let observer;
  if (autoplay) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
  }

  // --- Play/Pause Button ---
  const playButton = createIconButton({
    classSuffix: "playpause bonw",
    svgMarkup: video.paused ? playSVG : pauseSVG,
    onClick: () => {
      if (video.paused) {
        video.play();
        playButton.innerHTML = pauseSVG;
      } else {
        video.pause();
        playButton.innerHTML = playSVG;
      }
    },
    label: "",
    ariaLabel: "Play/Pause"
  });
  controlsl.appendChild(playButton);

  const removeTogglePlay = togglePlayOnClick(video);

  let availableQualities = [];
  let qualityCleanup = null;
  if (availableResolutions?.length) {
    const { selector, qualities, cleanup } = createQualitySelector(video, baseSrc, availableResolutions);
    controlsl.appendChild(selector);
    availableQualities = qualities;
    qualityCleanup = cleanup;
  }

  // --- Mute Button ---
  const muteButton = createIconButton({
    classSuffix: "bonw",
    svgMarkup: video.muted ? muteSVG : vol2SVG,
    onClick: () => {
      video.muted = !video.muted;
      muteButton.innerHTML = video.muted ? muteSVG : vol2SVG;
      muteButton.setAttribute("aria-label", video.muted ? "Muted" : "Unmuted");
    },
    label: ""
  });
  controlsl.appendChild(muteButton);

  // --- Subtitles ---
  if (subtitles.length !== 0) {
    const subtitleContainer = document.createElement("div");
    subtitleContainer.className = "subtitle-container";
    videocon.appendChild(subtitleContainer);
    setupSubtitles(video, subtitles, subtitleContainer);
  }

  // --- Theater Button ---
  const theaterButton = createIconButton({
    classSuffix: "bonw",
    svgMarkup: maximizeSVG,
    onClick: () => {
      video.pause(); // fixed bug: missing parentheses
      Vidpop(video.currentSrc, videoId, {
        poster,
        theme,
        qualities: availableQualities.map(q => ({
          label: `${q}p`,
          src: `${baseSrc}-${q}.mp4`
        }))
      });
    },
    label: "",
    ariaLabel: "Activate Theater Mode"
  });
  theaterButton.setAttribute("title", "Activate Theater Mode");
  controlsr.appendChild(theaterButton);

  // ---- Build DOM ----
  const fragment = document.createDocumentFragment();
  fragment.appendChild(video);
  fragment.appendChild(controlsContainer);
  videocon.appendChild(fragment);
  container.appendChild(videocon);

  // ---- Cleanup ----
  container.cleanup = () => {
    removeTogglePlay();
    if (qualityCleanup) qualityCleanup();
    if (observer) observer.disconnect();
  };

  return container;
};

export default VideoPlayer;
