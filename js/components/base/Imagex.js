import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
import { createElement } from "../../components/createElement.js";

/**
 * Imagex component, wraps createElement for <img> with fallback & async decoding
 * Supports both `class` and legacy `classes`
 */
const Imagex = (attributes = {}) => {
  const { fallback = "/assets/icon-192.png", decodeAsync = true, classes, class: className, ...rest } = attributes;

  // Map legacy `classes` to `class` for createElement
  if (!rest.class && (className || classes)) {
    rest.class = className || classes;
  }

  // Create <img> using createElement
  const img = createElement("img", rest);

  // Async decoding
  if (decodeAsync) img.decoding = "async";

  // Fallback on error
  let triedFallback = false;
  img.onerror = () => {
    if (!triedFallback) {
      triedFallback = true;
      img.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, fallback);
    }
  };

  return img;
};

export default Imagex;
export { Imagex };

// import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";
// import { createElement } from "../../components/createElement.js";

// /**
//  * Imagex component, wraps createElement for <img> with fallback & async decoding
//  * @param {Object} attributes - Any standard <img> attributes, plus:
//  * @param {Object} [attributes.events] - Event listeners
//  * @param {string} [attributes.fallback="/assets/icon-192.png"] - Fallback image path
//  * @param {boolean} [attributes.decodeAsync=true] - Use async decoding hint
//  * @returns {HTMLImageElement}
//  */
// const Imagex = (attributes = {}) => {
//   const { fallback = "/assets/icon-192.png", decodeAsync = true, ...rest } = attributes;

//   // Create <img> using createElement
//   const img = createElement("img", rest);

//   // Async decoding
//   if (decodeAsync) img.decoding = "async";

//   // Fallback on error
//   let triedFallback = false;
//   img.onerror = () => {
//     if (!triedFallback) {
//       triedFallback = true;
//       img.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, fallback);
//     }
//   };

//   return img;
// };

// export default Imagex;
// export { Imagex };

// // import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

// // /**
// //  * Imagex component
// //  * @param {Object} options
// //  * @param {string} [options.src] - Image source URL (required unless using lazy placeholder)
// //  * @param {string} [options.alt=""] - Alternative text (empty by default, better for decorative images)
// //  * @param {string} [options.loading="lazy"] - Loading type ("lazy", "eager")
// //  * @param {string} [options.id=""] - Element ID
// //  * @param {string} [options.classes=""] - Space-separated CSS classes
// //  * @param {Object|string} [options.style=""] - CSS styles (object or string)
// //  * @param {Object} [options.events={}] - Event listeners: { click: fn, mouseover: fn } 
// //  *                                       or { click: { handler: fn, options: { once: true } } }
// //  * @param {string} [options.fallback="/assets/icon-192.png"] - Fallback image path
// //  * @param {boolean} [options.decodeAsync=true] - Use async decoding hint
// //  * @returns {HTMLImageElement}
// //  */
// // const Imagex = ({
// //   src = "",
// //   alt = "",
// //   loading = "lazy",
// //   id = "",
// //   classes = "",
// //   style = "",
// //   events = {},
// //   fallback = "/assets/icon-192.png",
// //   decodeAsync = true
// // } = {}) => {
// //   const image = document.createElement("img");

// //   // If no src provided, leave empty but allow lazy placeholders
// //   if (src) image.src = src;

// //   image.alt = alt;
// //   image.id = id;
// //   image.loading = loading;

// //   if (decodeAsync) {
// //     image.decoding = "async";
// //   }

// //   // Apply classes
// //   if (classes) {
// //     image.classList.add(...classes.trim().split(/\s+/));
// //   }

// //   // Apply style
// //   if (typeof style === "string" && style.trim()) {
// //     image.style.cssText = style;
// //   } else if (style && typeof style === "object") {
// //     Object.assign(image.style, style);
// //   }

// //   // Handle fallback with loop guard
// //   let triedFallback = false;
// //   image.onerror = () => {
// //     if (!triedFallback) {
// //       triedFallback = true;
// //       image.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, fallback);
// //     }
// //   };

// //   // Add event listeners
// //   for (const [event, handlerOrObj] of Object.entries(events)) {
// //     if (typeof handlerOrObj === "function") {
// //       image.addEventListener(event, handlerOrObj);
// //     } else if (
// //       handlerOrObj &&
// //       typeof handlerOrObj.handler === "function"
// //     ) {
// //       image.addEventListener(event, handlerOrObj.handler, handlerOrObj.options || {});
// //     }
// //   }

// //   return image;
// // };

// // export default Imagex;
// // export { Imagex };

// // // // src/components/base/Imagex.js
// // // import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";


// // // /**
// // //  * Imagex component
// // //  * @param {Object} options
// // //  * @param {string} options.src - Image source URL (required)
// // //  * @param {string} [options.alt="Image"] - Alternative text
// // //  * @param {string} [options.loading="lazy"] - Loading type ("lazy", "eager")
// // //  * @param {string} [options.id=""] - Element ID
// // //  * @param {string} [options.classes=""] - Space-separated CSS classes
// // //  * @param {Object|string} [options.style=""] - CSS styles (object or string)
// // //  * @param {Object} [options.events={}] - Event listeners: { click: fn, mouseover: fn }
// // //  * @param {string} [options.fallback="/assets/icon-192.png"] - Fallback image path
// // //  * @returns {HTMLImageElement}
// // //  */
// // // const Imagex = ({
// // //   src,
// // //   alt = "Image",
// // //   loading = "lazy",
// // //   id = "",
// // //   classes = "",
// // //   style = "",
// // //   events = {},
// // //   fallback = "/assets/icon-192.png"
// // // } = {}) => {
// // //   if (!src || typeof src !== "string") {
// // //     throw new Error("A valid 'src' is required for Imagex.");
// // //   }

// // //   const image = document.createElement("img");
// // //   image.src = src;
// // //   image.alt = alt;
// // //   image.id = id;
// // //   image.loading = loading;

// // //   // Apply classes
// // //   if (classes) {
// // //     image.classList.add(...classes.split(" "));
// // //   }

// // //   // Apply style (string or object)
// // //   if (typeof style === "string" && style.trim()) {
// // //     image.style.cssText = style;
// // //   } else if (typeof style === "object" && style !== null) {
// // //     for (const [k, v] of Object.entries(style)) {
// // //       image.style[k] = v;
// // //     }
// // //   }

// // //   // Handle fallback
// // //   image.onerror = () => {
// // //     image.src = resolveImagePath(EntityType.DEFAULT, PictureType.STATIC, fallback);
// // //   };

// // //   // Add event listeners
// // //   for (const [event, handler] of Object.entries(events)) {
// // //     if (typeof handler === "function") {
// // //       image.addEventListener(event, handler);
// // //     }
// // //   }

// // //   return image;
// // // };

// // // export default Imagex;
// // // export { Imagex };
