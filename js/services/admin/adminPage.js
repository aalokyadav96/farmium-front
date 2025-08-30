import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";


// -------------------------------------------------------------
// displayAdmin: Main entry point for rendering the admin UI.
// -------------------------------------------------------------
export function displayAdmin(contentx, isLoggedIn) {
  contentx.innerHTML = "";
  let contentContainer = createElement('div',{"class":"adminpage"},[]);

  contentx.innerHTML = "";
  contentx.appendChild(contentContainer);
  // contentContainer.replaceChildren();

  if (!isLoggedIn) {
    const msg = document.createElement("p");
    msg.textContent = "Admin access only. Please log in.";
    contentContainer.appendChild(msg);
    return;
  }

  // -----------------------------
  // CONSTANTS & STATE
  // -----------------------------
  const LIMIT = 10;
  let currentPage = 0;           // zero-based
  let lastAction = null;         // to store last update for undo
  let totalFetched = 0;          // number of items returned in last fetch
  let isLoading = false;         // prevents double‐fetch
  const DEBOUNCE_DELAY = 300;    // ms for filter debouncing

  // -----------------------------
  // 1) Create Title and Undo Button
  // -----------------------------
  const title = document.createElement("h2");
  title.textContent = "Reported Content";

  const undoBtn = createActionButton("Undo Last", async () => {
    if (!lastAction) {
      alert("No action to undo.");
      return;
    }
    try {
      await apiFetch(`/report/${lastAction.reportId}`, "PUT", lastAction.prevPayload);
      lastAction = null;
      undoBtn.disabled = true;
      fetchReportedContent();
    } catch (e) {
      console.error("Undo failed:", e);
      alert("Failed to undo last action.");
    }
  });
  undoBtn.disabled = true; // no action to undo initially

  // -----------------------------
  // 2) Create Filter Controls
  // -----------------------------
  // Wrapper to hold all filters
  const filtersWrapper = document.createElement("div");
  filtersWrapper.className = "admin-filters";

  const statusFilter = createDropdown("Status", ["all", "pending", "reviewed", "resolved", "rejected"]);
  const typeFilter = createDropdown("Type", ["all", "post", "comment", "event", "place"]);
  const reasonFilter = createDropdown("Reason", ["all", "Spam", "Harassment", "Inappropriate", "Other"]);

  // Optionally allow filtering by reporter’s ID
  const reportedByInput = document.createElement("input");
  reportedByInput.type = "text";
  reportedByInput.placeholder = "Filter by Reporter ID";
  reportedByInput.className = "filter-input";
  reportedByInput.style.marginRight = "1rem";

  filtersWrapper.append(statusFilter, typeFilter, reasonFilter, reportedByInput);

  // -----------------------------
  // 3) Create Summary Container
  // -----------------------------
  const summaryContainer = document.createElement("div");
  summaryContainer.className = "admin-summary";

  // -----------------------------
  // 4) Reports List + Entity Preview
  // -----------------------------
  const wrapper = document.createElement("div");
  wrapper.className = "admin-wrapper"; // e.g. display: flex;

  const listContainer = document.createElement("div");
  listContainer.className = "admin-reported-list";

  const entityPreview = document.createElement("div");
  entityPreview.className = "admin-entity-preview";
  entityPreview.textContent = "Select a report to preview its content.";

  wrapper.append(listContainer, entityPreview);

  // -----------------------------
  // 5) Pagination Controls
  // -----------------------------
  const pagination = document.createElement("div");
  pagination.className = "pagination-controls";

  const prevBtn = createActionButton("Previous", () => {
    if (currentPage > 0) {
      currentPage--;
      fetchReportedContent();
    }
  });
  const pageIndicator = document.createElement("span");
  pageIndicator.textContent = `Page ${currentPage + 1}`;
  pageIndicator.className = "page-indicator";
  pageIndicator.style.margin = "0 1rem";
  const nextBtn = createActionButton("Next", () => {
    if (totalFetched === LIMIT) {
      currentPage++;
      fetchReportedContent();
    }
  });

  pagination.append(prevBtn, pageIndicator, nextBtn);

  // -----------------------------
  // 6) Assemble Everything
  // -----------------------------
  contentContainer.append(title, undoBtn, filtersWrapper, summaryContainer, wrapper, pagination);

  // -----------------------------
  // 7) Debounced Filter Listeners
  // -----------------------------
  // Whenever any filter changes, reset to page 0 and fetch
  const debouncedFetch = debounce(() => {
    currentPage = 0;
    fetchReportedContent();
  }, DEBOUNCE_DELAY);

  statusFilter.querySelector("select").addEventListener("change", debouncedFetch);
  typeFilter.querySelector("select").addEventListener("change", debouncedFetch);
  reasonFilter.querySelector("select").addEventListener("change", debouncedFetch);
  reportedByInput.addEventListener("input", debouncedFetch);

  // -----------------------------
  // 8) Fetch & Render Reports
  // -----------------------------
  async function fetchReportedContent() {
    if (isLoading) return;
    isLoading = true;
    listContainer.replaceChildren();
    entityPreview.replaceChildren();
    entityPreview.textContent = "Select a report to preview its content.";
    summaryContainer.replaceChildren();
    pageIndicator.textContent = `Page ${currentPage + 1}`;

    // Show loading spinner
    const spinner = document.createElement("div");
    spinner.className = "spinner"; // hook your CSS for an animated loader
    listContainer.appendChild(spinner);

    // Build query params
    const params = buildQueryString({
      status: statusFilter.querySelector("select").value,
      targetType: typeFilter.querySelector("select").value,
      reason: reasonFilter.querySelector("select").value,
      reportedBy: reportedByInput.value.trim(),
      limit: LIMIT,
      offset: currentPage * LIMIT,
    });

    try {
      const reports = await apiFetch(`/admin/reports?${params}`);
      totalFetched = Array.isArray(reports) ? reports.length : 0;

      // If fewer than LIMIT, disable Next
      nextBtn.disabled = totalFetched < LIMIT;
      // Disable Previous if on page 0
      prevBtn.disabled = currentPage === 0;

      listContainer.replaceChildren();

      if (!reports || reports.length === 0) {
        const p = document.createElement("p");
        p.textContent = "No reports found for these filters.";
        listContainer.appendChild(p);
        updateSummary({}); // pass empty
        isLoading = false;
        return;
      }

      // Group by "targetType:targetId"
      const grouped = {};
      for (const r of reports) {
        const key = `${r.targetType}:${r.targetId}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      }

      // Render each group
      Object.values(grouped).forEach((group) => {
        const card = createGroupedCard(group);
        listContainer.appendChild(card);
      });

      updateSummary(grouped);
    } catch (err) {
      console.error("Failed to load reports:", err);
      listContainer.replaceChildren();
      const p = document.createElement("p");
      p.textContent = "Failed to load reports. Please try again.";
      listContainer.appendChild(p);
      // Since this fetch failed, keep page unchanged but disable navigation
      nextBtn.disabled = false;
      prevBtn.disabled = currentPage === 0;
    } finally {
      isLoading = false;
    }
  }

  // Initial load
  fetchReportedContent();

  // -----------------------------
  // 9) Helper: Create Dropdown Filter
  // -----------------------------
  function createDropdown(labelText, options) {
    const wrapper = document.createElement("div");
    wrapper.className = "filter-wrapper";

    const label = document.createElement("label");
    label.textContent = labelText;
    label.style.marginRight = "0.5rem";

    const select = document.createElement("select");
    select.style.marginRight = "1rem";

    options.forEach((optVal) => {
      const opt = document.createElement("option");
      opt.value = optVal;
      opt.textContent = optVal;
      select.appendChild(opt);
    });

    wrapper.append(label, select);
    return wrapper;
  }

  // -----------------------------
  // 10) Create Grouped & Expandable Card
  // -----------------------------
  function createGroupedCard(reports) {
    const container = document.createElement("div");
    container.className = "report-card";

    const first = reports[0];

    // Determine group‐status by the first report’s status
    const groupStatus = first.status; // all in a group share targetType/targetId, but status might differ; you could pick highest‐priority here

    // Header
    const header = document.createElement("div");
    header.className = `report-header status-${groupStatus}`;

    // Type & ID
    const typeSpan = document.createElement("span");
    typeSpan.textContent = `Type: ${first.targetType}`;
    typeSpan.className = "report-type";

    // Earliest report date in this group
    const earliest = [...reports].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    )[0];
    const dateSpan = document.createElement("span");
    dateSpan.textContent = `First Reported: ${new Date(earliest.createdAt).toLocaleString()}`;
    dateSpan.className = "report-date";

    // Count of reports in the group
    const countSpan = document.createElement("span");
    countSpan.textContent = `Reports: ${reports.length}`;
    countSpan.className = "report-count";

    // Expand/Collapse button
    const toggleBtn = createActionButton("Expand", () => {
      expandedSection.style.display = expandedSection.style.display === "none" ? "" : "none";
      toggleBtn.textContent = expandedSection.style.display === "none" ? "Expand" : "Collapse";
    });

    // View Preview button
    const viewBtn = createActionButton("View", () => {
      entityPreview.replaceChildren();
      handleView(first);
    });

    header.append(typeSpan, dateSpan, countSpan, toggleBtn, viewBtn);

    // Expanded section (initially hidden)
    const expandedSection = document.createElement("div");
    expandedSection.className = "report-expanded";
    expandedSection.style.display = "none";

    // For each individual report in this group
    reports.forEach((report) => {
      const item = document.createElement("div");
      item.className = "report-item";

      // Report details
      const reasonP = document.createElement("p");
      reasonP.textContent = `Reason: ${report.reason}`;

      const notesP = document.createElement("p");
      notesP.textContent = report.notes ? `User Notes: ${report.notes}` : "User Notes: (none)";

      const contentIdP = document.createElement("p");
      contentIdP.textContent = `Reported ID: ${report.targetId}`;

      const parentP = document.createElement("p");
      if (report.parentType && report.parentId) {
        parentP.textContent = `Parent: ${report.parentType} → ${report.parentId}`;
      } else {
        parentP.textContent = "Parent: (none)";
      }

      const statusP = document.createElement("p");
      statusP.textContent = `Status: ${report.status}`;
      statusP.className = `status-text status-${report.status}`;

      const reviewedByP = document.createElement("p");
      reviewedByP.textContent = report.reviewedBy ? `Reviewed By: ${report.reviewedBy}` : "Reviewed By: (none)";

      const reviewNotesP = document.createElement("p");
      reviewNotesP.textContent = report.reviewNotes ? `Moderator Notes: ${report.reviewNotes}` : "Moderator Notes: (none)";

      const dateP = document.createElement("p");
      dateP.textContent = `Reported At: ${new Date(report.createdAt).toLocaleString()}`;

      // Notification status
      const notifySpan = document.createElement("span");
      notifySpan.textContent = report.notified ? "Reporter Notified" : "Notification Pending";
      notifySpan.className = report.notified ? "notified-yes" : "notified-pending";

      // Update controls
      const updateWrapper = document.createElement("div");
      updateWrapper.className = "update-wrapper";

      const statusSelect = document.createElement("select");
      ["pending", "reviewed", "resolved", "rejected"].forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        if (report.status === s) opt.selected = true;
        statusSelect.appendChild(opt);
      });

      const reviewTextarea = document.createElement("textarea");
      reviewTextarea.rows = 2;
      reviewTextarea.placeholder = "Moderator notes…";
      reviewTextarea.value = report.reviewNotes || "";

      const saveBtn = createActionButton("Save", async () => {
        const newStatus = statusSelect.value;
        const newNotes = reviewTextarea.value.trim();

        if (newStatus === report.status && newNotes === (report.reviewNotes || "")) {
          alert("No changes to save.");
          return;
        }

        const confirmMsg = `Update this report to status "${newStatus}"?`;
        if (!confirm(confirmMsg)) return;

        // Store previous payload for undo
        lastAction = {
          reportId: report.id,
          prevPayload: {
            status: report.status,
            reviewedBy: report.reviewedBy || "",
            reviewNotes: report.reviewNotes || "",
          },
        };
        undoBtn.disabled = false;

        try {
          await apiFetch(`/report/${report.id}`, "PUT", {
            status: newStatus,
            reviewedBy: "admin", // Replace with actual admin ID if you have one
            reviewNotes: newNotes,
          });
          fetchReportedContent();
        } catch (err) {
          console.error("Failed to update report:", err);
          alert("Failed to update this report. Try again.");
        }
      });

      updateWrapper.append(statusSelect, reviewTextarea, saveBtn);

      // Assemble the individual report item
      item.append(reasonP, notesP, contentIdP, parentP, statusP, reviewedByP, reviewNotesP, dateP, notifySpan, updateWrapper);
      expandedSection.appendChild(item);
    });

    container.append(header, expandedSection);
    return container;
  }

  // -----------------------------
  // 11) Handle Viewing Parent & Child Entities
  // -----------------------------
  function handleView(report) {
    if (report.parentType && report.parentId) {
      loadReportedEntity(report.parentType, report.parentId, "Parent");
    }
    loadReportedEntity(report.targetType, report.targetId, "Reported");
  }

  async function loadReportedEntity(type, id, label) {
    const section = document.createElement("div");
    section.className = "entity-section";
    section.textContent = `${label} (${type}) loading…`;
    entityPreview.appendChild(section);

    let endpoint;
    switch (type) {
      case "post":
        endpoint = `/feed/post/${id}`;
        break;
      case "place":
        endpoint = `/place/${id}`;
        break;
      case "comment":
        endpoint = `/comments/${id}`;
        break;
      case "event":
        endpoint = `/events/event/${id}`;
        break;
      default:
        section.textContent = `${label}: Unknown content type.`;
        return;
    }

    try {
      const entity = await apiFetch(endpoint);
      section.replaceChildren();

      const title = document.createElement("h4");
      title.textContent = `${label}: ${type.toUpperCase()} Preview`;

      const pre = document.createElement("pre");
      pre.textContent = JSON.stringify(entity, null, 2);

      section.append(title, pre);
    } catch (err) {
      console.error(`Failed to load ${label}:`, err);
      section.textContent = `${label}: Failed to load content.`;
    }
  }

  // -----------------------------
  // 12) Update Summary Metrics
  // -----------------------------
  function updateSummary(grouped) {
    // grouped: { "post:123": [r1, r2], "comment:456": [r3], … }
    const keys = Object.keys(grouped);
    const totalEntities = keys.length;

    const statusCounts = { pending: 0, reviewed: 0, resolved: 0, rejected: 0 };
    keys.forEach((key) => {
      const group = grouped[key];
      const firstStatus = group[0].status;
      if (statusCounts[firstStatus] !== undefined) {
        statusCounts[firstStatus]++;
      }
    });

    summaryContainer.replaceChildren();
    const summaryText = document.createElement("div");
    summaryText.innerHTML = `
      <strong>Total Entities Reported:</strong> ${totalEntities} &nbsp;|&nbsp;
      <strong>Pending:</strong> ${statusCounts.pending} &nbsp;|&nbsp;
      <strong>Reviewed:</strong> ${statusCounts.reviewed} &nbsp;|&nbsp;
      <strong>Resolved:</strong> ${statusCounts.resolved} &nbsp;|&nbsp;
      <strong>Rejected:</strong> ${statusCounts.rejected}
    `;
    summaryContainer.appendChild(summaryText);
  }

  // -----------------------------
  // 13) Utility: Create Action Button
  // -----------------------------
  function createActionButton(label, handler) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "admin-btn";
    btn.style.margin = "0 0.5rem";
    btn.addEventListener("click", handler);
    return btn;
  }

  // -----------------------------
  // 14) Utility: Build Query String (skips “all” or empty)
  // -----------------------------
  function buildQueryString(paramsObj) {
    const p = new URLSearchParams();
    Object.keys(paramsObj).forEach((key) => {
      const val = paramsObj[key];
      if (val !== undefined && val !== null && val !== "" && val !== "all") {
        p.append(key, val);
      }
    });
    return p.toString();
  }

  // -----------------------------
  // 15) Utility: Debounce
  // -----------------------------
  function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
}
