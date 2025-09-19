import { createElement } from "../../components/createElement.js";
import { apiFetch } from "../../api/api.js";

export async function displayGtaMap(container, isLoggedIn, config = {}, markers = []) {
  container.innerHTML = "";

  // Advance mission button
  const advanceBtn = createElement(
    "button",
    {
      id: "advance-btn",
      style: "margin-bottom:10px;padding:6px 12px;cursor:pointer;"
    },
    ["▶ Advance Mission"]
  );

  advanceBtn.addEventListener("click", async () => {
    try {
      await apiFetch("/api/player/progress", "POST");
      const newConfig = await apiFetch("/api/map/config");
      const newMarkers = await apiFetch("/api/map/markers");
      displayGtaMap(container, isLoggedIn, newConfig, newMarkers);
    } catch (err) {
      console.error("Failed to advance mission:", err);
    }
  });

  container.appendChild(advanceBtn);

  // Map container
  const mapContainer = createElement(
    "div",
    {
      id: "map-container",
      style:
        "position:relative;overflow:hidden;width:600px;height:400px;border:2px solid #333;cursor:grab;",
    }
  );

  const mapImageUrl = config.mapImage || "/assets/gta-map.jpg";
  const mapInner = createElement("img", {
    id: "map-inner",
    src: mapImageUrl,
    style: "display:block;width:100%;height:auto;user-drag:none;pointer-events:none;",
  });

  const markerLayer = createElement("div", {
    id: "marker-layer",
    style: "position:absolute;top:0;left:0;width:100%;height:100%;",
  });

  const lockedLayer = createElement("div", {
    id: "locked-layer",
    style: "position:absolute;top:0;left:0;width:100%;height:100%;z-index:4;",
  });

  const mapWrapper = createElement("div", { id: "map-wrapper" }, [
    mapInner,
    markerLayer,
    lockedLayer,
  ]);

  mapContainer.appendChild(mapWrapper);

  // Legend
  const legend = createElement(
    "div",
    {
      id: "legend",
      style:
        "position:absolute;top:10px;left:10px;background:#222;color:#fff;padding:10px;display:none;z-index:5;font-size:14px;",
    },
    [
      createElement("div", {}, ["🏠 Safehouse"]),
      createElement("div", {}, ["⭐ Mission"]),
      createElement("div", {}, ["💲 Shop"]),
      createElement("div", {}, ["💀 Enemy"]),
    ]
  );

  // Zoom controls
  const zoomControls = createElement(
    "div",
    {
      id: "zoom-controls",
      style: "position:absolute;top:10px;right:10px;z-index:5",
    },
    [
      createElement("button", {}, ["+"]),
      createElement("button", {}, ["−"]),
    ]
  );

  // Radar (mini-map)
  const minimapImage = createElement("img", {
    src: mapImageUrl,
    style: "width:100%;height:100%;object-fit:cover",
  });
  const minimapViewport = createElement("div", {
    id: "minimap-viewport",
    style:
      "position:absolute;border:2px solid red;pointer-events:none;width:40px;height:40px;",
  });
  const minimap = createElement(
    "div",
    {
      id: "minimap",
      style:
        "position:absolute;bottom:10px;right:10px;width:120px;height:120px;border:2px solid #333;overflow:hidden;z-index:5;background:#000;",
    },
    [minimapImage, minimapViewport]
  );

  // Info panel
  const infoTitle = createElement("h3", {}, ["Info"]);
  const infoContent = createElement("p", {}, ["Click a marker to see details"]);
  const closeBtn = createElement("button", {}, ["Close"]);
  const infoPanel = createElement(
    "div",
    {
      id: "info-panel",
      style:
        "position:absolute;bottom:10px;left:10px;width:220px;background:#fff;border:1px solid #333;padding:10px;display:none;z-index:6",
    },
    [closeBtn, infoTitle, infoContent]
  );
  closeBtn.addEventListener("click", () => {
    infoPanel.style.display = "none";
  });

  container.append(mapContainer, legend, zoomControls, minimap, infoPanel);

  // === Markers ===
  const emojiMap = {
    house: "🏠",
    mission: "⭐",
    shop: "💲",
    enemy: "💀",
  };

  markers.forEach((marker) => {
    const el = createElement(
      "div",
      {
        class: "marker",
        style: `
          position:absolute;
          left:${marker.x}px;
          top:${marker.y}px;
          font-size:22px;
          cursor:pointer;
          z-index:3;
        `,
      },
      [emojiMap[marker.type] || "❓"]
    );
    el.addEventListener("click", () => {
      infoTitle.textContent = marker.name;
      infoContent.textContent = `Type: ${marker.type}`;
      infoPanel.style.display = "block";
    });
    markerLayer.appendChild(el);
  });

  // === Locked areas ===
  if (Array.isArray(config.lockedAreas) && config.lockedAreas.length > 0) {
    lockedLayer.style.pointerEvents = "auto";
    config.lockedAreas.forEach((area) => {
      const lockedDiv = createElement(
        "div",
        {
          class: "locked-area",
          style: `
            position:absolute;
            left:${area.x}px;
            top:${area.y}px;
            width:${area.width}px;
            height:${area.height}px;
            background:rgba(0,0,0,0.6);
            backdrop-filter:blur(2px);
            color:white;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:16px;
          `,
        },
        [`🚫 ${area.label}`]
      );
      lockedLayer.appendChild(lockedDiv);
    });
  } else {
    lockedLayer.style.pointerEvents = "none";
  }

  // === Pan + Zoom ===
  let isDragging = false,
    startX = 0,
    startY = 0,
    mapX = 0,
    mapY = 0,
    zoom = 1;
  const zoomStep = 0.1;

  function applyTransform() {
    mapWrapper.style.transform = `translate(${mapX}px, ${mapY}px) scale(${zoom})`;
    updateMinimap();
  }

  function updateMinimap() {
    const visibleWidth = mapContainer.offsetWidth / zoom;
    const visibleHeight = mapContainer.offsetHeight / zoom;
    const minimapScale = minimap.offsetWidth / (mapInner.naturalWidth || 1000);
    minimapViewport.style.width = `${visibleWidth * minimapScale}px`;
    minimapViewport.style.height = `${visibleHeight * minimapScale}px`;
    minimapViewport.style.left = `${-mapX * minimapScale}px`;
    minimapViewport.style.top = `${-mapY * minimapScale}px`;
  }

  mapContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    mapContainer.style.cursor = "grabbing";
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    mapX += e.clientX - startX;
    mapY += e.clientY - startY;
    startX = e.clientX;
    startY = e.clientY;
    applyTransform();
  });
  document.addEventListener("mouseup", () => {
    isDragging = false;
    mapContainer.style.cursor = "grab";
  });

  const [zoomInBtn, zoomOutBtn] = zoomControls.querySelectorAll("button");
  zoomInBtn.addEventListener("click", () => {
    zoom += zoomStep;
    applyTransform();
  });
  zoomOutBtn.addEventListener("click", () => {
    zoom = Math.max(0.5, zoom - zoomStep);
    applyTransform();
  });

  // Legend toggle with L
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "l") {
      legend.style.display = legend.style.display === "none" ? "block" : "none";
    }
  });

  applyTransform();
}

