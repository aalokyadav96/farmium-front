import { apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import Modal from "../../../components/ui/Modal.mjs";
import { formatRelativeTime } from "../../../utils/dateUtils.js";

/**
 * Builds the dashboard header.
 */
function buildHeader() {
  return createElement("h2", {}, ["🏢 Your Posted Baitos"]);
}

/**
 * Shows a modal listing applicants for a given job.
 */
export async function showApplicantsModal(job) {
  let applicants;
  try {
    applicants = await apiFetch(`/baitos/baito/${job.baitoid}/applicants`);
  } catch {
    const errModal = Modal({
      title: "Error",
      content: createElement("p", {}, ["❌ Failed to fetch applicants."]),
      onClose: () => errModal.remove()
    });
    document.body.appendChild(errModal);
    return;
  }

  const content = createElement("div", { class: "applicant-list" });
  if (!applicants.length) {
    content.appendChild(createElement("p", {}, ["No applications yet."]));
  } else {
    applicants.forEach(app => {
      const row = createElement(
        "div",
        { class: "app-card" },
        [
          createElement("strong", {}, [app.username || "Applicant"]),
          createElement("p", {}, [app.pitch || "(No pitch)"]),
          createElement("p", { class: "muted" }, [`📅 ${formatRelativeTime(app.submittedAt)}`])
        ]
      );
      row.addEventListener("click", () => {
        const detailModal = Modal({
          title: `Applicant: ${app.username}`,
          content: createElement(
            "div",
            {},
            [
              createElement("p", {}, [`📩 ${app.pitch}`]),
              createElement("p", {}, [`📅 Applied: ${new Date(app.submittedAt).toLocaleString()}`])
            ]
          ),
          onClose: () => detailModal.remove()
        });
        document.body.appendChild(detailModal);
      });
      content.appendChild(row);
    });
  }

  const modal = Modal({
    title: `Applicants for "${job.title}"`,
    content,
    onClose: () => modal.remove()
  });
  document.body.appendChild(modal);
}

/**
 * Builds a single admin card for a posted job.
 */
function buildAdminCard(job) {
  const card = createElement("div", { class: "baito-admin-card" });
  card.appendChild(createElement("h4", {}, [job.title]));
  card.appendChild(createElement("p", {}, [`📍 ${job.location} • 💴 ¥${job.wage}/hr`]));

  const viewBtn = createElement("button", { class: "btn btn-outline" }, ["👥 View Applicants"]);
  viewBtn.addEventListener("click", () => showApplicantsModal(job));
  card.appendChild(viewBtn);

  return card;
}

/**
 * Main employer dashboard display function.
 */
export async function baitoEmployerDash(container) {
  container.innerHTML = "";

  // Header
  container.appendChild(buildHeader());

  // Fetch jobs
  let jobs;
  try {
    jobs = await apiFetch("/baitos/mine");
  } catch {
    container.appendChild(
      createElement("p", { class: "error" }, ["❌ Failed to load your baito listings."])
    );
    return;
  }

  // Empty state
  if (!jobs.length) {
    container.appendChild(
      createElement("p", { class: "empty-state" }, ["You haven’t posted any baitos yet."])
    );
    return;
  }

  // List container
  const list = createElement("div", { class: "baito-admin-list" });
  jobs.forEach(job => list.appendChild(buildAdminCard(job)));
  container.appendChild(list);
}

// import { apiFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";
// import Modal from "../../components/ui/Modal.mjs";
// import { formatRelativeTime } from "../../utils/dateUtils.js";

// export async function baitoEmployerDash(container) {
//     container.innerHTML = "";
//     container.appendChild(createElement("h2", {}, ["🏢 Your Posted Baitos"]));

//     let jobs;
//     try {
//         jobs = await apiFetch("/baitos/mine");
//     } catch (err) {
//         container.appendChild(createElement("p", { class: "error" }, ["❌ Failed to load your baito listings."]));
//         return;
//     }

//     if (!jobs.length) {
//         container.appendChild(createElement("p", { class: "empty-state" }, ["You haven’t posted any baitos yet."]));
//         return;
//     }

//     const list = createElement("div", { class: "baito-admin-list" });

//     jobs.forEach(job => {
//         const card = createElement("div", { class: "baito-admin-card" });
//         card.appendChild(createElement("h4", {}, [job.title]));
//         card.appendChild(createElement("p", {}, [`📍 ${job.location} • 💴 ¥${job.wage}/hr`]));

//         const viewBtn = createElement("button", { class: "btn btn-outline" }, ["👥 View Applicants"]);
//         viewBtn.onclick = async () => {
//             let applicants;
//             try {
//                 applicants = await apiFetch(`/baitos/baito/${job._id}/applicants`);
//             } catch {
//                 return Modal({
//                     title: "Error",
//                     content: createElement("p", {}, ["❌ Failed to fetch applicants."]),
//                     onClose: () => modal.remove()
//                 });
//             }

//             const content = createElement("div", { class: "applicant-list" });

//             if (!applicants.length) {
//                 content.appendChild(createElement("p", {}, ["No applications yet."]));
//             } else {
//                 applicants.forEach(app => {
//                     const row = createElement("div", { class: "app-card" }, [
//                         createElement("strong", {}, [app.username || "Applicant"]),
//                         createElement("p", {}, [app.pitch || "(No pitch)"]),
//                         createElement("p", { class: "muted" }, [`📅 ${formatRelativeTime(app.submittedAt)}`])
//                     ]);

//                     row.addEventListener("click", () => {
//                         const modal = Modal({
//                             title: `Applicant: ${app.username}`,
//                             content: createElement("div", {}, [
//                                 createElement("p", {}, [`📩 ${app.pitch}`]),
//                                 createElement("p", {}, [`📅 Applied: ${new Date(app.submittedAt).toLocaleString()}`])
//                             ]),
//                             onClose: () => modal.remove()
//                         });
//                         document.body.appendChild(modal);
//                     });

//                     content.appendChild(row);
//                 });
//             }

//             const modal = Modal({
//                 title: `Applicants for "${job.title}"`,
//                 content,
//                 onClose: () => modal.remove()
//             });

//             document.body.appendChild(modal);
//         };

//         card.appendChild(viewBtn);
//         list.appendChild(card);
//     });

//     container.appendChild(list);
// }
