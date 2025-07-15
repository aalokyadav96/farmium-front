import { createControls } from "./controls.js";
import { setupSubtitles } from "./subtitles.js";
import { createVideoElement } from "./createVideo.js";
import { setupQualitySwitch } from "./setupQualitySwitch.js";
import { setupProgress } from "./setupProgress.js";
import { setupClickToPlay } from "./setupClickToPlay.js";
import { setupFullscreenOrientation } from "./setupOrientation.js";

import {hklegends} from "../video-utils/hkLegends.js";


async function generateVideoPlayer(mediaSrc, poster, qualities, subtitles, videoid) {
  const videoPlayer = document.createElement("div");
  videoPlayer.id = "video-player";

  const video = createVideoElement({ mediaSrc, poster, qualities });

  if (subtitles.length !== 0) {
    const subtitleContainer = document.createElement("div");
    subtitleContainer.className = "subtitle-container";
    videoPlayer.appendChild(subtitleContainer);
    await setupSubtitles(video, subtitles, subtitleContainer);
  }

  const controls = createControls(video, mediaSrc, qualities, videoid, videoPlayer);
  videoPlayer.appendChild(video);
  videoPlayer.appendChild(controls);

  const progressBar = controls.querySelector(".progress-bar");
  const progress = controls.querySelector(".progress");

  setupProgress(video, progressBar, progress);
  setupClickToPlay(video);
  setupQualitySwitch(video, qualities, controls.querySelector(".quality-selector"));
  setupFullscreenOrientation(videoPlayer, video);

  return videoPlayer;
}

export { generateVideoPlayer };
