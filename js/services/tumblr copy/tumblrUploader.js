import { createEl } from "./tumblrHelpers.js";
import { uploadFile } from "../media/api/mediaApi.js";

// ------------------- Config -------------------
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 400;

// ------------------- Helpers -------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries - 1) throw err;
      await sleep(RETRY_DELAY_BASE * (i + 1));
    }
  }
}

function validateFile(file, type) {
  if (!file) return false;
  const maxSize = type === "video" ? 300 * 1024 * 1024 : 10 * 1024 * 1024;
  const validType =
    (type === "image" && file.type.startsWith("image/")) ||
    (type === "video" && file.type.startsWith("video/")) ||
    (type === "poster" && file.type.startsWith("image/"));
  return validType && file.size <= maxSize;
}

// ------------------- Single Upload -------------------
export async function handleFileUpload(file, mediaEntity, fileType, previewContainer = null) {
  if (!validateFile(file, fileType)) {
    throw new Error(`Invalid ${fileType} file: ${file?.name}`);
  }

  const progressEl = previewContainer
    ? createEl("div", { class: ["upload-progress"] }, [`Uploading: ${file.name}`])
    : null;

  if (previewContainer) previewContainer.appendChild(progressEl);

  const uploadMeta = { id: crypto.randomUUID(), mediaEntity, file, fileType };

  try {
    const result = await retry(() => uploadFile(uploadMeta));
    if (progressEl) progressEl.textContent = `✔ ${file.name} uploaded`;
    return Array.isArray(result) ? result[0] : result;
  } catch (err) {
    if (progressEl) progressEl.textContent = `✖ ${file.name} failed`;
    console.error("Upload error:", err);
    throw err;
  }
}

// ------------------- Batch Uploads -------------------
export async function uploadFilesInBatches(files, mediaEntity, previewContainer, maxConcurrent = 3, fileType = "image") {
  const queue = Array.from(files);
  const results = [];

  async function worker() {
    while (queue.length > 0) {
      const file = queue.shift();
      try {
        const uploaded = await handleFileUpload(file, mediaEntity, fileType, previewContainer);
        results.push({
          filename: uploaded.filename,
          extn: uploaded.extn,
          key: uploaded.key,
        });
      } catch (_) {
        // Continue on error
      }
    }
  }

  const workers = Array(Math.min(maxConcurrent, queue.length)).fill(null).map(worker);
  await Promise.all(workers);
  return results;
}
