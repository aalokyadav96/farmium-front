import { SRC_URL, apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import Modal from "../../components/ui/Modal.mjs";
import Button from "../../components/base/Button.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { playSVG, PauseSVG } from "../../components/svgs.js";

// 🎵 Global State
let currentAudio = null;
let currentPlayBtn = null;
let currentIndex = -1;
let songQueue = [];
let isShuffle = false;
let isAutoplay = true;

// 🎵 Footer Player (inside container)
function createPlayerFooter(container) {
    let footer = container.querySelector(".songs-footer");
    if (footer) return footer;

    footer = createElement("footer", { class: "songs-footer" });

    const audio = createElement("audio", { id: "songs-audio", controls: true });

    const shuffleBtn = createElement("button", { class: "shuffle-btn" }, ["Shuffle"]);
    shuffleBtn.addEventListener("click", () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle("active", isShuffle);
    });

    const autoplayBtn = createElement("button", { class: "autoplay-btn" }, ["Autoplay"]);
    autoplayBtn.addEventListener("click", () => {
        isAutoplay = !isAutoplay;
        autoplayBtn.classList.toggle("active", isAutoplay);
    });

    footer.append(shuffleBtn, autoplayBtn, audio);
    container.appendChild(footer);

    audio.addEventListener("ended", () => {
        if (isAutoplay) playNextSong(container);
    });

    return footer;
}

// 🎵 Play Next Song
function playNextSong(container) {
    if (!songQueue.length) return;

    if (isShuffle) {
        currentIndex = Math.floor(Math.random() * songQueue.length);
    } else {
        currentIndex = (currentIndex + 1) % songQueue.length;
    }

    const song = songQueue[currentIndex];
    if (song) {
        playSong(song, container);
    }
}

// 🎵 Play Song
function playSong(song, container) {
    const footer = createPlayerFooter(container);
    const audio = footer.querySelector("#songs-audio");

    if (!song.audioUrl) return;

    if (currentAudio && currentAudio.src === song.audioUrl && !audio.paused) {
        audio.pause();
        if (currentPlayBtn) currentPlayBtn.innerHTML = playSVG;
        return;
    }

    if (currentPlayBtn) currentPlayBtn.innerHTML = playSVG;

    audio.src = song.audioUrl;
    audio.play();
    currentAudio = audio;

    if (song._playBtn) {
        song._playBtn.innerHTML = PauseSVG;
        currentPlayBtn = song._playBtn;
    }
}

async function renderSongsTab(container, artistID, isCreator) {
    try {
        const songs = await apiFetch(`/artists/${artistID}/songs`);
        container.replaceChildren();

        if (isCreator) {
            const uploadButton = Button("Upload New Song", "", {
                click: () => {
                    openSongModal({ mode: "upload", artistID, container, isCreator });
                }
            }, "open-upload-modal");
            container.appendChild(uploadButton);
        }

        if (!songs.length) {
            container.appendChild(createElement("p", {}, ["No songs available."]));
            return;
        }

        const list = createElement("div", { class: "songs-table" }, []);

        songQueue = [];
        currentIndex = -1;

        songs.forEach((song, idx) => {
            if (!song.published && !isCreator) return;

            song.poster = song.poster
                ? resolveImagePath(EntityType.SONG, PictureType.THUMB, song.poster)
                : "/placeholder.png";

            song.audioUrl = song.audioUrl
                ? resolveImagePath(EntityType.SONG, PictureType.AUDIO, song.audioUrl)
                : null;

            // Play Button
            const playBtn = createElement("button", { class: "song-play-btn" });
            playBtn.innerHTML = playSVG;
            song._playBtn = playBtn;

            playBtn.addEventListener("click", () => {
                currentIndex = idx;
                playSong(song, container);
            });

            // Poster
            const poster = createElement("img", {
                src: song.poster,
                alt: song.title,
                class: "song-poster"
            });

            // Info
            const info = createElement("div", { class: "song-info" }, [
                createElement("div", { class: "song-title" }, [song.title]),
                createElement("div", { class: "song-meta" }, [`${song.genre} • ${song.duration}`]),
                song.description ? createElement("div", { class: "song-desc" }, [song.description]) : null
            ]);

            // Actions
            let actions = null;
            if (isCreator) {
                actions = createElement("div", { class: "song-actions" });

                const editBtn = Button("Edit", "", {
                    click: () => {
                        openSongModal({ mode: "edit", song, artistID, container, isCreator });
                    }
                }, "edit-song-btn buttonx");

                const delBtn = Button("Delete", "", {
                    click: async () => {
                        if (!confirm(`Delete "${song.title}"?`)) return;
                        try {
                            await apiFetch(`/artists/${artistID}/songs/${encodeURIComponent(song.songid)}`, "DELETE");
                            await renderSongsTab(container, artistID, isCreator);
                        } catch (err) {
                            console.error("Delete failed:", err);
                            alert("Delete failed.");
                        }
                    }
                }, "delete-song-btn buttonx");

                actions.append(editBtn, delBtn);
            }

            const row = createElement("div", { class: "song-row" }, [
                playBtn,
                poster,
                info,
                actions
            ]);

            list.appendChild(row);
            songQueue.push(song);
        });

        container.appendChild(list);

        // Attach footer player at the bottom of tab
        createPlayerFooter(container);
    } catch (err) {
        console.error(err);
        container.replaceChildren(createElement("p", {}, ["Error loading songs."]));
    }
}

