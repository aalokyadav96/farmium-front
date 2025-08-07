import { createElement } from "../../components/createElement";
import { apiFetch } from "../../api/api";
import { fetchFeed } from "../feed/fetchFeed.js";
import { Button } from "../../components/base/Button.js";

const TAB_CONFIG = [
  { name: "Text", type: "text", multiple: false },
  { name: "Images", type: "image", multiple: true },
  { name: "Video", type: "video", multiple: false },
  { name: "Audio", type: "audio", multiple: false }
];

export function displayTumblr(isLoggedIn, root) {
  let activeTab = TAB_CONFIG[0].name;
  const panels = {};
  const tabButtons = {};

  root.innerHTML = "";

  const layout = createEl("div", { class: ["tumblr-layout"] });

  // Form Section
  const formCon = createEl("div", { class: ["tumblr-form"] });
  const tabHeader = createEl("div", { class: ["tab-header"], role: "tablist" });

  TAB_CONFIG.forEach(cfg => {
    const btn = createTabButton(cfg.name, () => switchTab(cfg.name));
    tabButtons[cfg.name] = btn;
    tabHeader.appendChild(btn);

    let content;
    if (cfg.type === "text") {
      content = createEl("textarea", {
        id: "text-input",
        placeholder: "Write something…",
        class: ["tumblr-textarea"],
        rows: 4
      });
    } else {
      const input = createFileInput(cfg.type, cfg.multiple);
      const preview = createPreviewContainer(`${cfg.type}-preview`);
      input.addEventListener("change", () => {
        renderPreviewList(Array.from(input.files), preview, cfg.type);
        checkPublishEnable();
      });
      panels[`${cfg.name}-input`] = input;
      panels[`${cfg.name}-preview`] = preview;
      content = createEl("div", { class: ["file-input-wrapper"] }, [input, preview]);
    }

    panels[cfg.name] = createPanel(`${cfg.type}-panel`, [content]);
  });

  const panelWrapper = createEl("div", { class: ["panel-wrapper"] });
  Object.values(panels)
    .filter(p => p.getAttribute("role") === "tabpanel")
    .forEach(panelWrapper.appendChild.bind(panelWrapper));

  const publishBtn = createEl("button", {
    id: "publish-btn",
    class: ["publish-btn"],
    disabled: true
  }, ["Publish"]);

  publishBtn.addEventListener("click", handlePublish);

  formCon.appendChild(tabHeader);
  formCon.appendChild(panelWrapper);
  formCon.appendChild(publishBtn);
  layout.appendChild(formCon);

  // Feed Section
  const feedContainer = createEl("div", { id: "postsContainer", class: ["tumblr-feed"] });
  layout.appendChild(feedContainer);

  root.appendChild(layout);

  // Init
  switchTab(activeTab);
  refreshFeed();

  // ——— Functions ———

  function switchTab(tabName) {
    TAB_CONFIG.forEach(cfg => {
      panels[cfg.name].style.display = cfg.name === tabName ? "block" : "none";
    });
    Object.entries(tabButtons).forEach(([name, btn]) => {
      const selected = name === tabName;
      btn.setAttribute("aria-selected", selected);
      btn.classList.toggle("active", selected);
    });
    activeTab = tabName;
    checkPublishEnable();
  }

  function checkPublishEnable() {
    if (activeTab === "Text") {
      const ta = panels["Text"].querySelector("textarea");
      publishBtn.disabled = ta.value.trim().length === 0;
    } else {
      const cfg = TAB_CONFIG.find(c => c.name === activeTab);
      const input = panels[`${cfg.name}-input`];
      const count = input.files.length;
      publishBtn.disabled = cfg.multiple ? count === 0 : count !== 1;
    }
  }

  async function handlePublish() {
    publishBtn.disabled = true;
    try {
      const formData = await buildFormData();
      const res = await apiFetch("/feed/post", "POST", formData, {
        headers: { "X-CSRF-Token": await getCSRFToken() }
      });
      if (!res.ok) throw new Error("Upload failed");
      resetInputs();
      await refreshFeed();
    } catch (err) {
      console.error("Publish error:", err);
    } finally {
      publishBtn.disabled = false;
    }
  }

  function resetInputs() {
    panels["Text"].querySelector("textarea").value = "";
    TAB_CONFIG.filter(c => c.type !== "text").forEach(cfg => {
      const input = panels[`${cfg.name}-input`];
      const preview = panels[`${cfg.name}-preview`];
      input.value = "";
      preview.innerHTML = "";
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

    if (active.type === "text") {
      const text = document.getElementById("text-input").value.trim();
      formData.append("text", text);
    } else {
      const input = panels[`${active.name}-input`];
      const field = active.type + (active.multiple ? "s" : "");
      Array.from(input.files).forEach(file => {
        formData.append(field, file);
      });
    }

    return formData;
  }
}

// ——— Helpers ———

function createEl(tag, attrs = {}, children = []) {
  if (attrs.class && typeof attrs.class === "string") {
    attrs.class = [attrs.class];
  }
  return createElement(tag, attrs, children);
}

function createTabButton(label, onClick) {
  const btn = createEl("button", {
    class: ["tab-button"],
    role: "tab",
    dataset: { tab: label },
    ariaSelected: "false"
  }, [label]);
  btn.addEventListener("click", onClick);
  return btn;
}

function createPanel(id, children) {
  return createEl("div", { id, class: ["tab-panel"], role: "tabpanel", style: "display: none;" }, children);
}

function createFileInput(type, multiple) {
  return createEl("input", {
    type: "file",
    class: ["file-input"],
    accept: `${type}/*`,
    multiple: multiple || undefined
  });
}

function createPreviewContainer(id) {
  return createEl("div", { id, class: ["file-preview"] });
}

function renderPreviewList(files, container, type) {
  container.innerHTML = "";
  files.forEach(file => {
    if (!file.type.startsWith(type)) return;
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target.result;
      let el;
      if (type === "image") {
        el = createEl("img", { src, class: ["preview-image"] });
      } else if (type === "video") {
        el = createEl("video", { src, controls: true, class: ["preview-video"] });
      } else {
        el = createEl("audio", { src, controls: true, class: ["preview-audio"] });
      }
      container.appendChild(el);
    };
    reader.readAsDataURL(file);
  });
}

async function getCSRFToken() {
  const res = await apiFetch("/csrf");
  return res.csrf_token || "";
}
