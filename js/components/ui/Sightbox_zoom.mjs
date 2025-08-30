import { createZoomableMedia } from "./ZoomableMedia.js";

const Sightbox = (src, type = "image") => {
  if (document.getElementById("sightbox")) return;

  const sightbox = document.createElement("div");
  sightbox.id = "sightbox";
  sightbox.className = "sightbox";

  const overlay = document.createElement("div");
  overlay.className = "sightbox-overlay";
  overlay.addEventListener("click", closeSightbox);

  const content = document.createElement("div");
  content.className = "sightbox-content";
  content.setAttribute("tabindex", "-1");
  content.focus();

  const zoomable = createZoomableMedia(src, type);
  content.appendChild(zoomable);

  const closeBtn = document.createElement("button");
  closeBtn.className = "sightbox-close";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", closeSightbox);

  content.appendChild(closeBtn);
  sightbox.appendChild(overlay);
  sightbox.appendChild(content);
  document.getElementById("app").appendChild(sightbox);

  function closeSightbox() {
    sightbox.remove();
    document.removeEventListener("keydown", onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") closeSightbox();
  }

  document.addEventListener("keydown", onKeyDown);
};

export default Sightbox;
