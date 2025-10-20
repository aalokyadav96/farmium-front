// chomponents/renderAvatar.js
import Imagex from "../../../components/base/Imagex.js";
import { createElement } from "../../../components/createElement";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";

export function renderAvatar(msg, { isMine }) {
  if (isMine) return null;
  return Imagex( {
    classes: "avatar",
    src: resolveImagePath(EntityType.USER, PictureType.THUMB, `${msg.sender}`),
    alt: `${msg.sender}'s avatar`
  }, []);
}
