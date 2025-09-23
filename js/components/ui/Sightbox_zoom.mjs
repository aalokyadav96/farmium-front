import "../../../css/ui/Sightbox.css";
import {createZoomableMedia} from "./createZoomableMedia";

const Sightbox = (mediaSrc, mediaType = "image") => {
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

  // zoomable media
  const { container, mediaEl, resetZoomBtn } = createZoomableMedia(mediaSrc, mediaType);
  content.appendChild(container);

  // close button
  const closeButton = document.createElement("button");
  closeButton.className = "sightbox-close";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.addEventListener("click", closeSightbox);
  content.appendChild(closeButton);

  // reset zoom button
  content.appendChild(resetZoomBtn);

  sightbox.appendChild(overlay);
  sightbox.appendChild(content);
  document.getElementById("app").appendChild(sightbox);

  content.focus();
  history.pushState({ sightboxOpen: true }, "");

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSightbox();
    } else if (e.key === "Tab") {
      const focusable = [closeButton, resetZoomBtn];
      const currentIndex = focusable.indexOf(document.activeElement);
      if (e.shiftKey && currentIndex === 0) {
        e.preventDefault();
        focusable[focusable.length - 1].focus();
      } else if (!e.shiftKey && currentIndex === focusable.length - 1) {
        e.preventDefault();
        focusable[0].focus();
      }
    }
  }

  function onPopState(e) {
    if (e.state && e.state.sightboxOpen) {
      closeSightbox(true);
    }
  }

  function closeSightbox(fromPop = false) {
    if (!document.body.contains(sightbox)) return;
    sightbox.remove();
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("popstate", onPopState);
    if (!fromPop) history.back();
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("popstate", onPopState);

  return sightbox;
};

export default Sightbox;
