import "../../../css/ui/MinAudio.css";
import {PauseSVG, playSVG} from "../svgs.js";
import {createElement} from "../createElement.js";

function MinAudio(audioSrc) {
  const player = document.createElement("div");
  player.className = "mini-audio";

  const thumbnailWrapper = document.createElement("div");
  thumbnailWrapper.className = "thumbnail-wrapper";

  const poster = document.createElement("img");
  poster.src = audioSrc.poster || "";
  poster.alt = "Audio Poster";
  poster.className = "audio-thumbnail";

  const overlayIcon = document.createElement("div");
  overlayIcon.className = "overlay-icon";
  overlayIcon.innerHTML = `${playSVG}`;

  const audio = document.createElement("audio");
  audio.src = audioSrc.audioUrl;
  audio.preload = "metadata";

  poster.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      overlayIcon.innerHTML = `${PauseSVG}`;
    } else {
      audio.pause();
      overlayIcon.innerHTML = `${playSVG}`;
    }
  });

  thumbnailWrapper.append(poster, overlayIcon, audio);

  const seekBar = document.createElement("input");
  seekBar.type = "range";
  seekBar.className = "seek-bar";
  seekBar.min = 0;
  seekBar.max = 100;
  seekBar.value = 0;

  const timeDisplay = document.createElement("div");
  timeDisplay.className = "time-display";

  const currentTime = document.createElement("span");
  currentTime.className = "current-time";
  currentTime.textContent = "00:00";

  const durationTime = document.createElement("span");
  durationTime.className = "duration-time";
  durationTime.textContent = "00:00";

  timeDisplay.append(currentTime, durationTime);

  audio.addEventListener("loadedmetadata", () => {
    durationTime.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    const progress = (audio.currentTime / audio.duration) * 100 || 0;
    seekBar.value = progress;
    currentTime.textContent = formatTime(audio.currentTime);
  });

  seekBar.addEventListener("input", () => {
    audio.currentTime = (seekBar.value / 100) * audio.duration;
  });

  const controls = document.createElement("div");
  controls.className = "controls vflex";

  const muteBtn = document.createElement("button");
  muteBtn.className = "btn mute-btn";
  muteBtn.innerHTML = "🔊";

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted ? "🔇" : "🔊";
  });

  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.className = "volume-slider";
  volumeSlider.min = 0;
  volumeSlider.max = 1;
  volumeSlider.step = 0.05;
  volumeSlider.value = audio.volume;

  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
    muteBtn.innerHTML = audio.volume == 0 ? "🔇" : "🔊";
  });

  const speedControl = document.createElement("select");
  speedControl.className = "speed-select";
  [0.5, 1, 1.5, 2].forEach((rate) => {
    const opt = document.createElement("option");
    opt.value = rate;
    opt.textContent = `${rate}x`;
    if (rate === 1) opt.selected = true;
    speedControl.appendChild(opt);
  });

  speedControl.addEventListener("change", () => {
    audio.playbackRate = parseFloat(speedControl.value);
  });

  const loopBtn = document.createElement("button");
  loopBtn.className = "btn loop-btn";
  loopBtn.innerHTML = "🔁";

  loopBtn.addEventListener("click", () => {
    audio.loop = !audio.loop;
    loopBtn.classList.toggle("active");
  });

  const volcon = createElement('div',{"class":"hflex"});
  const loopcon = createElement('div',{"class":"hflex"});

  volcon.append(muteBtn, volumeSlider);
  loopcon.append(speedControl, loopBtn);
  controls.append(volcon, loopcon);

  player.append(thumbnailWrapper, seekBar, timeDisplay, controls);
  return player;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default MinAudio;

// import "../../../css/ui/MinAudio.css";

// function MinAudio(audioSrc) {
//   const player = document.createElement("div");
//   player.className = "mini-audio-player";

//   const mediacon = document.createElement("div");
//   mediacon.className = "mediacon";

