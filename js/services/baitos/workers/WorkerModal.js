import Modal from "../../../components/ui/Modal.mjs";
import { createElement } from "../../../components/createElement.js";

export function openHireWorkerModal(worker) {
  const wrapper = createElement("div", {
    style: "padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;"
  });

  wrapper.appendChild(createElement("h3", {}, [worker.name]));
  wrapper.appendChild(createElement("p", {}, [`📞 ${worker.phone_number}`]));
  wrapper.appendChild(createElement("p", {}, [`🎯 ${worker.preferred_roles}`]));
  wrapper.appendChild(createElement("p", {}, [`📍 ${worker.address}`]));
  wrapper.appendChild(createElement("p", {}, [`📝 ${worker.bio}`]));

  const modal = Modal({
    title: "Worker Details",
    content: wrapper,
    onClose: () => modal.remove()
  });
}
