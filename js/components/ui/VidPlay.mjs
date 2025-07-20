import "../../../css/ui/VidPlay.css";
import { generateVideoPlayer } from "./vidpopHelpers";

const VidPlay = (videoSrc, poster, qualities, subtitles, videoid) => {
  const player = document.createElement("div");
  player.className = "video-player-container";

  // Push a new state into history when the video player opens
  history.pushState({ vidPlayOpen: true }, "");

  // Add close button
  const closeButton = document.createElement("button");
  closeButton.className = "video-close-btn";
  closeButton.textContent = "X";
  closeButton.addEventListener("click", () => closeVidPlay());
  player.appendChild(closeButton);

  // Append the generated video player
  generateVideoPlayer(videoSrc, poster, qualities, subtitles, videoid).then((videoPlayer) => {
    player.appendChild(videoPlayer);
  });

  // Close function that removes the video player without going back
  function closeVidPlay() {
    if (document.getElementById("app").contains(player)) {
      player.remove();
      history.back(); // Trigger history back to sync state
    }
  }

  // Handle back button press
  function onPopState(event) {
    if (event.state && event.state.vidPlayOpen) {
      closeVidPlay();
    }
  }

  window.addEventListener("popstate", onPopState);

  return player;
};

export default VidPlay;