// // gtaMap.js
// import { createElement } from "../../components/createElement.js";

// export function displayGtaMap(container, isLoggedIn, config = {}, markers = []) {
//   container.innerHTML = "";

//   // Fixed size map container
//   const mapContainer = createElement(
//     "div",
//     {
//       id: "map-container",
//       style:
//         "position:relative;overflow:hidden;width:600px;height:400px;border:2px solid #333;cursor:grab;",
//     }
//   );

//   // Background map image
//   const mapImageUrl = config.mapImage || "/assets/gta-map.jpg";
//   const mapInner = createElement("img", {
//     id: "map-inner",
//     src: mapImageUrl,
//     style: "display:block;width:100%;height:auto;user-drag:none;pointer-events:none;",
//   });

//   // Marker + locked layers
//   const markerLayer = createElement("div", {
//     id: "marker-layer",
//     style: "position:absolute;top:0;left:0;width:100%;height:100%;",
//   });
//   const lockedLayer = createElement("div", {
//     id: "locked-layer",
//     style: "position:absolute;top:0;left:0;width:100%;height:100%;z-index:4;",
//   });

//   // Wrapper
//   const mapWrapper = createElement("div", { id: "map-wrapper" }, [
//     mapInner,
//     markerLayer,
//     lockedLayer,
//   ]);

//   mapContainer.appendChild(mapWrapper);

//   // Legend
//   const legend = createElement(
//     "div",
//     {
//       id: "legend",
//       style:
//         "position:absolute;top:10px;left:10px;background:#222;color:#fff;padding:10px;display:none;z-index:5;font-size:14px;",
//     },
//     [
//       createElement("div", {}, ["🏠 Safehouse"]),
//       createElement("div", {}, ["⭐ Mission"]),
//       createElement("div", {}, ["💲 Shop"]),
//       createElement("div", {}, ["💀 Enemy"]),
//     ]
//   );

//   // Zoom controls
//   const zoomControls = createElement(
//     "div",
//     {
//       id: "zoom-controls",
//       style: "position:absolute;top:10px;right:10px;z-index:5",
//     },
//     [
//       createElement("button", {}, ["+"]),
//       createElement("button", {}, ["−"]),
//     ]
//   );

//   // Radar (mini-map)
//   const minimapImage = createElement("img", {
//     src: mapImageUrl,
//     style: "width:100%;height:100%;object-fit:cover",
//   });
//   const minimapViewport = createElement("div", {
//     id: "minimap-viewport",
//     style:
//       "position:absolute;border:2px solid red;pointer-events:none;width:40px;height:40px;",
//   });
//   const minimap = createElement(
//     "div",
//     {
//       id: "minimap",
//       style:
//         "position:absolute;bottom:10px;right:10px;width:120px;height:120px;border:2px solid #333;overflow:hidden;z-index:5;background:#000;",
//     },
//     [minimapImage, minimapViewport]
//   );

