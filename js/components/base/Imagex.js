// src/components/base/Imagex.js

import "../../../css/ui/Image.css";

// Image component with fallback and dynamic attributes
const Imagex = (
  src,
  alt = "Image",
  loading = "lazy",
  id = "",
  classes = "",
  styles = {},
  events = {},
  fallback = "/assets/icon-192.png"
) => {
  if (!src || typeof src !== "string") {
    throw new Error("A valid 'src' is required for Imagex.");
  }

  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;
  image.id = id;
  image.loading = loading;

  for (const [k, v] of Object.entries(styles)) {
    image.style[k] = v;
  }

  if (classes) {
    image.classList.add(...classes.split(" "));
  }

  image.onerror = () => {
    image.src = fallback;
    image.alt = "Fallback image";
  };

  for (const [event, handler] of Object.entries(events)) {
    if (typeof handler === "function") {
      image.addEventListener(event, handler);
    }
  }

  return image;
};

export default Imagex;
export { Imagex };

// import "../../../css/ui/Image.css";
// import { SRC_URL } from "../../state/state";

// // Enhanced universal image component
// const Imagex = (
//   src,
//   alt = "Image",
//   loading = "lazy",
//   id = "",
//   classes = "",
//   styles = {},
//   events = {},
//   fallback = "/images/fallback.png", // Custom fallback path
// ) => {
//   if (!src || typeof src !== "string") {
//     throw new Error("A valid 'src' attribute is required for the Image component.");
//   }

//   const image = document.createElement("img");
//   image.src = src;
//   image.alt = alt || "Image";
//   image.id = id;
//   image.loading = loading;

//   // Apply styles (both object or string)
//   if (typeof styles === "string") {
//     image.setAttribute("style", styles);
//   } else {
//     for (const [key, value] of Object.entries(styles)) {
//       image.style[key] = value;
//     }
//   }

//   // Add class list
//   if (classes) {
//     image.classList.add(...classes.trim().split(/\s+/));
//   }

//   // Fallback image on error
//   image.onerror = () => {
//     image.src = fallback;
//     image.alt = "Fallback image";
//   };

//   // Add all event listeners
//   for (const [event, handler] of Object.entries(events)) {
//     if (typeof handler === "function") {
//       image.addEventListener(event, handler);
//     }
//   }

//   return image;
// };

// export default Imagex;
// export { Imagex };