// 🔄 Upload or Edit Modal
function openSongModal({ mode, song = {}, artistID, container, isCreator }) {
    const isEdit = mode === "edit";
    const form = createSongForm(song);

    const closeModal = () => { form.closest(".modal")?.remove(); document.body.style.overflow = ""; }
    const modal = Modal({
        title: isEdit ? `Edit Song: ${song.title}` : "Upload New Song",
        content: form,
        onClose: closeModal,
    });

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const formData = new FormData(form);
        try {
            const url = isEdit
                ? `/artists/${artistID}/songs/${encodeURIComponent(song.songid)}/edit`
                : `/artists/${artistID}/songs`;
            const method = isEdit ? "PUT" : "POST";

            await apiFetch(url, method, formData);
            closeModal();
            await renderSongsTab(container, artistID, isCreator);
        } catch (err) {
            console.error(`${isEdit ? "Edit" : "Upload"} failed:`, err);
            alert(`${isEdit ? "Edit" : "Upload"} failed. Try again.`);
        }
    });
}

// 🧱 Shared form creator using createFormGroup
function createSongForm(song = {}) {
    const audioPreview = createElement("audio", { controls: true, style: "display:none; margin-top:10px;" });
    const imagePreview = createElement("img", { style: "display:none; max-height:120px; margin-top:10px;" });

    const audioGroup = createFormGroup({
        type: "file", name: "audio", label: "Audio File", accept: "audio/*", additionalNodes: [audioPreview]
    });

    const imageGroup = createFormGroup({
        type: "file", name: "poster", label: "Poster Image", accept: "image/*", additionalNodes: [imagePreview]
    });

    const audioInput = audioGroup.querySelector("input");
    const imageInput = imageGroup.querySelector("input");
    setupFilePreview(audioInput, audioPreview, "audio");
    setupFilePreview(imageInput, imagePreview, "image");

    return createElement("form", { class: "song-form" }, [
        createFormGroup({ type: "text", name: "title", id: "title", label: "Title", value: song.title || "", placeholder: "Song Title", required: true }),
        createFormGroup({ type: "text", name: "genre", id: "genre", label: "Genre", value: song.genre || "", placeholder: "Genre", required: true }),
        createFormGroup({ type: "text", name: "duration", id: "duration", label: "Duration", value: song.duration || "", placeholder: "Duration", required: true }),
        createFormGroup({ type: "text", name: "description", id: "description", label: "Description", value: song.description || "", placeholder: "Description (optional)" }),
        audioGroup,
        imageGroup,
        createElement("button", { type: "submit" }, [song.songid ? "Save Changes" : "Add Song"]),
    ]);
}

// 🎧 File preview
function setupFilePreview(input, preview, type) {
    input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) {
            preview.style.display = "none";
            return;
        }

        const url = URL.createObjectURL(file);
        if (type === "audio" && file.type.startsWith("audio/")) {
            preview.src = url; preview.load(); preview.style.display = "block";
        }
        if (type === "image" && file.type.startsWith("image/")) {
            preview.src = url; preview.style.display = "block";
        }
    });
}

export {
    renderSongsTab,
};