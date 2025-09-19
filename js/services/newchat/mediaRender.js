import { RenderImagePost } from "./renders/renderImagePost.js";
import { RenderVideoPost } from "./renders/renderVideoPost.js";
import { RenderAudioPost } from "./renders/renderAudioPost.js";
import { createElement } from "../../components/createElement.js";

/**
 * Create chat-friendly media content
 * Wraps feed renderers into a bubble for chat messages
 * @param {Object} post - metadata { type: "image"|"video"|"audio" }
 * @param {Array<string>} media - list of media URLs
 * @param {boolean} isOwn - whether the message is sent by current user
 * @returns {Promise<HTMLElement>} chat bubble
 */
async function createChatContent(post, media, isOwn = false) {
  const bubble = createElement("section", {
    class: `chat-bubble ${isOwn ? "chat-own" : "chat-other"}`,
    role: "group",
    "aria-label": `${post.type} message`
  });

  const mediaContainer = createElement("figure", { class: "chat-media" });

  switch (post.type) {
    case "image":
      if (media.length > 0) {
        // Provide alt text for accessibility
        await RenderImagePost(mediaContainer, media.map((url, i) => ({
          src: url,
          alt: `Image ${i + 1} in message`
        })));
      }
      break;

    case "video":
      if (media.length > 0) {
        RenderVideoPost(mediaContainer, media, {
          controls: true,
          "aria-label": "Video message"
        });
      }
      break;

    case "audio":
      if (media.length > 0) {
        RenderAudioPost(mediaContainer, media[0], {
          controls: true,
          "aria-label": "Audio message"
        });
      }
      break;

    default:
      if (media.length > 0) {
        const link = createElement("a", { 
          href: media[0], 
          target: "_blank", 
          rel: "noopener noreferrer",
          class: "chat-file-link", 
          "aria-label": "Download attached file" 
        }, ["Download file"]);
        mediaContainer.appendChild(link);
      }
  }

  // optional <figcaption> for assistive context
  const caption = createElement("figcaption", { class: "visually-hidden" }, [
    `${post.type} attachment`
  ]);
  mediaContainer.appendChild(caption);

  bubble.appendChild(mediaContainer);
  return bubble;
}

export { createChatContent };


// import { RenderImagePost } from "./renders/renderImagePost.js";
// import { RenderVideoPost } from "./renders/renderVideoPost.js";
// import { RenderAudioPost } from "./renders/renderAudioPost.js";
// import { createElement } from "../../components/createElement.js";

// /**
//  * Create chat-friendly media content
//  * Wraps feed renderers into a bubble for chat messages
//  * @param {Object} post - metadata { type: "image"|"video"|"audio" }
//  * @param {Array<string>} media - list of media URLs
//  * @param {boolean} isOwn - whether the message is sent by current user
//  * @returns {Promise<HTMLElement>} chat bubble
//  */
// async function createChatContent(post, media, isOwn = false) {
//   console.log(post, media);
//   const bubble = createElement("div", {
//     class: `chat-bubble ${isOwn ? "chat-own" : "chat-other"}`
//   });

//   const mediaContainer = createElement("div", { class: "chat-media" });

//   switch (post.type) {
//     case "image":
//       if (media.length > 0) {
//         await RenderImagePost(mediaContainer, media);
//       }
//       break;
//     case "video":
//       if (media.length > 0) {
//         RenderVideoPost(mediaContainer, media);
//       }
//       break;
//     case "audio":
//       if (media.length > 0) {
//         RenderAudioPost(mediaContainer, media[0]); // audio is single file
//       }
//       break;
//     default:
//       // unsupported file type → show as plain link
//       if (media.length > 0) {
//         const link = createElement("a", { href: media[0], target: "_blank", class: "chat-file-link" }, ["Download file"]);
//         mediaContainer.appendChild(link);
//       }
//   }

//   bubble.appendChild(mediaContainer);
//   return bubble;
// }

// export { createChatContent };
