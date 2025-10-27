// musicModule.js
// Modular single-file music module: fetchers, player, UI
// Fully updated to remove runtime errors and add logs

import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { musicFetch } from "../../api/api.js";

// ------------------------ Fetchers ------------------------
export async function safeFetch(endpoint, method = "GET", body = null) {
    try {
        console.log(`[fetch] ${method} ${endpoint}`);
        const res = await musicFetch(endpoint, method, body);
        if (res?.success && Array.isArray(res.data)) return res.data;
        console.warn(`[fetch] No data returned from ${endpoint}`);
        return [];
    } catch (err) {
        console.error(`[fetch] Error fetching ${endpoint}:`, err);
        Notify(`Failed to fetch ${endpoint}`, { type: "error" });
        return [];
    }
}

export async function fetchPersonalizedRecommendations() { return safeFetch("/musicon/recommendations?based_on=recently_played"); }
export async function fetchUserPlaylists() { return safeFetch("/musicon/user/playlists"); }
export async function fetchArtistSongs(artistID) { return safeFetch(`/musicon/artists/${artistID}/songs`); }
export async function fetchPlaylistSongs(playlistID, offset = 0, limit = 20) {
    return safeFetch(`/musicon/playlists/${playlistID}/songs?skip=${offset}&limit=${limit}`);
}
export async function fetchAlbums() { return safeFetch("/musicon/albums"); }
export async function fetchAlbumSongs(albumID, offset = 0, limit = 20) {
    return safeFetch(`/musicon/albums/${albumID}/songs?skip=${offset}&limit=${limit}`);
}
export async function fetchRecommendedSongs() { return safeFetch("/musicon/recommended"); }
export async function fetchRecommendedAlbums() { return safeFetch("/musicon/recommended/albums"); }

// ------------------------ Player ------------------------
let activePlayer = null; // tracks most recent player

function createPlayerFooter(container, state) {
    let footer = container.querySelector(".songs-footer");
    if (!footer) {
        footer = createElement("footer", { class: "songs-footer" });
        const audio = createElement("audio", { id: "songs-audio" });
        audio.volume = state.volume;

        const prevBtn = createElement("button", { class: "prev-btn" }, ["⏮"]);
        const nextBtn = createElement("button", { class: "next-btn" }, ["⏭"]);
        const repeatBtn = createElement("button", { class: "repeat-btn" }, ["Repeat"]);
        const shuffleBtn = createElement("button", { class: "shuffle-btn" }, ["Shuffle"]);
        const volumeSlider = createElement("input", { type: "range", min: 0, max: 1, step: 0.01, value: state.volume });
        const progressBar = createElement("input", { type: "range", min: 0, max: 100, step: 0.1, value: 0, class: "progress-bar" });

        footer.append(prevBtn, nextBtn, repeatBtn, shuffleBtn, volumeSlider, progressBar, audio);
        container.append(footer);

        // Bind events
        prevBtn.addEventListener("click", () => playPrevSong(state));
        nextBtn.addEventListener("click", () => playNextSong(state));
        repeatBtn.addEventListener("click", () => {
            state.repeat = state.repeat === "all" ? "one" : state.repeat === "one" ? "none" : "all";
            console.log(`[player] Repeat mode: ${state.repeat}`);
            Notify(`Repeat mode: ${state.repeat}`);
        });
        shuffleBtn.addEventListener("click", () => {
            state.shuffle = !state.shuffle;
            shuffleBtn.classList.toggle("active", state.shuffle);
            console.log(`[player] Shuffle: ${state.shuffle}`);
            Notify(`Shuffle: ${state.shuffle ? "ON" : "OFF"}`);
        });
        volumeSlider.addEventListener("input", () => {
            audio.volume = volumeSlider.value;
            state.volume = audio.volume;
        });
        audio.addEventListener("timeupdate", () => {
            progressBar.value = (audio.currentTime / audio.duration) * 100 || 0;
        });
        progressBar.addEventListener("input", () => {
            audio.currentTime = (progressBar.value / 100) * audio.duration;
        });
        audio.addEventListener("ended", () => {
            if (state.repeat === "one") {
                const cur = state.queue[state.currentIndex];
                if (cur) playSong(cur, state, 0);
            } else playNextSong(state);
        });

        state.audio = audio;
    } else {
        const audio = footer.querySelector("#songs-audio");
        if (audio) state.audio = audio;
    }
}

function clearFadeInterval(state) {
    if (state._fadeInterval) {
        clearInterval(state._fadeInterval);
        state._fadeInterval = null;
    }
}

