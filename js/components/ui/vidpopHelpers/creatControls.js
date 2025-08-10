import Button from "../../base/Button.js";
import { setupVideoUtilityFunctions } from "../video-utils/index.js";
import { createSpeedDropdown } from "./speedDropdown.js";
import { toggleFullScreen, setupFullscreenControls } from "./fullscreen.js";
import { togglePictureInPicture } from "./vutils.js";
import { createElement } from "../../createElement.js";
import { createProgressBar } from "./progressBar.js";
import { createQualitySelector } from "./qualitySelector.js";

// Utility to format time as MM:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function createControls(video, mediaSrc, qualities, videoid, videoPlayer) {
  const controls = createElement("div", { class: "controlcon" }, []);
  const { bar: progressBar, progress } = createProgressBar();
  const buttons = createElement("div", { class: "buttons" }, []);

  // Quality dropdown
  const qualitySelector = qualities.length ? createQualitySelector(video, qualities) : null;

  // Playback speed control
  const speedDropdown = createSpeedDropdown(video);

  // Mute toggle with icon update
  const muteButton = Button(video.muted ? "🔇" : "🔊", "mute", {
    click: () => {
      video.muted = !video.muted;
      muteButton.textContent = video.muted ? "🔇" : "🔊";
      muteButton.setAttribute("title", video.muted ? "Muted" : "Unmuted");
    }
  });

  // Drag utility for overlays
  const dragBox = Button("P", "drag", {
    click: () => setupVideoUtilityFunctions(video, videoid)
  });

  // Fullscreen
  const fullscreenButton = Button("⛶", "fullscreen", {
    click: () => toggleFullScreen(videoPlayer)
  });

  // Picture-in-Picture
  const pipButton = Button("PiP", "pip", {
    click: () => togglePictureInPicture(video)
  });

  // Time display (current / duration)
  const timeDisplay = createElement("div", { class: "time-display" }, [
    createElement("span", { id: "current-time" }, []),
    createElement("span", {}, [" / "]),
    createElement("span", { id: "duration" }, []),
  ]);

  video.addEventListener("loadedmetadata", () => {
    timeDisplay.querySelector("#duration").textContent = formatTime(video.duration);
  });

  video.addEventListener("timeupdate", () => {
    timeDisplay.querySelector("#current-time").textContent = formatTime(video.currentTime);
  });

  // Buffering indicator
  const loader = createElement("div", { class: "buffering-indicator" }, ["Loading..."]);
  loader.style.display = "none";
  videoPlayer.appendChild(loader);

  video.addEventListener("waiting", () => loader.style.display = "block");
  video.addEventListener("playing", () => loader.style.display = "none");

  // Append quality selector first
  if (qualitySelector) buttons.appendChild(qualitySelector);

  // Append remaining buttons
  [
    speedDropdown,
    muteButton,
    dragBox,
    fullscreenButton,
    pipButton,
  ].forEach(btn => btn && buttons.appendChild(btn));

  // Order: progress, time, buttons
  [progressBar, timeDisplay, buttons].forEach(el => controls.appendChild(el));

  // Enable fullscreen control keyboard interactions
  setupFullscreenControls(videoPlayer, controls);

  return controls;
}
