import "../../../css/ui/Sightbox.css";

const Sightbox = (mediaSrc, mediaType = 'image') => {
  const sightbox = document.createElement('div');
  sightbox.className = 'sightbox';

  const overlay = document.createElement('div');
  overlay.className = 'sightbox-overlay';
  overlay.addEventListener('click', closeSightbox);

  const content = document.createElement('div');
  content.className = 'sightbox-content';

  if (mediaType === 'image') {
    const img = document.createElement('img');
    img.src = mediaSrc;
    img.alt = 'Sightbox Image';
    img.className = "zoomable-image";
    content.appendChild(img);
  } else if (mediaType === 'video') {
    const video = document.createElement('video');
    video.src = mediaSrc;
    video.controls = true;
    video.muted = true;
    content.appendChild(video);
  }

  const closeButton = document.createElement('button');
  closeButton.className = 'sightbox-close';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', closeSightbox);

  sightbox.appendChild(overlay);
  sightbox.appendChild(content);
  content.appendChild(closeButton);

  document.getElementById('app').appendChild(sightbox);

  // Push a new state into history when Sightbox opens
  history.pushState({ sightboxOpen: true }, "");

  function closeSightbox() {
    if (document.getElementById('app').contains(sightbox)) {
      sightbox.remove();
      // Go back in history when the Sightbox is closed
      history.back();
    }
  }

  // Handle back button press
  function onPopState(event) {
    if (event.state && event.state.sightboxOpen) {
      closeSightbox();
    }
  }

  window.addEventListener("popstate", onPopState);

  return sightbox;
};

export default Sightbox;
