import { apiFetch } from "../../../api/api.js";
import { createElement } from "../../../components/createElement.js";
import { formatRelativeTime } from "../../../utils/dateUtils.js";
import { navigate } from "../../../routes/index.js";
import Notify from "../../../components/ui/Notify.mjs";
import Modal from "../../../components/ui/Modal.mjs";
import Button from "../../../components/base/Button.js";

// ---------------- Applicant Dashboard ----------------
export async function baitoApplicantDash(container) {
  container.innerHTML = "";

  const wrapper = createElement("div", { class: "baitosdashpage" });
  container.appendChild(wrapper);

  wrapper.appendChild(createElement("h2", {}, ["📥 Your Baito Applications"]));

  let applications = [];
  try {
    applications = await apiFetch("/baitos/applications");
  } catch (err) {
    wrapper.appendChild(createElement("p", { class: "error" }, ["❌ Failed to load applications."]));
    return;
  }

  if (!applications.length) {
    wrapper.appendChild(createElement("p", { class: "empty-state" }, ["You haven’t applied for any baito jobs yet."]));
    return;
  }

  // --- Filters ---
  const filterRow = createElement("div", { class: "filter-row" });
  const statusFilter = createElement("select", { id: "status-filter" }, [
    createElement("option", { value: "" }, ["All Statuses"]),
    ...["Submitted","Viewed","Shortlisted","Interview Scheduled","Rejected","Hired"].map(status =>
      createElement("option", { value: status }, [status])
    )
  ]);
  const searchInput = createElement("input", { type: "text", placeholder: "Search by job title", class: "search-input" });

  filterRow.append(statusFilter, searchInput);
  wrapper.appendChild(filterRow);

  const list = createElement("div", { class: "application-list" });
  wrapper.appendChild(list);

  function render(filteredApps) {
    list.innerHTML = "";
    if (!filteredApps.length) {
      list.appendChild(createElement("p", { class: "empty" }, ["No applications match your filter."]));
      return;
    }

    filteredApps.forEach(app => {
      const card = createElement("div", { class: "application-card" });

      card.append(
        createElement("h4", {}, [app.title || "Untitled Job"]),
        createElement("p", { class: "meta" }, [`📍 ${app.location || "Unknown"} • 💴 ¥${app.wage || "?"}/hr`]),
        createElement("p", { class: "status" }, [`📌 Status: ${app.status || "Pending"}`]),
        createElement("p", {}, [`📝 Pitch: ${app.pitch || "—"}`]),
        createElement("p", {}, [`📅 ${formatRelativeTime(app.submittedAt)}`])
      );

      if (app.feedback) {
        card.appendChild(createElement("p", { class: "feedback" }, [`📩 Feedback: ${app.feedback}`]));
      }

      const viewBtn = Button("🔎 View Listing", "", { click: () => navigate(`/baito/${app.jobId}`) }, "buttonx btn-secondary");
      const withdrawBtn = Button("❌ Withdraw", "", { click: async () => {
        if (!confirm("Are you sure you want to withdraw your application?")) return;
        try {
          await apiFetch(`/baitos/applications/${app._id}`, "DELETE");
          Notify("Application withdrawn", { type: "success", duration: 3000, dismissible: true });
          baitoApplicantDash(container);
        } catch {
          Notify("Failed to withdraw", { type: "error", duration: 3000, dismissible: true });
        }
      } }, "buttonx btn-danger");

      card.append(createElement("div", { class: "action-row" }, [viewBtn, withdrawBtn]));
      list.appendChild(card);
    });
  }

  render(applications);

  // Filter events
  statusFilter.addEventListener("change", () => applyFilters());
  searchInput.addEventListener("input", () => applyFilters());

  function applyFilters() {
    const status = statusFilter.value;
    const search = searchInput.value.toLowerCase();
    const filtered = applications.filter(app => 
      (status ? app.status === status : true) &&
      (search ? (app.title || "").toLowerCase().includes(search) : true)
    );
    render(filtered);
  }
}

// ---------------- Employer Dashboard ----------------
function buildAdminCard(job) {
  const card = createElement("div", { class: "baito-admin-card" });
  card.append(
    createElement("h4", {}, [job.title]),
    createElement("p", { class: "meta" }, [`📍 ${job.location || "Unknown"} • 💴 ¥${job.wage || "?"}/hr`]),
    createElement("p", {}, [`📝 Applications: ${job.applicationsCount || 0}`])
  );

  const viewBtn = Button("👥 View Applicants", "", { click: () => showApplicantsModal(job) }, "buttonx btn-secondary");
  const copyLinkBtn = Button("🔗 Copy Job Link", "", { click: () => {
    navigator.clipboard.writeText(`${window.location.origin}/baito/${job.baitoid}`);
    Notify("Job link copied!", { type: "success", duration: 3000, dismissible: true });
  } }, "buttonx btn-primary");

  card.append(createElement("div", { class: "action-row" }, [viewBtn, copyLinkBtn]));
  return card;
}

export async function baitoEmployerDash(container) {
  container.innerHTML = "";

  container.appendChild(createElement("h2", {}, ["🏢 Your Posted Baitos"]));

  let jobs = [];
  try { jobs = await apiFetch("/baitos/mine"); }
  catch { container.appendChild(createElement("p", { class: "error" }, ["❌ Failed to load your baito listings."])); return; }

  if (!jobs.length) {
    container.appendChild(createElement("p", { class: "empty-state" }, ["You haven’t posted any baitos yet."]));
    return;
  }

  const list = createElement("div", { class: "baito-admin-list" });
  jobs.forEach(job => list.appendChild(buildAdminCard(job)));
  container.appendChild(list);
}

// ---------------- Modal to show applicants ----------------
export async function showApplicantsModal(job) {
  let applicants = [];
  try { applicants = await apiFetch(`/baitos/baito/${job.baitoid}/applicants`); }
  catch { 
    Notify("Failed to fetch applicants", { type: "error", duration: 3000, dismissible: true });
    return; 
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
        const detailModal = Modal({
          title: `Applicant: ${app.username}`,
          content: createElement("div", {}, [
            createElement("p", {}, [`📩 ${app.pitch}`]),
            createElement("p", {}, [`📅 Applied: ${new Date(app.submittedAt).toLocaleString()}`])
          ]),
          onClose: () => detailModal.remove()
        });
        document.body.appendChild(detailModal);
      });

      content.appendChild(row);
    });
  }

  const modal = Modal({ title: `Applicants for "${job.title}"`, content, onClose: () => modal.remove() });
  document.body.appendChild(modal);
}

// ---------------- Main Dashboard Navigation ----------------
export function displayBaitoDash(isLoggedIn, container) {
  container.innerHTML = "";
  container.appendChild(createElement("h2", {}, ["🏢 Baito Dashboard"]));

  if (!isLoggedIn) {
    container.appendChild(createElement("p", {}, ["🔒 Please log in to access your dashboard."]));
    return;
  }

  container.append(
    Button("Employer Dashboard", "baito-dash-emp", { click: () => baitoEmployerDash(container) }, "buttonx"),
    Button("Applicant Dashboard", "baito-dash-apc", { click: () => baitoApplicantDash(container) }, "buttonx")
  );
}