//   // Info panel
//   const infoTitle = createElement("h3", {}, ["Info"]);
//   const infoContent = createElement("p", {}, ["Click a marker to see details"]);
//   const closeBtn = createElement("button", {}, ["Close"]);
//   const infoPanel = createElement(
//     "div",
//     {
//       id: "info-panel",
//       style:
//         "position:absolute;bottom:10px;left:10px;width:220px;background:#fff;border:1px solid #333;padding:10px;display:none;z-index:6",
//     },
//     [closeBtn, infoTitle, infoContent]
//   );
//   closeBtn.addEventListener("click", () => {
//     infoPanel.style.display = "none";
//   });

//   container.append(mapContainer, legend, zoomControls, minimap, infoPanel);

//   // === Markers ===
//   const emojiMap = {
//     house: "🏠",
//     mission: "⭐",
//     shop: "💲",
//     enemy: "💀",
//   };

//   markers.forEach((marker) => {
//     const el = createElement(
//       "div",
//       {
//         class: "marker",
//         style: `
//           position:absolute;
//           left:${marker.x}px;
//           top:${marker.y}px;
//           font-size:22px;
//           cursor:pointer;
//           z-index:3;
//         `,
//       },
//       [emojiMap[marker.type] || "❓"]
//     );
//     el.addEventListener("click", () => {
//       infoTitle.textContent = marker.name;
//       infoContent.textContent = `Type: ${marker.type}`;
//       infoPanel.style.display = "block";
//     });
//     markerLayer.appendChild(el);
//   });

//   // === Locked areas ===
//   if (Array.isArray(config.lockedAreas) && config.lockedAreas.length > 0) {
//     lockedLayer.style.pointerEvents = "auto"; // block clicks
//     config.lockedAreas.forEach((area) => {
//       const lockedDiv = createElement(
//         "div",
//         {
//           class: "locked-area",
//           style: `
//             position:absolute;
//             left:${area.x}px;
//             top:${area.y}px;
//             width:${area.width}px;
//             height:${area.height}px;
//             background:rgba(0,0,0,0.6);
//             backdrop-filter:blur(2px);
//             color:white;
//             display:flex;
//             align-items:center;
//             justify-content:center;
//             font-size:16px;
//           `,
//         },
//         [`🚫 ${area.label}`]
//       );
//       lockedLayer.appendChild(lockedDiv);
//     });
//   } else {
//     lockedLayer.style.pointerEvents = "none"; // no locks, allow clicks
//   }

//   // === Pan + Zoom ===
//   let isDragging = false,
//     startX = 0,
//     startY = 0,
//     mapX = 0,
//     mapY = 0,
//     zoom = 1;
//   const zoomStep = 0.1;

//   function applyTransform() {
//     mapWrapper.style.transform = `translate(${mapX}px, ${mapY}px) scale(${zoom})`;
//     updateMinimap();
//   }

//   function updateMinimap() {
//     const visibleWidth = mapContainer.offsetWidth / zoom;
//     const visibleHeight = mapContainer.offsetHeight / zoom;
//     const minimapScale = minimap.offsetWidth / (mapInner.naturalWidth || 1000);
//     minimapViewport.style.width = `${visibleWidth * minimapScale}px`;
//     minimapViewport.style.height = `${visibleHeight * minimapScale}px`;
//     minimapViewport.style.left = `${-mapX * minimapScale}px`;
//     minimapViewport.style.top = `${-mapY * minimapScale}px`;
//   }

//   mapContainer.addEventListener("mousedown", (e) => {
//     isDragging = true;
//     startX = e.clientX;
//     startY = e.clientY;
//     mapContainer.style.cursor = "grabbing";
//   });
//   document.addEventListener("mousemove", (e) => {
//     if (!isDragging) return;
//     mapX += e.clientX - startX;
//     mapY += e.clientY - startY;
//     startX = e.clientX;
//     startY = e.clientY;
//     applyTransform();
//   });
//   document.addEventListener("mouseup", () => {
//     isDragging = false;
//     mapContainer.style.cursor = "grab";
//   });

//   const [zoomInBtn, zoomOutBtn] = zoomControls.querySelectorAll("button");
//   zoomInBtn.addEventListener("click", () => {
//     zoom += zoomStep;
//     applyTransform();
//   });
//   zoomOutBtn.addEventListener("click", () => {
//     zoom = Math.max(0.5, zoom - zoomStep);
//     applyTransform();
//   });

//   // Legend toggle with L
//   document.addEventListener("keydown", (e) => {
//     if (e.key.toLowerCase() === "l") {
//       legend.style.display = legend.style.display === "none" ? "block" : "none";
//     }
//   });

