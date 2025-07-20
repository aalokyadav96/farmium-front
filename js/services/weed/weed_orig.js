// main.js

import { createElement } from "../../components/createElement.js";
import { apiFetch } from ".././../api/api.js";
import {fetchFeed} from "../feed/fetchFeed.js";

// (You can remove this import if you prefer to use `fetch` everywhere.
//  In this example, we’ll only use `apiFetch` for JSON GETs—CSRF and feed.)

export function displayWeed(isLoggedIn, root) {
  // ─────────────────────────────────────────────────────────────────
  // 1) Build the tabbed composer UI
  // ─────────────────────────────────────────────────────────────────

  const tabs = ["Text", "Images", "Video", "Audio"];
  let activeTab = "Text";

  // - Container that holds everything:
  const container = document.createElement("div");
  container.className = "container feed";
  // (You can style #container in CSS later.)
  root.appendChild(container);

  var formcon = createElement('div',{},[]);
  container.appendChild(formcon);

  // -- 1.1) Tab header (buttons “Text” / “Images” / “Video” / “Audio”)
  const tabHeader = document.createElement("div");
  tabHeader.id = "tab-header";
  tabHeader.style.display = "flex";
  tabHeader.style.gap = "8px";
  tabHeader.style.marginBottom = "12px";

  const tabButtons = {};
  tabs.forEach((tabName) => {
    const btn = document.createElement("button");
    btn.textContent = tabName;
    btn.dataset.tab = tabName;
    // btn.style.padding = "6px 12px";
    // btn.style.cursor = "pointer";
    // btn.style.border = "1px solid #666";
    // btn.style.background = tabName === activeTab ? "#eee" : "#fff";

    btn.addEventListener("click", () => {
      switchTab(tabName);
    });

    tabButtons[tabName] = btn;
    tabHeader.appendChild(btn);
  });
  formcon.appendChild(tabHeader);

  // -- 1.2) Panels container (only one panel is visible at a time)
  const panelWrapper = document.createElement("div");
  panelWrapper.id = "panel-wrapper";
  panelWrapper.style.marginBottom = "4px";

  // ---- Text panel
  const textPanel = document.createElement("div");
  textPanel.id = "text-panel";
  const textArea = document.createElement("textarea");
  textArea.id = "text-input";
  textArea.placeholder = "Write your post...";
  textArea.rows = 4;
  textArea.cols = 50;
  textArea.style.width = "100%";
  textPanel.appendChild(textArea);
  panelWrapper.appendChild(textPanel);

  // ---- Images panel
  const imagesPanel = document.createElement("div");
  imagesPanel.id = "images-panel";
  imagesPanel.style.display = "none";
  const imgInput = document.createElement("input");
  imgInput.type = "file";
  imgInput.accept = "image/*";
  imgInput.multiple = true;
  imgInput.id = "img-input";
  imagesPanel.appendChild(imgInput);
  const imgPreviewContainer = document.createElement("div");
  imgPreviewContainer.id = "img-preview";
  imgPreviewContainer.style.marginTop = "8px";
  imgPreviewContainer.style.display = "flex";
  imgPreviewContainer.style.flexWrap = "wrap";
  imgPreviewContainer.style.gap = "8px";
  imagesPanel.appendChild(imgPreviewContainer);
  panelWrapper.appendChild(imagesPanel);

  // ---- Video panel
  const videoPanel = document.createElement("div");
  videoPanel.id = "video-panel";
  videoPanel.style.display = "none";
  const videoInput = document.createElement("input");
  videoInput.type = "file";
  videoInput.accept = "video/*";
  videoInput.id = "video-input";
  videoPanel.appendChild(videoInput);
  const videoPreviewContainer = document.createElement("div");
  videoPreviewContainer.id = "video-preview";
  videoPreviewContainer.style.marginTop = "8px";
  videoPanel.appendChild(videoPreviewContainer);
  panelWrapper.appendChild(videoPanel);

  formcon.appendChild(panelWrapper);

  // ---- Audio panel
  const audioPanel = document.createElement("div");
  audioPanel.id = "audio-panel";
  audioPanel.style.display = "none";
  const audioInput = document.createElement("input");
  audioInput.type = "file";
  audioInput.accept = "audio/*";
  audioInput.id = "audio-input";
  audioPanel.appendChild(audioInput);
  const audioPreviewContainer = document.createElement("div");
  audioPreviewContainer.id = "audio-preview";
  audioPreviewContainer.style.marginTop = "8px";
  audioPanel.appendChild(audioPreviewContainer);
  panelWrapper.appendChild(audioPanel);

  formcon.appendChild(panelWrapper);

  // -- 1.3) “Publish” button
  const publishButton = document.createElement("button");
  publishButton.id = "publish-btn";
  publishButton.textContent = "Publish";
  publishButton.disabled = true;
  publishButton.style.padding = "8px 16px";
  publishButton.style.cursor = "pointer";
  publishButton.style.border = "1px solid #333";
  formcon.appendChild(publishButton);

  // -- 1.4) Feed container (initially empty)
  const feedContainer = document.createElement("div");
  feedContainer.id = "postsContainer";
  feedContainer.className = "postsContainer";
  feedContainer.style.marginTop = "24px";
  container.appendChild(feedContainer);

  // ─────────────────────────────────────────────────────────────────
  // 2) Tab‐switch logic
  // ─────────────────────────────────────────────────────────────────

  function switchTab(newTab) {
    // Hide all panels
    textPanel.style.display = "none";
    imagesPanel.style.display = "none";
    videoPanel.style.display = "none";
    audioPanel.style.display = "none";

    // Reset all tab button backgrounds
    Object.values(tabButtons).forEach((btn) => {
      // btn.style.background = "#fff";
    });

    // Show the requested panel and highlight its tab button
    if (newTab === "Text") {
      textPanel.style.display = "block";
    } else if (newTab === "Images") {
      imagesPanel.style.display = "block";
    } else if (newTab === "Video") {
      videoPanel.style.display = "block";
    } else if (newTab === "Audio") {
      audioPanel.style.display = "block";
    }
    tabButtons[newTab].style.background = "var(--color-fg)";
    tabButtons[newTab].style.color = "var(--color-bg)";

    activeTab = newTab;
    checkPublishEnable();
  }

  // Initialize default tab
  switchTab(activeTab);

  // ─────────────────────────────────────────────────────────────────
  // 3) Preview helpers & “Publish”‐enabling logic
  // ─────────────────────────────────────────────────────────────────

  function clearImagePreviews() {
    imgPreviewContainer.innerHTML = "";
  }
  function clearVideoPreview() {
    videoPreviewContainer.innerHTML = "";
  }
  function clearAudioPreview() {
    audioPreviewContainer.innerHTML = "";
  }

  textArea.addEventListener("input", () => {
    checkPublishEnable();
  });

  imgInput.addEventListener("change", (e) => {
    clearImagePreviews();
    const files = Array.from(e.target.files);
    if (!files.length) {
      checkPublishEnable();
      return;
    }
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.createElement("img");
        img.src = ev.target.result;
        img.style.maxWidth = "120px";
        img.style.maxHeight = "120px";
        img.style.objectFit = "cover";
        img.style.border = "1px solid #ccc";
        imgPreviewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
    checkPublishEnable();
  });

  videoInput.addEventListener("change", (e) => {
    clearVideoPreview();
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("video/")) {
      checkPublishEnable();
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const video = document.createElement("video");
      video.src = ev.target.result;
      video.controls = true;
      video.style.maxWidth = "240px";
      video.style.maxHeight = "240px";
      videoPreviewContainer.appendChild(video);
    };
    reader.readAsDataURL(file);
    checkPublishEnable();
  });

  audioInput.addEventListener("change", (e) => {
    clearAudioPreview();
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("audio/")) {
      checkPublishEnable();
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const audio = document.createElement("audio");
      audio.src = ev.target.result;
      audio.controls = true;
      audio.style.maxWidth = "240px";
      audio.style.maxHeight = "240px";
      audioPreviewContainer.appendChild(audio);
    };
    reader.readAsDataURL(file);
    checkPublishEnable();
  });

  function checkPublishEnable() {
    if (activeTab === "Text") {
      publishButton.disabled = textArea.value.trim().length === 0;
    } else if (activeTab === "Images") {
      publishButton.disabled = imgInput.files.length === 0;
    } else if (activeTab === "Video") {
      publishButton.disabled = !(videoInput.files.length === 1);
    } else if (activeTab === "Audio") {
      publishButton.disabled = !(audioInput.files.length === 1);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 4) CSRF + API‐call helpers
  // ─────────────────────────────────────────────────────────────────

  // (a) GET /api/csrf → { csrf_token: "..." }
  async function getCSRFToken() {
    const res = await apiFetch("/csrf");
    return res.csrf_token || "";
  }

  // (b) POST /api/feed/post  (multipart/form-data)
  // Returns JSON: { ok: true, data: { id, content, media: [ ... ], author, created_at } }
  async function postToFeed(formData, csrfToken) {
    // We attach CSRF token as a header (many Go middleware expect X-CSRF-Token),
    // but also append it to FormData if your handler reads it from form values.
    //
    // If your middleware expects the token in the header:
    //
    const response = await apiFetch("/feed/post", "POST", formData, {
      headers: {
        "X-CSRF-Token": csrfToken
      }
    },
    );
    return await response;
  }

  // // (c) GET /api/feed/feed → [ { id, content, media: [...], author, created_at }, … ]
  // async function fetchFeed() {
  //   const res = await apiFetch("/feed/feed");
  //   if (!Array.isArray(res.data)) {
  //     throw new Error("Feed did not return an array");
  //   }
  //   return res.data;
  // }

  // ─────────────────────────────────────────────────────────────────
  // 5) Render a single post in the feed
  // ─────────────────────────────────────────────────────────────────

  // function createPostElement(post) {
  //   // `post.media` is assumed to be an array of URLs (could be length=0, =1, or >1)
  //   const div = document.createElement("div");
  //   div.className = "feed-post";
  //   div.style.border = "1px solid #ddd";
  //   div.style.padding = "12px";
  //   div.style.marginBottom = "12px";

  //   // -- Author / timestamp
  //   const meta = document.createElement("div");
  //   meta.style.marginBottom = "8px";
  //   meta.style.fontSize = "0.9em";
  //   meta.style.color = "#555";
  //   meta.textContent = `${post.author || "Unknown"} · ${new Date(post.created_at).toLocaleString()}`;
  //   div.appendChild(meta);

  //   // -- Text content (if any)
  //   if (post.content && post.content.trim().length > 0) {
  //     const p = document.createElement("p");
  //     p.textContent = post.content;
  //     p.style.marginBottom = "8px";
  //     div.appendChild(p);
  //   }

  //   // -- Media (images/videos)
  //   if (Array.isArray(post.media) && post.media.length > 0) {
  //     const mediaContainer = document.createElement("div");
  //     mediaContainer.style.display = "flex";
  //     mediaContainer.style.flexWrap = "wrap";
  //     mediaContainer.style.gap = "8px";

  //     post.media.forEach((url) => {
  //       const isImage = /\.(png|jpe?g|gif|webp)$/i.test(url);
  //       const isVideo = /\.(mp4|webm|ogg)$/i.test(url);

  //       if (isImage) {
  //         const img = document.createElement("img");
  //         img.src = url;
  //         img.style.maxWidth = "160px";
  //         img.style.maxHeight = "160px";
  //         img.style.objectFit = "cover";
  //         imgContainerAppend(img, mediaContainer);
  //       } else if (isVideo) {
  //         const video = document.createElement("video");
  //         video.src = url;
  //         video.controls = true;
  //         video.style.maxWidth = "320px";
  //         video.style.maxHeight = "240px";
  //         mediaContainer.appendChild(video);
  //       }
  //     });

  //     div.appendChild(mediaContainer);
  //   }

  //   return div;
  // }

  // function imgContainerAppend(img, container) {
  //   // Some minimal wrapper if you like; for now, just append
  //   container.appendChild(img);
  // }

  
  // // ─────────────────────────────────────────────────────────────────
  // // 6) Refresh entire feed from the server
  // // ─────────────────────────────────────────────────────────────────

  // async function refreshFeed() {
  //   try {
  //     const posts = await fetchFeed();
  //     feedContainer.innerHTML = ""; // clear old
  //     posts.forEach((post) => {
  //       const el = createPostElement(post);
  //       feedContainer.appendChild(el);
  //     });
  //   } catch (err) {
  //     console.error("Could not load feed:", err);
  //   }
  // }

  async function refreshFeed() {
    fetchFeed(feedContainer);
  }

  // Load feed once on page load
  refreshFeed();

  // ─────────────────────────────────────────────────────────────────
  // 7) “Publish” button click handler
  // ─────────────────────────────────────────────────────────────────

  publishButton.addEventListener("click", async () => {
    publishButton.disabled = true;

    // 1) Fetch CSRF
    let csrfToken = "";
    try {
      csrfToken = await getCSRFToken();
    } catch (err) {
      console.error("Could not fetch CSRF token:", err);
      publishButton.disabled = false;
      return;
    }

    // 2) Build form data
    const formData = new FormData();
    // Always include a “text” field (empty string if no text)
    formData.append("text", activeTab === "Text" ? textArea.value.trim() : "");

    // Include exactly one type of media field if activeTab == "Images" or "Video" or "Audio"
    if (activeTab === "Images") {
      const files = Array.from(imgInput.files);
      // Append each image under key “image”
      files.forEach((file) => {
        if (!file.type.startsWith("image/")) return;
        formData.append("type", "image");
        formData.append("images", file);
      });
    } else if (activeTab === "Video") {
      const file = videoInput.files[0];
      if (file && file.type.startsWith("video/")) {
        formData.append("type", "video");
        formData.append("videos", file);
      }
    } else if (activeTab === "Audio") {
      const file = audioInput.files[0];
      if (file && file.type.startsWith("audio/")) {
        formData.append("type", "audio");
        formData.append("audios", file);
      }
    }

    // Append CSRF token (some middleware read it from form-data)
    formData.append("csrf_token", csrfToken);

    // 3) POST to /api/feed/post
    let result;
    try {
      result = await postToFeed(formData, csrfToken);
    } catch (err) {
      console.error("Error posting to feed:", err);
      publishButton.disabled = false;
      return;
    }

    if (!result || !result.ok) {
      console.error("Server responded with an error:", result);
      publishButton.disabled = false;
      return;
    }

    // 4) On success, clear inputs & refresh feed
    textArea.value = "";
    imgInput.value = "";
    videoInput.value = "";
    audioInput.value = "";
    clearImagePreviews();
    clearVideoPreview();
    clearAudioPreview();
    checkPublishEnable();
    await refreshFeed();
  });
}