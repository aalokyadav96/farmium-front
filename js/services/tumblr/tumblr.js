import { apiFetch } from "../../api/api";
import { fetchFeed } from "../feed/fetchFeed.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import { renderNewPost } from "../feed/renderNewPost.js";
import {
  createEl,
  createTabButton,
  createPanel,
  createFileInput,
  createPreviewContainer,
  renderPreviewList,
  getCSRFToken
} from "./tumblrHelpers.js";
import { tposts_text, tposts_video, tposts_photo } from "../../components/tumblrSvgs.js";
import { createIconButton } from "../../utils/svgIconButton.js";
import Button from "../../components/base/Button.js";
import { uploadFile } from "../media/api/mediaApi.js";

const MEDIA_ENTITY = "feed";

function appendIfValue(obj, key, el) {
  const val = el?.value.trim();
  if (val) obj[key] = val;
}
function appendTags(obj, el) {
  const tags = el?.value.split(",").map(t => t.trim()).filter(Boolean);
  if (tags.length) obj.tags = tags;
}
function clearChildren(el) {
  el.replaceChildren();
}

const TAB_CONFIG = [
  {
    name: "Text", type: "text", icon: tposts_text,
    fields: [
      { label: "Text", type: "textarea", id: "text-input", placeholder: "Write something…", rows: 4 }
    ]
  },
  {
    name: "Images", type: "image", multiple: true, icon: tposts_photo,
    fields: [
      { label: "Caption", type: "textarea", id: "Images-caption", placeholder: "Add a caption…", rows: 2 },
      { label: "Tags", type: "text", id: "Images-tags", placeholder: "Tags (comma separated)" }
    ]
  },
  {
    name: "Video", type: "video", icon: tposts_video,
    fields: [
      { label: "Title", type: "text", id: "Video-title", placeholder: "Title" },
      { label: "Description", type: "textarea", id: "Video-description", placeholder: "Description", rows: 3 },
      { label: "Tags", type: "text", id: "Video-tags", placeholder: "Tags (comma separated)" }
    ]
  }
];

const uploadCache = {};

async function uploadFilesInBatches(files, mediaEntity, previewContainer, maxConcurrent = 3, fileType = "image") {
  const results = [];
  const queue = [...files];
  async function worker() {
    while (queue.length > 0) {
      const file = queue.shift();
      const progressEl = createEl("div", { class: ["upload-progress"] }, [`Uploading: ${file.name}`]);
      previewContainer.appendChild(progressEl);
      try {
        const uploaded = await handleFileUpload(file, mediaEntity, fileType);
        const data = Array.isArray(uploaded) ? uploaded[0] : uploaded;
        progressEl.textContent = `✔ ${file.name} uploaded`;
        results.push({ filename: data.filename, extn: data.extn, key: data.key });
      } catch {
        progressEl.textContent = `✖ ${file.name} failed`;
      }
    }
  }
  const workers = Array(Math.min(maxConcurrent, files.length)).fill(null).map(() => worker());
  await Promise.all(workers);
  return results;
}