//   applyTransform();
// }

// // // gtaMap.js
// // import { createElement } from "../../components/createElement.js";

// // /**
// //  * GTA-style map with draggable/zoomable map, emoji markers, radar, legend toggle, and dynamic locked areas.
// //  *
// //  * @param {HTMLElement} container - DOM element to render the map into.
// //  * @param {boolean} isLoggedIn - Whether the user is logged in.
// //  * @param {Object} config - Map config from backend (mapImage, lockedAreas).
// //  * @param {Array} markers - Marker data from backend.
// //  */
// // export function displayGtaMap(container, isLoggedIn, config = {}, markers = []) {
// //   container.innerHTML = "";

// //   // Fixed size map container
// //   const mapContainer = createElement(
// //     "div",
// //     {
// //       id: "map-container",
// //       style:
// //         "position:relative;overflow:hidden;width:800px;height:420px;border:2px solid #333;cursor:grab;",
// //     }
// //   );

// //   // Background map image
// //   const mapImageUrl = config.mapImage || "/assets/gta-map.jpg";
// //   const mapInner = createElement("img", {
// //     id: "map-inner",
// //     src: mapImageUrl,
// //     style: "display:block;width:100%;height:auto;user-drag:none;pointer-events:none;",
// //   });

// //   // Marker + locked layers
// //   const markerLayer = createElement("div", {
// //     id: "marker-layer",
// //     style: "position:absolute;top:0;left:0;width:100%;height:100%;",
// //   });
// //   const lockedLayer = createElement("div", {
// //     id: "locked-layer",
// //     style: "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;",
// //   });

// //   // Wrapper
// //   const mapWrapper = createElement("div", { id: "map-wrapper" }, [
// //     mapInner,
// //     markerLayer,
// //     lockedLayer,
// //   ]);

// //   mapContainer.appendChild(mapWrapper);

// //   // Legend
// //   const legend = createElement(
// //     "div",
// //     {
// //       id: "legend",
// //       style:
// //         "position:absolute;top:10px;left:10px;background:#222;color:#fff;padding:10px;display:none;z-index:5;font-size:14px;",
// //     },
// //     [
// //       createElement("div", {}, ["🏠 Safehouse"]),
// //       createElement("div", {}, ["⭐ Mission"]),
// //       createElement("div", {}, ["💲 Shop"]),
// //       createElement("div", {}, ["💀 Enemy"]),
// //     ]
// //   );

// //   // Zoom controls
// //   const zoomControls = createElement(
// //     "div",
// //     {
// //       id: "zoom-controls",
// //       style: "position:absolute;top:10px;right:10px;z-index:5",
// //     },
// //     [
// //       createElement("button", {}, ["+"]),
// //       createElement("button", {}, ["−"]),
// //     ]
// //   );

// //   // Radar (mini-map)
// //   const minimapImage = createElement("img", {
// //     src: mapImageUrl,
// //     style: "width:100%;height:100%;object-fit:cover",
// //   });
// //   const minimapViewport = createElement("div", {
// //     id: "minimap-viewport",
// //     style:
// //       "position:absolute;border:2px solid red;pointer-events:none;width:40px;height:40px;",
// //   });
// //   const minimap = createElement(
// //     "div",
// //     {
// //       id: "minimap",
// //       style:
// //         "position:absolute;bottom:10px;right:10px;width:120px;height:120px;border:2px solid #333;overflow:hidden;z-index:5;background:#000;",
// //     },
// //     [minimapImage, minimapViewport]
// //   );

// //   // Info panel
// //   const infoTitle = createElement("h3", {}, ["Info"]);
// //   const infoContent = createElement("p", {}, ["Click a marker to see details"]);
// //   const closeBtn = createElement("button", {}, ["Close"]);
// //   const infoPanel = createElement(
// //     "div",
// //     {
// //       id: "info-panel",
// //       style:
// //         "position:absolute;bottom:10px;left:10px;width:220px;background:#fff;border:1px solid #333;padding:10px;display:none;z-index:5",
// //     },
// //     [closeBtn, infoTitle, infoContent]
// //   );
// //   closeBtn.addEventListener("click", () => {
// //     infoPanel.style.display = "none";
// //   });

// //   container.append(mapContainer, legend, zoomControls, minimap, infoPanel);

// //   // === Markers ===
// //   const emojiMap = {
// //     house: "🏠",
// //     mission: "⭐",
// //     shop: "💲",
// //     enemy: "💀",
// //   };

// //   markers.forEach((marker) => {
// //     const el = createElement(
// //       "div",
// //       {
// //         class: "marker",
// //         style: `
// //           position:absolute;
// //           left:${marker.x}px;
// //           top:${marker.y}px;
// //           font-size:22px;
// //           cursor:pointer;
// //         `,
// //       },
// //       [emojiMap[marker.type] || "❓"]
// //     );
// //     el.addEventListener("click", () => {
// //       infoTitle.textContent = marker.name;
// //       infoContent.textContent = `Type: ${marker.type}`;
// //       infoPanel.style.display = "block";
// //     });
// //     markerLayer.appendChild(el);
// //   });

