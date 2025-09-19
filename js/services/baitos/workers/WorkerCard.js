import { createElement } from "../../../components/createElement.js";
import { Button } from "../../../components/base/Button.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { navigate } from "../../../routes/index.js";
import { getState } from "../../../state/state.js";

export function HireWorkerCard(worker, isLoggedIn) {
  const isSelf = getState("user") === worker.userid;

  const card = createElement("div", { class: "worker-card" });

  // Worker photo
  const photo = createElement("div", { class: "worker-photo" });

  const profileImg = createElement("img", {
    src: resolveImagePath(EntityType.WORKER, PictureType.THUMB, worker.photo),
    class: "profile-thumbnail",
    loading: "lazy",
    alt: `${worker.name || "Worker"}'s profile photo`
  });

  photo.appendChild(profileImg);

  // Render details
  function renderDetail(icon, text) {
    return text ? createElement("p", {}, [icon + " ", text]) : null;
  }

  const details = createElement("div", { class: "worker-details" }, [
    createElement("h3", {}, [worker.name || "Unnamed Worker"]),
    renderDetail("📞", worker.phone_number),
    renderDetail("🛠", worker.preferred_roles),
    renderDetail("📍", worker.address),
    renderDetail("📝", worker.bio),
    !isSelf && isLoggedIn
      ? Button("View Profile", `hire-${worker.baito_user_id}`, {
          click: (e) => {
            e.stopPropagation();
            navigate(`/baitos/worker/${worker.baito_user_id}`);
          }
        }, "btn btn-primary")
      : !isSelf
        ? createElement("p", { style: "color:gray;" }, ["🔒 Login to hire"])
        : null
  ].filter(Boolean));

  card.appendChild(photo);
  card.appendChild(details);

  // Click anywhere on card to view profile
  card.addEventListener("click", () => navigate(`/baitos/worker/${worker.baito_user_id}`));

  return card;
}
