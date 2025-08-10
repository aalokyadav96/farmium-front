import "../../../css/ui/Sightbox.css";

const Sightbox = (mediaSrc, mediaType = "image") => {
  // prevent duplicate instance
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

  // media
  let mediaEl;
  if (mediaType === "image") {
    mediaEl = document.createElement("img");
    mediaEl.src = mediaSrc;
    mediaEl.alt = "Sightbox Image";
    mediaEl.className = "zoomable-image";
  } else if (mediaType === "video") {
    mediaEl = document.createElement("video");
    mediaEl.src = mediaSrc;
    mediaEl.controls = true;
    mediaEl.muted = true;
  }
  content.appendChild(mediaEl);

  // close button
  const closeButton = document.createElement("button");
  closeButton.className = "sightbox-close";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Close");
  closeButton.addEventListener("click", closeSightbox);
  content.appendChild(closeButton);

  // append DOM
  sightbox.appendChild(overlay);
  sightbox.appendChild(content);
  document.getElementById("app").appendChild(sightbox);

  // focus trap
  content.focus();

  // history push
  history.pushState({ sightboxOpen: true }, "");

  // esc + focus trap listener
  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeSightbox();
    } else if (e.key === "Tab") {
      // trap focus inside content
      const focusable = [closeButton];
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

  // back button
  function onPopState(e) {
    if (e.state && e.state.sightboxOpen) {
      closeSightbox(true);
    }
  }

  // clean close
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

// import "../../../css/ui/Sightbox.css";

// const Sightbox = (mediaSrc, mediaType = 'image') => {
//   const sightbox = document.createElement('div');
//   sightbox.className = 'sightbox';

//   const overlay = document.createElement('div');
//   overlay.className = 'sightbox-overlay';
//   overlay.addEventListener('click', closeSightbox);

//   const content = document.createElement('div');
//   content.className = 'sightbox-content';

//   if (mediaType === 'image') {
//     const img = document.createElement('img');
//     img.src = mediaSrc;
//     img.alt = 'Sightbox Image';
//     img.className = "zoomable-image";
//     content.appendChild(img);
//   } else if (mediaType === 'video') {
//     const video = document.createElement('video');
//     video.src = mediaSrc;
//     video.controls = true;
//     video.muted = true;
//     content.appendChild(video);
//   }

//   const closeButton = document.createElement('button');
//   closeButton.className = 'sightbox-close';
//   closeButton.textContent = '×';
//   closeButton.addEventListener('click', closeSightbox);

//   sightbox.appendChild(overlay);
//   sightbox.appendChild(content);
//   content.appendChild(closeButton);

//   document.getElementById('app').appendChild(sightbox);

//   // Push a new state into history when Sightbox opens
//   history.pushState({ sightboxOpen: true }, "");

//   function closeSightbox() {
//     if (document.getElementById('app').contains(sightbox)) {
//       sightbox.remove();
//       // Go back in history when the Sightbox is closed
//       history.back();
//     }
//   }

//   // Handle back button press
//   function onPopState(event) {
//     if (event.state && event.state.sightboxOpen) {
//       closeSightbox();
//     }
//   }

//   window.addEventListener("popstate", onPopState);

//   return sightbox;
// };

// export default Sightbox;
