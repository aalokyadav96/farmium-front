import Modal from "../../../components/ui/Modal.mjs";
import { Button } from "../../../components/base/Button.js";
import { createElement } from "../../../components/createElement.js";
import Notify from "../../../components/ui/Notify.mjs";
import Imagex from "../../../components/base/Imagex.js";
import { UploadStore } from "../store/uploadStore.js";
import { uploadFile, postMedia } from "../api/mediaApi.js";

// --- Helper for unique IDs ---
export function uid() {
  return crypto.randomUUID?.() || Math.random().toString(36).substring(2, 9);
}

// --- Main function ---
export function showMediaUploadForm(isLoggedIn, entityType, entityId, mediaList) {
  console.log(entityType);
  const uploadsDiv = createElement("div", { class: "upload-list" });
  const caption = createElement("textarea", { placeholder: "Write a caption...", class: "upload-caption" });

  const fileInput = createElement("input", { 
    type: "file", 
    multiple: true, 
    accept: "image/*,video/*", 
    class: "hidden",
    id: "mediaFileInput"
  });

  const dropZone = createElement("div", { class: "upload-dropzone" }, [
    createElement("label", { for: "mediaFileInput", class: "upload-label" }, ["Select or drop files here"]),
    fileInput
  ]);

  const submit = Button("Upload All", "submitUploadsBtn", { click: () => submitGroupedUploads(caption, uploadsDiv, entityType, entityId, modal) }, "button-primary");
  submit.style.display = "none";

  const content = createElement("div", { class: "upload-container" }, [dropZone, caption, uploadsDiv, submit]);

  const modal = Modal({
    title: "Upload Media",
    content,
    onClose: () => {
      // Optional cleanup if needed
      UploadStore.uploads = [];
    },
    size: "large",
  });

  // --- Drag & Drop ---
  const handleDrop = e => {
    e.preventDefault();
    dropZone.classList.remove("drag-active");
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files, caption, uploadsDiv, submit);
  };

  dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("drag-active"); });
  dropZone.addEventListener("dragleave", e => { e.preventDefault(); dropZone.classList.remove("drag-active"); });
  dropZone.addEventListener("drop", handleDrop);

  // File selection via input
  fileInput.addEventListener("change", e => handleFiles(Array.from(e.target.files), caption, uploadsDiv, submit));
}

// --- Validate files ---
function validateFile(file) {
  const MAX_SIZE_MB = 100;
  const validTypes = ["image/", "video/"];
  if (!validTypes.some(t => file.type.startsWith(t))) throw new Error(`${file.name}: Unsupported file type`);
  if (file.size > MAX_SIZE_MB * 1024 * 1024) throw new Error(`${file.name}: File too large`);
}

// --- Handle files ---
function handleFiles(files, caption, uploadsDiv, submit) {
  try {
    files.forEach(validateFile);
  } catch (err) {
    return Notify(err.message, { type: "error" });
  }

  const newUploads = files.map(f => ({
    id: uid(),
    file: f,
    previewURL: URL.createObjectURL(f),
    progress: 0,
    uploading: true,
    mediaEntity: "media",
  }));

  UploadStore.uploads.push(...newUploads);
  renderUploads(uploadsDiv, submit);

  newUploads.forEach(uploadFileAndTrack);
}

// --- Upload helper ---
async function uploadFileAndTrack(u) {
  const uploadsDiv = document.querySelector(".upload-list");
  const submit = document.getElementById("submitUploadsBtn");
  try {
    const dropData = await uploadFile(u);
    UploadStore.update(u.id, { uploading: false, done: true, dropData, progress: 100 });
    Notify(`Uploaded: ${u.file.name}`, { type: "success" });
  } catch (err) {
    UploadStore.update(u.id, { uploading: false, error: true });
    Notify(err.message || "Upload failed", { type: "error" });
  } finally {
    URL.revokeObjectURL(u.previewURL);
    renderUploads(uploadsDiv, submit);
  }
}

// --- Submit grouped uploads ---
async function submitGroupedUploads(caption, uploadsDiv, entityType, entityId, modal) {
  const ready = UploadStore.uploads.filter(u => u.dropData && !u.serverData);
  if (!ready.length) return Notify("No uploads ready to submit.", { type: "info" });

  const payload = { caption: caption.value, files: ready.map(u => u.dropData) };
  try {
    const res = await postMedia(entityType, entityId, payload);
    if (Array.isArray(res)) {
      ready.forEach((u, i) => UploadStore.update(u.id, { serverData: res[i] }));
      Notify("Media submitted successfully!", { type: "success" });
      modal.close?.(); // close modal after submission
    }
  } catch (err) {
    Notify(err.message || "Failed to submit media", { type: "error" });
  }
}

// --- Render uploads incrementally ---
function renderUploads(uploadsDiv, submit) {
  const fragment = document.createDocumentFragment();

  UploadStore.uploads.forEach(u => {
    const existing = uploadsDiv.querySelector(`[data-id="${u.id}"]`);
    if (existing) return;

    const preview = u.file.type.startsWith("image/")
      ? Imagex({ src: u.previewURL, class: "upload-preview" })
      : createElement("video", { src: u.previewURL, controls: true, class: "upload-preview" });

    const progress = createElement("div", { class: "upload-progress" }, [
      createElement("div", { style: `width:${u.progress}%` })
    ]);

    const card = createElement("div", { class: "upload-card", "data-id": u.id }, [
      preview,
      createElement("p", {}, [u.file.name]),
      progress,
      Button("Remove", "", { click: () => { UploadStore.remove(u.id); renderUploads(uploadsDiv, submit); } }, "button-secondary")
    ]);

    fragment.append(card);
  });

  uploadsDiv.append(fragment);

  submit.style.display = UploadStore.uploads.some(u => u.dropData && !u.serverData)
    ? "inline-block" : "none";
}
