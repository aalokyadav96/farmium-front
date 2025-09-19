// gtaMap.js
import { createElement } from "../../components/createElement.js";

export function displayGtaMap(container, isLoggedIn) {
  container.innerHTML = "";

  // Background map image
  const mapImageUrl = "/assets/gta-map.jpg"; // replace with your map image

  // Map + marker layer
  const mapInner = createElement("img", { id: "map-inner", src: mapImageUrl });
  const markerLayer = createElement("div", {
    id: "marker-layer",
    style: "position:absolute;top:0;left:0;width:100%;height:100%",
  });
  const mapWrapper = createElement("div", { id: "map-wrapper" }, [
    mapInner,
    markerLayer,
  ]);
  const mapContainer = createElement(
    "div",
    {
      id: "map-container",
      style:
        "position:relative;overflow:hidden;width:600px;height:400px;border:2px solid #333;cursor:grab;",
    },
    [mapWrapper]
  );

  // Legend (hidden until 'L')
  const legend = createElement(
    "div",
    {
      id: "legend",
      style:
        "position:absolute;top:10px;left:10px;background:#222;color:#fff;padding:10px;display:none;z-index:5",
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
        "position:absolute;bottom:10px;right:10px;width:120px;height:120px;border:2px solid #333;overflow:hidden;z-index:5",
    },
    [minimapImage, minimapViewport]
  );

  // Info panel (appears when marker clicked)
  const infoTitle = createElement("h3", {}, ["Info"]);
  const infoContent = createElement("p", {}, ["Click a marker to see details"]);
  const closeBtn = createElement("button", {}, ["Close"]);
  const infoPanel = createElement(
    "div",
    {
      id: "info-panel",
      style:
        "position:absolute;bottom:10px;left:10px;width:200px;background:#fff;border:1px solid #333;padding:10px;display:none;z-index:5",
    },
    [closeBtn, infoTitle, infoContent]
  );
  closeBtn.addEventListener("click", () => {
    infoPanel.style.display = "none";
  });

  container.append(mapContainer, legend, zoomControls, minimap, infoPanel);

  // Dummy markers (replace with backend later)
  const markers = [
    { id: "m1", type: "house", name: "CJ's House", x: 200, y: 150 },
    { id: "m2", type: "mission", name: "Big Smoke Mission", x: 400, y: 300 },
    { id: "m3", type: "shop", name: "Ammu-Nation", x: 500, y: 100 },
  ];

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
          font-size:20px;
          cursor:pointer;
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

  // Pan + Zoom
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

  // Legend toggle with L key
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "l") {
      legend.style.display = legend.style.display === "none" ? "block" : "none";
    }
  });

  applyTransform();
}

// import { createElement } from "../../components/createElement.js";
// import { apiFetch } from "../../api/api.js";

// export function displayGtaMap(container, isLoggedIn) {
//     const mapData = {
//       areas: [
//         { id: "los_santos", name: "Los Santos", x: 50, y: 200, locked: false },
//         { id: "san_fierro", name: "San Fierro", x: 250, y: 100, locked: true },
//         { id: "las_venturas", name: "Las Venturas", x: 400, y: 50, locked: true }
//       ],
//       legends: [
//         { id: "safehouse", label: "Safehouse", icon: "🏠", x: 60, y: 210 },
//         { id: "mission", label: "Mission", icon: "⭐", x: 120, y: 180 },
//         { id: "shop", label: "Shop", icon: "💲", x: 90, y: 240 }
//       ]
//     };
  
//     let player = { x: 60, y: 210, area: "los_santos" };
//     let showLegends = false;
//     const radarRadius = 80;
  
//     function renderMap() {
//       const mapWrapper = createElement("div", {
//         id: "map-wrapper",
//         styles: `
//           position:relative;
//           width:500px;height:300px;
//           overflow:hidden;
//           border:2px solid #333;
//         `
//       });
  
//       const map = createElement("div", {
//         id: "map",
//         styles: `
//           position:absolute;
//           width:1000px;height:600px;
//           background:url('/assets/map.png') no-repeat center center;
//           background-size:cover;
//           cursor:grab;
//         `
//       });
  
