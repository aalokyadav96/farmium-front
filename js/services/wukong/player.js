
import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";
import { getContentContainer } from "./uiHelpers.js";

// ------------------------ Player (encapsulated) ------------------------
let activePlayer = null; // tracks most recent player

class Player {
    constructor(container) {
        this.container = container;
        this.state = {
            audio: null,
            currentSong: null,
            currentIndex: -1,
            queue: [],
            repeat: "all",
            shuffle: false,
            volume: 1,
            crossfadeDuration: 2,
            _fadeInterval: null
        };

        // create footer & audio once
        this._createFooter();
        // wire keyboard activation via global activePlayer handled below
    }

    _createFooter() {
        let footer = this.container.querySelector(".songs-footer");
        if (footer) {
            const audio = footer.querySelector("#songs-audio");
            if (audio) this.state.audio = audio;
            return;
        }

        let playcon = createElement("div", { "class": "playcon" }, []);
        let progresscon = createElement("div", { "class": "progresscon" }, []);
        let volumecon = createElement("div", { "class": "volumecon" }, []);
        footer = createElement("footer", { class: "songs-footer hvflex" });
        const audio = createElement("audio", { id: "songs-audio" });
        audio.volume = this.state.volume;

        const prevBtn = createElement("button", { class: "prev-btn" }, ["⏮"]);
        const playBtn = createElement("button", { class: "play-btn" }, ["▶"]);
        const pauseBtn = createElement("button", { class: "pause-btn" }, ["⏸"]);
        const nextBtn = createElement("button", { class: "next-btn" }, ["⏭"]);
        const repeatBtn = createElement("button", { class: "repeat-btn" }, ["Repeat"]);
        const shuffleBtn = createElement("button", { class: "shuffle-btn" }, ["Shuffle"]);
        const volumeSlider = createElement("input", { type: "range", min: 0, max: 1, step: 0.01, value: this.state.volume });
        const progressBar = createElement("input", { type: "range", min: 0, max: 100, step: 0.1, value: 0, class: "progress-bar" });

        // footer.append(prevBtn, playBtn, pauseBtn, nextBtn, repeatBtn, shuffleBtn, volumeSlider, progressBar, audio);
        playcon.append(prevBtn, playBtn, pauseBtn, nextBtn);
        progresscon.append(repeatBtn, shuffleBtn, progressBar, audio);
        volumecon.append(volumeSlider);
        footer.append(volumecon, playcon, progresscon);
        this.container.append(footer);

        // Events
        prevBtn.addEventListener("click", () => this.playPrev());
        nextBtn.addEventListener("click", () => this.playNext());
        playBtn.addEventListener("click", () => { if (audio.src) audio.play(); });
        pauseBtn.addEventListener("click", () => { if (audio.src) audio.pause(); });
        repeatBtn.addEventListener("click", () => {
            this.state.repeat = this.state.repeat === "all" ? "one" : this.state.repeat === "one" ? "none" : "all";
            console.log(`[player] Repeat mode: ${this.state.repeat}`);
            Notify(`Repeat mode: ${this.state.repeat}`);
        });
        shuffleBtn.addEventListener("click", () => {
            this.state.shuffle = !this.state.shuffle;
            shuffleBtn.classList.toggle("active", this.state.shuffle);
            console.log(`[player] Shuffle: ${this.state.shuffle}`);
            Notify(`Shuffle: ${this.state.shuffle ? "ON" : "OFF"}`);
        });
        volumeSlider.addEventListener("input", () => {
            audio.volume = Number(volumeSlider.value);
            this.state.volume = audio.volume;
        });
        audio.addEventListener("timeupdate", () => {
            progressBar.value = (audio.currentTime / audio.duration) * 100 || 0;
        });
        progressBar.addEventListener("input", () => {
            audio.currentTime = (progressBar.value / 100) * audio.duration;
        });
        audio.addEventListener("ended", () => {
            if (this.state.repeat === "one") {
                const cur = this.state.queue[this.state.currentIndex];
                if (cur) this.play(cur, this.state.currentIndex, 0);
            } else this.playNext();
        });

        // update UI when metadata loads (duration)
        audio.addEventListener("loadedmetadata", () => {
            const cur = this.state.currentSong;
            if (cur) {
                // update matching song-row meta to show duration if missing
                const content = getContentContainer(this.container);
                const row = content.querySelector(`.song-row[data-songid="${cur.songid}"]`);
                if (row) {
                    const metaEl = row.querySelector(".song-meta");
                    if (metaEl) {
                        const minutes = Math.floor(audio.duration / 60);
                        const seconds = Math.floor(audio.duration % 60).toString().padStart(2, "0");
                        // replace children safely
                        while (metaEl.firstChild) metaEl.removeChild(metaEl.firstChild);
                        metaEl.append(createElement("span", {}, [`${cur.genre || ""} • ${minutes}:${seconds}`]));
                    }
                }
            }
        });

        this.state.audio = audio;
    }

