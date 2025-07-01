import {
    changeZoom,
    flipVideo,
    rotateVideo,
    resetRotation,
    updateTransform
  } from "./transformController.js";
  import {
    setVolume, toggleMute,
    resetSpeed, slower, faster
  } from "./volumeSpeedControls.js";
  
  export function setupHotkeys(video) {
    const isInput = (el) => ["INPUT", "TEXTAREA"].includes(el.tagName) || el.isContentEditable;
  
    window.addEventListener("keydown", (e) => {
      if (isInput(e.target)) return;
  
      const actions = {
        "h": () => flipVideo(video),
        "+": () => changeZoom(-1, null, video),
        "-": () => changeZoom(1, null, video),
        "c": () => faster(video),
        "x": () => resetSpeed(video),
        "z": () => slower(video),
        "b": () => setVolume(video, -0.1),
        "n": () => setVolume(video, 0.1),
        "m": () => toggleMute(video),
        "v": () => video.paused ? video.play() : video.pause(),
        ",": () => video.currentTime = Math.max(0, video.currentTime - 1 / 12),
        ".": () => video.currentTime = Math.min(video.duration, video.currentTime + 1 / 12),
        "r": () => rotateVideo(video),
        "Alt+r": () => resetRotation(video),
        "Shift+ArrowUp": () => setVolume(video, 0.1),
        "Shift+ArrowDown": () => setVolume(video, -0.1),
        "Ctrl+ArrowLeft": () => video.currentTime -= 5,
        "Ctrl+ArrowRight": () => video.currentTime += 5,
      };
  
      const combo = [
        e.ctrlKey && "Ctrl",
        e.shiftKey && "Shift",
        e.altKey && "Alt",
        e.key,
      ].filter(Boolean).join("+");
  
      if (actions[combo]) {
        actions[combo]();
        if (!["m", "v"].includes(e.key)) updateTransform(video);
        e.preventDefault();
      }
    });
  }
  