//   // Poster image (acts as play button)
//   const img = document.createElement("img");
//   img.src = audioSrc.poster || "";
//   img.alt = "Audio Thumbnail";
//   img.className = "audio-poster";

//   // Play/Pause overlay on image
//   const overlay = document.createElement("div");
//   overlay.className = "play-overlay";
//   overlay.innerHTML = "▶️";

//   // Audio element
//   const audio = document.createElement("audio");
//   audio.src = audioSrc.audioUrl;
//   audio.preload = "metadata";

//   // Click event for image (plays/pauses audio)
//   img.addEventListener("click", () => {
//     if (audio.paused) {
//       audio.play();
//       overlay.innerHTML = "⏸️"; // Change overlay to pause icon
//     } else {
//       audio.pause();
//       overlay.innerHTML = "▶️";
//     }
//   });

//   // Audio time updates
//   audio.addEventListener("timeupdate", () => {
//     if (audio.ended) {
//       overlay.innerHTML = "▶️"; // Reset overlay when audio ends
//     }
//   });

//   mediacon.append(img, overlay, audio);
//   player.appendChild(mediacon);

//   return player;
// }

// export default MinAudio;

// import "../../../css/ui/MinAudio.css";
// import { SRC_URL } from "../../api/api.js";

// function MinAudio(audioSrc) {
//   const player = document.createElement("div");
//   player.className = "mini-audio-player";

//   const mediacon = document.createElement("div");
//   mediacon.className = "mediacon";

//   // Poster image
//   const img = document.createElement("img");
//   img.src = audioSrc.poster || "";
//   img.alt = "Audio Thumbnail";
//   img.className = "audio-poster";

//   // Audio element
//   const audio = document.createElement("audio");
//   // audio.src = `${SRC_URL}/artistpic/songs/${audioSrc.audioUrl}`;
//   audio.src = audioSrc.audioUrl;
//   audio.preload = "metadata";

//   // === CONTROLS ===
//   const controls = document.createElement("div");
//   controls.className = "audiocontrols";

//   // Play/Pause button
//   const playBtn = document.createElement("button");
//   playBtn.className = "play-pause-btn";
//   playBtn.innerHTML = "▶️";

//   playBtn.addEventListener("click", () => {
//     if (audio.paused) {
//       audio.play();
//       playBtn.innerHTML = "⏸️";
//     } else {
//       audio.pause();
//       playBtn.innerHTML = "▶️";
//     }
//   });

//   // Seek bar container with buffered progress
//   const seekContainer = document.createElement("div");
//   seekContainer.className = "seek-container";

//   const bufferedBar = document.createElement("div");
//   bufferedBar.className = "buffered-bar";

//   const seekBar = document.createElement("input");
//   seekBar.type = "range";
//   seekBar.min = 0;
//   seekBar.max = 100;
//   seekBar.value = 0;
//   seekBar.className = "seek-bar";

//   // Time Labels
//   const timeContainer = document.createElement("div");
//   timeContainer.className = "time-container";

//   const currentTimeLabel = document.createElement("span");
//   currentTimeLabel.className = "current-time";
//   currentTimeLabel.textContent = "00:00";

//   const totalTimeLabel = document.createElement("span");
//   totalTimeLabel.className = "total-time";
//   totalTimeLabel.textContent = "00:00";

//   timeContainer.append(currentTimeLabel, totalTimeLabel);

//   audio.addEventListener("loadedmetadata", () => {
//     totalTimeLabel.textContent = formatTime(audio.duration);
//   });

//   audio.addEventListener("timeupdate", () => {
//     seekBar.value = (audio.currentTime / audio.duration) * 100 || 0;
//     currentTimeLabel.textContent = formatTime(audio.currentTime);
//   });

//   audio.addEventListener("progress", () => {
//     if (audio.buffered.length) {
//       const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
//       const bufferedPercent = (bufferedEnd / audio.duration) * 100;
//       bufferedBar.style.width = `${bufferedPercent}%`;
//     }
//   });

