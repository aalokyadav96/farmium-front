import { RenderImagePost } from "../../feed/renderImagePost.js";
import { RenderVideoPost } from "../../feed/renderVideoPost.js";
import { RenderAudioPost } from "../../feed/renderAudioPost.js";
import { createElement } from "../../../components/createElement.js";

/**
 * Create chat-friendly media content
 * Wraps feed renderers into a bubble for chat messages
 * @param {Object} post - metadata { type: "image"|"video"|"audio" }
 * @param {Array<string>} media - list of media paths
 * @param {boolean} isOwn - whether the message is sent by current user
 */
function createChatContent(post, media, isOwn = false) {
  const bubble = createElement("div", {
    class: `chat-bubble ${isOwn ? "chat-own" : "chat-other"}`
  });

  const mediaContainer = createElement("div", { class: "chat-media" });

  if (post.type === "image" && media.length > 0) {
    RenderImagePost(mediaContainer, media);
  } else if (post.type === "video" && media.length > 0) {
    RenderVideoPost(mediaContainer, media);
  } else if (post.type === "audio" && media.length > 0) {
    RenderAudioPost(mediaContainer, media[0]); // audio is single file
  }

  bubble.appendChild(mediaContainer);
  return bubble;
}

export { createChatContent };
