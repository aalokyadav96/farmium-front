import "../../../css/ui/Image.css";
import { SRC_URL } from "../../state/state";

// Image component with enhanced functionality
const Imagex = (
  src,
  alt = "Image", // Fallback alt text for accessibility
  loading = "lazy", // Default loading behavior
  id = "",
  classes = "",
  styles = {},
  events = {}
) => {
  // Input validation
  if (!src || typeof src !== "string") {
    throw new Error("A valid 'src' attribute is required for the Image component.");
  }

  // Create the image element
  const image = document.createElement("img");
  image.src = src;
  image.alt = alt || "Image"; // Ensure accessibility
  image.id = id;

  // Add loading attribute for lazy loading
  image.loading = loading;

  // Apply inline styles dynamically
  for (const [key, value] of Object.entries(styles)) {
    image.style[key] = value;
  }

  // Add classes dynamically
  if (classes) {
    image.classList.add(...classes.split(" "));
  }

  // Add fallback for broken image links
  image.onerror = () => {
    image.src = `/images/fallback.png`; // Replace with your fallback image path
    image.alt = "Fallback image"; // Ensure fallback accessibility
  };

  // Add custom event listeners
  for (const [event, handler] of Object.entries(events)) {
    if (typeof handler === "function") {
      image.addEventListener(event, handler);
    }
  }

  return image;
};

export default Imagex;
export { Imagex };
