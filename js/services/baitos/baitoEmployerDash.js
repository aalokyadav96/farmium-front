import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import Modal from "../../components/ui/Modal.mjs";
import { formatRelativeTime } from "../../utils/dateUtils.js";

export async function baitoEmployerDash(container) {
    container.innerHTML = "";
    container.appendChild(createElement("h2", {}, ["🏢 Your Posted Baitos"]));

    let jobs;
    try {
        jobs = await apiFetch("/baitos/mine");
    } catch (err) {
        container.appendChild(createElement("p", { class: "error" }, ["❌ Failed to load your baito listings."]));
        return;
    }

    if (!jobs.length) {
        container.appendChild(createElement("p", { class: "empty-state" }, ["You haven’t posted any baitos yet."]));
        return;
    }

    const list = createElement("div", { class: "baito-admin-list" });

    jobs.forEach(job => {
        const card = createElement("div", { class: "baito-admin-card" });
        card.appendChild(createElement("h4", {}, [job.title]));
        card.appendChild(createElement("p", {}, [`📍 ${job.location} • 💴 ¥${job.wage}/hr`]));

        const viewBtn = createElement("button", { class: "btn btn-outline" }, ["👥 View Applicants"]);
        viewBtn.onclick = async () => {
            let applicants;
            try {
                applicants = await apiFetch(`/baitos/baito/${job._id}/applicants`);
            } catch {
                return Modal({
                    title: "Error",
                    content: createElement("p", {}, ["❌ Failed to fetch applicants."]),
                    onClose: () => modal.remove()
                });
            }

            const content = createElement("div", { class: "applicant-list" });

            if (!applicants.length) {
                content.appendChild(createElement("p", {}, ["No applications yet."]));
            } else {
                applicants.forEach(app => {
                    const row = createElement("div", { class: "app-card" }, [
                        createElement("strong", {}, [app.username || "Applicant"]),
                        createElement("p", {}, [app.pitch || "(No pitch)"]),
                        createElement("p", { class: "muted" }, [`📅 ${formatRelativeTime(app.submittedAt)}`])
                    ]);

                    row.addEventListener("click", () => {
                        const modal = Modal({
                            title: `Applicant: ${app.username}`,
                            content: createElement("div", {}, [
                                createElement("p", {}, [`📩 ${app.pitch}`]),
                                createElement("p", {}, [`📅 Applied: ${new Date(app.submittedAt).toLocaleString()}`])
                            ]),
                            onClose: () => modal.remove()
                        });
                        document.body.appendChild(modal);
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
        };

        card.appendChild(viewBtn);
        list.appendChild(card);
    });

    container.appendChild(list);
}

// import { apiFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";
// import Modal from "../../components/ui/Modal.mjs";

// export async function baitoEmployerDash(container) {
//     const jobs = await apiFetch("/baitos/mine");
//     if (!jobs.length) {
//         container.appendChild(createElement("p", {}, ["You haven’t posted any baitos yet."]));
//         return;
//     }

//     const list = createElement("div", { class: "baito-admin-list" });

//     jobs.forEach(job => {
//         const card = createElement("div", { class: "baito-admin-card" });
//         card.appendChild(createElement("h4", {}, [job.title]));
//         card.appendChild(createElement("p", {}, [`📍 ${job.location} • 💴 ¥${job.wage}/hr`]));

//         const viewApplicantsBtn = createElement("button", { class: "btn btn-outline" }, ["👥 View Applicants"]);
//         viewApplicantsBtn.onclick = async () => {
//             const applicants = await apiFetch(`/baitos/baito/${job._id}/applicants`);
//             const content = createElement("div", { class: "applicant-list" });

//             if (applicants.length === 0) {
//                 content.appendChild(createElement("p", {}, ["No applications yet."]));
//             } else {
//                 applicants.forEach(app => {
//                     const row = createElement("div", { class: "app-card" });
//                     row.textContent = `${app.username || "Applicant"} – ${app.pitch || "(No message)"}`;
//                     row.onclick = () => {
//                         const details = createElement("div", {}, [
//                             createElement("p", {}, [`📩 ${app.pitch}`]),
//                             createElement("p", {}, [`📅 ${new Date(app.submittedAt).toLocaleString()}`])
//                         ]);
//                         const modal = Modal({
//                             title: `Applicant: ${app.username}`,
//                             content: details,
//                             onClose: () => modal.remove()
//                         });
//                         document.body.appendChild(modal);
//                     };
//                     content.appendChild(row);
//                 });
//             }

//             const modal = Modal({
//                 title: `Applicants for: ${job.title}`,
//                 content,
//                 onClose: () => modal.remove()
//             });
//             document.body.appendChild(modal);
//         };

//         card.appendChild(viewApplicantsBtn);
//         list.appendChild(card);
//     });

//     container.appendChild(list);
// }
