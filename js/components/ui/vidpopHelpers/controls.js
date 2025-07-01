import Button from "../../base/Button.js";
import { setupVideoUtilityFunctions } from "../video-utils/index.js";
import { createFilterSelector } from "./filters.js";
import { togglePictureInPicture } from "./vutils.js";

import { createProgressBar } from "./progressBar.js";
import { createQualitySelector } from "./qualitySelector.js";
import { createSpeedDropdown } from "./speedDropdown.js";
import { toggleFullScreen, setupFullscreenControls } from "./fullscreen.js";
// import { createElement, appendElements } from "./helpers.js";
import { createElement } from "../../createElement.js";


export function appendElements(parent, children) {
  children.forEach(child => child && parent.appendChild(child));
}

export function createControls(video, mediaSrc, qualities, videoid, videoPlayer) {
  const controls = createElement("div", { class: "controlcon" }, []);
  const { bar: progressBar, progress } = createProgressBar();
  const buttons = createElement("div", { class: "buttons" }, []);

  const qualitySelector = qualities.length ? createQualitySelector(video, qualities) : null;
  const speedDropdown = createSpeedDropdown(video);
  // const filterSelector = createFilterSelector(video);

  const muteButton = Button("🔇", "mute", { click: () => video.muted = !video.muted });
  const fullscreenButton = Button("⛶", "fullscreen", { click: () => toggleFullScreen(videoPlayer) });
  const pipButton = Button("PiP", "pip", { click: () => togglePictureInPicture(video) });
  const dragBox = Button("P", "drag", { click: () => setupVideoUtilityFunctions(video, videoid) });

  // appendElements(buttons, [filterSelector, speedDropdown, dragBox, muteButton, pipButton, fullscreenButton]);
  appendElements(buttons, [speedDropdown, muteButton, dragBox, fullscreenButton]);
  if (qualitySelector) buttons.prepend(qualitySelector);

  appendElements(controls, [progressBar, buttons]);
  setupFullscreenControls(videoPlayer, controls);

  return controls;
}