// //   // === Locked areas ===
// //   if (Array.isArray(config.lockedAreas)) {
// //     config.lockedAreas.forEach((area) => {
// //       const lockedDiv = createElement(
// //         "div",
// //         {
// //           class: "locked-area",
// //           style: `
// //             position:absolute;
// //             left:${area.x}px;
// //             top:${area.y}px;
// //             width:${area.width}px;
// //             height:${area.height}px;
// //             background:rgba(0,0,0,0.6);
// //             backdrop-filter:blur(2px);
// //             color:white;
// //             display:flex;
// //             align-items:center;
// //             justify-content:center;
// //             font-size:16px;
// //             z-index:4;
// //             pointer-events:auto;
// //           `,
// //         },
// //         [`🚫 ${area.label}`]
// //       );
// //       lockedLayer.appendChild(lockedDiv);
// //     });
// //   }

// //   // === Pan + Zoom ===
// //   let isDragging = false,
// //     startX = 0,
// //     startY = 0,
// //     mapX = 0,
// //     mapY = 0,
// //     zoom = 1;
// //   const zoomStep = 0.1;

// //   function applyTransform() {
// //     mapWrapper.style.transform = `translate(${mapX}px, ${mapY}px) scale(${zoom})`;
// //     updateMinimap();
// //   }

// //   function updateMinimap() {
// //     const visibleWidth = mapContainer.offsetWidth / zoom;
// //     const visibleHeight = mapContainer.offsetHeight / zoom;
// //     const minimapScale = minimap.offsetWidth / (mapInner.naturalWidth || 1000);
// //     minimapViewport.style.width = `${visibleWidth * minimapScale}px`;
// //     minimapViewport.style.height = `${visibleHeight * minimapScale}px`;
// //     minimapViewport.style.left = `${-mapX * minimapScale}px`;
// //     minimapViewport.style.top = `${-mapY * minimapScale}px`;
// //   }

// //   mapContainer.addEventListener("mousedown", (e) => {
// //     isDragging = true;
// //     startX = e.clientX;
// //     startY = e.clientY;
// //     mapContainer.style.cursor = "grabbing";
// //   });
// //   document.addEventListener("mousemove", (e) => {
// //     if (!isDragging) return;
// //     mapX += e.clientX - startX;
// //     mapY += e.clientY - startY;
// //     startX = e.clientX;
// //     startY = e.clientY;
// //     applyTransform();
// //   });
// //   document.addEventListener("mouseup", () => {
// //     isDragging = false;
// //     mapContainer.style.cursor = "grab";
// //   });

// //   const [zoomInBtn, zoomOutBtn] = zoomControls.querySelectorAll("button");
// //   zoomInBtn.addEventListener("click", () => {
// //     zoom += zoomStep;
// //     applyTransform();
// //   });
// //   zoomOutBtn.addEventListener("click", () => {
// //     zoom = Math.max(0.5, zoom - zoomStep);
// //     applyTransform();
// //   });

// //   // Legend toggle with L
// //   document.addEventListener("keydown", (e) => {
// //     if (e.key.toLowerCase() === "l") {
// //       legend.style.display = legend.style.display === "none" ? "block" : "none";
// //     }
// //   });

// //   applyTransform();
// // }

// // // // gtaMap.js
// // // import { createElement } from "../../components/createElement.js";

// // // export function displayGtaMap(container, isLoggedIn) {
// // //   container.innerHTML = "";
// // //   container.style.position = "relative";
// // //   container.style.overflow = "hidden";

// // //   // Map image
// // //   const mapImageUrl = "/assets/gta-map.jpg"; // replace with your map image

// // //   // Map + marker layer
// // //   const mapInner = createElement("img", {
// // //     id: "map-inner",
// // //     src: mapImageUrl,
// // //     style: "display:block;width:100%;height:auto;user-drag:none;pointer-events:none;",
// // //   });
// // //   const markerLayer = createElement("div", {
// // //     id: "marker-layer",
// // //     style: "position:absolute;top:0;left:0;width:100%;height:100%;",
// // //   });
// // //   const mapWrapper = createElement("div", { id: "map-wrapper" }, [
// // //     mapInner,
// // //     markerLayer,
// // //   ]);
// // //   const mapContainer = createElement(
// // //     "div",
// // //     {
// // //       id: "map-container",
// // //       style:
// // //         "position:absolute;top:0;left:0;width:100%;height:100%;border:2px solid #333;cursor:grab;",
// // //     },
// // //     [mapWrapper]
// // //   );

