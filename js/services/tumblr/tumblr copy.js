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

import {
  tposts_text,
  tposts_video,
  tposts_photo,
} from "../../components/tumblrSvgs.js";
import { createIconButton } from "../../utils/svgIconButton.js";

// ------------------- Helpers -------------------
function appendIfValue(fd, key, el) {
  const val = el?.value.trim();
  if (val) fd.append(key, val);
}
function appendTags(fd, el) {
  const tags = el?.value.split(",").map(t => t.trim()).filter(Boolean);
  if (tags?.length) fd.append("tags", tags);
}
function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// ------------------- Tab Config -------------------
const TAB_CONFIG = [
  { 
    name: "Text", type: "text", multiple: false, icon: tposts_text,
    fields: [
      { label: "Text", type: "textarea", id: "text-input", placeholder: "Write something…", rows: 4, classList: ["tumblr-textarea"] }
    ]
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

// ------------------- Validation & FormData -------------------
const handlers = {
  text: {
    isValid: (panels) => panels.Text?.querySelector("textarea")?.value.trim().length > 0,
    appendFormData: (fd, panels) => appendIfValue(fd, "text", panels.Text.querySelector("textarea"))
  },
  image: {
    isValid: (panels) => panels["Images-input"]?.files.length > 0,
    appendFormData: (fd, panels) => {
      Array.from(panels["Images-input"].files).forEach(f => fd.append("images", f));
      appendIfValue(fd, "caption", panels["Images-caption"]);
      appendTags(fd, panels["Images-tags"]);
    }
  },
  video: {
    isValid: (panels) => {
      const files = panels["Video-input"]?.files;
      return files?.length === 1 && !!panels["Video-title"]?.value.trim();
    },
    appendFormData: (fd, panels) => {
      const file = panels["Video-input"].files[0];
      if (file) fd.append("video", file);
      appendIfValue(fd, "title", panels["Video-title"]);
      appendIfValue(fd, "description", panels["Video-description"]);
      appendTags(fd, panels["Video-tags"]);
    }
  }
};

// ------------------- Main -------------------
export function displayTumblr(isLoggedIn, root) {
  let activeTab = null;
  const panels = {};
  const tabButtons = {};

  root.innerHTML = "";

  const layout = createEl("div", { class: ["tumblr-layout"] });
  const formCon = createEl("div", { class: ["tumblr-form"] });
  const tabHeader = createEl("div", { class: ["tab-header"], role: "tablist" });

  // Create tabs + panels
  TAB_CONFIG.forEach(cfg => {
    const btn = createTabButton(
      createIconButton({ svgMarkup: cfg.icon, classSuffix: "clrful" }),
      () => switchTab(cfg.name)
    );
    btn.dataset["tab"] = cfg.name;
    tabButtons[cfg.name] = btn;
    tabHeader.appendChild(btn);

    const input = cfg.type !== "text" ? createFileInput(cfg.type, cfg.multiple) : null;
    const preview = cfg.type !== "text" ? createPreviewContainer(`${cfg.type}-preview`) : null;

    if (input) {
      input.addEventListener("change", () => {
        renderPreviewList(Array.from(input.files), preview, cfg.type, input, checkPublishEnable);
        checkPublishEnable();
      });
      panels[`${cfg.name}-input`] = input;
      panels[`${cfg.name}-preview`] = preview;
    }

    const extraFields = cfg.fields.map(field =>
      createFormGroup({ ...field, additionalProps: { ...field } })
    );

    extraFields.forEach(field => {
      field.querySelectorAll("input, textarea").forEach(el => {
        panels[el.id] = el;
        el.addEventListener("input", checkPublishEnable);
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

  const publishBtn = createEl("button", {
    id: "publish-btn",
    class: ["publish-btn"],
    disabled: true,
    style: "display: none"
  }, ["Publish"]);

  publishBtn.addEventListener("click", handlePublish);

  formCon.appendChild(tabHeader);
  formCon.appendChild(panelWrapper);
  formCon.appendChild(publishBtn);
  layout.appendChild(formCon);

  const feedContainer = createEl("div", { id: "postsContainer", class: ["tumblr-feed"] });
  layout.appendChild(feedContainer);
  root.appendChild(layout);

  refreshFeed();

  // ------------------- Core -------------------
  function switchTab(tabName) {
    if (!panels[tabName]) return;
    activeTab = tabName;

    Object.entries(panels).forEach(([name, panel]) => {
      if (panel.getAttribute("role") === "tabpanel") {
        panel.style.display = name === tabName ? "block" : "none";
      }
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
    if (!activeTab) {
      publishBtn.disabled = true;
      return;
    }
    const cfg = TAB_CONFIG.find(c => c.name === activeTab);
    publishBtn.disabled = !handlers[cfg.type].isValid(panels);
  }

  async function handlePublish() {
    publishBtn.disabled = true;
    try {
      const formData = await buildFormData();
      const csrfToken = await getCSRFToken();
      const res = await apiFetch("/feed/post", "POST", formData, { headers: { "X-CSRF-Token": csrfToken } });
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
    Object.entries(panels).forEach(([key, panel]) => {
      if (panel instanceof HTMLElement) {
        panel.querySelectorAll("input, textarea").forEach(el => {
          if (el.type === "file") el.value = "";
          else el.value = "";
        });
      }
      if (key.endsWith("-preview") && panel instanceof HTMLElement) {
        clearChildren(panel);
      }
    });
    checkPublishEnable();
  }

  async function refreshFeed() {
    await fetchFeed(feedContainer);
  }

  async function buildFormData() {
    const formData = new FormData();
    const active = TAB_CONFIG.find(c => c.name === activeTab);
    formData.append("type", active.type);
    handlers[active.type].appendFormData(formData, panels);
    return formData;
  }
}
