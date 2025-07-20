import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";
import { fetchFeed } from "../feed/fetchFeed.js";
import { miscnav } from "./miscnav.js";

export function displayWeed(isLoggedIn, root) {
  const tabs = ["Text", "Images", "Video", "Audio"];
  let activeTab = "Text";

  const layout = createEl("div", { class: "feed" });
  const leftColumn = createEl("div", { id: "form-column", class: "form-column" });
  const rightColumn = createEl("div", { class: "feed-column" });

  root.appendChild(layout);
  layout.append(leftColumn, rightColumn);

  const formcon = createEl("div", { class: "hvflex" });
  const misccon = createEl("div", { class: "vflex" });
  misccon.appendChild(miscnav());

  leftColumn.append(formcon, misccon);

  const tabHeader = createEl("div", {
    id: "tab-header",
    style: "display: flex; gap: 8px; margin-bottom: 12px;"
  });

  const tabButtons = {};
  const panels = {};

  tabs.forEach((tab) => {
    tabButtons[tab] = createTabButton(tab, () => switchTab(tab));
    tabHeader.appendChild(tabButtons[tab]);
  });

  formcon.appendChild(tabHeader);

  const panelWrapper = createEl("div", { id: "panel-wrapper", style: "margin-bottom: 4px;" });

  const textArea = createEl("textarea", {
    id: "text-input",
    rows: 4,
    cols: 50,
    placeholder: "Write your post...",
    style: "width: 100%;"
  });

  panels["Text"] = createPanel("text-panel", [textArea]);

  const imgInput = createFileInput("image/*", true, "img-input");
  const imgPreview = createPreview("img-preview");
  panels["Images"] = createPanel("images-panel", [imgInput, imgPreview]);

  const videoInput = createFileInput("video/*", false, "video-input");
  const videoPreview = createPreview("video-preview");
  panels["Video"] = createPanel("video-panel", [videoInput, videoPreview]);

  const audioInput = createFileInput("audio/*", false, "audio-input");
  const audioPreview = createPreview("audio-preview");
  panels["Audio"] = createPanel("audio-panel", [audioInput, audioPreview]);

  Object.values(panels).forEach(p => panelWrapper.appendChild(p));
  formcon.appendChild(panelWrapper);

  const publishButton = createEl("button", {
    id: "publish-btn",
    disabled: true,
    style: "padding: 8px 16px; cursor: pointer;"
  }, ["Publish"]);

  formcon.appendChild(publishButton);

  const feedContainer = createEl("div", {
    id: "postsContainer",
    class: "postsContainer",
  });

  rightColumn.appendChild(feedContainer);

  switchTab(activeTab);
  refreshFeed();

  // Event Bindings
  textArea.addEventListener("input", checkPublishEnable);

  imgInput.addEventListener("change", () => {
    renderPreview(Array.from(imgInput.files), imgPreview, "image");
    checkPublishEnable();
  });

  videoInput.addEventListener("change", () => {
    renderPreview([videoInput.files[0]], videoPreview, "video");
    checkPublishEnable();
  });

  audioInput.addEventListener("change", () => {
    renderPreview([audioInput.files[0]], audioPreview, "audio");
    checkPublishEnable();
  });

  publishButton.addEventListener("click", async () => {
    publishButton.disabled = true;

    let csrfToken = "";
    try {
      csrfToken = await getCSRF();
    } catch (err) {
      console.error("CSRF error:", err);
      publishButton.disabled = false;
      return;
    }

    const formData = new FormData();
    formData.append("csrf_token", csrfToken);

    if (activeTab === "Text") {
      formData.append("text", textArea.value.trim());
      formData.append("type", "text");
    } else {
      const fileInput = {
        Images: imgInput,
        Video: videoInput,
        Audio: audioInput
      }[activeTab];

      const field = activeTab.toLowerCase();
      const files = Array.from(fileInput.files);

      formData.append("type", field);

      const fieldname = field + (files.length > 1 ? "s" : "");
      files.forEach(file => formData.append(fieldname, file));
    }

    try {
      const result = await apiFetch("/feed/post", "POST", formData, {
        headers: { "X-CSRF-Token": csrfToken }
      });

      if (!result || !result.ok) throw new Error("Upload failed");

      resetInputs();
      await refreshFeed();
    } catch (err) {
      console.error("Feed post error:", err);
    } finally {
      publishButton.disabled = false;
    }
  });

  // Internal Functions

  function switchTab(tab) {
    Object.entries(panels).forEach(([key, panel]) => {
      panel.style.display = key === tab ? "block" : "none";
    });

    Object.entries(tabButtons).forEach(([key, btn]) => {
      const isActive = key === tab;
      btn.style.background = isActive ? "var(--color-fg)" : "";
      btn.style.color = isActive ? "var(--color-bg)" : "";
    });

    activeTab = tab;
    checkPublishEnable();
  }

  function checkPublishEnable() {
    if (activeTab === "Text") {
      publishButton.disabled = textArea.value.trim().length === 0;
    } else if (activeTab === "Images") {
      publishButton.disabled = imgInput.files.length === 0;
    } else if (activeTab === "Video") {
      publishButton.disabled = videoInput.files.length !== 1;
    } else if (activeTab === "Audio") {
      publishButton.disabled = audioInput.files.length !== 1;
    }
  }

  function resetInputs() {
    textArea.value = "";
    [imgInput, videoInput, audioInput].forEach(i => (i.value = ""));
    [imgPreview, videoPreview, audioPreview].forEach(p => (p.innerHTML = ""));
    checkPublishEnable();
  }

  async function getCSRF() {
    const res = await apiFetch("/csrf");
    return res.csrf_token || "";
  }

  async function refreshFeed() {
    fetchFeed(feedContainer);
  }

  // Helper Creators

  function createEl(tag, attrs = {}, children = []) {
    return createElement(tag, attrs, children);
  }

  function createTabButton(label, onClick) {
    const btn = createEl("button", { dataset: { tab: label } }, [label]);
    btn.addEventListener("click", onClick);
    return btn;
  }

  function createPanel(id, children) {
    return createEl("div", { id, style: "display: none;" }, children);
  }

  function createFileInput(accept, multiple, id) {
    return createEl("input", {
      type: "file",
      id,
      accept,
      ...(multiple ? { multiple: true } : {})
    });
  }

  function createPreview(id) {
    return createEl("div", {
      id,
      style: "margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;"
    });
  }

  function renderPreview(files, container, type) {
    container.innerHTML = "";

    files.forEach(file => {
      if (!file || !file.type.startsWith(type)) return;

      const reader = new FileReader();
      reader.onload = e => {
        const src = e.target.result;
        const el = type === "image"
          ? createEl("img", {
            src,
            style: "max-width: 120px; max-height: 120px; object-fit: cover; border: 1px solid #ccc;"
          })
          : type === "video"
            ? createEl("video", {
              src,
              controls: true,
              style: "max-width: 240px; max-height: 240px;"
            })
            : createEl("audio", {
              src,
              controls: true,
              style: "max-width: 240px;"
            });

        container.appendChild(el);
      };
      reader.readAsDataURL(file);
    });
  }
}

