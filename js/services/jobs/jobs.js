import { createElement } from "../../components/createElement.js";
import Button from "../../components/base/Button.js";
import { apiFetch } from "../../api/api.js";
import Modal from "../../components/ui/Modal.mjs";
import Notify from "../../components/ui/Notify.mjs";
import { createFormGroup } from "../../components/createFormGroup.js";
import { buildCard } from "../baitos/baitoslisting/JobCard.js";

// --- Hire Job Form Modal ---
export function jobsHire(container, entityType, entityId) {
  const form = createElement("form", { id: "hire-job-form", class: "create-section" });

  const fields = [
    { label: "Title", type: "text", id: "job-title", placeholder: "Job Title", required: true },
    { label: "Description", type: "textarea", id: "job-description", placeholder: "Job Description", required: true },
    { label: "Category", type: "text", id: "job-category", placeholder: "Category" },
    { label: "Location", type: "text", id: "job-location", placeholder: "Location" },
    { label: "Wage", type: "text", id: "job-wage", placeholder: "Wage" },
  ];
  fields.forEach(f => form.appendChild(createFormGroup(f)));

  const submitBtn = Button("Create Job", "", { type: "submit" }, "buttonx btn-primary");
  form.appendChild(submitBtn);

  // --- Modal setup ---
  const { close: closeModal } = Modal({
    title: "Hire a Job",
    content: form,
    size: "medium",
    closeOnOverlayClick: true
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const jobData = {
      title: form.querySelector("#job-title")?.value.trim(),
      description: form.querySelector("#job-description")?.value.trim(),
      category: form.querySelector("#job-category")?.value.trim(),
      location: form.querySelector("#job-location")?.value.trim(),
      wage: form.querySelector("#job-wage")?.value.trim(),
    };

    if (!jobData.title || !jobData.description) {
      Notify("Title and Description are required.", { type: "error", duration: 3000 });
      return;
    }

    try {
      const newJob = await apiFetch(
        `/jobs/${entityType}/${entityId}`,
        "POST",
        JSON.stringify(jobData),
        { "Content-Type": "application/json" }
      );

      if (!newJob?.baitoid) throw new Error("Failed to create job");

      container.querySelector(".places-wrapper")?.appendChild(buildCard(newJob));
      Notify("Job created successfully!", { type: "success", duration: 3000 });

      closeModal(); // properly close modal
    } catch (err) {
      console.error("Error creating job:", err);
      Notify(`Error creating job: ${err.message}`, { type: "error", duration: 5000 });
    }
  });
}

// --- Display Jobs ---
export async function displayPlaceJobs(container, isCreator, isLoggedIn, entityType, entityId) {
  container.replaceChildren();

  container.appendChild(createElement("h2", {}, ["Jobs"]));

  if (isCreator) {
    container.appendChild(
      Button("Hire", "hire-btn", { click: () => jobsHire(container, entityType, entityId) }, "buttonx btn-primary")
    );
  }

  const jobsContainer = createElement("div", { class: "places-wrapper grid" });
  container.appendChild(jobsContainer);

  try {
    const { jobs } = await apiFetch(`/jobs/${entityType}/${entityId}`);
    if (!Array.isArray(jobs) || jobs.length === 0) {
      jobsContainer.appendChild(createElement("p", { class: "no-jobs" }, ["No jobs yet."]));
      return;
    }

    const fragment = document.createDocumentFragment();
    jobs.forEach(job => {
      const card = buildCard(job);
      if (card) fragment.appendChild(card);
    });
    jobsContainer.appendChild(fragment);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    jobsContainer.appendChild(createElement("p", { class: "error-message" }, ["Failed to load jobs."]));
  }
}