export function displayTumblr(isLoggedIn, root) {
  let activeTab = null;
  let videoThumbnailFile = null;
  const panels = {};
  const tabButtons = {};
  root.replaceChildren();

  const layout = createEl("div", { class: ["tumblr-layout"] });
  const formCon = createEl("div", { class: ["tumblr-form"] });
  const tabHeader = createEl("div", { class: ["tab-header"], role: "tablist" });

  TAB_CONFIG.forEach(cfg => {
    const btn = createTabButton(createIconButton({ svgMarkup: cfg.icon }), () => switchTab(cfg.name));
    btn.dataset.tab = cfg.name;
    tabButtons[cfg.name] = btn;
    tabHeader.appendChild(btn);

    const container = createEl("div", { class: [`${cfg.type}-container`] });
    const cacheKey = `${cfg.type}-input`;
    let input = null, preview = null;

    if (cfg.type !== "text") {
      input = createFileInput(cfg.type, cfg.multiple);
      preview = createPreviewContainer(`${cfg.type}-preview`);
      container.append(input, preview);
    }

    // extra fields
    const fieldEls = cfg.fields.map(field => {
      const group = createFormGroup(field);
      const el = group.querySelector("input, textarea");
      if (el) {
        panels[field.id] = el;
        el.addEventListener("input", checkPublishEnable);
      }
      return group;
    });
    container.append(...fieldEls);

    // type-specific behavior
    if (cfg.type === "image") {
      input.addEventListener("change", async () => {
        try {
          clearChildren(preview);
          renderPreviewList(Array.from(input.files), preview, "image", input, checkPublishEnable);
          uploadCache[cacheKey] = await uploadFilesInBatches(Array.from(input.files), MEDIA_ENTITY, preview, 3, "image");
        } finally { checkPublishEnable(); }
      });
    }
    if (cfg.type === "video") {
      const videoPreview = createEl("video", { controls: true, class: ["preview-video"] });
      preview.append(videoPreview);
      input.addEventListener("change", async () => {
        const file = input.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        videoPreview.src = url;
        try {
          const uploaded = await handleFileUpload(file, MEDIA_ENTITY, "video");
          uploadCache[cacheKey] = [uploaded];
        } finally {
          URL.revokeObjectURL(url);
          checkPublishEnable();
        }
      });
    }

    const panel = createPanel(`${cfg.type}-panel`, [container]);
    panel.style.display = "none";
    panels[cfg.name] = panel;
  });

  const panelWrapper = createEl("div", { class: ["panel-wrapper"] });
  Object.values(panels)
    .filter(p => p.getAttribute("role") === "tabpanel")
    .forEach(panel => panelWrapper.append(panel));

  const publishBtn = createEl("button", { id: "publish-btn", class: ["publish-btn"], disabled: true, style: "display:none" }, ["Publish"]);
  publishBtn.addEventListener("click", handlePublish);

  formCon.append(tabHeader, panelWrapper, publishBtn);
  layout.append(formCon);
  const feedContainer = createEl("div", { id: "postsContainer", class: ["tumblr-feed"] });
  layout.append(feedContainer);
  root.append(layout);

  refreshFeed();

  function switchTab(tabName) {
    if (!panels[tabName]) return;
    activeTab = tabName;
    Object.entries(panels).forEach(([name, panel]) => {
      if (panel.getAttribute("role") === "tabpanel")
        panel.style.display = name === tabName ? "block" : "none";
    });
    Object.entries(tabButtons).forEach(([name, btn]) => {
      const selected = name === tabName;
      btn.setAttribute("aria-selected", selected);
      btn.classList.toggle("active", selected);
    });
    publishBtn.style.display = "inline-block";
    checkPublishEnable();
  }

  function checkPublishEnable() {
    if (!activeTab) return publishBtn.disabled = true;
    const cfg = TAB_CONFIG.find(c => c.name === activeTab);
    const key = `${cfg.type}-input`;
    if (cfg.type === "video") {
      publishBtn.disabled = !(uploadCache[key]?.length && panels["Video-title"].value.trim());
    } else if (cfg.type === "image") {
      publishBtn.disabled = !(uploadCache[key]?.length);
    } else {
      publishBtn.disabled = !panels["text-input"].value.trim();
    }
  }

  async function handlePublish() {
    publishBtn.disabled = true;
    try {
      const payload = await buildJSONPayload();
      const csrfToken = await getCSRFToken();
      const res = await apiFetch("/feed/post", "POST", JSON.stringify(payload), {
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }
      });
      if (!res || res.error) throw new Error(res?.error || "Upload failed");
      renderNewPost([res.data].flat(), 0, feedContainer);
      resetInputs();
      alert("Post published successfully!");
    } catch {
      alert("Failed to publish post.");
    } finally {
      publishBtn.disabled = false;
    }
  }

  function resetInputs() {
    for (const el of Object.values(panels)) {
      if (el instanceof HTMLElement) {
        el.querySelectorAll("input[type='text'], textarea").forEach(i => i.value = "");
      }
    }
    Object.keys(uploadCache).forEach(k => delete uploadCache[k]);
    videoThumbnailFile = null;
    checkPublishEnable();
  }

  async function refreshFeed() {
    try { await fetchFeed(feedContainer); }
    catch { alert("Failed to load feed."); }
  }

  async function buildJSONPayload() {
    const active = TAB_CONFIG.find(c => c.name === activeTab);
    const obj = { type: active.type };
    const key = `${active.type}-input`;
    if (active.type === "text") {
      appendIfValue(obj, "text", panels["text-input"]);
    } else if (active.type === "image") {
      obj.images = uploadCache[key] || [];
      appendIfValue(obj, "caption", panels["Images-caption"]);
      appendTags(obj, panels["Images-tags"]);
    } else if (active.type === "video") {
      obj.video = uploadCache[key]?.[0];
      appendIfValue(obj, "title", panels["Video-title"]);
      appendIfValue(obj, "description", panels["Video-description"]);
      appendTags(obj, panels["Video-tags"]);
    }
    return obj;
  }
}

async function handleFileUpload(file, mediaEntity, fileType) {
  const uploadMeta = { id: crypto.randomUUID(), mediaEntity, file, fileType };
  return uploadFile(uploadMeta);
}

