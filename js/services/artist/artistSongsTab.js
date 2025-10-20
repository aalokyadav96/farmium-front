// songsTab.js
import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import Imagex from "../../components/base/Imagex.js";

import {
    createPlayerFooter,
    playSong,
    setSongQueue,
    setCurrentIndex
} from "./player.js";
import Notify from "../../components/ui/Notify.mjs";
import { openSongModal } from "./songModal.js";


// ------------------------ Render Songs Tab ------------------------
async function renderSongsTab(container, artistID, isCreator) {
    try {
        const songs = await apiFetch(`/artists/${artistID}/songs`, "GET");
        container.replaceChildren();

        if (isCreator) {
            const uploadButton = createElement("button", { class: "open-upload-modal" }, ["Upload New Song"]);
            uploadButton.addEventListener("click", () => openSongModal({ mode: "upload", artistID, container, isCreator }));
            container.appendChild(uploadButton);
        }

        if (!songs.length) {
            container.appendChild(createElement("p", {}, ["No songs available."]));
            return;
        }

        const list = createElement("div", { class: "songs-table" });
        const queue = [];

        songs.forEach((song, idx) => {
            if (!song.published && !isCreator) return;

            song.poster = song.poster ? resolveImagePath(EntityType.SONG, PictureType.THUMB, song.poster) : "/placeholder.png";
            console.log("song.poster", song.poster);
            
            song.audioUrl = song.audioUrl ? resolveImagePath(EntityType.SONG, PictureType.AUDIO, song.audioUrl) : null;


            const playBtn = createElement("button", { class: "song-play-btn" });
            playBtn.innerHTML = "▶"; // replace with playSVG if needed
            song._playBtn = playBtn;

            playBtn.addEventListener("click", () => {
                setCurrentIndex(idx);
                playSong(song, container);
            });

            const poster = Imagex({ src: song.poster, alt: song.title, classes: "song-poster" });

            const info = createElement("div", { class: "song-info" }, [
                createElement("div", { class: "song-title" }, [song.title]),
                createElement("div", { class: "song-meta" }, [`${song.genre} • ${song.duration}`]),
                song.description ? createElement("div", { class: "song-desc" }, [song.description]) : null
            ]);

            let actions = null;
            if (isCreator) {
                actions = createElement("div", { class: "song-actions" });
                const editBtn = createElement("button", {}, ["Edit"]);
                editBtn.addEventListener("click", () => openSongModal({ mode: "edit", song, artistID, container, isCreator }));
                const delBtn = createElement("button", {}, ["Delete"]);
                delBtn.addEventListener("click", async () => {
                    if (!confirm(`Delete "${song.title}"?`)) return;
                    await apiFetch(`/artists/${artistID}/songs/${encodeURIComponent(song.songid)}`, "DELETE");
                    await renderSongsTab(container, artistID, isCreator);
                });
                actions.append(editBtn, delBtn);
            }

            const row = createElement("div", { class: "song-row" }, [
                playBtn,
                poster,
                info,
                actions
            ]);

            list.appendChild(row);
            queue.push(song);
        });

        container.appendChild(list);
        setSongQueue(queue);
        createPlayerFooter(container);
    } catch (err) {
        console.error(err);
        container.replaceChildren(createElement("p", {}, ["Error loading songs."]));
    }
}



export { renderSongsTab };
