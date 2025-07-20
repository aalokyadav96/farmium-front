import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { fetchFeed } from "../feed/fetchFeed.js";
import { miscnav } from "./miscnav.js";

/**
 * Configuration for each tab
 */
const TAB_CONFIG = [
  { name: "Text", type: "text", multiple: false },
  { name: "Images", type: "image", multiple: true },
  { name: "Video", type: "video", multiple: false },
  { name: "Audio", type: "audio", multiple: false }
];

/**
 * Display the “Weed” feed UI: left = form & misc, right = feed
 */
export function displayWeed(isLoggedIn, root) {
  let activeTab = TAB_CONFIG[0].name;
  const layout = createEl("div", { class: "feed-layout" });
  const leftCol = createEl("div", { id: "form-column", class: "form-column" });
  const rightCol = createEl("div", { id: "feed-column", class: "feed-column" });

  root.appendChild(layout);
  layout.append(leftCol, rightCol);

  // Sidebar / misc nav
  const miscCon = createEl("div", { class: ["vflex", "misccon"] });
  miscCon.appendChild(miscnav());
  leftCol.appendChild(miscCon);

  // Form container
  const formCon = createEl("div", { class: ["vflex", "formcon"] });
  leftCol.appendChild(formCon);

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

    // Create each panel
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
      // bind change event
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

  // Publish button
  const publishBtn = createEl(
    "button",
    { id: "publish-btn", disabled: true, class: "publish-btn" },
    ["Publish"]
  );
  publishBtn.addEventListener("click", handlePublish);
  formCon.appendChild(publishBtn);

  // Feed container
  const feedContainer = createEl("div", {
    id: "postsContainer",
    class: "postsContainer"
  });
  rightCol.appendChild(feedContainer);

  // Initial activation
  switchTab(activeTab);
  refreshFeed();

  // ——— Internal Functions ———

  function switchTab(tabName) {
    // panels
    TAB_CONFIG.forEach(cfg => {
      const panel = panels[cfg.name];
      panel.style.display = cfg.name === tabName ? "block" : "none";
    });
    // buttons
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
    // textarea
    const ta = panels["Text"].querySelector("textarea");
    ta.value = "";
    // files & previews
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
}

/** Helpers **/

function createEl(tag, attrs = {}, children = []) {
  // normalize class
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
        el = createEl("img", {
          src,
          class: "preview-image"
        });
      } else if (type === "video") {
        el = createEl("video", {
          src,
          controls: true,
          class: "preview-video"
        });
      } else {
        el = createEl("audio", {
          src,
          controls: true,
          class: "preview-audio"
        });
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

async function buildFormData() {
  const formData = new FormData();
  const active = TAB_CONFIG.find(c => c.name === document.querySelector('[aria-selected="true"]').dataset.tab);
  formData.append("type", active.type);
  if (active.type === "text") {
    const text = document.getElementById("text-input").value.trim();
    formData.append("text", text);
  } else {
    const input = document.querySelector(`#${active.type}-panel input[type="file"]`);
    Array.from(input.files).forEach(file => {
      const field = active.type + (active.multiple ? "s" : "");
      formData.append(field, file);
    });
  }
  return formData;
}

// import { createElement } from "../../components/createElement.js";
// import { apiFetch } from "../../api/api.js";
// import { fetchFeed } from "../feed/fetchFeed.js";
// import { miscnav } from "./miscnav.js";

// export function displayWeed(isLoggedIn, root) {
//   const tabs = ["Text", "Images", "Video", "Audio"];
//   let activeTab = "Text";

//   const layout = createEl("div", { class: "feed" });
//   const leftColumn = createEl("div", { id: "form-column", class: "form-column" });
//   const rightColumn = createEl("div", { id: "feed-column", class: "feed-column" });

//   root.appendChild(layout);
//   layout.append(leftColumn, rightColumn);

//   const formcon = createEl("div", { class: "vflex formcon" });
//   const misccon = createEl("div", { class: "vflex misccon" });
//   misccon.appendChild(miscnav());

//   leftColumn.append(misccon);
//   rightColumn.append(formcon);

//   const tabHeader = createEl("div", {
//     id: "tab-header",
//     style: "display: flex; gap: 8px; margin-bottom: 12px;"
//   });

//   const tabButtons = {};
//   const panels = {};

//   tabs.forEach((tab) => {
//     tabButtons[tab] = createTabButton(tab, () => switchTab(tab));
//     tabHeader.appendChild(tabButtons[tab]);
//   });

//   formcon.appendChild(tabHeader);

//   const panelWrapper = createEl("div", { id: "panel-wrapper", style: "margin-bottom: 4px;" });

//   const textArea = createEl("textarea", {
//     id: "text-input",
//     rows: 4,
//     cols: 50,
//     placeholder: "Write your post...",
//     style: "width: 100%;"
//   });

//   panels["Text"] = createPanel("text-panel", [textArea]);

//   const imgInput = createFileInput("image/*", true, "img-input");
//   const imgPreview = createPreview("img-preview");
//   panels["Images"] = createPanel("images-panel", [imgInput, imgPreview]);

//   const videoInput = createFileInput("video/*", false, "video-input");
//   const videoPreview = createPreview("video-preview");
//   panels["Video"] = createPanel("video-panel", [videoInput, videoPreview]);

//   const audioInput = createFileInput("audio/*", false, "audio-input");
//   const audioPreview = createPreview("audio-preview");
//   panels["Audio"] = createPanel("audio-panel", [audioInput, audioPreview]);

//   Object.values(panels).forEach(p => panelWrapper.appendChild(p));
//   formcon.appendChild(panelWrapper);

//   const publishButton = createEl("button", {
//     id: "publish-btn",
//     disabled: true,
//     style: "padding: 8px 16px; cursor: pointer;"
//   }, ["Publish"]);

//   formcon.appendChild(publishButton);

//   const feedContainer = createEl("div", {
//     id: "postsContainer",
//     class: "postsContainer",
//   });

//   rightColumn.appendChild(feedContainer);

//   switchTab(activeTab);
//   refreshFeed();

//   // Event Bindings
//   textArea.addEventListener("input", checkPublishEnable);

//   imgInput.addEventListener("change", () => {
//     renderPreview(Array.from(imgInput.files), imgPreview, "image");
//     checkPublishEnable();
//   });

//   videoInput.addEventListener("change", () => {
//     renderPreview([videoInput.files[0]], videoPreview, "video");
//     checkPublishEnable();
//   });

//   audioInput.addEventListener("change", () => {
//     renderPreview([audioInput.files[0]], audioPreview, "audio");
//     checkPublishEnable();
//   });

//   publishButton.addEventListener("click", async () => {
//     publishButton.disabled = true;

//     let csrfToken = "";
//     try {
//       csrfToken = await getCSRF();
//     } catch (err) {
//       console.error("CSRF error:", err);
//       publishButton.disabled = false;
//       return;
//     }

//     const formData = new FormData();
//     formData.append("csrf_token", csrfToken);

//     if (activeTab === "Text") {
//       formData.append("text", textArea.value.trim());
//       formData.append("type", "text");
//     } else {
//       const fileInput = {
//         Images: imgInput,
//         Video: videoInput,
//         Audio: audioInput
//       }[activeTab];

//       const field = activeTab.toLowerCase();
//       const files = Array.from(fileInput.files);

//       formData.append("type", field);

//       const fieldname = field + (files.length > 1 ? "s" : "");
//       files.forEach(file => formData.append(fieldname, file));
//     }

//     try {
//       const result = await apiFetch("/feed/post", "POST", formData, {
//         headers: { "X-CSRF-Token": csrfToken }
//       });

//       if (!result || !result.ok) throw new Error("Upload failed");

//       resetInputs();
//       await refreshFeed();
//     } catch (err) {
//       console.error("Feed post error:", err);
//     } finally {
//       publishButton.disabled = false;
//     }
//   });

//   // Internal Functions

//   function switchTab(tab) {
//     Object.entries(panels).forEach(([key, panel]) => {
//       panel.style.display = key === tab ? "block" : "none";
//     });

//     Object.entries(tabButtons).forEach(([key, btn]) => {
//       const isActive = key === tab;
//       btn.style.background = isActive ? "var(--color-fg)" : "";
//       btn.style.color = isActive ? "var(--color-bg)" : "";
//     });

//     activeTab = tab;
//     checkPublishEnable();
//   }

//   function checkPublishEnable() {
//     if (activeTab === "Text") {
//       publishButton.disabled = textArea.value.trim().length === 0;
//     } else if (activeTab === "Images") {
//       publishButton.disabled = imgInput.files.length === 0;
//     } else if (activeTab === "Video") {
//       publishButton.disabled = videoInput.files.length !== 1;
//     } else if (activeTab === "Audio") {
//       publishButton.disabled = audioInput.files.length !== 1;
//     }
//   }

//   function resetInputs() {
//     textArea.value = "";
//     [imgInput, videoInput, audioInput].forEach(i => (i.value = ""));
//     [imgPreview, videoPreview, audioPreview].forEach(p => (p.innerHTML = ""));
//     checkPublishEnable();
//   }

//   async function getCSRF() {
//     const res = await apiFetch("/csrf");
//     return res.csrf_token || "";
//   }

//   async function refreshFeed() {
//     fetchFeed(feedContainer);
//   }

//   // Helper Creators

//   function createEl(tag, attrs = {}, children = []) {
//     return createElement(tag, attrs, children);
//   }

//   function createTabButton(label, onClick) {
//     const btn = createEl("button", { dataset: { tab: label } }, [label]);
//     btn.addEventListener("click", onClick);
//     return btn;
//   }

//   function createPanel(id, children) {
//     return createEl("div", { id, style: "display: none;" }, children);
//   }

//   function createFileInput(accept, multiple, id) {
//     return createEl("input", {
//       type: "file",
//       id,
//       accept,
//       ...(multiple ? { multiple: true } : {})
//     });
//   }

//   function createPreview(id) {
//     return createEl("div", {
//       id,
//       style: "margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;"
//     });
//   }

//   function renderPreview(files, container, type) {
//     container.innerHTML = "";

//     files.forEach(file => {
//       if (!file || !file.type.startsWith(type)) return;

//       const reader = new FileReader();
//       reader.onload = e => {
//         const src = e.target.result;
//         const el = type === "image"
//           ? createEl("img", {
//             src,
//             style: "max-width: 120px; max-height: 120px; object-fit: cover; border: 1px solid #ccc;"
//           })
//           : type === "video"
//             ? createEl("video", {
//               src,
//               controls: true,
//               style: "max-width: 240px; max-height: 240px;"
//             })
//             : createEl("audio", {
//               src,
//               controls: true,
//               style: "max-width: 240px;"
//             });

//         container.appendChild(el);
//       };
//       reader.readAsDataURL(file);
//     });
//   }
// }

// // import { createElement } from "../../components/createElement.js";
// // import { apiFetch } from "../../api/api.js";
// // import { fetchFeed } from "../feed/fetchFeed.js";
// // import { miscnav } from "./miscnav.js";

// // export function displayWeed(isLoggedIn, root) {
// //   const tabs = ["Text", "Images", "Video", "Audio"];
// //   let activeTab = "Text";

// //   const layout = createElement("div", {
// //     class: "feed",
// //   });

// //   const leftColumn = createElement("div", {
// //     class: "form-column",
// //   });

// //   const rightColumn = createElement("div", {
// //     class: "feed-column",
// //   });

// //   root.appendChild(layout);
// //   layout.appendChild(leftColumn);
// //   layout.appendChild(rightColumn);

// //   const formcon = createElement("div",{"class":"hvflex"},[]);
// //   leftColumn.appendChild(formcon);

// //   const misccon = createElement("div",{"class":"vflex"},[]);
// //   misccon.appendChild(miscnav() );
// //   leftColumn.appendChild(misccon);

// //   const tabButtons = {};
// //   const tabHeader = createElement("div", {
// //     id: "tab-header",
// //     style: "display: flex; gap: 8px; margin-bottom: 12px;"
// //   });

// //   tabs.forEach((tabName) => {
// //     const btn = createTabButton(tabName, () => switchTab(tabName));
// //     tabButtons[tabName] = btn;
// //     tabHeader.appendChild(btn);
// //   });
// //   formcon.appendChild(tabHeader);

// //   const panelWrapper = createElement("div", {
// //     id: "panel-wrapper",
// //     style: "margin-bottom: 4px;"
// //   });

// //   const textArea = createElement("textarea", {
// //     id: "text-input",
// //     rows: 4,
// //     cols: 50,
// //     placeholder: "Write your post...",
// //     style: "width: 100%;"
// //   });
// //   const textPanel = createPanel("text-panel", [textArea]);

// //   const imgInput = createFileInput("image/*", true, "img-input");
// //   const imgPreviewContainer = createPreviewContainer("img-preview");
// //   const imagesPanel = createPanel("images-panel", [imgInput, imgPreviewContainer]);

// //   const videoInput = createFileInput("video/*", false, "video-input");
// //   const videoPreviewContainer = createPreviewContainer("video-preview");
// //   const videoPanel = createPanel("video-panel", [videoInput, videoPreviewContainer]);

// //   const audioInput = createFileInput("audio/*", false, "audio-input");
// //   const audioPreviewContainer = createPreviewContainer("audio-preview");
// //   const audioPanel = createPanel("audio-panel", [audioInput, audioPreviewContainer]);

// //   panelWrapper.appendChild(textPanel);
// //   panelWrapper.appendChild(imagesPanel);
// //   panelWrapper.appendChild(videoPanel);
// //   panelWrapper.appendChild(audioPanel);
// //   formcon.appendChild(panelWrapper);

// //   const publishButton = createElement("button", {
// //     id: "publish-btn",
// //     disabled: true,
// //     style: "padding: 8px 16px; cursor: pointer;"
// //   }, ["Publish"]);
// //   formcon.appendChild(publishButton);

// //   const feedContainer = createElement("div", {
// //     id: "postsContainer",
// //     class: "postsContainer",
// //     style: "margin-top: 8px;"
// //   });
// //   rightColumn.appendChild(feedContainer);

// //   switchTab(activeTab);
// //   refreshFeed();

// //   function switchTab(newTab) {
// //     [textPanel, imagesPanel, videoPanel, audioPanel].forEach((panel) => {
// //       panel.style.display = "none";
// //     });

// //     Object.values(tabButtons).forEach((btn) => {
// //       btn.style.background = "";
// //       btn.style.color = "";
// //     });

// //     if (newTab === "Text") textPanel.style.display = "block";
// //     if (newTab === "Images") imagesPanel.style.display = "block";
// //     if (newTab === "Video") videoPanel.style.display = "block";
// //     if (newTab === "Audio") audioPanel.style.display = "block";

// //     tabButtons[newTab].style.background = "var(--color-fg)";
// //     tabButtons[newTab].style.color = "var(--color-bg)";

// //     activeTab = newTab;
// //     checkPublishEnable();
// //   }

// //   textArea.addEventListener("input", checkPublishEnable);

// //   imgInput.addEventListener("change", () => {
// //     renderPreviewList(Array.from(imgInput.files), imgPreviewContainer, "image");
// //     checkPublishEnable();
// //   });

// //   videoInput.addEventListener("change", () => {
// //     renderPreviewList([videoInput.files[0]], videoPreviewContainer, "video");
// //     checkPublishEnable();
// //   });

// //   audioInput.addEventListener("change", () => {
// //     renderPreviewList([audioInput.files[0]], audioPreviewContainer, "audio");
// //     checkPublishEnable();
// //   });

// //   function checkPublishEnable() {
// //     if (activeTab === "Text") {
// //       publishButton.disabled = textArea.value.trim().length === 0;
// //     } else if (activeTab === "Images") {
// //       publishButton.disabled = imgInput.files.length === 0;
// //     } else if (activeTab === "Video") {
// //       publishButton.disabled = videoInput.files.length !== 1;
// //     } else if (activeTab === "Audio") {
// //       publishButton.disabled = audioInput.files.length !== 1;
// //     }
// //   }

// //   publishButton.addEventListener("click", async () => {
// //     publishButton.disabled = true;
// //     let csrfToken = "";
// //     try {
// //       csrfToken = await getCSRFToken();
// //     } catch (err) {
// //       console.error("CSRF error:", err);
// //       publishButton.disabled = false;
// //       return;
// //     }

// //     const formData = new FormData();
// //     formData.append("text", activeTab === "Text" ? textArea.value.trim() : "");

// //     if (activeTab === "Images") {
// //       Array.from(imgInput.files).forEach((file) => {
// //         formData.append("type", "image");
// //         formData.append("images", file);
// //       });
// //     } else if (activeTab === "Video") {
// //       formData.append("type", "video");
// //       formData.append("videos", videoInput.files[0]);
// //     } else if (activeTab === "Audio") {
// //       formData.append("type", "audio");
// //       formData.append("audios", audioInput.files[0]);
// //     }

// //     formData.append("csrf_token", csrfToken);

// //     try {
// //       const result = await postToFeed(formData, csrfToken);
// //       if (!result || !result.ok) throw new Error("Upload failed");

// //       resetInputs();
// //       await refreshFeed();
// //     } catch (err) {
// //       console.error("Feed post error:", err);
// //     } finally {
// //       publishButton.disabled = false;
// //     }
// //   });

// //   function createTabButton(label, onClick) {
// //     const btn = createElement("button", { dataset: { tab: label } }, [label]);
// //     btn.addEventListener("click", onClick);
// //     return btn;
// //   }

// //   function createPanel(id, children) {
// //     return createElement("div", { id, style: "display: none;" }, children);
// //   }

// //   function createFileInput(accept, multiple, id) {
// //     return createElement("input", {
// //       type: "file",
// //       id,
// //       accept,
// //       ...(multiple ? { multiple: true } : {})
// //     });
// //   }

// //   function createPreviewContainer(id) {
// //     return createElement("div", {
// //       id,
// //       style: "margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;"
// //     });
// //   }

// //   function renderPreviewList(files, container, type) {
// //     container.innerHTML = "";
// //     files.forEach((file) => {
// //       if (!file || !file.type.startsWith(type)) return;

// //       const reader = new FileReader();
// //       reader.onload = (e) => {
// //         let el;
// //         if (type === "image") {
// //           el = createElement("img", {
// //             src: e.target.result,
// //             style: "max-width: 120px; max-height: 120px; object-fit: cover; border: 1px solid #ccc;"
// //           });
// //         } else if (type === "video") {
// //           el = createElement("video", {
// //             src: e.target.result,
// //             controls: true,
// //             style: "max-width: 240px; max-height: 240px;"
// //           });
// //         } else if (type === "audio") {
// //           el = createElement("audio", {
// //             src: e.target.result,
// //             controls: true,
// //             style: "max-width: 240px;"
// //           });
// //         }
// //         container.appendChild(el);
// //       };
// //       reader.readAsDataURL(file);
// //     });
// //   }

// //   function resetInputs() {
// //     textArea.value = "";
// //     imgInput.value = "";
// //     videoInput.value = "";
// //     audioInput.value = "";
// //     [imgPreviewContainer, videoPreviewContainer, audioPreviewContainer].forEach(c => c.innerHTML = "");
// //     checkPublishEnable();
// //   }

// //   async function getCSRFToken() {
// //     const res = await apiFetch("/csrf");
// //     return res.csrf_token || "";
// //   }

// //   async function postToFeed(formData, csrfToken) {
// //     return await apiFetch("/feed/post", "POST", formData, {
// //       headers: { "X-CSRF-Token": csrfToken }
// //     });
// //   }

// //   async function refreshFeed() {
// //     fetchFeed(feedContainer);
// //   }
// // }