// // //   // Legend
// // //   const legend = createElement(
// // //     "div",
// // //     {
// // //       id: "legend",
// // //       style:
// // //         "position:absolute;top:10px;left:10px;background:#222;color:#fff;padding:10px;display:none;z-index:5;font-size:14px;",
// // //     },
// // //     [
// // //       createElement("div", {}, ["🏠 Safehouse"]),
// // //       createElement("div", {}, ["⭐ Mission"]),
// // //       createElement("div", {}, ["💲 Shop"]),
// // //       createElement("div", {}, ["💀 Enemy"]),
// // //     ]
// // //   );

// // //   // Zoom controls
// // //   const zoomControls = createElement(
// // //     "div",
// // //     {
// // //       id: "zoom-controls",
// // //       style: "position:absolute;top:10px;right:10px;z-index:5",
// // //     },
// // //     [
// // //       createElement("button", {}, ["+"]),
// // //       createElement("button", {}, ["−"]),
// // //     ]
// // //   );

// // //   // Radar (mini-map)
// // //   const minimapImage = createElement("img", {
// // //     src: mapImageUrl,
// // //     style: "width:100%;height:100%;object-fit:cover",
// // //   });
// // //   const minimapViewport = createElement("div", {
// // //     id: "minimap-viewport",
// // //     style:
// // //       "position:absolute;border:2px solid red;pointer-events:none;width:40px;height:40px;",
// // //   });
// // //   const minimap = createElement(
// // //     "div",
// // //     {
// // //       id: "minimap",
// // //       style:
// // //         "position:absolute;bottom:10px;right:10px;width:120px;height:120px;border:2px solid #333;overflow:hidden;z-index:5;background:#000;",
// // //     },
// // //     [minimapImage, minimapViewport]
// // //   );

// // //   // Info panel
// // //   const infoTitle = createElement("h3", {}, ["Info"]);
// // //   const infoContent = createElement("p", {}, ["Click a marker to see details"]);
// // //   const closeBtn = createElement("button", {}, ["Close"]);
// // //   const infoPanel = createElement(
// // //     "div",
// // //     {
// // //       id: "info-panel",
// // //       style:
// // //         "position:absolute;bottom:10px;left:10px;width:220px;background:#fff;border:1px solid #333;padding:10px;display:none;z-index:5",
// // //     },
// // //     [closeBtn, infoTitle, infoContent]
// // //   );
// // //   closeBtn.addEventListener("click", () => {
// // //     infoPanel.style.display = "none";
// // //   });

// // //   container.append(mapContainer, legend, zoomControls, minimap, infoPanel);

// // //   // Dummy markers
// // //   const markers = [
// // //     { id: "m1", type: "house", name: "CJ's House", x: 200, y: 150 },
// // //     { id: "m2", type: "mission", name: "Big Smoke Mission", x: 600, y: 400 },
// // //     { id: "m3", type: "shop", name: "Ammu-Nation", x: 900, y: 200 },
// // //     { id: "m4", type: "enemy", name: "Rival Gang", x: 1200, y: 600 },
// // //   ];

// // //   const emojiMap = {
// // //     house: "🏠",
// // //     mission: "⭐",
// // //     shop: "💲",
// // //     enemy: "💀",
// // //   };

// // //   markers.forEach((marker) => {
// // //     const el = createElement(
// // //       "div",
// // //       {
// // //         class: "marker",
// // //         style: `
// // //           position:absolute;
// // //           left:${marker.x}px;
// // //           top:${marker.y}px;
// // //           font-size:22px;
// // //           cursor:pointer;
// // //         `,
// // //       },
// // //       [emojiMap[marker.type] || "❓"]
// // //     );
// // //     el.addEventListener("click", () => {
// // //       infoTitle.textContent = marker.name;
// // //       infoContent.textContent = `Type: ${marker.type}`;
// // //       infoPanel.style.display = "block";
// // //     });
// // //     markerLayer.appendChild(el);
// // //   });

// // //   // 🔒 Locked areas (example overlay)
// // //   const lockedArea = createElement("div", {
// // //     style: `
// // //       position:absolute;
// // //       left:800px;
// // //       top:0;
// // //       width:600px;
// // //       height:100%;
// // //       background:rgba(0,0,0,0.6);
// // //       backdrop-filter: blur(2px);
// // //       color:white;
// // //       display:flex;
// // //       align-items:center;
// // //       justify-content:center;
// // //       font-size:24px;
// // //       pointer-events:auto;
// // //       z-index:4;
// // //     `,
// // //   }, ["🚫 Locked"]);
// // //   markerLayer.appendChild(lockedArea);

// // //   // Pan + Zoom
// // //   let isDragging = false,
// // //     startX = 0,
// // //     startY = 0,
// // //     mapX = 0,
// // //     mapY = 0,
// // //     zoom = 1;
// // //   const zoomStep = 0.1;

// // //   function applyTransform() {
// // //     mapWrapper.style.transform = `translate(${mapX}px, ${mapY}px) scale(${zoom})`;
// // //     updateMinimap();
// // //   }

