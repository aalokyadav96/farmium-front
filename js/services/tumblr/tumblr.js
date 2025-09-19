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
  tposts_photo_alt,
} from "../../components/tumblrSvgs.js";
import { createIconButton } from "../../utils/svgIconButton.js";

const TAB_CONFIG = [
  { name: "Text", type: "text", multiple: false, icon: tposts_text },
  { name: "Images", type: "image", multiple: true, icon: tposts_photo_alt },
  { name: "Video", type: "video", multiple: false, icon: tposts_video },
];

export function displayTumblr(isLoggedIn, root) {
  let activeTab = null;
  const panels = {};
  const tabButtons = {};

  root.innerHTML = "";

  const layout = createEl("div", { class: ["tumblr-layout"] });
  const formCon = createEl("div", { class: ["tumblr-form"] });
  const tabHeader = createEl("div", { class: ["tab-header"], role: "tablist" });

  // ------------------- Validation & Handlers -------------------
  const handlers = {
    text: {
      isValid: () => panels.Text?.querySelector("textarea")?.value.trim().length > 0,
      appendFormData: (fd) => fd.append("text", panels.Text.querySelector("textarea").value.trim())
    },
    image: {
      isValid: () => panels["Images-input"]?.files.length > 0,
      appendFormData: (fd) => {
        Array.from(panels["Images-input"].files).forEach(f => fd.append("images", f));
        const caption = panels["Images-preview"].parentElement.querySelector("textarea");
        const tags = panels["Images-preview"].parentElement.querySelector("input[type=text]");
        if (caption?.value.trim()) fd.append("caption", caption.value.trim());
        const tagValues = tags?.value.split(",").map(t => t.trim()).filter(Boolean);
        if (tagValues?.length) fd.append("tags", tagValues);
      }
    },
    video: {
      isValid: () => {
        const files = panels["Video-input"]?.files;
        const title = panels["Video-preview"].parentElement.querySelector("input[type=text]");
        return files?.length === 1 && !!title?.value.trim();
      },
      appendFormData: (fd) => {
        const file = panels["Video-input"].files[0];
        if (file) fd.append("video", file);
        const title = panels["Video-preview"].parentElement.querySelector("input[type=text]");
        const description = panels["Video-preview"].parentElement.querySelector("textarea");
        const tags = panels["Video-preview"].parentElement.querySelectorAll("input[type=text]")[1];
        if (title?.value.trim()) fd.append("title", title.value.trim());
        if (description?.value.trim()) fd.append("description", description.value.trim());
        const tagValues = tags?.value.split(",").map(t => t.trim()).filter(Boolean);
        if (tagValues?.length) fd.append("tags", tagValues);
      }
    }
  };

  // ------------------- Tab Content -------------------
  function createTabContent(cfg) {
    if (cfg.type === "text") {
      const group = createFormGroup({
        label: "Text",
        type: "textarea",
        id: "text-input",
        placeholder: "Write something…",
        additionalProps: { rows: 4, classList: ["tumblr-textarea"] }
      });
      group.querySelector("textarea").addEventListener("input", checkPublishEnable);
      return group;
    }

    const input = createFileInput(cfg.type, cfg.multiple);
    const preview = createPreviewContainer(`${cfg.type}-preview`);

    input.addEventListener("change", () => {
      renderPreviewList(Array.from(input.files), preview, cfg.type, input, checkPublishEnable);
      checkPublishEnable();
    });

    const extraFields = cfg.type === "image" ? [
      createFormGroup({ label: "Caption", type: "textarea", id: `${cfg.name}-caption`, placeholder: "Add a caption…", additionalProps: { rows: 2, classList: ["caption-textarea"] } }),
      createFormGroup({ label: "Tags", type: "text", id: `${cfg.name}-tags`, placeholder: "Tags (comma separated)", additionalProps: { classList: ["tag-input"] } })
    ] : [
      createFormGroup({ label: "Title", type: "text", id: `${cfg.name}-title`, placeholder: "Title", isRequired: true, additionalProps: { classList: ["meta-title"] } }),
      createFormGroup({ label: "Description", type: "textarea", id: `${cfg.name}-description`, placeholder: "Description", additionalProps: { rows: 3, classList: ["meta-description"] } }),
      createFormGroup({ label: "Tags", type: "text", id: `${cfg.name}-tags`, placeholder: "Tags (comma separated)", additionalProps: { classList: ["tag-input"] } })
    ];

    extraFields.forEach(field => {
      field.querySelectorAll("input, textarea").forEach(el => {
        el.addEventListener("input", checkPublishEnable);
      });
    });

    panels[`${cfg.name}-input`] = input;
    panels[`${cfg.name}-preview`] = preview;

    return createEl("div", { class: ["file-input-wrapper"] }, [input, preview, ...extraFields]);
  }

  // ------------------- Tabs -------------------
  // TAB_CONFIG.forEach(cfg => {
  //   const btn = createTabButton(cfg.name, () => switchTab(cfg.name));
  //   tabButtons[cfg.name] = btn;
  //   tabHeader.appendChild(btn);

  //   const content = createTabContent(cfg);
  //   const panel = createPanel(`${cfg.type}-panel`, [content]);
  //   panel.style.display = "none"; // Hide initially
  //   panels[cfg.name] = panel;
  // });

  TAB_CONFIG.forEach(cfg => {
    const btn = createTabButton(createIconButton({ svgMarkup: cfg.icon, classSuffix: "clrful" }), () => switchTab(cfg.name));
    tabButtons[cfg.name] = btn;
    tabHeader.appendChild(btn);
    
    btn.dataset["tab"] = cfg.name;

    const content = createTabContent(cfg);
    const panel = createPanel(`${cfg.type}-panel`, [content]);
    panel.style.display = "none"; // Hide initially
    panels[cfg.name] = panel;
  });


  const panelWrapper = createEl("div", { class: ["panel-wrapper"] });
  Object.values(panels)
    .filter(p => p.getAttribute("role") === "tabpanel")
    .forEach(panelWrapper.appendChild.bind(panelWrapper));

  // const publishBtn = createEl("button", { id: "publish-btn", class: ["publish-btn"], disabled: true }, ["Publish"]);
  const publishBtn = createEl("button", {
    id: "publish-btn",
    class: ["publish-btn"],
    disabled: true,
    style: "display: none" // 👈 Hide initially
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
    if (!tabName || !panels[tabName]) return;

    TAB_CONFIG.forEach(cfg => {
      panels[cfg.name].style.display = cfg.name === tabName ? "block" : "none";
    });

    Object.entries(tabButtons).forEach(([name, btn]) => {
      const selected = name === tabName;
      btn.setAttribute("aria-selected", selected);
      btn.classList.toggle("active", selected);
    });

    activeTab = tabName;
    publishBtn.style.display = "inline-block"; // 👈 Show when tab is active
    checkPublishEnable();
  }

  function checkPublishEnable() {
    if (!activeTab) {
      publishBtn.disabled = true;
      return;
    }
    const cfg = TAB_CONFIG.find(c => c.name === activeTab);
    publishBtn.disabled = !handlers[cfg.type].isValid();
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
      if (panel.tagName === "DIV") {
        panel.querySelectorAll("input, textarea").forEach(el => {
          el.value = el.type === "file" ? "" : "";
        });
      }
      if (key.endsWith("-preview") && panel instanceof HTMLElement) {
        panel.innerHTML = "";
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
    handlers[active.type].appendFormData(formData);
    return formData;
  }
}
