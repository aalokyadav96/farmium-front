import { createElement } from "../../../components/createElement.js";
import { Button } from "../../../components/base/Button.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { openHireWorkerModal } from "./WorkerModal.js";

export function HireWorkerCard(worker, isLoggedIn) {
  const card = createElement("div", { class: "worker-card" });

  const photo = createElement("div", { class: "worker-photo", alt: "worker-photo" });

  const profileImg = createElement("img", {
    src: resolveImagePath(EntityType.BAITO, PictureType.THUMB, worker.profile_picture),
    class: "profile-thumbnail",
    loading: "lazy",
    alt: `${worker.name}'s profile photo`
  });

  photo.appendChild(profileImg);

  const details = createElement("div", { class: "worker-details" }, [
    createElement("h3", {}, [worker.name || "Unnamed Worker"]),
    worker.phone_number
      ? createElement("p", {}, [`📞 ${worker.phone_number}`])
      : null,
    worker.preferred_roles
      ? createElement("p", {}, [`🛠 Roles: ${worker.preferred_roles}`])
      : null,
    worker.address
      ? createElement("p", {}, [`📍 ${worker.address}`])
      : null,
    worker.bio
      ? createElement("p", {}, [`📝 ${worker.bio}`])
      : null,
    isLoggedIn
      ? Button("Hire", `hire-${worker.baito_user_id}`, {
          click: (e) => {
            e.stopPropagation();
            openHireWorkerModal(worker);
          }
        }, "btn btn-primary")
      : createElement("p", { style: "color:gray;" }, ["🔒 Login to hire"])
  ].filter(Boolean));

  card.appendChild(photo);
  card.appendChild(details);

  card.addEventListener("click", () => openHireWorkerModal(worker));

  return card;
}


// import { createElement } from "../../../components/createElement.js";
// import { Button } from "../../../components/base/Button.js";
// import { SRC_URL } from "../../../api/api.js";
// import { openHireWorkerModal } from "./WorkerModal.js";

// export function HireWorkerCard(worker, isLoggedIn) {
//   const photo = createElement("div", { class: "worker-photo", alt:"worker-photo" });

//   if (worker.profile_picture) {
//     photo.appendChild(createElement("img", {
//       src: `${SRC_URL}/uploads/baitos/${worker.profile_picture}`,
//       class: "profile-thumbnail"
//     }));
//   }

//   const details = createElement("div", { class: "worker-details" }, [
//     createElement("h3", {}, [worker.name]),
//     createElement("p", {}, [`Phone: ${worker.phone_number}`]),
//     createElement("p", {}, [`Roles: ${worker.preferred_roles}`]),
//     createElement("p", {}, [`Location: ${worker.address}`]),
//     createElement("p", {}, [`Bio: ${worker.bio}`]),
//     isLoggedIn
//       ? Button("Hire", `hire-${worker.baito_user_id}`, {
//           click: () => console.log(`Hiring ${worker.name}`),
//         })
//       : createElement("p", {}, ["Login to hire"])
//   ]);

//   const card = createElement("div", { class: "worker-card" }, [photo, details]);

//   card.addEventListener("click", () => openHireWorkerModal(worker));

//   return card;
// }
