import { createControls } from "./controls.js";
import { setupSubtitles } from "./subtitles.js";
import { createVideoElement } from "./createVideo.js";
import { setupQualitySwitch } from "./setupQualitySwitch.js";
import { setupProgress } from "./setupProgress.js";
import { setupClickToPlay } from "./setupClickToPlay.js";
import { setupFullscreenOrientation } from "./setupOrientation.js";

async function generateVideoPlayer(mediaSrc, poster, qualities, subtitles, videoid) {
  const videoPlayer = document.createElement("div");
  videoPlayer.id = "video-player";
  // Create the main <video> element
  const video = createVideoElement({ mediaSrc, poster, qualities });

  // Add subtitle track container if any
  if (subtitles.length !== 0) {
    const subtitleContainer = document.createElement("div");
    subtitleContainer.className = "subtitle-container";
    videoPlayer.appendChild(subtitleContainer);
    await setupSubtitles(video, subtitles, subtitleContainer);
  }

  // Create control bar
  const controls = createControls(video, mediaSrc, qualities, videoid, videoPlayer);

  // Append video and controls to player
  videoPlayer.appendChild(video);
  videoPlayer.appendChild(controls);

  // Setup progress bar updates
  const progressBar = controls.querySelector(".progress-bar");
  const progress = controls.querySelector(".progress");
  setupProgress(video, progressBar, progress);

  // Setup click-to-play
  setupClickToPlay(video);

  // Setup quality selector switching
  const qualitySelector = controls.querySelector(".quality-selector");
  if (qualitySelector) {
    setupQualitySwitch(video, qualities, qualitySelector);
  }

  // Setup fullscreen + orientation logic
  setupFullscreenOrientation(videoPlayer, video);

  return videoPlayer;
}

export { generateVideoPlayer };
