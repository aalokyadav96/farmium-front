import { createElement } from "../../../components/createElement.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { RenderImagePost } from "./renderImagePost.js";
import { RenderVideoPost } from "./renderVideoPost.js";
import { RenderAudioPost } from "./renderAudioPost.js";

/**
 * Renders any media attached to a chat message.
 * Returns a <div class="mediacon"> element or null if no media.
 */
export function renderMedia(msg) {
  const media = msg?.media;
  if (!media || !media.url || !media.type) return null;

  const url = String(media.url).trim();
  if (url === "") return null;

  const mime = String(media.type).toLowerCase();
  const container = createElement("div", { class: "mediacon" }, []);

  try {
    if (mime.startsWith("image/")) {
      RenderImagePost(container, [url]);
    } else if (mime.startsWith("video/")) {
      RenderVideoPost(container, [url], url);
    } else if (mime.startsWith("audio/")) {
      RenderAudioPost(container, url);
    } else {
      // Generic file download fallback
      const filename = url.split("/").pop() || "download";
      const link = createElement(
        "a",
        {
          href: resolveImagePath(EntityType.CHAT, PictureType.FILE, url),
          download: filename,
          class: "msg-file",
          title: `Download ${filename}`
        },
        [filename]
      );
      container.appendChild(link);
    }
  } catch (err) {
    console.error("renderMedia error:", err);
    // Show a minimal fallback instead of breaking the UI
    const errorNote = createElement("div", { class: "media-error" }, [
      "[media failed to load]"
    ]);
    container.appendChild(errorNote);
  }

  return container;
}


// export function renderMedia(msg) {
//   // If no media, return nothing
//   if (!msg.media || !msg.media.url || !msg.media.type) {
//     return null;
//   }

//   // Create container for media
//   const mediaContainer = createElement("div", { class: "mediacon" }, []);

//   // Normalize type prefix (e.g. "image/jpeg" → "image")
//   const mime = msg.media.type.toLowerCase();

//   if (mime.startsWith("image/")) {
//     RenderImagePost(mediaContainer, [msg.media.url]);
//   } else if (mime.startsWith("video/")) {
//     RenderVideoPost(mediaContainer, [msg.media.url], msg.media.url);
//   } else if (mime.startsWith("audio/")) {
//     RenderAudioPost(mediaContainer, msg.media.url);
//   } else {
//     // Generic file download link
//     const filename = msg.media.url.split("/").pop();
//     const fileLink = createElement("a", {
//       href: resolveImagePath(EntityType.CHAT, PictureType.FILE, msg.media.url),
//       download: filename,
//       class: "msg-file"
//     }, [filename]);
//     mediaContainer.appendChild(fileLink);
//   }

//   return mediaContainer;
// }

// // import { createElement } from "../../../components/createElement.js";
// // import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
// // import { RenderImagePost } from "./renderImagePost.js";
// // import { RenderVideoPost } from "./renderVideoPost.js";
// // import { RenderAudioPost } from "./renderAudioPost.js";

// // export function renderMedia(msg) {
// //   const children = [];

// //   // Always add plain text content if present
// //   if (msg.content) {
// //     children.push(msg.content);
// //   }

// //   // Create container for media
// //   const mediaContainer = createElement("div", { class: "mediacon" }, []);
// //   children.push(mediaContainer);

// //   // If no media, return early
// //   if (!msg.media || !msg.media.url || !msg.media.type) {
// //     return children;
// //   }

// //   // Normalize type prefix (e.g. "image/jpeg" → "image")
// //   const mime = msg.media.type.toLowerCase();

// //   if (mime.startsWith("image/")) {
// //     // RenderImagePost expects an array of urls
// //     RenderImagePost(mediaContainer, [msg.media.url]);
// //   } else if (mime.startsWith("video/")) {
// //     RenderVideoPost(mediaContainer, [msg.media.url], msg.media.url);
// //   } else if (mime.startsWith("audio/")) {
// //     RenderAudioPost(mediaContainer, msg.media.url);
// //   } else {
// //     // Generic file download
// //     const filename = msg.media.url.split("/").pop();
// //     children.push(
// //       createElement("a", {
// //         href: resolveImagePath(EntityType.CHAT, PictureType.FILE, msg.media.url),
// //         download: filename,
// //         class: "msg-file"
// //       }, [ filename ])
// //     );
// //   }

// //   return children;
// // }
