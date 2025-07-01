export function setupClickToPlay(video) {
    video.addEventListener("click", () => {
      video.paused ? video.play() : video.pause();
    });
  }
  