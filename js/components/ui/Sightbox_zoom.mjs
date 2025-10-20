import "../../../css/ui/SightboxZoom.css";
import { createZoomableMedia } from "./createZoomableMedia";
import { createElement } from "../../components/createElement";

const Sightbox = (mediaSrc, mediaType = "image") => {
  if (document.getElementById("sightbox")) return;

  const overlay = createElement("div", { 
    id: "", 
    class: "sightboxz-overlay", 
    events: { click: () => closeSightbox() } 
  });

  const { container, mediaEl, resetZoomBtn } = createZoomableMedia(mediaSrc, mediaType);

  const closeButton = createElement("button", { 
    class: "sightboxz-close", 
    "aria-label": "Close", 
    events: { click: () => closeSightbox() } 
  }, [document.createTextNode("×")]);

  const content = createElement("div", { 
    class: "sightboxz-content", 
    tabindex: "-1" 
  }, [container, closeButton, resetZoomBtn]);

  const sightbox = createElement("div", { id: "sightbox", class: "sightboxz" }, [
    overlay,
    content
  ]);

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

  function onPopState() {
    if (document.getElementById("sightbox")) {
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
