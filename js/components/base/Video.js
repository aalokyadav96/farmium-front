import "../../../css/ui/Video.css";

// Video component with enhanced functionality
const Video = (
  src,
  id = "",
  controls = true, // Default to include controls
  autoplay = false, // Default to no autoplay
  loop = false, // Default to no looping
  muted = false, // Default to not muted
  classes = "",
  styles = {}, // Inline styles
  events = {} // Custom event listeners
) => {
  // Input validation
  if (!src || typeof src !== "string") {
    throw new Error("A valid 'src' attribute is required for the Video component.");
  }

  // Create the video element
  const video = document.createElement("video");
  video.src = src;
  video.id = id;
  video.controls = controls;
  video.autoplay = autoplay;
  video.loop = loop;
  video.muted = muted;

  // Apply inline styles dynamically
  for (const [key, value] of Object.entries(styles)) {
    video.style[key] = value;
  }

  // Add classes dynamically
  if (classes) {
    video.classList.add(...classes.split(" "));
  }

  // Add default class
  video.classList.add("video");

  // Add fallback for unsupported formats
  const fallbackText = document.createTextNode("Your browser does not support the video tag.");
  video.appendChild(fallbackText);

  // Attach custom event listeners
  for (const [event, handler] of Object.entries(events)) {
    if (typeof handler === "function") {
      video.addEventListener(event, handler);
    }
  }

  return video;
};

export default Video;
export { Video };
