// import "../../../css/ui/Vidpop.css";
import { createIconButton } from "../../utils/svgIconButton";
import { xSVG } from "../svgs";
import { generateVideoPlayer } from "./vidpopHelpers";

const Vidpop = (mediaSrc, videoid, options = {}) => {
  const { poster = null, theme = "light", qualities = [], subtitles = [] } = options;

  const sightbox = document.createElement("div");
  sightbox.className = `sightbox theme-${theme}`;

  const overlay = document.createElement("div");
  overlay.className = "sightbox-overlay";
  overlay.addEventListener("click", () => removePopup(sightbox));

  const content = document.createElement("div");
  content.className = "sightbox-content";

  const closeButton = document.createElement("button");
  closeButton.className = "sightbox-close";
  // closeButton.textContent = "×";
  closeButton.appendChild(createIconButton({svgMarkup:xSVG}));
  closeButton.setAttribute("aria-label", "Close Theater Mode");
  closeButton.addEventListener("click", () => removePopup(sightbox));

  sightbox.appendChild(overlay);
  sightbox.appendChild(content);
  // Directly append the generated video player
  generateVideoPlayer(mediaSrc, poster, qualities, subtitles, videoid).then(videoPlayer => {
    content.appendChild(videoPlayer);
    content.appendChild(closeButton);
  });

  document.getElementById('app').appendChild(sightbox);
  return sightbox;
};


function removePopup(popupElement) {
  if (!popupElement || !popupElement.parentNode) return;

  popupElement.classList.add("fade-out"); // CSS should handle opacity transition

  setTimeout(() => {
    if (popupElement.parentNode) {
      popupElement.parentNode.removeChild(popupElement);
    }
  }, 300); // match the CSS transition duration
}


export default Vidpop;