//   seekBar.addEventListener("input", () => {
//     audio.currentTime = (seekBar.value / 100) * audio.duration;
//   });

//   seekContainer.appendChild(bufferedBar);
//   seekContainer.appendChild(seekBar);

//   // Volume and mute controls
//   const volumeContainer = document.createElement("div");
//   volumeContainer.className = "volume-container";

//   const muteBtn = document.createElement("button");
//   muteBtn.className = "mute-btn";
//   muteBtn.innerHTML = "🔊";

//   muteBtn.addEventListener("click", () => {
//     audio.muted = !audio.muted;
//     muteBtn.innerHTML = audio.muted ? "🔇" : "🔊";
//   });

//   const volumeSlider = document.createElement("input");
//   volumeSlider.type = "range";
//   volumeSlider.min = 0;
//   volumeSlider.max = 1;
//   volumeSlider.step = 0.05;
//   volumeSlider.value = audio.volume;
//   volumeSlider.className = "volume-slider";

//   volumeSlider.addEventListener("input", () => {
//     audio.volume = volumeSlider.value;
//     if (audio.volume === 0) {
//       muteBtn.innerHTML = "🔇";
//     } else {
//       muteBtn.innerHTML = "🔊";
//     }
//   });

//   volumeContainer.append(muteBtn, volumeSlider);

//   // Playback speed control
//   const speedSelect = document.createElement("select");
//   speedSelect.className = "speed-select";

//   [0.5, 1, 1.5, 2].forEach((rate) => {
//     const option = document.createElement("option");
//     option.value = rate;
//     option.textContent = `${rate}x`;
//     if (rate === 1) option.selected = true;
//     speedSelect.appendChild(option);
//   });

//   speedSelect.addEventListener("change", () => {
//     audio.playbackRate = parseFloat(speedSelect.value);
//   });

//   controls.append(seekContainer, timeContainer, volumeContainer, speedSelect);

//   mediacon.append(playBtn, img, audio);
//   player.append(mediacon, controls);

//   return player;
// }

// // Helper function to format time nicely
// function formatTime(seconds) {
//   const minutes = Math.floor(seconds / 60) || 0;
//   const secs = Math.floor(seconds % 60) || 0;
//   return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
// }

// export default MinAudio;

// import "../../../css/ui/MinAudio.css";
// import { SRC_URL } from "../../api/api.js";

// function MinAudio(audioSrc) {
//   const player = document.createElement("div");
//   player.className = "mini-audio-player";

//   // Poster image
//   const img = document.createElement("img");
//   img.src = audioSrc.poster || "";
//   img.alt = "Audio Thumbnail";
//   img.className = "audio-poster";

//   // Audio element
//   const audio = document.createElement("audio");
//   audio.src = `${SRC_URL}/artistpic/${audioSrc.audioUrl}`;
//   audio.preload = "metadata";

//   // === CONTROLS ===
//   const controls = document.createElement("div");
//   controls.className = "controlsx";

//   // Play/Pause button
//   const playBtn = document.createElement("button");
//   playBtn.className = "play-pause-btn";
//   playBtn.innerHTML = "▶️";

//   playBtn.addEventListener("click", () => {
//     if (audio.paused) {
//       audio.play();
//       playBtn.innerHTML = "⏸️";
//     } else {
//       audio.pause();
//       playBtn.innerHTML = "▶️";
//     }
//   });

//   // Seek bar container with buffered progress
//   const seekContainer = document.createElement("div");
//   seekContainer.className = "seek-container";

//   const bufferedBar = document.createElement("div");
//   bufferedBar.className = "buffered-bar";

//   const seekBar = document.createElement("input");
//   seekBar.type = "range";
//   seekBar.min = 0;
//   seekBar.max = 100;
//   seekBar.value = 0;
//   seekBar.className = "seek-bar";

