// src/utils/imagePaths.js

import { SRC_URL } from "../state/state";

// Entity types
export const EntityType = {
  ARTIST: "artist",
  MEMBER: "member",
  USER: "user",
  BAITO: "baito",
  WORKER: "worker",
  SONG: "song",
  POST: "post",
  CHAT: "chat",
  EVENT: "event",
  FARM: "farm",
  CROP: "crop",
  PLACE: "place",
  RECIPE: "recipe",
  PRODUCT: "product",
  TOOL: "tool",
  LIVE: "live",
  MEDIA: "media",
  MERCH: "merch",
  MENU: "menu",
  FEED: "feed",
  LOOP: "loops",
};

// Picture types
export const PictureType = {
  BANNER: "banner",
  PHOTO: "photo",
  POSTER: "poster",
  SEATING: "seating",
  MEMBER: "member",
  THUMB: "thumb",
  IMAGE: "images",
  AUDIO: "audio",
  VIDEO: "videos",
  DOCUMENT: "docs",
  GALLERY: "gallery",
  FILE: "files",
};

// Folder mapping
const PictureSubfolders = {
  [PictureType.BANNER]: "banner",
  [PictureType.PHOTO]: "photo",
  [PictureType.POSTER]: "poster",
  [PictureType.SEATING]: "seating",
  [PictureType.MEMBER]: "member",
  [PictureType.THUMB]: "thumb",
  [PictureType.IMAGE]: "images",
  [PictureType.AUDIO]: "audio",
  [PictureType.VIDEO]: "videos",
  [PictureType.DOCUMENT]: "docs",
  [PictureType.GALLERY]: "gallery",
  [PictureType.FILE]: "files",
};

export function resolveImagePath(entityType, pictureType, filename, fallback = "/assets/fallbacks.png") {
  if (!entityType || !pictureType || !filename || typeof filename !== "string") {
    return fallback;
  }

  // quick reject of dangerous schemes or traversal
  if (/^(file:|data:|javascript:)/i.test(filename) || filename.includes("..")) {
    return fallback;
  }

  // allow safe URLs (http/https only, block localhost/private ranges)
  try {
    const url = new URL(filename, window.location.origin);

    if (url.protocol === "http:" || url.protocol === "https:") {
      const host = url.hostname;
      const isBlockedHost =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "::1" ||
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);

      if (!isBlockedHost) {
        return filename; // safe external URL, return directly
      }
    }
  } catch (_) {
    // not a valid absolute URL → will treat as local filename
  }
console.log("jo");
  // local file: must be simple filename/path
  if (!/^[a-zA-Z0-9._/-]+$/.test(filename)) {
    return fallback;
  }

  const folder = PictureSubfolders[pictureType] || "misc";

  // normalize extensions based on type
  let finalName = filename;
  // if (pictureType === PictureType.THUMB || pictureType === PictureType.POSTER) {
  if (pictureType === PictureType.THUMB) {
    if (!finalName.endsWith(".jpg")) {
      finalName = finalName.replace(/\.[^.]+$/, "") + ".jpg";
    }
  } else if (isImageType(pictureType)) {
    if (!finalName.endsWith(".png")) {
      finalName = finalName.replace(/\.[^.]+$/, "") + ".png";
    }
  }

return `${SRC_URL}/uploads/${entityType}/${folder}/${finalName}`;

}




// Helper to check if type is image (non-thumb)
function isImageType(pictureType) {
  return [
    PictureType.PHOTO,
    PictureType.POSTER,
    PictureType.BANNER,
    PictureType.SEATING,
    PictureType.MEMBER,
    PictureType.IMAGE,
    PictureType.GALLERY,
  ].includes(pictureType);
}