// import { apiFetch } from "../../api/api";
// import { fetchFeed } from "../feed/fetchFeed.js";
// import { createFormGroup } from "../../components/createFormGroup.js";
// import { renderNewPost } from "../feed/renderNewPost.js";
// import { createEl, createTabButton, createPanel, createFileInput, createPreviewContainer, renderPreviewList, getCSRFToken } from "./tumblrHelpers.js";
// import { tposts_text, tposts_video, tposts_photo, } from "../../components/tumblrSvgs.js";
// import { createIconButton } from "../../utils/svgIconButton.js";
// import Button from "../../components/base/Button.js";
// import { uploadFile } from "../media/api/mediaApi.js";

// // ------------------- Helpers -------------------
// function appendIfValue(obj, key, el) {
//   const val = el?.value.trim();
//   if (val) obj[key] = val;
// }
// function appendTags(obj, el) {
//   const tags = el?.value.split(",").map(t => t.trim()).filter(Boolean);
//   if (tags?.length) obj.tags = tags;
// }
// function clearChildren(el) {
//   while (el.firstChild) el.removeChild(el.firstChild);
// }

// // ------------------- Tab Config -------------------
// const TAB_CONFIG = [
//   {
//     name: "Text", type: "text", multiple: false, icon: tposts_text,
//     fields: [
//       { label: "Text", type: "textarea", id: "text-input", placeholder: "Write something…", rows: 4, classList: ["tumblr-textarea"] }
//     ]
//   },
//   {
//     name: "Images", type: "image", multiple: true, icon: tposts_photo,
//     fields: [
//       { label: "Caption", type: "textarea", id: "Images-caption", placeholder: "Add a caption…", rows: 2, classList: ["caption-textarea"] },
//       { label: "Tags", type: "text", id: "Images-tags", placeholder: "Tags (comma separated)", classList: ["tag-input"] }
//     ]
//   },
//   {
//     name: "Video", type: "video", multiple: false, icon: tposts_video,
//     fields: [
//       { label: "Title", type: "text", id: "Video-title", placeholder: "Title", isRequired: true, classList: ["meta-title"] },
//       { label: "Description", type: "textarea", id: "Video-description", placeholder: "Description", rows: 3, classList: ["meta-description"] },
//       { label: "Tags", type: "text", id: "Video-tags", placeholder: "Tags (comma separated)", classList: ["tag-input"] }
//     ]
//   }
// ];

// // ------------------- Upload tracking -------------------
// const uploadCache = {}; // { inputId: [ { filename, extn, key }, ... ] }

// // ------------------- Parallel Upload Helper -------------------
// async function uploadFilesInBatches(files, mediaEntity, previewContainer, maxConcurrent = 3, fileType = "image") {
//   const results = [];
//   const queue = [...files];

//   async function worker() {
//     while (queue.length > 0) {
//       const file = queue.shift();
//       const progressEl = createEl("div", { class: ["upload-progress"] }, [`Uploading: ${file.name}`]);
//       previewContainer.appendChild(progressEl);
//       try {
//         const uploaded = await handleFileUpload(file, mediaEntity, fileType);
//         const data = Array.isArray(uploaded) ? uploaded[0] : uploaded;
//         progressEl.textContent = `✔ ${file.name} uploaded`;
//         results.push({ filename: data.filename, extn: data.extn, key: data.key });
//       } catch (err) {
//         progressEl.textContent = `✖ ${file.name} failed`;
//         console.error("Upload error:", err);
//       }
//     }
//   }

//   const workers = Array(Math.min(maxConcurrent, files.length)).fill(null).map(worker);
//   await Promise.all(workers);
//   return results;
// }

// // ------------------- Main -------------------
// export function displayTumblr(isLoggedIn, root) {
//   let activeTab = null;
//   let videoThumbnailFile = null;
//   const panels = {};
//   const tabButtons = {};

//   root.innerHTML = "";

//   const layout = createEl("div", { class: ["tumblr-layout"] });
//   const formCon = createEl("div", { class: ["tumblr-form"] });
//   const tabHeader = createEl("div", { class: ["tab-header"], role: "tablist" });

//   // --- Create tabs + panels ---
//   TAB_CONFIG.forEach(cfg => {
//     const btn = createTabButton(
//       createIconButton({ svgMarkup: cfg.icon, classSuffix: "clrful" }),
//       () => switchTab(cfg.name)
//     );
//     btn.dataset.tab = cfg.name;
//     tabButtons[cfg.name] = btn;
//     tabHeader.appendChild(btn);