//   audio.addEventListener("timeupdate", () => {
//     seekBar.value = (audio.currentTime / audio.duration) * 100 || 0;
//   });

//   audio.addEventListener("progress", () => {
//     if (audio.buffered.length) {
//       const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
//       const bufferedPercent = (bufferedEnd / audio.duration) * 100;
//       bufferedBar.style.width = `${bufferedPercent}%`;
//     }
//   });

//   seekBar.addEventListener("input", () => {
//     audio.currentTime = (seekBar.value / 100) * audio.duration;
//   });

//   seekContainer.appendChild(bufferedBar);
//   seekContainer.appendChild(seekBar);

//   // Volume and mute controls
//   const volumeContainer = document.createElement("div");
//   volumeContainer.className = "volume-container";

//   const muteBtn = document.createElement("button");
//   muteBtn.className = "mute-btn";
//   muteBtn.innerHTML = "🔊";

//   muteBtn.addEventListener("click", () => {
//     audio.muted = !audio.muted;
//     muteBtn.innerHTML = audio.muted ? "🔇" : "🔊";
//   });

//   const volumeSlider = document.createElement("input");
//   volumeSlider.type = "range";
//   volumeSlider.min = 0;
//   volumeSlider.max = 1;
//   volumeSlider.step = 0.05;
//   volumeSlider.value = audio.volume;
//   volumeSlider.className = "volume-slider";

//   volumeSlider.addEventListener("input", () => {
//     audio.volume = volumeSlider.value;
//     if (audio.volume === 0) {
//       muteBtn.innerHTML = "🔇";
//     } else {
//       muteBtn.innerHTML = "🔊";
//     }
//   });

//   volumeContainer.append(muteBtn, volumeSlider);

//   // Playback speed control
//   const speedSelect = document.createElement("select");
//   speedSelect.className = "speed-select";

//   [0.5, 1, 1.5, 2].forEach((rate) => {
//     const option = document.createElement("option");
//     option.value = rate;
//     option.textContent = `${rate}x`;
//     if (rate === 1) option.selected = true;
//     speedSelect.appendChild(option);
//   });

//   speedSelect.addEventListener("change", () => {
//     audio.playbackRate = parseFloat(speedSelect.value);
//   });

//   controls.append(playBtn, seekContainer, volumeContainer, speedSelect);

//   player.append(img, audio, controls);

//   return player;
// }

// export default MinAudio;

// // import "../../../css/ui/MinAudio.css";
// // import { SRC_URL } from "../../api/api.js";

// // function MinAudio(audioSrc) {
// //   const player = document.createElement("div");
// //   player.id = "audio-player-container";
// //   player.classList.add("mini-mode");

// //   // Poster image
// //   const img = document.createElement("img");
// //   img.src = audioSrc.poster;
// //   img.alt = "Audio Thumbnail";
// //   img.className = "audio-poster";

// //   // Audio element
// //   const audio = document.createElement("audio");
// //   audio.src = `${SRC_URL}/artistpic/${audioSrc.audioUrl}`;
// //   audio.controls = false;

// //   // === CONTROLS CONTAINER ===
// //   const controlsContainer = document.createElement("div");
// //   controlsContainer.className = "controls-container";

// //   // Play/Pause Button (Using Icons)
// //   const playButton = document.createElement("button");
// //   playButton.className = "play-btn";
// //   playButton.innerHTML = "▶️"; // Default play icon
// //   playButton.onclick = function () {
// //     if (audio.paused) {
// //       audio.play();
// //       playButton.innerHTML = "⏸️"; // Change to pause icon
// //     } else {
// //       audio.pause();
// //       playButton.innerHTML = "▶️"; // Change back to play icon
// //     }
// //   };

// //   // Seek Bar with Buffered Progress
// //   const seekBar = document.createElement("input");
// //   seekBar.type = "range";
// //   seekBar.min = 0;
// //   seekBar.max = 100;
// //   seekBar.value = 0;
// //   seekBar.className = "seek-bar";

