// loaders.js
import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";
import { MusicAPI } from "./fetchers.js";
import { getContentContainer, showLoadingOverlay, hideLoadingOverlay } from "./uiHelpers.js";
import { renderSongsSection } from "./sections.js";


// ------------------------ loadPlaylistSongs / loadAlbumSongs (use content area, improve error handling) ------------------------
export async function loadPlaylistSongs(playlistID, container, player) {
    const content = getContentContainer(container);
    showLoadingOverlay(content, "Loading playlist...");
    const songs = await MusicAPI.playlistSongs(playlistID);
    hideLoadingOverlay(content);

    content.replaceChildren();

    if (!songs.length) { content.append(createElement("p", {}, ["No songs in this playlist."])); return; }

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
        try {
            await Promise.all(selected.map(id => MusicAPI.removeSongFromPlaylist(playlistID, id)));
            Notify(`${selected.length} songs removed`);
            // reload playlist
            loadPlaylistSongs(playlistID, container, player);
        } catch (err) {
            console.error("[remove] Error:", err);
            Notify("Failed to remove songs", { type: "error" });
        }
    });

    batchActions.append(addBtn, removeBtn);
    content.append(batchActions);

    renderSongsSection("Playlist Songs", songs, content, player, batchSelection, async () => {
        const offset = songs.length;
        return await MusicAPI.playlistSongs(playlistID, offset);
    });

    const searchInput = createElement("input", { placeholder: "Search songs...", style: "margin:5px 0;" });
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        content.querySelectorAll(".song-row").forEach(row => {
            const titleEl = row.querySelector(".song-title");
            const title = titleEl ? (titleEl.firstChild?.textContent || "") : "";
            row.style.display = title.toLowerCase().includes(query) ? "" : "none";
        });
    });
    content.prepend(searchInput);
}

export async function loadAlbumSongs(albumID, albumTitle, container, player) {
    const content = getContentContainer(container);
    showLoadingOverlay(content, "Loading album...");
    const songs = await MusicAPI.albumSongs(albumID);
    hideLoadingOverlay(content);

    content.replaceChildren();

    if (!songs.length) { content.append(createElement("p", {}, ["No songs in this album."])); return; }

    renderSongsSection(albumTitle, songs, content, player, null, async () => {
        const offset = songs.length;
        return await MusicAPI.albumSongs(albumID, offset);
    });
}
