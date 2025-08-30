import { createElement } from "../../../components/createElement";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { RenderImagePost } from "./renderImagePost.js";
import { RenderVideoPost } from "./renderVideoPost.js";
import { RenderAudioPost } from "./renderAudioPost.js";

export function renderMedia(msg) {
  const children = [];

  // Always add plain text content if present
  if (msg.content) {
    children.push(msg.content);
  }

  // Create container for media
  const mediaContainer = createElement("div", { class: "mediacon" }, []);
  children.push(mediaContainer);

  // If no media, return early
  if (!msg.media || !msg.media.url || !msg.media.type) {
    return children;
  }

  // Normalize type prefix (e.g. "image/jpeg" → "image")
  const mime = msg.media.type.toLowerCase();

  if (mime.startsWith("image/")) {
    // RenderImagePost expects an array of urls
    RenderImagePost(mediaContainer, [msg.media.url]);
  } else if (mime.startsWith("video/")) {
    RenderVideoPost(mediaContainer, [msg.media.url], msg.media.url);
  } else if (mime.startsWith("audio/")) {
    RenderAudioPost(mediaContainer, msg.media.url);
  } else {
    // Generic file download
    const filename = msg.media.url.split("/").pop();
    children.push(
      createElement("a", {
        href: resolveImagePath(EntityType.CHAT, PictureType.FILE, msg.media.url),
        download: filename,
        class: "msg-file"
      }, [ filename ])
    );
  }

  return children;
}
