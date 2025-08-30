// src/utils/imagePaths.js

import { SRC_URL } from "../state/state";

// Entity types
export const EntityType = {
  ARTIST: "artist",
  USER: "user",
  BAITO: "baito",
  SONG: "song",
  POST: "post",
  CHAT: "chat",
  EVENT: "event",
  FARM: "farm",
  CROP: "crop",
  PLACE: "place",
  RECIPE: "recipe",
  PRODUCT: "product",
  MEDIA: "media",
  MERCH: "merch",
  MENU: "menu",
  FEED: "feed",
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

export function resolveImagePath(entityType, pictureType, filename, fallback = "/assets/fallback.png") {
  if (!entityType || !pictureType || !filename || typeof filename !== "string") {
    return fallback;
  }

  const folder = PictureSubfolders[pictureType] || "misc";

  // Normalize enforced extensions
  let finalName = filename;
  if (pictureType === PictureType.THUMB) {
    if (!filename.endsWith(".jpg")) {
      finalName = filename.replace(/\.[^.]+$/, "") + ".jpg";
    }
  } else if (pictureType === PictureType.POSTER) {
    if (!filename.endsWith(".jpg")) {
      finalName = filename.replace(/\.[^.]+$/, "") + ".jpg";
    }
  } else if (isImageType(pictureType)) {
    if (!filename.endsWith(".png")) {
      finalName = filename.replace(/\.[^.]+$/, "") + ".png";
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


/******HOW TO USE******/
/*

// Banner
const banner = Imagex(
  resolveImagePath(EntityType.EVENT, PictureType.BANNER, `${event.id}.jpg`),
  `Event banner`,
  "lazy",
  "",
  "event-banner-image"
);

import { Imagex } from "../../components/base/Imagex.js";
import { resolveImagePath, EntityType, PictureType } from "../../utils/imagePaths.js";

// Create avatar image
const avatar = Imagex(
  resolveImagePath(EntityType.USER, PictureType.THUMB, `${user.id}.jpg`),
  "User Avatar",
  "lazy",
  "",
  "chatavatar circle"
);
 */