    _clearFadeInterval() {
        if (this.state._fadeInterval) {
            clearInterval(this.state._fadeInterval);
            this.state._fadeInterval = null;
        }
    }

    async play(song, idx = undefined, startTime = 0) {
        if (!song || !song.audioUrl) return;
        const audio = this.state.audio;
        if (!audio) return;

        // if same song playing -> toggle pause
        if (this.state.currentSong === song && !audio.paused) {
            audio.pause();
            console.log(`[player] Paused: ${song.title}`);
            return;
        }

        const switchSong = () => {
            audio.src = `${song.audioUrl}${song.audioextn || ""}`;
            audio.currentTime = startTime;
            audio.volume = this.state.volume;
            audio.play();
            this.state.currentSong = song;
            if (typeof idx === "number") this.state.currentIndex = idx;
            console.log(`[player] Playing: ${song.title}`);
        };

        if (audio.src && !audio.paused && this.state.crossfadeDuration > 0 && this.state.currentSong) {
            this._clearFadeInterval();
            const fadeTime = this.state.crossfadeDuration;
            const step = 50;
            const steps = Math.max(1, Math.floor((fadeTime * 1000) / step));
            let vol = audio.volume;
            const volDelta = vol / steps;
            this.state._fadeInterval = setInterval(() => {
                vol -= volDelta;
                if (vol <= 0) {
                    this._clearFadeInterval();
                    audio.pause();
                    audio.volume = this.state.volume;
                    switchSong();
                } else audio.volume = Math.max(0, vol);
            }, step);
        } else {
            switchSong();
        }
    }

    playNext() {
        if (!this.state.queue?.length) return;
        this.state.currentIndex = this.state.shuffle ? Math.floor(Math.random() * this.state.queue.length) : (this.state.currentIndex + 1) % this.state.queue.length;
        this.play(this.state.queue[this.state.currentIndex], this.state.currentIndex);
    }

    playPrev() {
        if (!this.state.queue?.length) return;
        this.state.currentIndex = this.state.shuffle ? Math.floor(Math.random() * this.state.queue.length) : (this.state.currentIndex - 1 + this.state.queue.length) % this.state.queue.length;
        this.play(this.state.queue[this.state.currentIndex], this.state.currentIndex);
    }

    setQueue(songs) {
        this.state.queue = Array.isArray(songs) ? songs.slice() : [];
        this.state.currentIndex = -1;
        console.log(`[player] Queue set with ${this.state.queue.length} songs`);
    }

    reset() {
        this._clearFadeInterval();
        if (this.state.audio) this.state.audio.pause();
        this.state.currentIndex = -1;
        this.state.currentSong = null;
        this.state.queue = [];
        console.log("[player] Reset");
    }

    getState() {
        return this.state;
    }
}

export function initPlayer(container) {
    const player = new Player(container);
    activePlayer = {
        play: (song, idx, startTime) => { player.play(song, idx, startTime); activePlayer = activePlayer; },
        setQueue: (songs) => player.setQueue(songs),
        playNext: () => player.playNext(),
        playPrev: () => player.playPrev(),
        reset: () => player.reset(),
        getState: () => player.getState()
    };
    // assign activePlayer to the real Player instance for global keyboard handler compatibility
    activePlayer._playerInstance = player;
    return activePlayer;
}

// Keyboard shortcuts (global)
document.addEventListener("keydown", (e) => {
    if (!activePlayer) return;
    const st = activePlayer.getState();
    if (!st || !st.audio) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.code === "Space") { e.preventDefault(); st.audio.paused ? st.audio.play() : st.audio.pause(); }
    if (e.code === "ArrowRight") activePlayer.playNext();
    if (e.code === "ArrowLeft") activePlayer.playPrev();
});
