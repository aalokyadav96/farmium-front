import { SRC_URL, apiFetch } from "../../api/api.js";
import MiniAudio from "../../components/ui/MiniAudio.mjs";
import { createElement } from "../../components/createElement.js";
import Modal from "../../components/ui/Modal.mjs";
import Button from "../../components/base/Button.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

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

        const list = createElement("ul");
        songs.forEach(song => {
            if (!song.published && !isCreator) return;

            const li = createElement("li");
            li.append(
                createElement("strong", {}, [song.title]),
                document.createTextNode(` (${song.genre}) - ${song.duration}`)
            );

            if (song.description) {
                li.appendChild(createElement("p", {}, [song.description]));
            }

            if (song.poster) {
                // song.poster = `${SRC_URL}/artistpic/posters/${song.poster}`;
                song.poster = resolveImagePath(EntityType.SONG, PictureType.THUMB, song.poster);
            }

            if (song.audioUrl) {
                // song.audioUrl = `${SRC_URL}/uploads/song/audio/${song.audioUrl}`;
                song.audioUrl = resolveImagePath(EntityType.SONG, PictureType.AUDIO, song.audioUrl);
                li.appendChild(MiniAudio(song));
            }

            if (isCreator) {
                const actions = createElement("div", { class: "song-actions" });

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
                li.appendChild(actions);
            }

            list.appendChild(li);
        });

        container.appendChild(list);
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

// 🧱 Shared form creator
function createSongForm(song = {}) {
    const audioInput = createElement("input", { type: "file", name: "audio", accept: "audio/*" });
    const audioPreview = createElement("audio", { controls: true, style: "display:none; margin-top:10px;" });

    const imageInput = createElement("input", { type: "file", name: "poster", accept: "image/*" });
    const imagePreview = createElement("img", { style: "display:none; max-height:120px; margin-top:10px;" });

    setupFilePreview(audioInput, audioPreview, "audio");
    setupFilePreview(imageInput, imagePreview, "image");

    return createElement("form", { class: "song-form" }, [
        createElement("input", {
            type: "text",
            name: "title",
            value: song.title || "",
            placeholder: "Song Title",
            required: true,
        }),
        createElement("input", {
            type: "text",
            name: "genre",
            value: song.genre || "",
            placeholder: "Genre",
            required: true,
        }),
        createElement("input", {
            type: "text",
            name: "duration",
            value: song.duration || "",
            placeholder: "Duration",
            required: true,
        }),
        createElement("input", {
            type: "text",
            name: "description",
            value: song.description || "",
            placeholder: "Description (optional)",
        }),
        audioInput, audioPreview,
        imageInput, imagePreview,
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

        // Optional: revokeObjectURL after some delay or on form close
    });
}

export {
    renderSongsTab,
};