// //   const bufferedProgress = document.createElement("div");
// //   bufferedProgress.className = "buffered-progress";

// //   audio.addEventListener("timeupdate", () => {
// //     seekBar.value = (audio.currentTime / audio.duration) * 100;
// //   });
// //   audio.addEventListener("progress", () => {
// //     if (audio.buffered.length > 0) {
// //       const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
// //       bufferedProgress.style.width = `${(bufferedEnd / audio.duration) * 100}%`;
// //     }
// //   });

// //   seekBar.addEventListener("input", () => {
// //     audio.currentTime = (seekBar.value / 100) * audio.duration;
// //   });

// //   // Volume Slider with Mute Button
// //   const volumeContainer = document.createElement("div");
// //   volumeContainer.className = "volume-container";

// //   const muteButton = document.createElement("button");
// //   muteButton.className = "mute-btn";
// //   muteButton.innerHTML = "🔊";
// //   muteButton.onclick = function () {
// //     audio.muted = !audio.muted;
// //     muteButton.innerHTML = audio.muted ? "🔇" : "🔊";
// //   };

// //   const volumeSlider = document.createElement("input");
// //   volumeSlider.type = "range";
// //   volumeSlider.min = 0;
// //   volumeSlider.max = 1;
// //   volumeSlider.step = 0.1;
// //   volumeSlider.value = audio.volume;
// //   volumeSlider.className = "volume-slider";
// //   volumeSlider.addEventListener("input", () => {
// //     audio.volume = volumeSlider.value;
// //   });

// //   volumeContainer.appendChild(muteButton);
// //   volumeContainer.appendChild(volumeSlider);

// //   // Speed Select with Default Highlight
// //   const speedSelect = document.createElement("select");
// //   speedSelect.className = "speed-select";
// //   [0.5, 1, 1.5, 2].forEach((speed) => {
// //     const option = document.createElement("option");
// //     option.value = speed;
// //     option.textContent = `${speed}x`;
// //     if (speed === 1) option.selected = true;
// //     speedSelect.appendChild(option);
// //   });

// //   speedSelect.addEventListener("change", () => {
// //     audio.playbackRate = speedSelect.value;
// //   });

// //   controlsContainer.append(playButton, seekBar, volumeContainer, speedSelect);
// //   player.append(img, audio, bufferedProgress, controlsContainer);

// //   return player;
// // }
// // export default MinAudio;

// // // import "../../../css/ui/AudioPlayer.css";
// // // import { SRC_URL } from "../../api/api.js";

// // // function MinAudio(audioSrc) {
// // //   const player = document.createElement("div");
// // //   player.id = "audio-player-container";

// // //   // **MAKE MINI-MODE THE DEFAULT**
// // //   player.classList.add("mini-mode");

// // //   // Poster image
// // //   const img = document.createElement("img");
// // //   img.src = audioSrc.poster;
// // //   img.alt = "Audio Thumbnail";
// // //   img.className = "audio-poster";

// // //   // Audio element
// // //   const audio = document.createElement("audio");
// // //   audio.src = `${SRC_URL}/artistpic/${audioSrc.audioUrl}`;
// // //   audio.controls = false;

// // //   // === CONTROLS CONTAINER ===
// // //   const controlsContainer = document.createElement("div");
// // //   controlsContainer.className = "controls-container";

// // //   const playButton = document.createElement("button");
// // //   playButton.textContent = "Play";
// // //   playButton.onclick = function () {
// // //     if (audio.paused) {
// // //       audio.play();
// // //       playButton.textContent = "Pause";
// // //     } else {
// // //       audio.pause();
// // //       playButton.textContent = "Play";
// // //     }
// // //   };

// // //   const seekBar = document.createElement("input");
// // //   seekBar.type = "range";
// // //   seekBar.min = 0;
// // //   seekBar.max = 100;
// // //   seekBar.value = 0;
// // //   seekBar.className = "seek-bar";

