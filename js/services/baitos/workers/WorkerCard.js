import { createElement } from "../../../components/createElement.js";
import { Button } from "../../../components/base/Button.js";
import { SRC_URL } from "../../../api/api.js";
import { openHireWorkerModal } from "./WorkerModal.js";

export function HireWorkerCard(worker, isLoggedIn) {
  const photo = createElement("div", { class: "worker-photo", alt:"worker-photo" });

  if (worker.profile_picture) {
    photo.appendChild(createElement("img", {
      src: `${SRC_URL}/uploads/baitos/${worker.profile_picture}`,
      class: "profile-thumbnail"
    }));
  }

  const details = createElement("div", { class: "worker-details" }, [
    createElement("h3", {}, [worker.name]),
    createElement("p", {}, [`Phone: ${worker.phone_number}`]),
    createElement("p", {}, [`Roles: ${worker.preferred_roles}`]),
    createElement("p", {}, [`Location: ${worker.address}`]),
    createElement("p", {}, [`Bio: ${worker.bio}`]),
    isLoggedIn
      ? Button("Hire", `hire-${worker.baito_user_id}`, {
          click: () => console.log(`Hiring ${worker.name}`),
        })
      : createElement("p", {}, ["Login to hire"])
  ]);

  const card = createElement("div", { class: "worker-card" }, [photo, details]);

  card.addEventListener("click", () => openHireWorkerModal(worker));

  return card;
}