// // //   function updateMinimap() {
// // //     const visibleWidth = mapContainer.offsetWidth / zoom;
// // //     const visibleHeight = mapContainer.offsetHeight / zoom;
// // //     const minimapScale = minimap.offsetWidth / (mapInner.naturalWidth || 1000);
// // //     minimapViewport.style.width = `${visibleWidth * minimapScale}px`;
// // //     minimapViewport.style.height = `${visibleHeight * minimapScale}px`;
// // //     minimapViewport.style.left = `${-mapX * minimapScale}px`;
// // //     minimapViewport.style.top = `${-mapY * minimapScale}px`;
// // //   }

// // //   mapContainer.addEventListener("mousedown", (e) => {
// // //     isDragging = true;
// // //     startX = e.clientX;
// // //     startY = e.clientY;
// // //     mapContainer.style.cursor = "grabbing";
// // //   });
// // //   document.addEventListener("mousemove", (e) => {
// // //     if (!isDragging) return;
// // //     mapX += e.clientX - startX;
// // //     mapY += e.clientY - startY;
// // //     startX = e.clientX;
// // //     startY = e.clientY;
// // //     applyTransform();
// // //   });
// // //   document.addEventListener("mouseup", () => {
// // //     isDragging = false;
// // //     mapContainer.style.cursor = "grab";
// // //   });

// // //   const [zoomInBtn, zoomOutBtn] = zoomControls.querySelectorAll("button");
// // //   zoomInBtn.addEventListener("click", () => {
// // //     zoom += zoomStep;
// // //     applyTransform();
// // //   });
// // //   zoomOutBtn.addEventListener("click", () => {
// // //     zoom = Math.max(0.5, zoom - zoomStep);
// // //     applyTransform();
// // //   });

// // //   // Legend toggle with L
// // //   document.addEventListener("keydown", (e) => {
// // //     if (e.key.toLowerCase() === "l") {
// // //       legend.style.display = legend.style.display === "none" ? "block" : "none";
// // //     }
// // //   });

// // //   applyTransform();
// // // }

// // // // // gtaMap.js
// // // // import { createElement } from "../../components/createElement.js";

// // // // export function displayGtaMap(container, isLoggedIn) {
// // // //   container.innerHTML = "";

// // // //   // Background map image
// // // //   const mapImageUrl = "/assets/gta-map.jpg"; // replace with your map image

// // // //   // Map + marker layer
// // // //   const mapInner = createElement("img", { id: "map-inner", src: mapImageUrl });
// // // //   const markerLayer = createElement("div", {
// // // //     id: "marker-layer",
// // // //     style: "position:absolute;top:0;left:0;width:100%;height:100%",
// // // //   });
// // // //   const mapWrapper = createElement("div", { id: "map-wrapper" }, [
// // // //     mapInner,
// // // //     markerLayer,
// // // //   ]);
// // // //   const mapContainer = createElement(
// // // //     "div",
// // // //     {
// // // //       id: "map-container",
// // // //       style:
// // // //         "position:relative;overflow:hidden;width:600px;height:400px;border:2px solid #333;cursor:grab;",
// // // //     },
// // // //     [mapWrapper]
// // // //   );

// // // //   // Legend (hidden until 'L')
// // // //   const legend = createElement(
// // // //     "div",
// // // //     {
// // // //       id: "legend",
// // // //       style:
// // // //         "position:absolute;top:10px;left:10px;background:#222;color:#fff;padding:10px;display:none;z-index:5",
// // // //     },
// // // //     [
// // // //       createElement("div", {}, ["🏠 Safehouse"]),
// // // //       createElement("div", {}, ["⭐ Mission"]),
// // // //       createElement("div", {}, ["💲 Shop"]),
// // // //       createElement("div", {}, ["💀 Enemy"]),
// // // //     ]
// // // //   );

// // // //   // Zoom controls
// // // //   const zoomControls = createElement(
// // // //     "div",
// // // //     {
// // // //       id: "zoom-controls",
// // // //       style: "position:absolute;top:10px;right:10px;z-index:5",
// // // //     },
// // // //     [
// // // //       createElement("button", {}, ["+"]),
// // // //       createElement("button", {}, ["−"]),
// // // //     ]
// // // //   );

// // // //   // Radar (mini-map)
// // // //   const minimapImage = createElement("img", {
// // // //     src: mapImageUrl,
// // // //     style: "width:100%;height:100%;object-fit:cover",
// // // //   });
// // // //   const minimapViewport = createElement("div", {
// // // //     id: "minimap-viewport",
// // // //     style:
// // // //       "position:absolute;border:2px solid red;pointer-events:none;width:40px;height:40px;",
// // // //   });
// // // //   const minimap = createElement(
// // // //     "div",
// // // //     {
// // // //       id: "minimap",
// // // //       style:
// // // //         "position:absolute;bottom:10px;right:10px;width:120px;height:120px;border:2px solid #333;overflow:hidden;z-index:5",
// // // //     },
// // // //     [minimapImage, minimapViewport]
// // // //   );