//     const input = cfg.type !== "text" ? createFileInput(cfg.type, cfg.multiple) : null;
//     const preview = cfg.type !== "text" ? createPreviewContainer(`${cfg.type}-preview`) : null;

//     if (input) {
//       if (cfg.type === "video") {
//         // --- Video Upload ---
//         const videoPreview = createEl("video", { controls: true, class: ["preview-video"] });
//         preview.appendChild(videoPreview);

//         input.addEventListener("change", async () => {
//           const file = input.files[0];
//           if (file) {
//             videoPreview.src = URL.createObjectURL(file);
//             const uploaded = await handleFileUpload(file, "feed", "video");
//             uploadCache["Video-input"] = [{ filename: uploaded.filename, extn: uploaded.extn, key: uploaded.key, resolutions: uploaded.resolutions }];
//           }
//           checkPublishEnable();
//         });

//         // --- Video Controls ---
//         const controls = createEl("div", { class: "video-contra" });
//         const volumeRange = createEl("input", { type: "range", min: 0, max: 1, step: 0.05, value: 1 });
//         volumeRange.addEventListener("input", () => videoPreview.volume = parseFloat(volumeRange.value));
//         const speedRange = createEl("input", { type: "range", min: 0.25, max: 3, step: 0.05, value: 1 });
//         speedRange.addEventListener("input", () => videoPreview.playbackRate = parseFloat(speedRange.value));
//         const muteBtn = Button("Mute", "", { click: e => { videoPreview.muted = !videoPreview.muted; e.target.innerText = videoPreview.muted ? "Unmute" : "Mute"; } });
//         controls.append(
//           createEl("label", {}, ["Volume: ", volumeRange]),
//           createEl("label", {}, ["Speed: ", speedRange]),
//           muteBtn
//         );
//         preview.appendChild(controls);

//         // --- Thumbnail Upload / Capture ---
//         const thumbInput = createEl("input", { type: "file", accept: "image/*" });
//         const thumbPreview = createEl("img", { class: "thumbnail-preview", src: "", alt: "Thumbnail preview" });
//         thumbInput.addEventListener("change", async () => {
//           const file = thumbInput.files[0];
//           if (file) {
//             const uploaded = await handleFileUpload(file, "feed", "image");
//             videoThumbnailFile = uploaded;
//             thumbPreview.src = URL.createObjectURL(file);
//           }
//         });
//         // --- Thumbnail Capture Button (optimized) ---
//         const captureBtn = Button("Capture Thumbnail", "", {
//           click: async () => {
//             if (!videoPreview.src) return alert("Select a video first");

//             const canvas = document.createElement("canvas");
//             canvas.width = videoPreview.videoWidth || 640;
//             canvas.height = videoPreview.videoHeight || 360;
//             canvas.getContext("2d").drawImage(videoPreview, 0, 0, canvas.width, canvas.height);

//             canvas.toBlob(async (blob) => {
//               if (!blob) return alert("Failed to capture thumbnail");

//               // Upload directly using Blob without creating a new File
//               const uploaded = await handleFileUpload(blob, "feed", "poster");
//               videoThumbnailFile = uploaded;

//               // Update preview directly from Blob
//               thumbPreview.src = URL.createObjectURL(blob);

//               alert("Thumbnail captured!");
//             }, "image/png");
//           }
//         });

//         preview.appendChild(createEl("div", { class: ["thumbnail-controls"] }, [thumbInput, captureBtn, thumbPreview]));

//         panels[`${cfg.name}-input`] = input;
//         panels[`${cfg.name}-preview`] = preview;
//       } else {
//         // --- Image Upload (parallel, 3 max, progress) ---
//         input.addEventListener("change", async () => {
//           clearChildren(preview);
//           renderPreviewList(Array.from(input.files), preview, cfg.type, input, checkPublishEnable);
//           const uploadedFiles = await uploadFilesInBatches(Array.from(input.files), "feed", preview, 3, "image");
//           uploadCache["Images-input"] = uploadedFiles;
//           checkPublishEnable();
//         });
//         panels[`${cfg.name}-input`] = input;
//         panels[`${cfg.name}-preview`] = preview;
//       }
//     }

//     const extraFields = cfg.fields.map(field => createFormGroup({ ...field, additionalProps: { ...field } }));
//     extraFields.forEach(field => {
//       field.querySelectorAll("input, textarea").forEach(el => {
//         panels[el.id] = el;
//         el.addEventListener("input", checkPublishEnable);
//       });
//     });

//     const content = cfg.type === "text" ? extraFields[0] : createEl("div", { class: ["file-input-wrapper"] }, [input, preview, ...extraFields]);
//     const panel = createPanel(`${cfg.type}-panel`, [content]);
//     panel.style.display = "none";
//     panels[cfg.name] = panel;
//   });