function playSong(song, state, startTime = 0) {
    if (!song || !song.audioUrl) return;
    createPlayerFooter(state.container, state);
    const audio = state.audio;
    if (!audio) return;

    if (state.currentSong === song && !audio.paused) {
        audio.pause();
        console.log(`[player] Paused: ${song.title}`);
        return;
    }

    const switchSong = () => {
        audio.src = `${song.audioUrl}${song.audioextn || ""}`;
        audio.currentTime = startTime;
        audio.volume = state.volume;
        audio.play();
        state.currentSong = song;
        console.log(`[player] Playing: ${song.title}`);
    };

    if (audio.src && !audio.paused && state.crossfadeDuration > 0 && state.currentSong) {
        clearFadeInterval(state);
        const fadeTime = state.crossfadeDuration;
        const step = 50;
        const steps = Math.max(1, Math.floor((fadeTime * 1000) / step));
        let vol = audio.volume;
        const volDelta = vol / steps;
        state._fadeInterval = setInterval(() => {
            vol -= volDelta;
            if (vol <= 0) {
                clearFadeInterval(state);
                audio.pause();
                audio.volume = state.volume;
                switchSong();
            } else audio.volume = Math.max(0, vol);
        }, step);
    } else {
        switchSong();
    }
}

function playNextSong(state) {
    if (!state.queue?.length) return;
    state.currentIndex = state.shuffle ? Math.floor(Math.random() * state.queue.length) : (state.currentIndex + 1) % state.queue.length;
    playSong(state.queue[state.currentIndex], state);
}

function playPrevSong(state) {
    if (!state.queue?.length) return;
    state.currentIndex = state.shuffle ? Math.floor(Math.random() * state.queue.length) : (state.currentIndex - 1 + state.queue.length) % state.queue.length;
    playSong(state.queue[state.currentIndex], state);
}

export function initPlayer(container) {
    const state = {
        audio: null,
        currentSong: null,
        currentIndex: -1,
        queue: [],
        container,
        repeat: "all",
        shuffle: false,
        volume: 1,
        crossfadeDuration: 2,
        _fadeInterval: null
    };
    createPlayerFooter(container, state);

    const player = {
        play: (song, idx) => {
            state.currentIndex = typeof idx === "number" ? idx : state.currentIndex;
            playSong(song, state);
            activePlayer = player;
        },
        setQueue: (songs) => {
            state.queue = songs || [];
            state.currentIndex = -1;
            console.log(`[player] Queue set with ${songs.length} songs`);
        },
        playNext: () => playNextSong(state),
        playPrev: () => playPrevSong(state),
        reset: () => {
            clearFadeInterval(state);
            if (state.audio) state.audio.pause();
            state.currentIndex = -1;
            state.currentSong = null;
            state.queue = [];
            console.log("[player] Reset");
        },
        getState: () => state
    };
    activePlayer = player;
    return player;
}

// Keyboard shortcuts
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

// ------------------------ UI ------------------------
function createPlayButton(song, idx, player = null) {
    const btn = createElement("button", { class: "song-play-btn" }, ["▶"]);
    if (!song.audioUrl) { btn.disabled = true; return btn; }
    if (player) {
        btn.addEventListener("click", () => player.play(song, idx));
        song._playBtn = btn;
    }
    return btn;
}

export function createSongRow(song, idx, player = null, batchSelection = null) {
    song.poster = song.poster ? resolveImagePath(EntityType.SONG, PictureType.THUMB, song.poster) : "/placeholder.png";
    song.audioUrl = song.audioUrl ? resolveImagePath(EntityType.SONG, PictureType.AUDIO, song.audioUrl) : null;
    console.log(song.poster);
    console.log(song.audioUrl);
    const playBtn = createPlayButton(song, idx, player);
    const poster = createElement("img", { src: song.poster, alt: song.title, class: "song-poster" });
    const title = createElement("div", { class: "song-title" }, [song.title || "Untitled"]);
    const meta = createElement("div", { class: "song-meta" }, [`${song.genre || ""} • ${song.duration || ""}`]);

    const rowChildren = [playBtn, poster, title, meta];

    if (batchSelection) {
        const checkbox = createElement("input", { type: "checkbox" });
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) batchSelection.add(song.songid);
            else batchSelection.delete(song.songid);
        });
        rowChildren.unshift(checkbox);
    }

    return createElement("div", { class: "song-row" }, rowChildren);
}

function renderSongsSection(title, songs, container, player = null, batchSelection = null, loadMore = null) {
    if (!songs?.length) return;
    const section = createElement("div", { class: "music-section" }, [createElement("h3", {}, [title])]);
    const list = createElement("div", { class: "songs-table" });

    songs.forEach((song, idx) => list.append(createSongRow(song, idx, player, batchSelection)));
    section.append(list);

    if (typeof loadMore === "function") {
        const loadMoreBtn = createElement("button", {}, ["Load More"]);
        loadMoreBtn.addEventListener("click", async () => {
            const moreSongs = await loadMore();
            if (!moreSongs.length) Notify("No more songs", { type: "info" });
            else moreSongs.forEach((s, idx) => list.append(createSongRow(s, idx + songs.length, player, batchSelection)));
        });
        section.append(loadMoreBtn);
    }

    container.append(section);

    if (player?.setQueue) player.setQueue(songs);
}

