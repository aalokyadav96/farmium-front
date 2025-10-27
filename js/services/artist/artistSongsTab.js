// songsTab.js
import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Imagex from "../../components/base/Imagex.js";
import { initPlayer, setSongQueue, resetPlayer, createPlayerFooter } from "./player.js";
import Notify from "../../components/ui/Notify.mjs";
import { openSongModal } from "./songModal.js";

// ------------------------ Helpers ------------------------

async function fetchSongs(artistID) {
    try {
        return await apiFetch(`/artists/${artistID}/songs`, "GET");
    } catch (err) {
        console.error("Error fetching songs:", err);
        return [];
    }
}

function createUploadButton(artistID, container, isCreator) {
    return Button("Upload New Song", "button", {
        "click": () => openSongModal({ mode: "upload", artistID, container, isCreator })
    }, "open-upload-modal");
}

function createSongInfo(song) {
    const info = createElement("div", { class: "song-info" });
    const title = createElement("div", { class: "song-title" }, [song.title || "Untitled"]);
    const metaText = [song.genre, song.duration].filter(Boolean).join(" • ");
    const meta = createElement("div", { class: "song-meta" }, [metaText]);
    const desc = song.description ? createElement("div", { class: "song-desc" }, [song.description]) : null;

    info.append(title, meta);
    if (desc) info.append(desc);
    return info;
}

function createSongActions(song, artistID, container, isCreator) {
    if (!isCreator) return null;

    const actions = createElement("div", { class: "song-actions" });

    const editBtn = Button("Edit", "button", {
        "click": () => openSongModal({ mode: "edit", song, artistID, container, isCreator })
    });

    const delBtn = Button("Delete", "button", {
        "click": async () => {
            if (!confirm(`Delete "${song.title}"?`)) return;
            const row = delBtn.closest(".song-row");
            row?.remove();
            await apiFetch(`/artists/${artistID}/songs/${encodeURIComponent(song.songid)}`, "DELETE");
            Notify("Song deleted");
        }
    });

    actions.append(editBtn, delBtn);
    return actions;
}

function createPlayButton(song, idx, player) {
    const btn = createElement("button", { class: "song-play-btn" }, ["▶"]);

    if (!song.audioUrl) {
        btn.disabled = true;
        return btn;
    }

    btn.addEventListener("click", () => player.play(song, idx));
    song._playBtn = btn;
    return btn;
}

export function createSongRow(song, idx, artistID, player, isCreator) {
    song.poster = song.poster ? resolveImagePath(EntityType.SONG, PictureType.THUMB, song.poster) : "/placeholder.png";
    song.audioUrl = song.audioUrl ? resolveImagePath(EntityType.SONG, PictureType.AUDIO, song.audioUrl) : null;

    const playBtn = createPlayButton(song, idx, player);
    const poster = Imagex({ src: song.poster, alt: song.title, classes: "song-poster" });
    const info = createSongInfo(song);
    const actions = createSongActions(song, artistID, player.container, isCreator);

    const rowChildren = [playBtn, poster, info];
    if (actions) rowChildren.push(actions);

    return createElement("div", { class: "song-row" }, rowChildren);
}

function createSongsList(songs, artistID, player, isCreator, container) {
    const list = createElement("div", { class: "songs-table" });
    const queue = [];

    songs.forEach((song, idx) => {
        if (!song.published && !isCreator) return;
        const row = createSongRow(song, idx, artistID, player, isCreator);
        list.append(row);
        queue.push(song);
    });

    setSongQueue(queue);
    createPlayerFooter(container);
    return list;
}

// ------------------------ Main Renderer ------------------------

async function renderSongsTab(container, artistID, isCreator) {
    resetPlayer();
    const player = initPlayer(container);
    const songs = await fetchSongs(artistID);

    container.replaceChildren();

    if (isCreator) container.append(createUploadButton(artistID, container, isCreator));

    if (!songs.length) {
        container.append(createElement("p", {}, ["No songs available."]));
        return;
    }

    const list = createSongsList(songs, artistID, player, isCreator, container);
    container.append(list);
}

export { renderSongsTab };
