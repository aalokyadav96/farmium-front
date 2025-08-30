// chomponents/renderAvatar.js
import { createElement } from "../../../components/createElement";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";

export function renderAvatar(msg, { isMine }) {
  if (isMine) return null;
  return createElement("img", {
    class: "avatar",
    src: resolveImagePath(EntityType.USER, PictureType.THUMB, `${msg.sender}`),
    alt: `${msg.sender}'s avatar`
  }, []);
}