// import { createElement } from "../../components/createElement.js";
// import { apiFetch } from "../../api/api.js";
// import { fetchFeed } from "../feed/fetchFeed.js";
// import { miscnav } from "./miscnav.js";

// export function displayWeed(isLoggedIn, root) {
//   const tabs = ["Text", "Images", "Video", "Audio"];
//   let activeTab = "Text";

//   const layout = createElement("div", {
//     class: "feed",
//   });

//   const leftColumn = createElement("div", {
//     class: "form-column",
//   });

//   const rightColumn = createElement("div", {
//     class: "feed-column",
//   });

//   root.appendChild(layout);
//   layout.appendChild(leftColumn);
//   layout.appendChild(rightColumn);

//   const formcon = createElement("div",{"class":"hvflex"},[]);
//   leftColumn.appendChild(formcon);

//   const misccon = createElement("div",{"class":"vflex"},[]);
//   misccon.appendChild(miscnav() );
//   leftColumn.appendChild(misccon);

//   const tabButtons = {};
//   const tabHeader = createElement("div", {
//     id: "tab-header",
//     style: "display: flex; gap: 8px; margin-bottom: 12px;"
//   });

//   tabs.forEach((tabName) => {
//     const btn = createTabButton(tabName, () => switchTab(tabName));
//     tabButtons[tabName] = btn;
//     tabHeader.appendChild(btn);
//   });
//   formcon.appendChild(tabHeader);

//   const panelWrapper = createElement("div", {
//     id: "panel-wrapper",
//     style: "margin-bottom: 4px;"
//   });

//   const textArea = createElement("textarea", {
//     id: "text-input",
//     rows: 4,
//     cols: 50,
//     placeholder: "Write your post...",
//     style: "width: 100%;"
//   });
//   const textPanel = createPanel("text-panel", [textArea]);

//   const imgInput = createFileInput("image/*", true, "img-input");
//   const imgPreviewContainer = createPreviewContainer("img-preview");
//   const imagesPanel = createPanel("images-panel", [imgInput, imgPreviewContainer]);

//   const videoInput = createFileInput("video/*", false, "video-input");
//   const videoPreviewContainer = createPreviewContainer("video-preview");
//   const videoPanel = createPanel("video-panel", [videoInput, videoPreviewContainer]);

//   const audioInput = createFileInput("audio/*", false, "audio-input");
//   const audioPreviewContainer = createPreviewContainer("audio-preview");
//   const audioPanel = createPanel("audio-panel", [audioInput, audioPreviewContainer]);

//   panelWrapper.appendChild(textPanel);
//   panelWrapper.appendChild(imagesPanel);
//   panelWrapper.appendChild(videoPanel);
//   panelWrapper.appendChild(audioPanel);
//   formcon.appendChild(panelWrapper);

//   const publishButton = createElement("button", {
//     id: "publish-btn",
//     disabled: true,
//     style: "padding: 8px 16px; cursor: pointer;"
//   }, ["Publish"]);
//   formcon.appendChild(publishButton);

