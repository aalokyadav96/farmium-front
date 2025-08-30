// src/components/base/Imagex.js
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";


/**
 * Imagex component
 * @param {Object} options
 * @param {string} options.src - Image source URL (required)
 * @param {string} [options.alt="Image"] - Alternative text
 * @param {string} [options.loading="lazy"] - Loading type ("lazy", "eager")
 * @param {string} [options.id=""] - Element ID
 * @param {string} [options.classes=""] - Space-separated CSS classes
 * @param {Object|string} [options.style=""] - CSS styles (object or string)
 * @param {Object} [options.events={}] - Event listeners: { click: fn, mouseover: fn }
 * @param {string} [options.fallback="/assets/icon-192.png"] - Fallback image path
 * @returns {HTMLImageElement}
 */
const Imagex = ({
  src,
  alt = "Image",
  loading = "lazy",
  id = "",
  classes = "",
  style = "",
  events = {},
  fallback = "/assets/icon-192.png"
} = {}) => {
  if (!src || typeof src !== "string") {
    throw new Error("A valid 'src' is required for Imagex.");
  }

  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;
  image.id = id;
  image.loading = loading;

  // Apply classes
  if (classes) {
    image.classList.add(...classes.split(" "));
  }

  // Apply style (string or object)
  if (typeof style === "string" && style.trim()) {
    image.style.cssText = style;
  } else if (typeof style === "object" && style !== null) {
    for (const [k, v] of Object.entries(style)) {
      image.style[k] = v;
    }
  }

  // Handle fallback
  image.onerror = () => {
    image.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, fallback);
  };

  // Add event listeners
  for (const [event, handler] of Object.entries(events)) {
    if (typeof handler === "function") {
      image.addEventListener(event, handler);
    }
  }

  return image;
};

export default Imagex;
export { Imagex };

// // src/components/base/Imagex.js
// import "../../../css/ui/Image.css";

// /**
//  * Imagex component
//  * @param {Object} options
//  * @param {string} options.src - Image source URL (required)
//  * @param {string} [options.alt="Image"] - Alternative text
//  * @param {string} [options.loading="lazy"] - Loading type ("lazy", "eager")
//  * @param {string} [options.id=""] - Element ID
//  * @param {string} [options.classes=""] - Space-separated CSS classes
//  * @param {Object} [options.styles={}] - CSS styles as key-value pairs
//  * @param {Object} [options.events={}] - Event listeners: { click: fn, mouseover: fn }
//  * @param {string} [options.fallback="/assets/icon-192.png"] - Fallback image path
//  * @returns {HTMLImageElement}
//  */
// const Imagex = ({
//   src,
//   alt = "Image",
//   loading = "lazy",
//   id = "",
//   classes = "",
//   styles = {},
//   events = {},
//   fallback = "/assets/icon-192.png"
// } = {}) => {
//   if (!src || typeof src !== "string") {
//     throw new Error("A valid 'src' is required for Imagex.");
//   }

//   const image = document.createElement("img");
//   image.src = src;
//   image.alt = alt;
//   image.id = id;
//   image.loading = loading;

//   // Apply styles
//   for (const [k, v] of Object.entries(styles)) {
//     image.style[k] = v;
//   }

//   // Apply classes
//   if (classes) {
//     image.classList.add(...classes.split(" "));
//   }

//   // Handle fallback
//   image.onerror = () => {
//     image.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.png");
//   };

//   // Add event listeners
//   for (const [event, handler] of Object.entries(events)) {
//     if (typeof handler === "function") {
//       image.addEventListener(event, handler);
//     }
//   }

//   return image;
// };

// export default Imagex;
// export { Imagex };

// // // src/components/base/Imagex.js

// // import "../../../css/ui/Image.css";

// // // Image component with fallback and dynamic attributes
// // const Imagex = (
// //   src,
// //   alt = "Image",
// //   loading = "lazy",
// //   id = "",
// //   classes = "",
// //   styles = {},
// //   events = {},
// //   fallback = "/assets/icon-192.png"
// // ) => {
// //   if (!src || typeof src !== "string") {
// //     throw new Error("A valid 'src' is required for Imagex.");
// //   }

// //   const image = document.createElement("img");
// //   image.src = src;
// //   image.alt = alt;
// //   image.id = id;
// //   image.loading = loading;

// //   for (const [k, v] of Object.entries(styles)) {
// //     image.style[k] = v;
// //   }

// //   if (classes) {
// //     image.classList.add(...classes.split(" "));
// //   }

  
// //   image.onerror = () => {
// //     image.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, "placeholder.png");
// //   };

// //   // image.onerror = () => {
// //   //   image.src = fallback;
// //   //   image.alt = "Fallback image";
// //   // };

// //   for (const [event, handler] of Object.entries(events)) {
// //     if (typeof handler === "function") {
// //       image.addEventListener(event, handler);
// //     }
// //   }

// //   return image;
// // };

// // export default Imagex;
// // export { Imagex };
