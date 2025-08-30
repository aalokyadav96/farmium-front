import { createElement } from "../../../components/createElement.js";
import { Button } from "../../../components/base/Button.js";
import { apiFetch } from "../../../api/api.js";
import { resolveImagePath, EntityType, PictureType } from "../../../utils/imagePaths.js";
import { navigate } from "../../../routes/index.js";
import Imagex from "../../../components/base/Imagex.js";

export async function displayWorkerPage(contentContainer, isLoggedIn, workerId) {
  const container = createElement("div", { id: "worker-profile-page" });

  // Layout
  const layout = createElement("div", { class: "worker-profile-layout hvflex" });
  const main = createElement("div", { class: "worker-profile-main" });
  const aside = createElement("aside", { class: "worker-profile-aside" });

  // Worker data
  let worker = null;
  try {
    worker = await apiFetch(`/baitos/worker/${workerId}`);
  } catch (e) {
    console.error("Failed to load worker profile", e);
    contentContainer.appendChild(
      createElement("p", { class: "error-msg" }, ["⚠️ Failed to load worker profile."])
    );
    return;
  }

  // Header (photo + name)
  const photo = Imagex({
    src: resolveImagePath(EntityType.BAITO, PictureType.THUMB, worker.profile_picture),
    alt: `${worker.name} profile photo`,
    classes: "worker-profile-photo"
  });

  const header = createElement("div", { class: "worker-profile-header" }, [
    photo,
    createElement("h2", {}, [worker.name || "Unnamed Worker"])
  ]);

  // Details
  function renderDetail(icon, label, value) {
    return value ? createElement("p", {}, [`${icon} ${label}: ${value}`]) : null;
  }

  const details = createElement("div", { class: "worker-profile-details" }, [
    renderDetail("📞", "Phone", worker.phone_number),
    renderDetail("🎯", "Roles", worker.preferred_roles),
    renderDetail("📍", "Location", worker.address),
    renderDetail("📝", "Bio", worker.bio),
    renderDetail("⭐", "Experience", worker.experience || "Not specified"),
    renderDetail("💼", "Availability", worker.availability || "Unknown"),
  ].filter(Boolean));

  // Action buttons
  const actions = createElement("div", { class: "worker-profile-actions" }, [
    isLoggedIn
      ? Button("Hire This Worker", "hire-btn", {
          click: () => navigate(`/baitos/hire/${worker.userid}`)
        }, "btn btn-primary")
      : createElement("p", { style: "color: gray;" }, ["🔒 Login to hire"]),
    Button("Back to List", "back-btn", {
      click: () => navigate("/baitos/hire")
    }, "btn btn-secondary")
  ]);

  main.append(header, details, actions);

  // Sidebar (extra widgets / future expansion)
  aside.append(
    createElement("h3", {}, ["More Options"]),
    createElement("ul", {}, [
      Button("Message Worker", "msg-btn", {
        click: () => {
          if (!isLoggedIn) return alert("Login required to message");
          navigate(`/baitos/messages/${worker.userid}`);
        }
      }, "buttonx"),
      Button("Save to Favorites", "fav-btn", {
        click: () => {
          if (!isLoggedIn) return alert("Login required to save favorites");
          // Save favorite logic here
          alert("Worker saved to favorites!");
        }
      }, "buttonx")
    ])
  );

  layout.append(main, aside);
  container.appendChild(layout);
  contentContainer.innerHTML = "";
  contentContainer.appendChild(container);
}
