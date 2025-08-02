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

  const layout = createEl("div", {
    style: "display: flex; flex-direction: column; max-width: 600px; margin: 0 auto; gap: 16px; padding: 16px;"
  });

  root.innerHTML = "";
  root.appendChild(layout);

  // Form Section
  const formCon = createEl("div", {});
  const tabHeader = createEl("div", { role: "tablist", style: "display: flex; gap: 8px;" });

  TAB_CONFIG.forEach(cfg => {
    const btn = createTabButton(cfg.name, () => switchTab(cfg.name));
    tabButtons[cfg.name] = btn;
    tabHeader.appendChild(btn);

    let content;
    if (cfg.type === "text") {
      content = createEl("textarea", {
        id: "text-input",
        rows: 4,
        placeholder: "Write something…",
        style: "width: 100%; padding: 8px;"
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
      content = createEl("div", {}, [input, preview]);
    }

    panels[cfg.name] = createPanel(`${cfg.type}-panel`, [content]);
  });

  const panelWrapper = createEl("div", {});
  Object.values(panels)
    .filter(p => p.getAttribute("role") === "tabpanel")
    .forEach(panelWrapper.appendChild.bind(panelWrapper));

  const publishBtn = createEl("button", {
    id: "publish-btn",
    disabled: true,
    style: "margin-top: 8px;"
  }, ["Publish"]);
  publishBtn.addEventListener("click", handlePublish);

  formCon.appendChild(tabHeader);
  formCon.appendChild(panelWrapper);
  formCon.appendChild(publishBtn);
  layout.appendChild(formCon);

  // Feed Section
  const feedContainer = createEl("div", { id: "postsContainer" });
  layout.appendChild(feedContainer);

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

// ——— Reused helpers ———

function createEl(tag, attrs = {}, children = []) {
  if (attrs.class && typeof attrs.class === "string") {
    attrs.class = [attrs.class];
  }
  return createElement(tag, attrs, children);
}

function createTabButton(label, onClick) {
  const btn = createEl("button", {
    role: "tab",
    dataset: { tab: label },
    ariaSelected: "false",
    style: "padding: 6px 12px; border: none; background: #eee; cursor: pointer;"
  }, [label]);
  btn.addEventListener("click", onClick);
  return btn;
}

function createPanel(id, children) {
  return createEl("div", { id, role: "tabpanel", style: "display: none;" }, children);
}

function createFileInput(type, multiple) {
  return createEl("input", {
    type: "file",
    accept: `${type}/*`,
    multiple: multiple || undefined
  });
}

function createPreviewContainer(id) {
  return createEl("div", { id, style: "margin-top: 8px;" });
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
        el = createEl("img", { src, style: "width: 100%; max-height: 300px;" });
      } else if (type === "video") {
        el = createEl("video", { src, controls: true, style: "width: 100%;" });
      } else {
        el = createEl("audio", { src, controls: true });
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
// import { Button } from "../../components/base/Button.js";
// import { createTabs } from "../../components/ui/createTabs.js";

// export function displayTumblr(isLoggedIn, contentContainer) {
//   contentContainer.innerHTML = "";

//   // --- Compose box ---
//   const composeBox = createElement("section", { class: "compose-box" }, [
//     createElement("div", { class: "compose-tabs" }, [
//       Button("Text", "tab-text", { click: () => switchCompose("text") }, "compose-tab active"),
//       Button("Image", "tab-image", { click: () => switchCompose("image") }, "compose-tab"),
//       Button("Video", "tab-video", { click: () => switchCompose("video") }, "compose-tab"),
//       Button("Audio", "tab-audio", { click: () => switchCompose("audio") }, "compose-tab")
//     ]),
//     createElement("div", { class: "compose-panels" }, [
//       createElement("textarea", {
//         id: "compose-text",
//         class: "compose-panel active",
//         placeholder: "Say something..."
//       }),
//       createElement("input", {
//         id: "compose-image",
//         class: "compose-panel",
//         type: "file",
//         accept: "image/*"
//       }),
//       createElement("input", {
//         id: "compose-video",
//         class: "compose-panel",
//         type: "file",
//         accept: "video/*"
//       }),
//       createElement("input", {
//         id: "compose-audio",
//         class: "compose-panel",
//         type: "file",
//         accept: "audio/*"
//       })
//     ]),
//     Button("Publish", "publish-btn", {}, "publish-button")
//   ]);

//   // --- Feed Tabs ---
//   const feedTabs = createTabs(
//     [
//       {
//         id: "image-tab",
//         title: "Images",
//         render: (container) => {
//           container.appendChild(createPostCard({
//             username: "321",
//             timestamp: "2025-07-26T13:56:39+05:30",
//             avatar: "http://localhost:4000/static/userpic/thumb/uKcruD202TW.jpg",
//             media: {
//               type: "image",
//               src: "http://localhost:4000/static/postpic/thumb/8gpimyNE1g7OTrBA.jpg"
//             }
//           }));
//         }
//       },
//       {
//         id: "video-tab",
//         title: "Videos",
//         render: (container) => {
//           container.appendChild(createPostCard({
//             username: "321",
//             timestamp: "2025-07-26T14:04:51+05:30",
//             avatar: "http://localhost:4000/static/userpic/thumb/uKcruD202TW.jpg",
//             media: {
//               type: "video",
//               poster: "http://localhost:4000/static/postpic/4eqIjl0A0H3Gity8/4eqIjl0A0H3Gity8.jpg",
//               src: "http://localhost:4000/static/postpic/4eqIjl0A0H3Gity8/4eqIjl0A0H3Gity8-144p.mp4"
//             }
//           }));
//         }
//       }
//     ],
//     "tumblr-feed-tabs"
//   );

//   const mainLayout = createElement("main", { class: "tumblr-layout" }, [
//     composeBox,
//     feedTabs
//   ]);

//   contentContainer.appendChild(mainLayout);

//   // --- Compose Tab Switching ---
//   function switchCompose(type) {
//     const tabs = contentContainer.querySelectorAll(".compose-tab");
//     const panels = contentContainer.querySelectorAll(".compose-panel");

//     tabs.forEach((btn) => {
//       const isActive = btn.id === `tab-${type}`;
//       btn.classList.toggle("active", isActive);
//     });

//     panels.forEach((panel) => {
//       const isActive = panel.id === `compose-${type}`;
//       panel.classList.toggle("active", isActive);
//     });
//   }
// }

// // --- Tumblr-style post card ---
// function createPostCard({ username, timestamp, avatar, media }) {
//   const mediaElement = (() => {
//     if (media.type === "image") {
//       return createElement("img", {
//         class: "post-media-image",
//         src: media.src,
//         alt: "Post Image",
//         loading: "lazy"
//       });
//     }

//     if (media.type === "video") {
//       return createElement("video", {
//         class: "post-media-video",
//         src: media.src,
//         poster: media.poster,
//         controls: true,
//         preload: "metadata"
//       });
//     }

//     return null;
//   })();

//   return createElement("article", { class: "post-card" }, [
//     createElement("header", { class: "post-header" }, [
//       createElement("img", {
//         class: "post-avatar",
//         src: avatar,
//         alt: "User Avatar"
//       }),
//       createElement("div", { class: "post-meta" }, [
//         createElement("div", { class: "post-username" }, [username]),
//         createElement("div", { class: "post-timestamp" }, [timestamp])
//       ])
//     ]),
//     createElement("div", { class: "post-media" }, [mediaElement]),
//     createElement("footer", { class: "post-actions" }, [
//       Button("Like", "", {}, "post-action"),
//       Button("Comment", "", {}, "post-action"),
//       Button("Share", "", {}, "post-action")
//     ])
//   ]);
// }

// // import { createElement } from "../../components/createElement.js";
// // import { Button } from "../../components/base/Button.js";
// // import { createTabs } from "../../components/ui/createTabs.js";

// // export function displayTumblr(isLoggedIn, contentContainer) {
// //   contentContainer.innerHTML = "";

// //   const feedLayout = createElement("div", { class: "feed-layout" }, [
// //     // Right sidebar
// //     createElement("div", { class: "vflex misccon", style: "order: 3;" }, [
// //       createElement("div", { class: "miscnavcon" }, [
// //         createElement("h2", {}, ["Other"]),
// //         createElement("ul", {}, [
// //           createElement("li", {}, [
// //             Button("Messages", "feed-msg-btn", {}, "button")
// //           ])
// //         ])
// //       ])
// //     ]),

// //     // Form panel
// //     createElement("div", { class: "vflex formcon", style: "order: 1;" }, [
// //       createElement("div", {
// //         id: "tab-header",
// //         role: "tablist",
// //         class: "tab-header"
// //       }, [
// //         createElement("button", {
// //           role: "tab",
// //           "data-tab": "Text",
// //           "aria-selected": "true",
// //           class: "tab-btn active-tab"
// //         }, ["Text"]),
// //         createElement("button", {
// //           role: "tab",
// //           "data-tab": "Images",
// //           "aria-selected": "false",
// //           class: "tab-btn"
// //         }, ["Images"]),
// //         createElement("button", {
// //           role: "tab",
// //           "data-tab": "Video",
// //           "aria-selected": "false",
// //           class: "tab-btn"
// //         }, ["Video"]),
// //         createElement("button", {
// //           role: "tab",
// //           "data-tab": "Audio",
// //           "aria-selected": "false",
// //           class: "tab-btn"
// //         }, ["Audio"])
// //       ]),
// //       createElement("div", { id: "panel-wrapper", class: "panel-wrapper" }, [
// //         createElement("div", {
// //           id: "text-panel",
// //           role: "tabpanel",
// //           class: "tab-panel",
// //           style: "display: block;"
// //         }, [
// //           createElement("textarea", {
// //             id: "text-input",
// //             rows: "4",
// //             cols: "50",
// //             placeholder: "Write your post…",
// //             class: "text-area"
// //           })
// //         ]),
// //         createElement("div", {
// //           id: "image-panel",
// //           role: "tabpanel",
// //           class: "tab-panel",
// //           style: "display: none;"
// //         }, [
// //           createElement("input", {
// //             type: "file",
// //             accept: "image/*",
// //             multiple: "",
// //             class: "file-input"
// //           }),
// //           createElement("div", {
// //             id: "image-preview",
// //             class: "preview-container"
// //           })
// //         ]),
// //         createElement("div", {
// //           id: "video-panel",
// //           role: "tabpanel",
// //           class: "tab-panel",
// //           style: "display: none;"
// //         }, [
// //           createElement("input", {
// //             type: "file",
// //             accept: "video/*",
// //             class: "file-input"
// //           }),
// //           createElement("div", {
// //             id: "video-preview",
// //             class: "preview-container"
// //           })
// //         ]),
// //         createElement("div", {
// //           id: "audio-panel",
// //           role: "tabpanel",
// //           class: "tab-panel",
// //           style: "display: none;"
// //         }, [
// //           createElement("input", {
// //             type: "file",
// //             accept: "audio/*",
// //             class: "file-input"
// //           }),
// //           createElement("div", {
// //             id: "audio-preview",
// //             class: "preview-container"
// //           })
// //         ])
// //       ]),
// //       createElement("button", {
// //         id: "publish-btn",
// //         disabled: "",
// //         class: "publish-btn"
// //       }, ["Publish"])
// //     ]),

// //     // Posts container using createTabs
// //     createElement("div", {
// //       id: "postsContainer",
// //       class: "postsContainer",
// //       style: "order: 2;"
// //     }, [
// //       createTabs([
// //         {
// //           id: "image-tab",
// //           title: "Image",
// //           render: (container) => {
// //             // Append a post or placeholder
// //             container.appendChild(
// //               createElement("article", {
// //                 class: ["feed-item"],
// //                 date: "2025-07-26T13:56:39+05:30",
// //                 style: "--after-bg: url(http://localhost:4000/static/userpic/thumb/uKcruD202TW.jpg);"
// //               }, [
// //                 createElement("div", { class: "post-header hflex" }, [
// //                   createElement("a", {
// //                     href: "/user/321",
// //                     class: "user-icon"
// //                   }, [
// //                     createElement("img", {
// //                       src: "http://localhost:4000/static/userpic/thumb/uKcruD202TW.jpg",
// //                       alt: "Profile Picture",
// //                       class: "profile-thumb",
// //                       loading: "lazy"
// //                     })
// //                   ]),
// //                   createElement("div", { class: "user-time" }, [
// //                     createElement("div", { class: "username" }, ["321"]),
// //                     createElement("div", { class: "timestamp" }, ["2025-07-26T13:56:39+05:30"])
// //                   ])
// //                 ]),
// //                 createElement("div", { class: "post-media" }, [
// //                   createElement("ul", {
// //                     class: [
// //                       "preview_image_wrap__Q29V8",
// //                       "PostPreviewImageView_-artist__WkyUA",
// //                       "PostPreviewImageView_-bottom_radius__Mmn--",
// //                       "PostPreviewImageView_-one__-6MMx"
// //                     ]
// //                   }, [
// //                     createElement("li", { class: "PostPreviewImageView_image_item__dzD2P" }, [
// //                       createElement("img", {
// //                         src: "http://localhost:4000/static/postpic/thumb/8gpimyNE1g7OTrBA.jpg",
// //                         alt: "Post Image",
// //                         class: "post-image PostPreviewImageView_post_image__zLzXH",
// //                         loading: "lazy"
// //                       })
// //                     ])
// //                   ])
// //                 ]),
// //                 createElement("div", { class: "post-actions" }, [
// //                   createElement("span", { class: "like" }, ["Like (0)"]),
// //                   createElement("span", { class: "comment" }, ["Comment"]),
// //                   createElement("div", { class: "more-wrapper" }, [
// //                     createElement("button", { class: "more-btn" }, ["⋮"]),
// //                     createElement("div", { class: "dropdown hidden" }, [
// //                       createElement("button", { class: "report-btn" }, ["Report"])
// //                     ])
// //                   ])
// //                 ])
// //               ])
// //             );
// //           }
// //         },
// //         {
// //           id: "video-tab",
// //           title: "Video",
// //           render: (container) => {
// //             container.appendChild(
// //               createElement("article", {
// //                 class: ["feed-item"],
// //                 date: "2025-07-26T14:04:51+05:30",
// //                 style: "--after-bg: url(http://localhost:4000/static/userpic/thumb/uKcruD202TW.jpg);"
// //               }, [
// //                 createElement("div", { class: "post-header hflex" }, [
// //                   createElement("a", {
// //                     href: "/user/321",
// //                     class: "user-icon"
// //                   }, [
// //                     createElement("img", {
// //                       src: "http://localhost:4000/static/userpic/thumb/uKcruD202TW.jpg",
// //                       alt: "Profile Picture",
// //                       class: "profile-thumb",
// //                       loading: "lazy"
// //                     })
// //                   ]),
// //                   createElement("div", { class: "user-time" }, [
// //                     createElement("div", { class: "username" }, ["321"]),
// //                     createElement("div", { class: "timestamp" }, ["2025-07-26T14:04:51+05:30"])
// //                   ])
// //                 ]),
// //                 createElement("div", { class: "post-media" }, [
// //                   createElement("div", { class: "video-container theme-light" }, [
// //                     createElement("div", { class: "videocon" }, [
// //                       createElement("video", {
// //                         class: "video-player",
// //                         src: "http://localhost:4000/static/postpic/4eqIjl0A0H3Gity8/4eqIjl0A0H3Gity8-144p.mp4",
// //                         poster: "http://localhost:4000/static/postpic/4eqIjl0A0H3Gity8/4eqIjl0A0H3Gity8.jpg",
// //                         loop: "",
// //                         preload: "metadata",
// //                         crossorigin: "anonymous",
// //                         "aria-label": "Video Player"
// //                       })
// //                     ]),
// //                     createElement("div", { class: "hflex-sb buttcon" }, [
// //                       createElement("select", { class: "quality-selector buttonx" }, [
// //                         createElement("option", {
// //                           value: "http://localhost:4000/static/postpic/4eqIjl0A0H3Gity8/4eqIjl0A0H3Gity8.mp4"
// //                         }, ["Original"]),
// //                         createElement("option", {
// //                           value: "http://localhost:4000/static/postpic/4eqIjl0A0H3Gity8/4eqIjl0A0H3Gity8-240p.mp4"
// //                         }, ["240p"]),
// //                         createElement("option", {
// //                           value: "http://localhost:4000/static/postpic/4eqIjl0A0H3Gity8/4eqIjl0A0H3Gity8-144p.mp4"
// //                         }, ["144p"])
// //                       ]),
// //                       Button("Theater Mode", "theater", {}, "buttonx button")
// //                     ])
// //                   ])
// //                 ]),
// //                 createElement("div", { class: "post-actions" }, [
// //                   createElement("span", { class: "like" }, ["Like (0)"]),
// //                   createElement("span", { class: "comment" }, ["Comment"]),
// //                   createElement("div", { class: "more-wrapper" }, [
// //                     createElement("button", { class: "more-btn" }, ["⋮"]),
// //                     createElement("div", { class: "dropdown hidden" }, [
// //                       createElement("button", { class: "report-btn" }, ["Report"])
// //                     ])
// //                   ])
// //                 ])
// //               ])
// //             );
// //           }
// //         }
// //       ], "tumblr-feed-tabs")
// //     ])
// //   ]);

// //   contentContainer.appendChild(feedLayout);
// // }
