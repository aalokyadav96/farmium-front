import Modal from "../../../components/ui/Modal.mjs";
import { createElement } from "../../../components/createElement.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import Imagex from "../../../components/base/Imagex.js";

export function openHireWorkerModal(worker) {
  const wrapper = createElement("div", { class: "hire-worker-modal" });

  const imgSrc = resolveImagePath(EntityType.BAITO, PictureType.THUMB, worker.profile_picture);
  // const image = createElement("img", { src: imgSrc, alt: `${worker.name} profile picture`, class: "worker-image" });
  const image = Imagex({ src: imgSrc, alt: `${worker.name} profile picture`, classes: "worker-image" });

  const details = createElement("div", { class: "worker-details" }, [
    createElement("h3", { class: "worker-name" }, [worker.name]),
    createElement("p", { class: "worker-phone" }, [`📞 ${worker.phone_number}`]),
    createElement("p", { class: "worker-role" }, [`🎯 ${worker.preferred_roles}`]),
    createElement("p", { class: "worker-location" }, [`📍 ${worker.address}`]),
    createElement("p", { class: "worker-bio" }, [`📝 ${worker.bio}`])
  ]);

  wrapper.appendChild(image);
  wrapper.appendChild(details);

  const modal = Modal({
    title: "Worker Details",
    content: wrapper,
    onClose: () => modal.remove()
  });
}
