import "../../../css/ui/AudioPlayer.css";

function AudioPlayer(audioSrc) {
  const player = document.createElement("div");
  player.id = "audio-player-container";

  // **MAKE MINI-MODE THE DEFAULT**
  player.classList.add("mini-mode");

  // Poster image
  const img = document.createElement("img");
  img.src = audioSrc.poster;
  img.alt = "Audio Thumbnail";
  img.className = "audio-poster";

  // Audio element
  const audio = document.createElement("audio");
  audio.src = audioSrc.src;
  audio.controls = false;
  audio.preload = "metadata";

  // === CONTROLS CONTAINER ===
  const controlsContainer = document.createElement("div");
  controlsContainer.className = "controls-container";

  const playButton = document.createElement("button");
  playButton.textContent = "Play";
  playButton.onclick = function () {
    if (audio.paused) {
      audio.play();
      playButton.textContent = "Pause";
    } else {
      audio.pause();
      playButton.textContent = "Play";
    }
  };

  const seekBar = document.createElement("input");
  seekBar.type = "range";
  seekBar.min = 0;
  seekBar.max = 100;
  seekBar.value = 0;
  seekBar.className = "seek-bar";

  audio.addEventListener("timeupdate", () => {
    seekBar.value = (audio.currentTime / audio.duration) * 100;
  });
  seekBar.addEventListener("input", () => {
    audio.currentTime = (seekBar.value / 100) * audio.duration;
  });

  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.min = 0;
  volumeSlider.max = 1;
  volumeSlider.step = 0.1;
  volumeSlider.value = audio.volume;
  volumeSlider.className = "volume-slider";
  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
  });

  const speedSelect = document.createElement("select");
  [0.5, 1, 1.5, 2].forEach((speed) => {
    const option = document.createElement("option");
    option.value = speed;
    option.textContent = `${speed}x`;
    speedSelect.appendChild(option);
  });
  speedSelect.className = "speed-select";
  speedSelect.addEventListener("change", () => {
    audio.playbackRate = speedSelect.value;
  });

  controlsContainer.appendChild(playButton);
  controlsContainer.appendChild(seekBar);
  controlsContainer.appendChild(volumeSlider);
  controlsContainer.appendChild(speedSelect);

  // === LYRICS CONTAINER ===
  const lyricsContainer = document.createElement("div");
  lyricsContainer.id = "lyrics-container";
  audioSrc.lyricsData.forEach((lyric) => {
    const p = document.createElement("p");
    p.textContent = lyric.text;
    p.dataset.time = lyric.time;
    lyricsContainer.appendChild(p);
  });

  function updateLyrics() {
    const t = audio.currentTime;
    const lines = lyricsContainer.querySelectorAll("p");
    lines.forEach((el) => {
      const tm = parseFloat(el.dataset.time);
      el.classList.toggle("active", t >= tm);
    });
    const active = lyricsContainer.querySelector("p.active");
    if (active) active.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  audio.addEventListener("timeupdate", updateLyrics);

  // === DARK MODE TOGGLE ===
  const themeToggle = document.createElement("button");
  themeToggle.textContent = "🌙 Dark Mode";
  themeToggle.className = "theme-toggle";
  themeToggle.onclick = () => {
    player.classList.toggle("dark-mode");
    themeToggle.textContent = player.classList.contains("dark-mode")
      ? "☀️ Light Mode"
      : "🌙 Dark Mode";
  };

  // // === MINI / FULL-PLAYER TOGGLE ===
  // const miniToggle = document.createElement("button");
  // // since we're *in* mini-mode by default, offer the "expand" action
  // miniToggle.textContent = "🔼 Full View";
  // miniToggle.className = "mini-toggle";
  // miniToggle.onclick = () => {
  //   const isMini = player.classList.toggle("mini-mode");
  //   miniToggle.textContent = isMini ? "🔼 Full View" : "🔽 Mini Player";
  // };

  // const toggleControls = document.createElement("div");
  // toggleControls.className = "toggle-controls";
  // toggleControls.appendChild(themeToggle);
  // toggleControls.appendChild(miniToggle);

  // === APPEND ALL ===
  player.appendChild(img);
  player.appendChild(audio);
  player.appendChild(controlsContainer);
  player.appendChild(lyricsContainer);
  // player.appendChild(toggleControls);

  return player;
}

export default AudioPlayer;
export { AudioPlayer };