//       mapData.areas.forEach(area => {
//         const areaNode = createElement("div", {
//           id: `area-${area.id}`,
//           styles: `
//             position:absolute;
//             left:${area.x}px;
//             top:${area.y}px;
//             width:80px;height:60px;
//             background:${area.locked ? "rgba(68,68,68,0.7)" : "rgba(0,160,0,0.7)"};
//             color:#fff;
//             text-align:center;
//             line-height:60px;
//             cursor:${area.locked ? "not-allowed" : "pointer"};
//           `
//         }, [area.locked ? "LOCKED" : area.name]);
  
//         areaNode.addEventListener("click", () => {
//           if (area.locked) return;
//           player.area = area.id;
//           player.x = area.x + 10;
//           player.y = area.y + 10;
//           renderHUD();
//         });
  
//         map.appendChild(areaNode);
//       });
  
//       // Player marker
//       const playerMarker = createElement("div", {
//         id: "player-marker",
//         styles: `
//           position:absolute;
//           left:${player.x}px;
//           top:${player.y}px;
//           width:10px;height:10px;
//           background:red;
//           border-radius:50%;
//         `
//       });
//       map.appendChild(playerMarker);
  
//       // Make map draggable
//       let isDragging = false;
//       let startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0;
  
//       map.addEventListener("mousedown", (e) => {
//         isDragging = true;
//         startX = e.pageX - map.offsetLeft;
//         startY = e.pageY - map.offsetTop;
//         map.style.cursor = "grabbing";
//       });
  
//       document.addEventListener("mouseup", () => {
//         isDragging = false;
//         map.style.cursor = "grab";
//       });
  
//       document.addEventListener("mousemove", (e) => {
//         if (!isDragging) return;
//         const dx = e.pageX - startX;
//         const dy = e.pageY - startY;
//         map.style.left = `${dx}px`;
//         map.style.top = `${dy}px`;
//       });
  
//       mapWrapper.appendChild(map);
//       return mapWrapper;
//     }
  
//     function renderRadar() {
//       const radar = createElement("div", {
//         id: "radar",
//         styles: `
//           position:absolute;
//           bottom:10px;right:10px;
//           width:120px;height:120px;
//           border-radius:50%;
//           border:2px solid white;
//           background:#111;
//           overflow:hidden;
//         `
//       });
  
//       mapData.legends.forEach(icon => {
//         const dx = icon.x - player.x;
//         const dy = icon.y - player.y;
//         const dist = Math.sqrt(dx*dx + dy*dy);
//         if (dist <= radarRadius) {
//           const radarIcon = createElement("div", {
//             styles: `
//               position:absolute;
//               left:${60 + dx/5}px;
//               top:${60 + dy/5}px;
//               font-size:14px;
//               color:white;
//             `
//           }, [icon.icon]);
//           radar.appendChild(radarIcon);
//         }
//       });
  
//       const radarPlayer = createElement("div", {
//         styles: `
//           position:absolute;
//           left:58px;top:58px;
//           width:6px;height:6px;
//           background:red;
//           border-radius:50%;
//         `
//       });
//       radar.appendChild(radarPlayer);
  
//       return radar;
//     }
  
//     function renderLegendsBox() {
//       if (!showLegends) return createElement("div", {});
//       return createElement("div", {
//         id: "legend-box",
//         styles: "margin-top:10px;color:#fff;"
//       }, mapData.legends.map(l => createElement("div", {}, [`${l.icon} ${l.label}`])));
//     }
  
//     function renderHUD() {
//       container.innerHTML = ""; // reset container
//       const map = renderMap();
//       const radar = renderRadar();
//       const legendBox = renderLegendsBox();
//       const hud = createElement("div", { id: "hud", styles: "position:relative;" }, [map, radar, legendBox]);
//       container.appendChild(hud);
//     }
  
//     document.addEventListener("keydown", (e) => {
//       if (e.key === "l" || e.key === "L") {
//         showLegends = !showLegends;
//         renderHUD();
//       }
//     });
  
//     renderHUD();
//   }
  
// // import { createElement } from "../../components/createElement.js";
// // import { apiFetch } from "../../api/api.js";

// // export function displayGtaMap(container, isLoggedIn) {

