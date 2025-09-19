

import { setupVideoUtilityFunctions } from "../video-utils/index.js";
import { createFilterSelector } from "./filters.js";
import { togglePictureInPicture } from "./vutils.js";

import { createProgressBar } from "./progressBar.js";
import { createQualitySelector } from "./qualitySelector.js";
import { createSpeedDropdown } from "./speedDropdown.js";
import { toggleFullScreen, setupFullscreenControls } from "./fullscreen.js";
import { createElement } from "../../createElement.js";
import { createIconButton } from "../../../utils/svgIconButton.js";
import { 
  dragBoxSVG, maximizeSVG, muteSVG, pipSVG, vol2SVG, settingsSVG 
} from "../../../components/svgs.js";

export function appendElements(parent, children) {
  children.forEach(child => child && parent.appendChild(child));
}
export function createControls(video, mediaSrc, qualities, videoid, videoPlayer) {
  const controls = createElement("div", { class: "controlcon" }, []);
  const { bar: progressBar } = createProgressBar();
  const buttons = createElement("div", { class: "buttons" }, []);

  // ✅ Updated: always allow selecting same resolution
  const qualitySelector = qualities.length 
    ? createQualitySelector(video, qualities, { allowSame: true }) 
    : null;

  const speedDropdown = createSpeedDropdown(video);
  const filterSelector = createFilterSelector(video);

  // --- Mute button ---
  const muteButton = createIconButton({
    classSuffix: "mute bonw",
    svgMarkup: video.muted ? muteSVG : vol2SVG,
    onClick: () => {
      video.muted = !video.muted;
      muteButton.innerHTML = video.muted ? muteSVG : vol2SVG;
      muteButton.setAttribute("title", video.muted ? "Muted" : "Unmuted");
    },
    label: ""
  });

  // --- Fullscreen button ---
  const fullscreenButton = createIconButton({
    classSuffix: "fullscreen bonw",
    svgMarkup: maximizeSVG,
    onClick: () => toggleFullScreen(videoPlayer),
    label: ""
  });

  // --- Dropup menu ---
  const dropupMenu = createElement("div", { class: "dropup-menu hidden" }, []);
  appendElements(dropupMenu, [
    speedDropdown,
    filterSelector,
    createIconButton({
      classSuffix: "drag bonw",
      svgMarkup: dragBoxSVG,
      onClick: () => setupVideoUtilityFunctions(video, videoid),
      label: ""
    }),
    createIconButton({
      classSuffix: "pip bonw",
      svgMarkup: pipSVG,
      onClick: () => togglePictureInPicture(video),
      label: ""
    })
  ]);

  const settingsButton = createIconButton({
    classSuffix: "settings bonw",
    svgMarkup: settingsSVG,
    onClick: () => {
      dropupMenu.classList.toggle("hidden");
    },
    label: ""
  });

  // --- Add to DOM ---
  appendElements(buttons, [
    qualitySelector,
    muteButton,
    settingsButton,
    fullscreenButton
  ]);

  buttons.appendChild(dropupMenu);
  appendElements(controls, [progressBar, buttons]);
  setupFullscreenControls(videoPlayer, controls);

  return controls;
}



// import { setupVideoUtilityFunctions } from "../video-utils/index.js";
// import { createFilterSelector } from "./filters.js";
// import { togglePictureInPicture } from "./vutils.js";

// import { createProgressBar } from "./progressBar.js";
// import { createQualitySelector } from "./qualitySelector.js";
// import { createSpeedDropdown } from "./speedDropdown.js";
// import { toggleFullScreen, setupFullscreenControls } from "./fullscreen.js";
// import { createElement } from "../../createElement.js";
// import { createIconButton } from "../../../utils/svgIconButton.js";
// import { 
//   dragBoxSVG, maximizeSVG, muteSVG, pipSVG, vol2SVG, settingsSVG 
// } from "../../../components/svgs.js";

// export function appendElements(parent, children) {
//   children.forEach(child => child && parent.appendChild(child));
// }

// export function createControls(video, mediaSrc, qualities, videoid, videoPlayer) {
//   const controls = createElement("div", { class: "controlcon" }, []);
//   const { bar: progressBar } = createProgressBar();
//   const buttons = createElement("div", { class: "buttons" }, []);

//   const qualitySelector = qualities.length ? createQualitySelector(video, qualities) : null;
//   const speedDropdown = createSpeedDropdown(video);
//   const filterSelector = createFilterSelector(video);

//   // --- Mute button (toggles SVG) ---
//   const muteButton = createIconButton({
//     classSuffix: "mute bonw",
//     svgMarkup: video.muted ? muteSVG : vol2SVG,
//     onClick: () => {
//       video.muted = !video.muted;
//       muteButton.innerHTML = video.muted ? muteSVG : vol2SVG;
//       muteButton.setAttribute("title", video.muted ? "Muted" : "Unmuted");
//     },
//     label: "" // icon-only
//   });

