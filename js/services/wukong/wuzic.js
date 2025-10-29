// wuzic.js

import { createElement } from "../../components/createElement.js";
import Notify from "../../components/ui/Notify.mjs";
import { MusicAPI } from "./fetchers.js";
import {initPlayer} from "./player.js";
import { getContentContainer, showLoadingOverlay, hideLoadingOverlay } from "./uiHelpers.js";
import { ensureToolbar, ensureBackButton } from "./toolbar.js";
import { createPlaylistCard, createAlbumCard } from "./cards.js";
import { renderSongsSection } from "./sections.js";

// ------------------------ Page Back Button ------------------------
function createBackButton(container, player, isLoggedIn) {
    ensureBackButton(container, player, isLoggedIn);
}


// ------------------------ Main displayMusic (uses content wrapper and overlay, avoids duplicate toolbar/back) ------------------------
export async function displayMusic(xcon, isLoggedIn) {
    let container = createElement("div",{"class":"musicon"},[]);
    xcon.appendChild(container);
    let suppliedPlayer = initPlayer(container);
    // ensure toolbar/back exist and do not duplicate
    ensureToolbar(container, suppliedPlayer, isLoggedIn);
    ensureBackButton(container, suppliedPlayer, isLoggedIn);

    const player = suppliedPlayer || initPlayer(container);
    const content = getContentContainer(container);

    // show overlay instead of wiping the whole container (prevents scroll loss)
    showLoadingOverlay(content, "Loading music...");

    try {
        const artistID = "zJbQfaZ7pyoq";
        const [
            playlists,
            albums,
            recommended,
            recommendedAlbums,
            artistSongs,
            personalized
        ] = await Promise.all([
            isLoggedIn ? MusicAPI.playlists() : [],
            MusicAPI.albums(),
            MusicAPI.recommendedSongs(),
            MusicAPI.recommendedAlbums(),
            MusicAPI.artistSongs(artistID),
            isLoggedIn ? MusicAPI.personalizedRecommendations() : []
        ]);

        // replace only content area
        content.replaceChildren();

        // top toolbar and back button should remain outside content; content gets page-specific UI
        if (playlists.length) {
            const frag = document.createDocumentFragment();
            playlists.forEach(pl => frag.appendChild(createPlaylistCard(pl, content, player)));
            content.append(frag);
        }
        if (albums.length) {
            const frag = document.createDocumentFragment();
            albums.forEach(a => frag.appendChild(createAlbumCard(a, content, player)));
            content.append(frag);
        }
        if (recommended.length) renderSongsSection("Recommended for You", recommended, content, player);
        if (personalized.length) renderSongsSection("Because You Listened", personalized, content, player);
        if (artistSongs.length) renderSongsSection("Artist Songs", artistSongs, content, player);

        if (!playlists.length && !albums.length && !recommended.length && !personalized.length && !artistSongs.length) {
            content.append(createElement("p", {}, ["No music available."]));
        }
    } catch (err) {
        console.error("[displayMusic] Error:", err);
        Notify("Failed to load music", { type: "error" });
        content.replaceChildren(createElement("p", {}, ["Error loading music."]));
    } finally {
        hideLoadingOverlay(content);
    }
}
