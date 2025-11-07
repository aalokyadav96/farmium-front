import { apiFetch } from "../../api/api";
import { fetchFeed } from "../feed/fetchFeed.js";
import { createFormGroup } from "../../components/createFormGroup.js";
import { renderNewPost } from "../feed/renderNewPost.js";
import { createEl, createTabButton, createPanel, createFileInput, createPreviewContainer, renderPreviewList, getCSRFToken } from "./tumblrHelpers.js";
import { tposts_text, tposts_video, tposts_photo } from "../../components/tumblrSvgs.js";
import { createIconButton } from "../../utils/svgIconButton.js";
import Button from "../../components/base/Button.js";
import { uploadFilesInBatches, handleFileUpload } from "./tumblrUploader.js";

// ------------------- Helpers -------------------
function appendIfValue(obj, key, el) {
  const val = el?.value.trim();
  if (val) obj[key] = val;
}
function appendTags(obj, el) {
  const tags = el?.value.split(",").map(t => t.trim()).filter(Boolean);
  if (tags?.length) obj.tags = tags;
}
function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
function debounce(fn, delay = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ------------------- Tabs -------------------
const TAB_CONFIG = [
  {
    name: "Text", type: "text", multiple: false, icon: tposts_text,
    fields: [{ label: "Text", type: "textarea", id: "text-input", placeholder: "Write something…", rows: 4, classList: ["tumblr-textarea"] }]
  },
  {
    name: "Images", type: "image", multiple: true, icon: tposts_photo,
    fields: [
      { label: "Caption", type: "textarea", id: "Images-caption", placeholder: "Add a caption…", rows: 2, classList: ["caption-textarea"] },
      { label: "Tags", type: "text", id: "Images-tags", placeholder: "Tags (comma separated)", classList: ["tag-input"] }
    ]
  },
  {
    name: "Video", type: "video", multiple: false, icon: tposts_video,
    fields: [
      { label: "Title", type: "text", id: "Video-title", placeholder: "Title", isRequired: true, classList: ["meta-title"] },
      { label: "Description", type: "textarea", id: "Video-description", placeholder: "Description", rows: 3, classList: ["meta-description"] },
      { label: "Tags", type: "text", id: "Video-tags", placeholder: "Tags (comma separated)", classList: ["tag-input"] }
    ]
  }
];

// ------------------- Main -------------------
export function displayTumblr(isLoggedIn, root) {
  const state = { activeTab: null, uploads: {}, videoThumb: null };
  const panels = {};
  const tabButtons = {};

  const debouncedCheck = debounce(checkPublishEnable);

  root.textContent = "";

  const layout = createEl("div", { class: ["tumblr-layout"] });
  const formCon = createEl("div", { class: ["tumblr-form"] });
  const tabHeader = createEl("div", { class: ["tab-header"], role: "tablist" });

  TAB_CONFIG.forEach(cfg => {
    const btn = createTabButton(
      createIconButton({ svgMarkup: cfg.icon, classSuffix: "clrful" }),
      () => switchTab(cfg.name)
    );
    btn.dataset.tab = cfg.name;
    tabButtons[cfg.name] = btn;
    tabHeader.appendChild(btn);

    const input = cfg.type !== "text" ? createFileInput(cfg.type, cfg.multiple) : null;
    const preview = cfg.type !== "text" ? createPreviewContainer(`${cfg.type}-preview`) : null;

    if (cfg.type === "video" && input) setupVideoInput(input, preview, state);
    else if (cfg.type === "image" && input) setupImageInput(input, preview, state);

    const extraFields = cfg.fields.map(field => createFormGroup(field));
    extraFields.forEach(field => {
      field.querySelectorAll("input, textarea").forEach(el => {
        panels[el.id] = el;
        el.addEventListener("input", debouncedCheck);
      });
    });

    const content = cfg.type === "text"
      ? extraFields[0]
      : createEl("div", { class: ["file-input-wrapper"] }, [input, preview, ...extraFields]);

    const panel = createPanel(`${cfg.type}-panel`, [content]);
    panel.style.display = "none";
    panels[cfg.name] = panel;
  });

  const panelWrapper = createEl("div", { class: ["panel-wrapper"] });
  Object.values(panels)
    .filter(p => p.getAttribute("role") === "tabpanel")
    .forEach(panel => panelWrapper.appendChild(panel));

  const publishBtn = createEl("button", { id: "publish-btn", class: ["publish-btn"], disabled: true, style: "display:none" }, ["Publish"]);
  publishBtn.addEventListener("click", handlePublish);

  formCon.append(tabHeader, panelWrapper, publishBtn);
  layout.appendChild(formCon);

  const feedContainer = createEl("div", { id: "postsContainer", class: ["tumblr-feed"] });
  layout.appendChild(feedContainer);
  root.appendChild(layout);

  fetchFeed(feedContainer);

  // --- Functions ---
  function switchTab(name) {
    if (!panels[name]) return;
    state.activeTab = name;

    Object.entries(panels).forEach(([key, panel]) => {
      if (panel.getAttribute("role") === "tabpanel") panel.style.display = key === name ? "block" : "none";
    });
    Object.entries(tabButtons).forEach(([key, btn]) => {
      const sel = key === name;
      btn.setAttribute("aria-selected", sel);
      btn.classList.toggle("active", sel);
    });

    publishBtn.style.display = "inline-block";
    checkPublishEnable();
  }

  function setupVideoInput(input, preview, state) {
    const videoPreview = createEl("video", { controls: true, class: ["preview-video"] });
    preview.appendChild(videoPreview);

    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      videoPreview.src = URL.createObjectURL(file);
      const uploaded = await handleFileUpload(file, "feed", "video", preview);
      state.uploads["Video-input"] = [uploaded];
      checkPublishEnable();
    });

    const volumeRange = createEl("input", { type: "range", min: 0, max: 1, step: 0.05, value: 1 });
    const speedRange = createEl("input", { type: "range", min: 0.25, max: 3, step: 0.05, value: 1 });
    const muteBtn = Button("Mute", "", { click: e => {
      videoPreview.muted = !videoPreview.muted;
      e.target.innerText = videoPreview.muted ? "Unmute" : "Mute";
    }});
    const controls = createEl("div", { class: "video-controls" }, [
      createEl("label", {}, ["Volume: ", volumeRange]),
      createEl("label", {}, ["Speed: ", speedRange]),
      muteBtn
    ]);
    preview.appendChild(controls);

    const thumbInput = createEl("input", { type: "file", accept: "image/*" });
    const thumbPreview = createEl("img", { class: "thumbnail-preview", src: "", alt: "Thumbnail preview" });
    const captureBtn = Button("Capture Thumbnail", "", {
      click: async () => {
        if (!videoPreview.src) return alert("Select a video first");
        const canvas = document.createElement("canvas");
        canvas.width = videoPreview.videoWidth || 640;
        canvas.height = videoPreview.videoHeight || 360;
        canvas.getContext("2d").drawImage(videoPreview, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async blob => {
          const uploaded = await handleFileUpload(blob, "feed", "poster", preview);
          state.videoThumb = uploaded;
          thumbPreview.src = URL.createObjectURL(blob);
        }, "image/png");
      }
    });

    thumbInput.addEventListener("change", async () => {
      const file = thumbInput.files[0];
      if (file) {
        const uploaded = await handleFileUpload(file, "feed", "image", preview);
        state.videoThumb = uploaded;
        thumbPreview.src = URL.createObjectURL(file);
      }
    });

    preview.appendChild(createEl("div", { class: ["thumbnail-controls"] }, [thumbInput, captureBtn, thumbPreview]));
  }

  function setupImageInput(input, preview, state) {
    input.addEventListener("change", async () => {
      clearChildren(preview);
      renderPreviewList(Array.from(input.files), preview, "image", input, checkPublishEnable);
      const uploadedFiles = await uploadFilesInBatches(Array.from(input.files), "feed", preview, 3, "image");
      state.uploads["Images-input"] = uploadedFiles;
      checkPublishEnable();
    });
  }

  function checkPublishEnable() {
    if (!state.activeTab) return (publishBtn.disabled = true);

    const cfg = TAB_CONFIG.find(c => c.name === state.activeTab);
    if (cfg.type === "video") {
      const hasFile = state.uploads["Video-input"]?.length === 1;
      const title = panels["Video-title"]?.value.trim();
      publishBtn.disabled = !(hasFile && title);
    } else if (cfg.type === "image") {
      publishBtn.disabled = !(state.uploads["Images-input"]?.length > 0);
    } else {
      publishBtn.disabled = !panels["text-input"]?.value.trim();
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
      renderNewPost(Array.isArray(res.data) ? res.data : [res.data], 0, feedContainer);
      resetInputs();
    } catch (err) {
      console.error("Publish error:", err);
    } finally {
      publishBtn.disabled = false;
    }
  }

  function resetInputs() {
    Object.values(panels).forEach(panel => {
      if (panel instanceof HTMLElement)
        panel.querySelectorAll("input, textarea").forEach(el => el.value = "");
    });
    Object.keys(state.uploads).forEach(k => delete state.uploads[k]);
    state.videoThumb = null;
    checkPublishEnable();
  }

  async function buildJSONPayload() {
    const active = TAB_CONFIG.find(c => c.name === state.activeTab);
    const obj = { type: active.type };
    if (active.type === "text") {
      appendIfValue(obj, "text", panels["text-input"]);
    } else if (active.type === "image") {
      obj.images = state.uploads["Images-input"] || [];
      appendIfValue(obj, "caption", panels["Images-caption"]);
      appendTags(obj, panels["Images-tags"]);
    } else if (active.type === "video") {
      obj.video = state.uploads["Video-input"]?.[0];
      if (state.videoThumb) {
        obj.thumbnail = {
          filename: state.videoThumb.filename,
          extn: state.videoThumb.extn,
          key: state.videoThumb.key
        };
      }
      appendIfValue(obj, "title", panels["Video-title"]);
      appendIfValue(obj, "description", panels["Video-description"]);
      appendTags(obj, panels["Video-tags"]);
    }
    return obj;
  }
}
