// src/utils/imagePaths.js

import { SRC_URL } from "../state/state";

// Entity types
export const EntityType = {
  ARTIST: "artist",
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
};

// Picture types
export const PictureType = {
  BANNER: "banner",
  PHOTO: "photo",
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

// Resolve image path with fallback
export function resolveImagePath(entityType, pictureType, filename, fallback = "/assets/icon-192.png") {
  console.log(entityType, pictureType, filename);
  if (!entityType || !pictureType || !filename || typeof filename !== "string") {
    return fallback;
  }
  const folder = PictureSubfolders[pictureType] || "misc";
  return `${SRC_URL}/uploads/${entityType}/${folder}/${filename}`;
}

/******HOW TO USE******/
/*
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

// Banner
const banner = Imagex(
  resolveImagePath(EntityType.EVENT, PictureType.BANNER, `${event.id}.jpg`),
  `Event banner`,
  "lazy",
  "",
  "event-banner-image"
);
 */