// // // //   // Info panel (appears when marker clicked)
// // // //   const infoTitle = createElement("h3", {}, ["Info"]);
// // // //   const infoContent = createElement("p", {}, ["Click a marker to see details"]);
// // // //   const closeBtn = createElement("button", {}, ["Close"]);
// // // //   const infoPanel = createElement(
// // // //     "div",
// // // //     {
// // // //       id: "info-panel",
// // // //       style:
// // // //         "position:absolute;bottom:10px;left:10px;width:200px;background:#fff;border:1px solid #333;padding:10px;display:none;z-index:5",
// // // //     },
// // // //     [closeBtn, infoTitle, infoContent]
// // // //   );
// // // //   closeBtn.addEventListener("click", () => {
// // // //     infoPanel.style.display = "none";
// // // //   });

// // // //   container.append(mapContainer, legend, zoomControls, minimap, infoPanel);

// // // //   // Dummy markers (replace with backend later)
// // // //   const markers = [
// // // //     { id: "m1", type: "house", name: "CJ's House", x: 200, y: 150 },
// // // //     { id: "m2", type: "mission", name: "Big Smoke Mission", x: 400, y: 300 },
// // // //     { id: "m3", type: "shop", name: "Ammu-Nation", x: 500, y: 100 },
// // // //   ];

// // // //   const emojiMap = {
// // // //     house: "🏠",
// // // //     mission: "⭐",
// // // //     shop: "💲",
// // // //     enemy: "💀",
// // // //   };

// // // //   markers.forEach((marker) => {
// // // //     const el = createElement(
// // // //       "div",
// // // //       {
// // // //         class: "marker",
// // // //         style: `
// // // //           position:absolute;
// // // //           left:${marker.x}px;
// // // //           top:${marker.y}px;
// // // //           font-size:20px;
// // // //           cursor:pointer;
// // // //         `,
// // // //       },
// // // //       [emojiMap[marker.type] || "❓"]
// // // //     );
// // // //     el.addEventListener("click", () => {
// // // //       infoTitle.textContent = marker.name;
// // // //       infoContent.textContent = `Type: ${marker.type}`;
// // // //       infoPanel.style.display = "block";
// // // //     });
// // // //     markerLayer.appendChild(el);
// // // //   });

// // // //   // Pan + Zoom
// // // //   let isDragging = false,
// // // //     startX = 0,
// // // //     startY = 0,
// // // //     mapX = 0,
// // // //     mapY = 0,
// // // //     zoom = 1;
// // // //   const zoomStep = 0.1;

// // // //   function applyTransform() {
// // // //     mapWrapper.style.transform = `translate(${mapX}px, ${mapY}px) scale(${zoom})`;
// // // //     updateMinimap();
// // // //   }

// // // //   function updateMinimap() {
// // // //     const visibleWidth = mapContainer.offsetWidth / zoom;
// // // //     const visibleHeight = mapContainer.offsetHeight / zoom;
// // // //     const minimapScale = minimap.offsetWidth / (mapInner.naturalWidth || 1000);
// // // //     minimapViewport.style.width = `${visibleWidth * minimapScale}px`;
// // // //     minimapViewport.style.height = `${visibleHeight * minimapScale}px`;
// // // //     minimapViewport.style.left = `${-mapX * minimapScale}px`;
// // // //     minimapViewport.style.top = `${-mapY * minimapScale}px`;
// // // //   }

// // // //   mapContainer.addEventListener("mousedown", (e) => {
// // // //     isDragging = true;
// // // //     startX = e.clientX;
// // // //     startY = e.clientY;
// // // //     mapContainer.style.cursor = "grabbing";
// // // //   });
// // // //   document.addEventListener("mousemove", (e) => {
// // // //     if (!isDragging) return;
// // // //     mapX += e.clientX - startX;
// // // //     mapY += e.clientY - startY;
// // // //     startX = e.clientX;
// // // //     startY = e.clientY;
// // // //     applyTransform();
// // // //   });
// // // //   document.addEventListener("mouseup", () => {
// // // //     isDragging = false;
// // // //     mapContainer.style.cursor = "grab";
// // // //   });

// // // //   const [zoomInBtn, zoomOutBtn] = zoomControls.querySelectorAll("button");
// // // //   zoomInBtn.addEventListener("click", () => {
// // // //     zoom += zoomStep;
// // // //     applyTransform();
// // // //   });
// // // //   zoomOutBtn.addEventListener("click", () => {
// // // //     zoom = Math.max(0.5, zoom - zoomStep);
// // // //     applyTransform();
// // // //   });

// // // //   // Legend toggle with L key
// // // //   document.addEventListener("keydown", (e) => {
// // // //     if (e.key.toLowerCase() === "l") {
// // // //       legend.style.display = legend.style.display === "none" ? "block" : "none";
// // // //     }
// // // //   });

// // // //   applyTransform();
// // // // }
