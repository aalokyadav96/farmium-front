// player.js
import { createElement } from "../../components/createElement.js";
import { playSVG, pauseSVG } from "../../components/svgs.js";

// Local state encapsulated in closure (no globals)
let state = {
    currentAudio: null,
    currentPlayBtn: null,
    currentIndex: -1,
    songQueue: [],
    isShuffle: false,
    isAutoplay: true,
};

// 🎵 Footer Player
function createPlayerFooter(container) {
    let footer = container.querySelector(".songs-footer");
    if (footer) return footer;

    footer = createElement("footer", { class: "songs-footer" });
    const audio = createElement("audio", { id: "songs-audio", controls: true });

    const shuffleBtn = createElement("button", { class: "shuffle-btn" }, ["Shuffle"]);
    shuffleBtn.addEventListener("click", () => {
        state.isShuffle = !state.isShuffle;
        shuffleBtn.classList.toggle("active", state.isShuffle);
    });

    const autoplayBtn = createElement("button", { class: "autoplay-btn" }, ["Autoplay"]);
    autoplayBtn.addEventListener("click", () => {
        state.isAutoplay = !state.isAutoplay;
        autoplayBtn.classList.toggle("active", state.isAutoplay);
    });

    footer.append(shuffleBtn, autoplayBtn, audio);
    container.appendChild(footer);

    audio.addEventListener("ended", () => {
        if (state.isAutoplay) playNextSong(container);
    });

    return footer;
}

// 🎵 Core Play Logic
function playSong(song, container) {
    console.log("song::::::",song);
    const footer = createPlayerFooter(container);
    const audio = footer.querySelector("#songs-audio");

    if (!song.audioUrl) return;

    // Pause if same song already playing
    if (state.currentAudio && state.currentAudio.src === song.audioUrl && !audio.paused) {
        audio.pause();
        if (state.currentPlayBtn) state.currentPlayBtn.innerHTML = playSVG;
        return;
    }

    // Reset play icon on previous song
    if (state.currentPlayBtn) state.currentPlayBtn.innerHTML = playSVG;

    // Play new song
    audio.src = `${song.audioUrl}${song.audioextn}`;
    console.log("audio.src", audio.src);
    audio.play();
    state.currentAudio = audio;

    if (song._playBtn) {
        song._playBtn.innerHTML = pauseSVG;
        state.currentPlayBtn = song._playBtn;
    }
}

// 🎵 Play Next Song
function playNextSong(container) {
    const { songQueue } = state;
    if (!songQueue.length) return;

    if (state.isShuffle) {
        state.currentIndex = Math.floor(Math.random() * songQueue.length);
    } else {
        state.currentIndex = (state.currentIndex + 1) % songQueue.length;
    }

    const song = songQueue[state.currentIndex];
    if (song) playSong(song, container);
}

// 🧱 Utility to initialize queue
function setSongQueue(songs) {
    state.songQueue = songs;
    state.currentIndex = -1;
}

// 🧱 Utility to set current index
function setCurrentIndex(index) {
    state.currentIndex = index;
}

export {
    createPlayerFooter,
    playSong,
    playNextSong,
    setSongQueue,
    setCurrentIndex
};