// Cards
function createPlaylistCard(playlist, container, player) {
    const card = createElement("div", { class: "playlist-card" }, [
        createElement("p", {}, [playlist.name || "Untitled Playlist"]),
        createElement("small", {}, [`${playlist.songs?.length || 0} songs`])
    ]);

    const viewBtn = createElement("button", {}, ["View"]);
    viewBtn.addEventListener("click", () => loadPlaylistSongs(playlist.playlistID, container, player));

    const delBtn = createElement("button", {}, ["Delete"]);
    delBtn.addEventListener("click", async () => {
        await safeFetch(`/musicon/playlists/${playlist.playlistID}`, "DELETE");
        displayMusic(container, true, player);
    });

    card.append(viewBtn, delBtn);
    return card;
}

function createAlbumCard(album, container, player) {
    const card = createElement("div", { class: "album-card" }, [
        createElement("p", {}, [album.title || "Untitled Album"]),
        createElement("small", {}, [`${album.songs?.length || 0} songs`])
    ]);
    card.addEventListener("click", () => loadAlbumSongs(album.albumID, album.title, container, player));
    return card;
}

// ------------------------ Top-level display ------------------------
export async function displayMusic(container, isLoggedIn) {
    const player = initPlayer(container);
    container.replaceChildren(createElement("p", {}, ["Loading music..."]));
    try {
        const artistID = "DuyT07tvXg7f";
        const [playlists, albums, recommended, recommendedAlbums, artistSongs, personalized] = await Promise.all([
            isLoggedIn ? fetchUserPlaylists() : [],
            fetchAlbums(),
            fetchRecommendedSongs(),
            fetchRecommendedAlbums(),
            fetchArtistSongs(artistID),
            isLoggedIn ? fetchPersonalizedRecommendations() : []
        ]);

        container.replaceChildren();

        if (playlists.length) container.append(...playlists.map(pl => createPlaylistCard(pl, container, player)));
        if (albums.length) container.append(...albums.map(a => createAlbumCard(a, container, player)));
        if (recommended.length) renderSongsSection("Recommended for You", recommended, container, player);
        if (personalized.length) renderSongsSection("Because You Listened", personalized, container, player);
        if (artistSongs.length) renderSongsSection("Artist Songs", artistSongs, container, player);

        if (!playlists.length && !albums.length && !recommended.length && !personalized.length && !artistSongs.length)
            container.append(createElement("p", {}, ["No music available."]));

    } catch (err) {
        console.error("[displayMusic] Error:", err);
        Notify("Failed to load music", { type: "error" });
        container.replaceChildren(createElement("p", {}, ["Error loading music."]));
    }
}

export async function loadPlaylistSongs(playlistID, container, player) {
    container.replaceChildren(createElement("p", {}, ["Loading playlist..."]));
    const songs = await fetchPlaylistSongs(playlistID);
    container.replaceChildren();

    if (!songs.length) { container.append(createElement("p", {}, ["No songs in this playlist."])); return; }

    const batchSelection = new Set();
    const batchActions = createElement("div", { class: "batch-actions" });
    const addBtn = createElement("button", {}, ["Add to Queue"]);
    addBtn.addEventListener("click", () => {
        const selected = songs.filter(s => batchSelection.has(s.songid));
        if (!selected.length) return Notify("No songs selected", { type: "info" });
        player?.setQueue?.(selected);
        Notify(`${selected.length} songs added to queue`);
    });

    const removeBtn = createElement("button", {}, ["Remove from Playlist"]);
    removeBtn.addEventListener("click", async () => {
        const selected = Array.from(batchSelection);
        if (!selected.length) return Notify("No songs selected", { type: "info" });
        await Promise.all(selected.map(id => safeFetch(`/musicon/playlists/${playlistID}/songs/${id}`, "DELETE")));
        Notify(`${selected.length} songs removed`);
        loadPlaylistSongs(playlistID, container, player);
    });

    batchActions.append(addBtn, removeBtn);
    container.append(batchActions);

    renderSongsSection("Playlist Songs", songs, container, player, batchSelection, async () => {
        const offset = songs.length;
        return await fetchPlaylistSongs(playlistID, offset);
    });

    const searchInput = createElement("input", { placeholder: "Search songs...", style: "margin:5px 0;" });
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        container.querySelectorAll(".song-row").forEach(row => {
            const titleEl = row.querySelector(".song-title");
            const title = titleEl ? titleEl.textContent.toLowerCase() : "";
            row.style.display = title.includes(query) ? "" : "none";
        });
    });
    container.prepend(searchInput);
}

export async function loadAlbumSongs(albumID, albumTitle, container, player) {
    container.replaceChildren(createElement("p", {}, ["Loading album..."]));
    const songs = await fetchAlbumSongs(albumID);
    container.replaceChildren();

    if (!songs.length) { container.append(createElement("p", {}, ["No songs in this album."])); return; }

    renderSongsSection(albumTitle, songs, container, player, null, async () => {
        const offset = songs.length;
        return await fetchAlbumSongs(albumID, offset);
    });
}