// //     const mapData = {
// //       areas: [
// //         { id: "los_santos", name: "Los Santos", x: 50, y: 200, locked: false },
// //         { id: "san_fierro", name: "San Fierro", x: 250, y: 100, locked: true },
// //         { id: "las_venturas", name: "Las Venturas", x: 400, y: 50, locked: true }
// //       ],
// //       legends: [
// //         { id: "safehouse", label: "Safehouse", icon: "🏠", x: 60, y: 210 },
// //         { id: "mission", label: "Mission", icon: "⭐", x: 120, y: 180 },
// //         { id: "shop", label: "Shop", icon: "💲", x: 90, y: 240 }
// //       ]
// //     };
  
// //     let player = { x: 60, y: 210, area: "los_santos" };
// //     let showLegends = false;
// //     const radarRadius = 80; // radius for nearby icons
  
// //     function renderMap() {
// //       const map = createElement("div", { 
// //         id: "map", 
// //         styles: "position:relative;width:500px;height:300px;background:#222;" 
// //       });
  
// //       mapData.areas.forEach(area => {
// //         const areaNode = createElement("div", {
// //           id: `area-${area.id}`,
// //           styles: `
// //             position:absolute;
// //             left:${area.x}px;
// //             top:${area.y}px;
// //             width:80px;height:60px;
// //             background:${area.locked ? "#444" : "#0a0"};
// //             color:#fff;
// //             text-align:center;
// //             line-height:60px;
// //             cursor:${area.locked ? "not-allowed" : "pointer"};
// //           `
// //         }, [area.locked ? "LOCKED" : area.name]);
  
// //         areaNode.addEventListener("click", () => {
// //           if (area.locked) return;
// //           player.area = area.id;
// //           player.x = area.x + 10;
// //           player.y = area.y + 10;
// //           renderHUD();
// //         });
  
// //         map.appendChild(areaNode);
// //       });
  
// //       // Player marker
// //       const playerMarker = createElement("div", {
// //         id: "player-marker",
// //         styles: `
// //           position:absolute;
// //           left:${player.x}px;
// //           top:${player.y}px;
// //           width:10px;height:10px;
// //           background:red;
// //           border-radius:50%;
// //         `
// //       });
// //       map.appendChild(playerMarker);
  
// //       return map;
// //     }
  
// //     function renderRadar() {
// //       const radar = createElement("div", {
// //         id: "radar",
// //         styles: `
// //           position:absolute;
// //           bottom:10px;right:10px;
// //           width:120px;height:120px;
// //           border-radius:50%;
// //           border:2px solid white;
// //           background:#111;
// //           overflow:hidden;
// //         `
// //       });
  
// //       // Nearby icons only
// //       mapData.legends.forEach(icon => {
// //         const dx = icon.x - player.x;
// //         const dy = icon.y - player.y;
// //         const dist = Math.sqrt(dx*dx + dy*dy);
// //         if (dist <= radarRadius) {
// //           const radarIcon = createElement("div", {
// //             styles: `
// //               position:absolute;
// //               left:${60 + dx/5}px;
// //               top:${60 + dy/5}px;
// //               font-size:14px;
// //               color:white;
// //             `
// //           }, [icon.icon]);
// //           radar.appendChild(radarIcon);
// //         }
// //       });
  
// //       // Player marker (center)
// //       const radarPlayer = createElement("div", {
// //         styles: `
// //           position:absolute;
// //           left:58px;top:58px;
// //           width:6px;height:6px;
// //           background:red;
// //           border-radius:50%;
// //         `
// //       });
// //       radar.appendChild(radarPlayer);
  
// //       return radar;
// //     }
  
// //     function renderLegendsBox() {
// //       if (!showLegends) return createElement("div", {});
// //       return createElement("div", {
// //         id: "legend-box",
// //         styles: "margin-top:10px;color:#fff;"
// //       }, mapData.legends.map(l => createElement("div", {}, [`${l.icon} ${l.label}`])));
// //     }
  
// //     function renderHUD() {
// //       container.innerHTML = ""; // safe reset
  
// //       const map = renderMap();
// //       const radar = renderRadar();
// //       const legendBox = renderLegendsBox();
  
// //       const hud = createElement("div", { id: "hud", styles: "position:relative;" }, [map, radar, legendBox]);
// //       container.appendChild(hud);
// //     }
  
// //     // Toggle legends with "L"
// //     document.addEventListener("keydown", (e) => {
// //       if (e.key === "l" || e.key === "L") {
// //         showLegends = !showLegends;
// //         renderHUD();
// //       }
// //     });
  
// //     renderHUD();
// //   }
  