// // //   audio.addEventListener("timeupdate", () => {
// // //     seekBar.value = (audio.currentTime / audio.duration) * 100;
// // //   });
// // //   seekBar.addEventListener("input", () => {
// // //     audio.currentTime = (seekBar.value / 100) * audio.duration;
// // //   });

// // //   const volumeSlider = document.createElement("input");
// // //   volumeSlider.type = "range";
// // //   volumeSlider.min = 0;
// // //   volumeSlider.max = 1;
// // //   volumeSlider.step = 0.1;
// // //   volumeSlider.value = audio.volume;
// // //   volumeSlider.className = "volume-slider";
// // //   volumeSlider.addEventListener("input", () => {
// // //     audio.volume = volumeSlider.value;
// // //   });

// // //   const speedSelect = document.createElement("select");
// // //   [0.5, 1, 1.5, 2].forEach((speed) => {
// // //     const option = document.createElement("option");
// // //     option.value = speed;
// // //     option.textContent = `${speed}x`;
// // //     speedSelect.appendChild(option);
// // //   });
// // //   speedSelect.className = "speed-select";
// // //   speedSelect.addEventListener("change", () => {
// // //     audio.playbackRate = speedSelect.value;
// // //   });

// // //   controlsContainer.appendChild(playButton);
// // //   controlsContainer.appendChild(seekBar);
// // //   controlsContainer.appendChild(volumeSlider);
// // //   controlsContainer.appendChild(speedSelect);

// // //   // === APPEND ALL ===
// // //   player.appendChild(img);
// // //   player.appendChild(audio);
// // //   player.appendChild(controlsContainer);

// // //   return player;
// // // }


// // // // function MinAudio(audioSrc) {
// // // //     const player = document.createElement("div");
// // // //     player.id = "audio-player-container";

// // // //     const audio = document.createElement("audio");
// // // //     audio.src = audioSrc.audioUrl;
// // // //     audio.controls = false; 
// // // //     player.appendChild(audio);

// // // //     const playButton = document.createElement("button");
// // // //     playButton.textContent = "Play";
// // // //     playButton.onclick = function () {
// // // //       if (audio.paused) {
// // // //         audio.play();
// // // //         playButton.textContent = "Pause";
// // // //       } else {
// // // //         audio.pause();
// // // //         playButton.textContent = "Play";
// // // //       }
// // // //     };
// // // //     player.appendChild(playButton);

// // // //     // **Lyrics Container**
// // // //     const lyricsContainer = document.createElement("div");
// // // //     lyricsContainer.id = "lyrics-container";
// // // //     player.appendChild(lyricsContainer);

// // // //     audioSrc.lyricsData.forEach(lyric => {
// // // //       const lyricElement = document.createElement("p");
// // // //       lyricElement.textContent = lyric.text;
// // // //       lyricElement.dataset.time = lyric.time;
// // // //       lyricsContainer.appendChild(lyricElement);
// // // //     });

// // // //     // **Lyrics Syncing Logic**
// // // //     function updateLyrics() {
// // // //       const currentTime = audio.currentTime;
// // // //       const lyricsElements = lyricsContainer.querySelectorAll("p");

// // // //       lyricsElements.forEach((lyricElement) => {
// // // //         const time = parseFloat(lyricElement.dataset.time);
// // // //         if (currentTime >= time) {
// // // //           lyricsElements.forEach(el => el.classList.remove("active"));
// // // //           lyricElement.classList.add("active");
// // // //         }
// // // //       });

// // // //       // Scroll to the active lyric
// // // //       const activeLyric = lyricsContainer.querySelector(".active");
// // // //       if (activeLyric) {
// // // //         activeLyric.scrollIntoView({ behavior: "smooth", block: "center" });
// // // //       }
// // // //     }

// // // //     audio.addEventListener("timeupdate", updateLyrics);

// // // //     return player;
// // // //   }

// // // export default MinAudio;
