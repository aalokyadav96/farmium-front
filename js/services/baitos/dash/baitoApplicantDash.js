import { apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import { formatRelativeTime } from "../../../utils/dateUtils.js";
import { navigate } from "../../../routes/index.js";
import Snackbar from "../../../components/ui/Snackbar.mjs";
import Notify from "../../../components/ui/Notify.mjs";

export async function baitoApplicantDash(content) {
    content.innerHTML = "";
    const container = createElement('div', { class: "baitosdashpage" }, []);
    content.appendChild(container);

    container.appendChild(createElement("h2", {}, ["📥 Your Baito Applications"]));

    let applications;
    try {
        applications = await apiFetch("/baitos/applications");
    } catch (err) {
        container.appendChild(createElement("p", { class: "error" }, ["❌ Failed to load applications."]));
        return;
    }

    if (!applications.length) {
        container.appendChild(createElement("p", { class: "empty-state" }, ["You haven’t applied for any baito jobs yet."]));
        return;
    }

    // Filter Section
    const filterWrapper = createElement("div", { class: "filter-section" });
    const statusSelect = createElement("select", { id: "status-filter" }, [
        createElement("option", { value: "" }, ["All Statuses"]),
        createElement("option", { value: "Submitted" }, ["Submitted"]),
        createElement("option", { value: "Viewed" }, ["Viewed"]),
        createElement("option", { value: "Shortlisted" }, ["Shortlisted"]),
        createElement("option", { value: "Interview Scheduled" }, ["Interview Scheduled"]),
        createElement("option", { value: "Rejected" }, ["Rejected"]),
        createElement("option", { value: "Hired" }, ["Hired"])
    ]);
    filterWrapper.appendChild(statusSelect);
    container.appendChild(filterWrapper);

    const list = createElement("div", { class: "application-list" });
    container.appendChild(list);

    function render(filteredApps) {
        list.innerHTML = "";
        if (!filteredApps.length) {
            list.appendChild(createElement("p", { class: "empty" }, ["No applications match your filter."]));
            return;
        }

        filteredApps.forEach(app => {
            const card = createElement("div", { class: "application-card" });

            const title = createElement("h4", {}, [app.title || "Untitled Job"]);
            const meta = createElement("p", { class: "meta" }, [
                `📍 ${app.location || "Unknown"} • 💴 ¥${app.wage || "?"}/hr`
            ]);
            const status = createElement("p", {
                class: "status",
                "data-status": app.status || "Pending"
            }, [`📌 Status: ${app.status || "Pending"}`]);
            const pitch = createElement("p", {}, [`📝 Pitch: ${app.pitch || "—"}`]);
            const date = createElement("p", {}, [`📅 ${formatRelativeTime(app.submittedAt)}`]);

            card.append(title, meta, status, pitch, date);

            // Employer Feedback
            if (app.feedback) {
                const feedback = createElement("p", { class: "feedback" }, [
                    `📩 Feedback: ${app.feedback}`
                ]);
                card.append(feedback);
            }

            // View Job Button
            const viewBtn = createElement("button", {
                class: "btn btn-secondary",
                onclick: () => navigate(`/baito/${app.jobId}`)
            }, ["🔎 View Listing"]);

            // Withdraw Button
            const withdrawBtn = createElement("button", {
                class: "btn btn-danger",
                onclick: async () => {
                    if (!confirm("Are you sure you want to withdraw your application?")) return;
                    try {
                        await apiFetch(`/baitos/applications/${app._id}`, "DELETE");
                        Snackbar("Application withdrawn", 2000);
                        baitoApplicantDash(content); // Re-render
                    } catch {
                        Snackbar("Failed to withdraw", 2000);
                    }
                }
            }, ["❌ Withdraw"]);

            const btnWrap = createElement("div", { class: "action-row" }, [viewBtn, withdrawBtn]);
            card.append(btnWrap);

            list.appendChild(card);
        });
    }

    // Initial render
    render(applications);

    // Filter change
    statusSelect.addEventListener("change", () => {
        const val = statusSelect.value;
        if (!val) return render(applications);
        const filtered = applications.filter(app => (app.status || "Pending") === val);
        render(filtered);
    });
}