//   // --- Fullscreen button ---
//   const fullscreenButton = createIconButton({
//     classSuffix: "fullscreen bonw",
//     svgMarkup: maximizeSVG,
//     onClick: () => toggleFullScreen(videoPlayer),
//     label: ""
//   });

//   // --- Dropup menu ---
//   const dropupMenu = createElement("div", { class: "dropup-menu hidden" }, []);
//   appendElements(dropupMenu, [
//     speedDropdown,
//     filterSelector,
//     createIconButton({
//       classSuffix: "drag bonw",
//       svgMarkup: dragBoxSVG,
//       onClick: () => setupVideoUtilityFunctions(video, videoid),
//       label: ""
//     }),
//     createIconButton({
//       classSuffix: "pip bonw",
//       svgMarkup: pipSVG,
//       onClick: () => togglePictureInPicture(video),
//       label: ""
//     })
//   ]);

//   const settingsButton = createIconButton({
//     classSuffix: "settings bonw",
//     svgMarkup: settingsSVG,
//     onClick: () => {
//       dropupMenu.classList.toggle("hidden");
//     },
//     label: ""
//   });

//   // --- Add to DOM ---
//   appendElements(buttons, [
//     qualitySelector,
//     muteButton,
//     settingsButton,
//     fullscreenButton
//   ]);

//   buttons.appendChild(dropupMenu);
//   appendElements(controls, [progressBar, buttons]);
//   setupFullscreenControls(videoPlayer, controls);

//   return controls;
// }

// // import { setupVideoUtilityFunctions } from "../video-utils/index.js";
// // import { createFilterSelector } from "./filters.js";
// // import { togglePictureInPicture } from "./vutils.js";

// // import { createProgressBar } from "./progressBar.js";
// // import { createQualitySelector } from "./qualitySelector.js";
// // import { createSpeedDropdown } from "./speedDropdown.js";
// // import { toggleFullScreen, setupFullscreenControls } from "./fullscreen.js";
// // import { createElement } from "../../createElement.js";
// // import { createIconButton } from "../../../utils/svgIconButton.js";
// // import { 
// //   dragBoxSVG, maximizeSVG, muteSVG, pipSVG, vol2SVG, settingsSVG 
// // } from "../../../components/svgs.js";

// // export function appendElements(parent, children) {
// //   children.forEach(child => child && parent.appendChild(child));
// // }

// // export function createControls(video, mediaSrc, qualities, videoid, videoPlayer) {
// //   const controls = createElement("div", { class: "controlcon" }, []);
// //   const { bar: progressBar } = createProgressBar();
// //   const buttons = createElement("div", { class: "buttons" }, []);

// //   const qualitySelector = qualities.length ? createQualitySelector(video, qualities) : null;
// //   const speedDropdown = createSpeedDropdown(video);
// //   const filterSelector = createFilterSelector(video);

// //   // --- Mute button (toggles SVG) ---
// //   const muteButton = createIconButton(
// //     "mute bonw",
// //     video.muted ? muteSVG : vol2SVG,
// //     () => {
// //       video.muted = !video.muted;
// //       muteButton.innerHTML = video.muted ? muteSVG : vol2SVG;
// //       muteButton.setAttribute("title", video.muted ? "Muted" : "Unmuted");
// //     }
// //   );

// //   // --- Fullscreen button ---
// //   const fullscreenButton = createIconButton(
// //     "fullscreen bonw",
// //     maximizeSVG,
// //     () => toggleFullScreen(videoPlayer)
// //   );

// //   // --- Dropup menu ---
// //   const dropupMenu = createElement("div", { class: "dropup-menu hidden" }, []);
// //   appendElements(dropupMenu, [
// //     speedDropdown,
// //     filterSelector,
// //     createIconButton("drag bonw", dragBoxSVG, () => setupVideoUtilityFunctions(video, videoid)),
// //     createIconButton("pip bonw", pipSVG, () => togglePictureInPicture(video))
// //   ]);

// //   const settingsButton = createIconButton(
// //     "settings bonw",
// //     settingsSVG,
// //     () => {
// //       dropupMenu.classList.toggle("hidden");
// //     }
// //   );

// //   // --- Add to DOM ---
// //   appendElements(buttons, [
// //     muteButton,
// //     qualitySelector,
// //     settingsButton,
// //     fullscreenButton
// //   ]);

// //   buttons.appendChild(dropupMenu);
// //   appendElements(controls, [progressBar, buttons]);
// //   setupFullscreenControls(videoPlayer, controls);

// //   return controls;
// // }
