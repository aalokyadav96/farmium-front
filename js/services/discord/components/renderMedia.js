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