//   const feedContainer = createElement("div", {
//     id: "postsContainer",
//     class: "postsContainer",
//     style: "margin-top: 8px;"
//   });
//   rightColumn.appendChild(feedContainer);

//   switchTab(activeTab);
//   refreshFeed();

//   function switchTab(newTab) {
//     [textPanel, imagesPanel, videoPanel, audioPanel].forEach((panel) => {
//       panel.style.display = "none";
//     });

//     Object.values(tabButtons).forEach((btn) => {
//       btn.style.background = "";
//       btn.style.color = "";
//     });

//     if (newTab === "Text") textPanel.style.display = "block";
//     if (newTab === "Images") imagesPanel.style.display = "block";
//     if (newTab === "Video") videoPanel.style.display = "block";
//     if (newTab === "Audio") audioPanel.style.display = "block";

//     tabButtons[newTab].style.background = "var(--color-fg)";
//     tabButtons[newTab].style.color = "var(--color-bg)";

//     activeTab = newTab;
//     checkPublishEnable();
//   }

//   textArea.addEventListener("input", checkPublishEnable);

//   imgInput.addEventListener("change", () => {
//     renderPreviewList(Array.from(imgInput.files), imgPreviewContainer, "image");
//     checkPublishEnable();
//   });

//   videoInput.addEventListener("change", () => {
//     renderPreviewList([videoInput.files[0]], videoPreviewContainer, "video");
//     checkPublishEnable();
//   });

//   audioInput.addEventListener("change", () => {
//     renderPreviewList([audioInput.files[0]], audioPreviewContainer, "audio");
//     checkPublishEnable();
//   });

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

//   publishButton.addEventListener("click", async () => {
//     publishButton.disabled = true;
//     let csrfToken = "";
//     try {
//       csrfToken = await getCSRFToken();
//     } catch (err) {
//       console.error("CSRF error:", err);
//       publishButton.disabled = false;
//       return;
//     }

//     const formData = new FormData();
//     formData.append("text", activeTab === "Text" ? textArea.value.trim() : "");

//     if (activeTab === "Images") {
//       Array.from(imgInput.files).forEach((file) => {
//         formData.append("type", "image");
//         formData.append("images", file);
//       });
//     } else if (activeTab === "Video") {
//       formData.append("type", "video");
//       formData.append("videos", videoInput.files[0]);
//     } else if (activeTab === "Audio") {
//       formData.append("type", "audio");
//       formData.append("audios", audioInput.files[0]);
//     }

//     formData.append("csrf_token", csrfToken);

//     try {
//       const result = await postToFeed(formData, csrfToken);
//       if (!result || !result.ok) throw new Error("Upload failed");

//       resetInputs();
//       await refreshFeed();
//     } catch (err) {
//       console.error("Feed post error:", err);
//     } finally {
//       publishButton.disabled = false;
//     }
//   });

//   function createTabButton(label, onClick) {
//     const btn = createElement("button", { dataset: { tab: label } }, [label]);
//     btn.addEventListener("click", onClick);
//     return btn;
//   }

//   function createPanel(id, children) {
//     return createElement("div", { id, style: "display: none;" }, children);
//   }

//   function createFileInput(accept, multiple, id) {
//     return createElement("input", {
//       type: "file",
//       id,
//       accept,
//       ...(multiple ? { multiple: true } : {})
//     });
//   }

//   function createPreviewContainer(id) {
//     return createElement("div", {
//       id,
//       style: "margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;"
//     });
//   }

//   function renderPreviewList(files, container, type) {
//     container.innerHTML = "";
//     files.forEach((file) => {
//       if (!file || !file.type.startsWith(type)) return;

//       const reader = new FileReader();
//       reader.onload = (e) => {
//         let el;
//         if (type === "image") {
//           el = createElement("img", {
//             src: e.target.result,
//             style: "max-width: 120px; max-height: 120px; object-fit: cover; border: 1px solid #ccc;"
//           });
//         } else if (type === "video") {
//           el = createElement("video", {
//             src: e.target.result,
//             controls: true,
//             style: "max-width: 240px; max-height: 240px;"
//           });
//         } else if (type === "audio") {
//           el = createElement("audio", {
//             src: e.target.result,
//             controls: true,
//             style: "max-width: 240px;"
//           });
//         }
//         container.appendChild(el);
//       };
//       reader.readAsDataURL(file);
//     });
//   }

//   function resetInputs() {
//     textArea.value = "";
//     imgInput.value = "";
//     videoInput.value = "";
//     audioInput.value = "";
//     [imgPreviewContainer, videoPreviewContainer, audioPreviewContainer].forEach(c => c.innerHTML = "");
//     checkPublishEnable();
//   }

//   async function getCSRFToken() {
//     const res = await apiFetch("/csrf");
//     return res.csrf_token || "";
//   }

//   async function postToFeed(formData, csrfToken) {
//     return await apiFetch("/feed/post", "POST", formData, {
//       headers: { "X-CSRF-Token": csrfToken }
//     });
//   }

//   async function refreshFeed() {
//     fetchFeed(feedContainer);
//   }
// }
