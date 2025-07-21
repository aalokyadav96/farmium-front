import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { fetchFeed } from "../feed/fetchFeed.js";
import { miscnav } from "./miscnav.js";

const TAB_CONFIG = [
  { name: "Text", type: "text", multiple: false },
  { name: "Images", type: "image", multiple: true },
  { name: "Video", type: "video", multiple: false },
  { name: "Audio", type: "audio", multiple: false }
];

export function displayWeed(isLoggedIn, root) {
  let activeTab = TAB_CONFIG[0].name;
  const layout = createEl("div", { class: "feed-layout" });
  root.appendChild(layout);

  const miscCon = createEl("div", { class: ["vflex", "misccon"], style: "order: 3;" });
  miscCon.appendChild(miscnav());
  layout.appendChild(miscCon);

  const formCon = createEl("div", { class: ["vflex", "formcon"], style: "order: 1;" });
  layout.appendChild(formCon);

  const feedContainer = createEl("div", {
    id: "postsContainer",
    class: "postsContainer",
    style: "order: 2;"
  });
  layout.appendChild(feedContainer);

  // Tabs
  const tabHeader = createEl("div", {
    id: "tab-header",
    role: "tablist",
    class: "tab-header"
  });
  const tabButtons = {};
  const panels = {};

  TAB_CONFIG.forEach(cfg => {
    tabButtons[cfg.name] = createTabButton(cfg.name, () => switchTab(cfg.name));
    tabHeader.appendChild(tabButtons[cfg.name]);

    let child;
    if (cfg.type === "text") {
      child = createEl("textarea", {
        id: "text-input",
        rows: 4,
        cols: 50,
        placeholder: "Write your post…",
        class: "text-area"
      });
    } else {
      const fileInput = createFileInput(cfg.type, cfg.multiple);
      const preview = createPreviewContainer(`${cfg.type}-preview`);
      panels[`${cfg.name}-preview`] = preview;
      child = createEl("div", {}, [fileInput, preview]);

      fileInput.addEventListener("change", () => {
        renderPreviewList(Array.from(fileInput.files), preview, cfg.type);
        checkPublishEnable();
      });
      panels[`${cfg.name}-input`] = fileInput;
    }

    const panel = createPanel(`${cfg.type}-panel`, [child]);
    panels[cfg.name] = panel;
  });

  formCon.appendChild(tabHeader);

  const panelWrapper = createEl("div", {
    id: "panel-wrapper",
    class: "panel-wrapper"
  });
  Object.values(panels)
    .filter(el => el.getAttribute("role") === "tabpanel")
    .forEach(panelWrapper.appendChild.bind(panelWrapper));
  formCon.appendChild(panelWrapper);

  const publishBtn = createEl(
    "button",
    { id: "publish-btn", disabled: true, class: "publish-btn" },
    ["Publish"]
  );
  publishBtn.addEventListener("click", handlePublish);
  formCon.appendChild(publishBtn);

  switchTab(activeTab);
  refreshFeed();

  // ——— Internal Functions ———

  function switchTab(tabName) {
    TAB_CONFIG.forEach(cfg => {
      const panel = panels[cfg.name];
      panel.style.display = cfg.name === tabName ? "block" : "none";
    });
    Object.entries(tabButtons).forEach(([name, btn]) => {
      const selected = name === tabName;
      btn.setAttribute("aria-selected", selected);
      btn.classList.toggle("active-tab", selected);
      if (selected) btn.focus();
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
    const ta = panels["Text"].querySelector("textarea");
    ta.value = "";
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
    const active = TAB_CONFIG.find(c => c.name === document.querySelector('[aria-selected="true"]').dataset.tab);
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

// ——— Helper Functions ———

function createEl(tag, attrs = {}, children = []) {
  if (attrs.class && typeof attrs.class === "string") {
    attrs.class = [attrs.class];
  }
  return createElement(tag, attrs, children);
}

function createTabButton(label, onClick) {
  const btn = createEl(
    "button",
    {
      role: "tab",
      dataset: { tab: label },
      ariaSelected: "false",
      class: "tab-btn"
    },
    [label]
  );
  btn.addEventListener("click", onClick);
  return btn;
}

function createPanel(id, children) {
  return createEl(
    "div",
    { id, role: "tabpanel", style: "display: none;", class: "tab-panel" },
    children
  );
}

function createFileInput(type, multiple) {
  return createEl("input", {
    type: "file",
    accept: `${type}/*`,
    multiple: multiple || undefined,
    class: "file-input"
  });
}

function createPreviewContainer(id) {
  return createEl("div", {
    id,
    class: "preview-container"
  });
}

function renderPreviewList(files, container, type) {
  container.innerHTML = "";
  files.forEach(file => {
    if (!file.type.startsWith(type)) return;
    const reader = new FileReader();
    reader.onload = e => {
      let el;
      const src = e.target.result;
      if (type === "image") {
        el = createEl("img", { src, class: "preview-image" });
      } else if (type === "video") {
        el = createEl("video", { src, controls: true, class: "preview-video" });
      } else {
        el = createEl("audio", { src, controls: true, class: "preview-audio" });
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

// import { createElement } from "../../components/createElement.js";
// import { apiFetch } from "../../api/api.js";
// import { fetchFeed } from "../feed/fetchFeed.js";
// import { miscnav } from "./miscnav.js";

// const TAB_CONFIG = [
//   { name: "Text", type: "text", multiple: false },
//   { name: "Images", type: "image", multiple: true },
//   { name: "Video", type: "video", multiple: false },
//   { name: "Audio", type: "audio", multiple: false }
// ];

// export function displayWeed(isLoggedIn, root) {
//   let activeTab = TAB_CONFIG[0].name;

//   const layout = createEl("div", { class: "feed-layout" });
//   root.appendChild(layout);

//   // ─── Misc Nav ───
//   const miscCon = createEl("div", { class: "vflex misccon", style: "order: 3;" });
//   miscCon.appendChild(miscnav());
//   layout.appendChild(miscCon);

//   // ─── Form Container ───
//   const formCon = createEl("div", { class: "vflex formcon", style: "order: 1;" });
//   layout.appendChild(formCon);

//   const tabHeader = createEl("div", {
//     id: "tab-header",
//     role: "tablist",
//     class: "tab-header"
//   });
//   const tabButtons = {};
//   const panels = {};

//   TAB_CONFIG.forEach(cfg => {
//     tabButtons[cfg.name] = createTabButton(cfg.name, () => switchTab(cfg.name));
//     tabHeader.appendChild(tabButtons[cfg.name]);

//     let child;
//     if (cfg.type === "text") {
//       child = createEl("textarea", {
//         id: "text-input",
//         rows: 4,
//         cols: 50,
//         placeholder: "Write your post…",
//         class: "text-area"
//       });
//     } else {
//       const fileInput = createFileInput(cfg.type, cfg.multiple);
//       const preview = createPreviewContainer(`${cfg.type}-preview`);
//       panels[`${cfg.name}-preview`] = preview;
//       child = createEl("div", {}, [fileInput, preview]);

//       fileInput.addEventListener("change", () => {
//         renderPreviewList(Array.from(fileInput.files), preview, cfg.type);
//         checkPublishEnable();
//       });
//       panels[`${cfg.name}-input`] = fileInput;
//     }

//     const panel = createPanel(`${cfg.type}-panel`, [child]);
//     panels[cfg.name] = panel;
//   });

//   formCon.appendChild(tabHeader);

//   const panelWrapper = createEl("div", {
//     id: "panel-wrapper",
//     class: "panel-wrapper"
//   });
//   Object.values(panels)
//     .filter(el => el.getAttribute("role") === "tabpanel")
//     .forEach(panelWrapper.appendChild.bind(panelWrapper));
//   formCon.appendChild(panelWrapper);

//   const publishBtn = createEl(
//     "button",
//     { id: "publish-btn", disabled: true, class: "publish-btn" },
//     ["Publish"]
//   );
//   publishBtn.addEventListener("click", handlePublish);
//   formCon.appendChild(publishBtn);

//   // ─── Feed Container ───
//   const feedContainer = createEl("div", {
//     id: "postsContainer",
//     class: "postsContainer",
//     style: "order: 2;"
//   });
//   layout.appendChild(feedContainer);

//   switchTab(activeTab);
//   refreshFeed();

//   // ─── Internal Functions ───

//   function switchTab(tabName) {
//     TAB_CONFIG.forEach(cfg => {
//       const panel = panels[cfg.name];
//       panel.style.display = cfg.name === tabName ? "block" : "none";
//     });
//     Object.entries(tabButtons).forEach(([name, btn]) => {
//       const selected = name === tabName;
//       btn.setAttribute("aria-selected", selected);
//       btn.classList.toggle("active-tab", selected);
//       if (selected) btn.focus();
//     });
//     activeTab = tabName;
//     checkPublishEnable();
//   }

//   function checkPublishEnable() {
//     if (activeTab === "Text") {
//       const ta = panels["Text"].querySelector("textarea");
//       publishBtn.disabled = ta.value.trim().length === 0;
//     } else {
//       const cfg = TAB_CONFIG.find(c => c.name === activeTab);
//       const input = panels[`${cfg.name}-input`];
//       const count = input.files.length;
//       publishBtn.disabled = cfg.multiple ? count === 0 : count !== 1;
//     }
//   }

//   async function handlePublish() {
//     publishBtn.disabled = true;
//     try {
//       const formData = await buildFormData();
//       const res = await apiFetch("/feed/post", "POST", formData, {
//         headers: { "X-CSRF-Token": await getCSRFToken() }
//       });
//       if (!res.ok) throw new Error("Upload failed");
//       resetInputs();
//       await refreshFeed();
//     } catch (err) {
//       console.error("Publish error:", err);
//     } finally {
//       publishBtn.disabled = false;
//     }
//   }

//   function resetInputs() {
//     const ta = panels["Text"].querySelector("textarea");
//     ta.value = "";
//     TAB_CONFIG.filter(c => c.type !== "text").forEach(cfg => {
//       const input = panels[`${cfg.name}-input`];
//       const preview = panels[`${cfg.name}-preview`];
//       input.value = "";
//       preview.innerHTML = "";
//     });
//     checkPublishEnable();
//   }

//   async function refreshFeed() {
//     await fetchFeed(feedContainer);
//   }
// }

// // ─── Helpers ───

// function createEl(tag, attrs = {}, children = []) {
//   if (attrs.class && typeof attrs.class === "string") {
//     attrs.class = [attrs.class];
//   }
//   return createElement(tag, attrs, children);
// }

// function createTabButton(label, onClick) {
//   const btn = createEl(
//     "button",
//     {
//       role: "tab",
//       dataset: { tab: label },
//       ariaSelected: "false",
//       class: "tab-btn"
//     },
//     [label]
//   );
//   btn.addEventListener("click", onClick);
//   return btn;
// }

// function createPanel(id, children) {
//   return createEl(
//     "div",
//     { id, role: "tabpanel", style: "display: none;", class: "tab-panel" },
//     children
//   );
// }

// function createFileInput(type, multiple) {
//   return createEl("input", {
//     type: "file",
//     accept: `${type}/*`,
//     multiple: multiple || undefined,
//     class: "file-input"
//   });
// }

// function createPreviewContainer(id) {
//   return createEl("div", {
//     id,
//     class: "preview-container"
//   });
// }

// function renderPreviewList(files, container, type) {
//   container.innerHTML = "";
//   files.forEach(file => {
//     if (!file.type.startsWith(type)) return;
//     const reader = new FileReader();
//     reader.onload = e => {
//       let el;
//       const src = e.target.result;
//       if (type === "image") {
//         el = createEl("img", { src, class: "preview-image" });
//       } else if (type === "video") {
//         el = createEl("video", { src, controls: true, class: "preview-video" });
//       } else {
//         el = createEl("audio", { src, controls: true, class: "preview-audio" });
//       }
//       container.appendChild(el);
//     };
//     reader.readAsDataURL(file);
//   });
// }

// async function getCSRFToken() {
//   const res = await apiFetch("/csrf");
//   return res.csrf_token || "";
// }

// async function buildFormData() {
//   const formData = new FormData();
//   const active = TAB_CONFIG.find(c => c.name === document.querySelector('[aria-selected="true"]').dataset.tab);
//   formData.append("type", active.type);
//   if (active.type === "text") {
//     const text = document.getElementById("text-input").value.trim();
//     formData.append("text", text);
//   } else {
//     const input = document.querySelector(`#${active.type}-panel input[type="file"]`);
//     Array.from(input.files).forEach(file => {
//       const field = active.type + (active.multiple ? "s" : "");
//       formData.append(field, file);
//     });
//   }
//   return formData;
// }

// // import { createElement } from "../../components/createElement.js";
// // import { apiFetch } from "../../api/api.js";
// // import { fetchFeed } from "../feed/fetchFeed.js";
// // import { miscnav } from "./miscnav.js";

// // /**
// //  * Configuration for each tab
// //  */
// // const TAB_CONFIG = [
// //   { name: "Text", type: "text", multiple: false },
// //   { name: "Images", type: "image", multiple: true },
// //   { name: "Video", type: "video", multiple: false },
// //   { name: "Audio", type: "audio", multiple: false }
// // ];

// // /**
// //  * Display the “Weed” feed UI: left = form & misc, right = feed
// //  */
// // export function displayWeed(isLoggedIn, root) {
// //   let activeTab = TAB_CONFIG[0].name;
// //   const layout = createEl("div", { class: "feed-layout" });
// //   const leftCol = createEl("div", { id: "form-column", class: "form-column" });
// //   const rightCol = createEl("div", { id: "feed-column", class: "feed-column" });

// //   root.appendChild(layout);
// //   // layout.append(leftCol, rightCol);
// //   layout.append(rightCol, leftCol);

// //   // Form container
// //   const formCon = createEl("div", { class: ["vflex", "formcon"] });
// //   leftCol.appendChild(formCon);

// //   // Sidebar / misc nav
// //   const miscCon = createEl("div", { class: ["vflex", "misccon"] });
// //   miscCon.appendChild(miscnav());
// //   leftCol.appendChild(miscCon);

// //   // Tabs
// //   const tabHeader = createEl("div", {
// //     id: "tab-header",
// //     role: "tablist",
// //     class: "tab-header"
// //   });
// //   const tabButtons = {};
// //   const panels = {};

// //   TAB_CONFIG.forEach(cfg => {
// //     tabButtons[cfg.name] = createTabButton(cfg.name, () => switchTab(cfg.name));
// //     tabHeader.appendChild(tabButtons[cfg.name]);

// //     // Create each panel
// //     let child;
// //     if (cfg.type === "text") {
// //       child = createEl("textarea", {
// //         id: "text-input",
// //         rows: 4,
// //         cols: 50,
// //         placeholder: "Write your post…",
// //         class: "text-area"
// //       });
// //     } else {
// //       const fileInput = createFileInput(cfg.type, cfg.multiple);
// //       const preview = createPreviewContainer(`${cfg.type}-preview`);
// //       panels[`${cfg.name}-preview`] = preview;
// //       child = createEl("div", {}, [fileInput, preview]);
// //       // bind change event
// //       fileInput.addEventListener("change", () => {
// //         renderPreviewList(Array.from(fileInput.files), preview, cfg.type);
// //         checkPublishEnable();
// //       });
// //       panels[`${cfg.name}-input`] = fileInput;
// //     }

// //     const panel = createPanel(`${cfg.type}-panel`, [child]);
// //     panels[cfg.name] = panel;
// //   });

// //   formCon.appendChild(tabHeader);

// //   const panelWrapper = createEl("div", {
// //     id: "panel-wrapper",
// //     class: "panel-wrapper"
// //   });
// //   Object.values(panels)
// //     .filter(el => el.getAttribute("role") === "tabpanel")
// //     .forEach(panelWrapper.appendChild.bind(panelWrapper));
// //   formCon.appendChild(panelWrapper);

// //   // Publish button
// //   const publishBtn = createEl(
// //     "button",
// //     { id: "publish-btn", disabled: true, class: "publish-btn" },
// //     ["Publish"]
// //   );
// //   publishBtn.addEventListener("click", handlePublish);
// //   formCon.appendChild(publishBtn);

// //   // Feed container
// //   const feedContainer = createEl("div", {
// //     id: "postsContainer",
// //     class: "postsContainer"
// //   });
// //   rightCol.appendChild(feedContainer);

// //   // Initial activation
// //   switchTab(activeTab);
// //   refreshFeed();

// //   // ——— Internal Functions ———

// //   function switchTab(tabName) {
// //     // panels
// //     TAB_CONFIG.forEach(cfg => {
// //       const panel = panels[cfg.name];
// //       panel.style.display = cfg.name === tabName ? "block" : "none";
// //     });
// //     // buttons
// //     Object.entries(tabButtons).forEach(([name, btn]) => {
// //       const selected = name === tabName;
// //       btn.setAttribute("aria-selected", selected);
// //       btn.classList.toggle("active-tab", selected);
// //       if (selected) btn.focus();
// //     });
// //     activeTab = tabName;
// //     checkPublishEnable();
// //   }

// //   function checkPublishEnable() {
// //     if (activeTab === "Text") {
// //       const ta = panels["Text"].querySelector("textarea");
// //       publishBtn.disabled = ta.value.trim().length === 0;
// //     } else {
// //       const cfg = TAB_CONFIG.find(c => c.name === activeTab);
// //       const input = panels[`${cfg.name}-input`];
// //       const count = input.files.length;
// //       publishBtn.disabled = cfg.multiple ? count === 0 : count !== 1;
// //     }
// //   }

// //   async function handlePublish() {
// //     publishBtn.disabled = true;
// //     try {
// //       const formData = await buildFormData();
// //       const res = await apiFetch("/feed/post", "POST", formData, {
// //         headers: { "X-CSRF-Token": await getCSRFToken() }
// //       });
// //       if (!res.ok) throw new Error("Upload failed");
// //       resetInputs();
// //       await refreshFeed();
// //     } catch (err) {
// //       console.error("Publish error:", err);
// //     } finally {
// //       publishBtn.disabled = false;
// //     }
// //   }

// //   function resetInputs() {
// //     // textarea
// //     const ta = panels["Text"].querySelector("textarea");
// //     ta.value = "";
// //     // files & previews
// //     TAB_CONFIG.filter(c => c.type !== "text").forEach(cfg => {
// //       const input = panels[`${cfg.name}-input`];
// //       const preview = panels[`${cfg.name}-preview`];
// //       input.value = "";
// //       preview.innerHTML = "";
// //     });
// //     checkPublishEnable();
// //   }

// //   async function refreshFeed() {
// //     await fetchFeed(feedContainer);
// //   }
// // }

// // /** Helpers **/

// // function createEl(tag, attrs = {}, children = []) {
// //   // normalize class
// //   if (attrs.class && typeof attrs.class === "string") {
// //     attrs.class = [attrs.class];
// //   }
// //   return createElement(tag, attrs, children);
// // }

// // function createTabButton(label, onClick) {
// //   const btn = createEl(
// //     "button",
// //     {
// //       role: "tab",
// //       dataset: { tab: label },
// //       ariaSelected: "false",
// //       class: "tab-btn"
// //     },
// //     [label]
// //   );
// //   btn.addEventListener("click", onClick);
// //   return btn;
// // }

// // function createPanel(id, children) {
// //   return createEl(
// //     "div",
// //     { id, role: "tabpanel", style: "display: none;", class: "tab-panel" },
// //     children
// //   );
// // }

// // function createFileInput(type, multiple) {
// //   return createEl("input", {
// //     type: "file",
// //     accept: `${type}/*`,
// //     multiple: multiple || undefined,
// //     class: "file-input"
// //   });
// // }

// // function createPreviewContainer(id) {
// //   return createEl("div", {
// //     id,
// //     class: "preview-container"
// //   });
// // }

// // function renderPreviewList(files, container, type) {
// //   container.innerHTML = "";
// //   files.forEach(file => {
// //     if (!file.type.startsWith(type)) return;
// //     const reader = new FileReader();
// //     reader.onload = e => {
// //       let el;
// //       const src = e.target.result;
// //       if (type === "image") {
// //         el = createEl("img", {
// //           src,
// //           class: "preview-image"
// //         });
// //       } else if (type === "video") {
// //         el = createEl("video", {
// //           src,
// //           controls: true,
// //           class: "preview-video"
// //         });
// //       } else {
// //         el = createEl("audio", {
// //           src,
// //           controls: true,
// //           class: "preview-audio"
// //         });
// //       }
// //       container.appendChild(el);
// //     };
// //     reader.readAsDataURL(file);
// //   });
// // }

// // async function getCSRFToken() {
// //   const res = await apiFetch("/csrf");
// //   return res.csrf_token || "";
// // }

// // async function buildFormData() {
// //   const formData = new FormData();
// //   const active = TAB_CONFIG.find(c => c.name === document.querySelector('[aria-selected="true"]').dataset.tab);
// //   formData.append("type", active.type);
// //   if (active.type === "text") {
// //     const text = document.getElementById("text-input").value.trim();
// //     formData.append("text", text);
// //   } else {
// //     const input = document.querySelector(`#${active.type}-panel input[type="file"]`);
// //     Array.from(input.files).forEach(file => {
// //       const field = active.type + (active.multiple ? "s" : "");
// //       formData.append(field, file);
// //     });
// //   }
// //   return formData;
// // }