//   const panelWrapper = createEl("div", { class: ["panel-wrapper"] });
//   Object.values(panels)
//     .filter(p => p.getAttribute("role") === "tabpanel")
//     .forEach(panel => panelWrapper.appendChild(panel));

//   const publishBtn = createEl("button", { id: "publish-btn", class: ["publish-btn"], disabled: true, style: "display: none" }, ["Publish"]);
//   publishBtn.addEventListener("click", handlePublish);

//   formCon.appendChild(tabHeader);
//   formCon.appendChild(panelWrapper);
//   formCon.appendChild(publishBtn);
//   layout.appendChild(formCon);

//   const feedContainer = createEl("div", { id: "postsContainer", class: ["tumblr-feed"] });
//   layout.appendChild(feedContainer);
//   root.appendChild(layout);

//   refreshFeed();

//   // ------------------- Core -------------------
//   function switchTab(tabName) {
//     if (!panels[tabName]) return;
//     activeTab = tabName;
//     Object.entries(panels).forEach(([name, panel]) => {
//       if (panel.getAttribute("role") === "tabpanel") panel.style.display = name === tabName ? "block" : "none";
//     });
//     Object.entries(tabButtons).forEach(([name, btn]) => {
//       const selected = name === tabName;
//       btn.setAttribute("aria-selected", selected);
//       btn.classList.toggle("active", selected);
//     });
//     publishBtn.style.display = "inline-block";
//     checkPublishEnable();
//   }

//   function checkPublishEnable() {
//     if (!activeTab) {
//       publishBtn.disabled = true;
//       return;
//     }
//     const cfg = TAB_CONFIG.find(c => c.name === activeTab);
//     if (cfg.type === "video") {
//       const hasFile = uploadCache["Video-input"]?.length === 1;
//       const title = panels["Video-title"]?.value.trim();
//       publishBtn.disabled = !(hasFile && title);
//     } else if (cfg.type === "image") {
//       publishBtn.disabled = !(uploadCache["Images-input"]?.length > 0);
//     } else {
//       publishBtn.disabled = !panels["text-input"]?.value.trim();
//     }
//   }

//   async function handlePublish() {
//     publishBtn.disabled = true;
//     try {
//       const payload = await buildJSONPayload();
//       const csrfToken = await getCSRFToken();
//       const res = await apiFetch("/feed/post", "POST", JSON.stringify(payload), {
//         headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken }
//       });
//       if (!res || res.error) throw new Error(res?.error || "Upload failed");
//       renderNewPost(Array.isArray(res.data) ? res.data : [res.data], 0, feedContainer);
//       resetInputs();
//     } catch (err) {
//       console.error("Publish error:", err);
//     } finally {
//       publishBtn.disabled = false;
//     }
//   }

//   function resetInputs() {
//     Object.entries(panels).forEach(([key, panel]) => {
//       if (panel instanceof HTMLElement) panel.querySelectorAll("input, textarea").forEach(el => el.value = "");
//       if (key.endsWith("-preview") && panel instanceof HTMLElement) clearChildren(panel);
//     });
//     Object.keys(uploadCache).forEach(k => delete uploadCache[k]);
//     videoThumbnailFile = null;
//     checkPublishEnable();
//   }

//   async function refreshFeed() { await fetchFeed(feedContainer); }

//   async function buildJSONPayload() {
//     const active = TAB_CONFIG.find(c => c.name === activeTab);
//     const obj = { type: active.type };

//     if (active.type === "text") {
//       appendIfValue(obj, "text", panels["text-input"]);
//     } else if (active.type === "image") {
//       obj.images = uploadCache["Images-input"] || [];
//       appendIfValue(obj, "caption", panels["Images-caption"]);
//       appendTags(obj, panels["Images-tags"]);
//     } else if (active.type === "video") {
//       obj.video = uploadCache["Video-input"]?.[0];
//       obj.thumbnail = videoThumbnailFile ? {
//         filename: videoThumbnailFile.filename,
//         extn: videoThumbnailFile.extn,
//         key: videoThumbnailFile.key
//       } : null;
//       appendIfValue(obj, "title", panels["Video-title"]);
//       appendIfValue(obj, "description", panels["Video-description"]);
//       appendTags(obj, panels["Video-tags"]);
//     }

//     return obj;
//   }
// }

// async function handleFileUpload(file, mediaEntity, fileType) {
//   const uploadMeta = {
//     id: crypto.randomUUID(), mediaEntity, file, fileType
//   };
//   return await uploadFile(uploadMeta);
// }
