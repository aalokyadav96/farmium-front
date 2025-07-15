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

// // adminReports.js

// import { apiFetch } from "../../api/api.js";

// // -------------------------------------------------------------
// // displayAdmin: Main entry point for rendering the admin UI.
// // -------------------------------------------------------------
// export function displayAdmin(contentContainer, isLoggedIn) {
//   contentContainer.replaceChildren();

//   if (!isLoggedIn) {
//     const msg = document.createElement("p");
//     msg.textContent = "Admin access only. Please log in.";
//     contentContainer.appendChild(msg);
//     return;
//   }

//   // -----------------------------
//   // 1) Create Title and Undo Button
//   // -----------------------------
//   const title = document.createElement("h2");
//   title.textContent = "Reported Content";

//   // Undo Last Action button (initially disabled)
//   const undoBtn = createActionButton("Undo Last", async () => {
//     if (!lastAction) {
//       alert("No action to undo.");
//       return;
//     }
//     try {
//       await apiFetch(`/report/${lastAction.reportId}`, "PUT", lastAction.prevPayload);
//       alert("Last action undone.");
//       lastAction = null;
//       fetchReportedContent();
//     } catch (e) {
//       console.error("Undo failed:", e);
//       alert("Failed to undo.");
//     }
//   });
//   undoBtn.disabled = true; // will enable when there's something to undo

//   // -----------------------------
//   // 2) Create Filters: Status, Type, Reason
//   // -----------------------------
//   const filtersWrapper = document.createElement("div");
//   filtersWrapper.className = "admin-filters";

//   const statusFilter = createDropdown("Status", ["all", "pending", "reviewed", "resolved", "rejected"]);
//   const typeFilter = createDropdown("Type", ["all", "post", "comment", "event", "place"]);
//   const reasonFilter = createDropdown("Reason", ["all", "Spam", "Harassment", "Inappropriate", "Other"]);

//   filtersWrapper.append(statusFilter, typeFilter, reasonFilter);

//   // -----------------------------
//   // 3) Create Summary Container
//   // -----------------------------
//   const summaryContainer = document.createElement("div");
//   summaryContainer.className = "admin-summary";
//   // Will be populated by updateSummary()

//   // -----------------------------
//   // 4) Create Reports List + Preview Wrapper
//   // -----------------------------
//   const wrapper = document.createElement("div");
//   wrapper.className = "admin-wrapper"; // flex container

//   const listContainer = document.createElement("div");
//   listContainer.className = "admin-reported-list";

//   const entityPreview = document.createElement("div");
//   entityPreview.className = "admin-entity-preview";
//   entityPreview.textContent = "Select a report to preview its content.";

//   wrapper.append(listContainer, entityPreview);

//   // -----------------------------
//   // 5) Append Everything to contentContainer
//   // -----------------------------
//   contentContainer.append(title, undoBtn, filtersWrapper, summaryContainer, wrapper);

//   // -----------------------------
//   // 6) State Variables
//   // -----------------------------
//   let lastAction = null; // To store last update for undo
//   let allReports = [];   // Raw fetched reports

//   // -----------------------------
//   // 7) Wire up Filter Change Handlers
//   // -----------------------------
//   // Whenever a filter changes, re-fetch & re-render
//   [statusFilter, typeFilter, reasonFilter].forEach(filterWrapper => {
//     const selectEl = filterWrapper.querySelector("select");
//     selectEl.addEventListener("change", fetchReportedContent);
//   });

//   // -----------------------------
//   // 8) Fetch & Render Reports
//   // -----------------------------
//   async function fetchReportedContent() {
//     listContainer.replaceChildren();
//     entityPreview.replaceChildren();
//     entityPreview.textContent = "Select a report to preview its content.";
//     summaryContainer.textContent = "";

//     listContainer.textContent = "Loading reports...";

//     try {
//       const reports = await apiFetch("/admin/reports");
//       allReports = reports; // store for undo logic

//       if (!reports.length) {
//         listContainer.replaceChildren();
//         const p = document.createElement("p");
//         p.textContent = "No reports found.";
//         listContainer.appendChild(p);
//         updateSummary({});
//         return;
//       }

//       // Group by (targetType + targetId)
//       const grouped = {};
//       for (const r of reports) {
//         const key = `${r.targetType}:${r.targetId}`;
//         if (!grouped[key]) grouped[key] = [];
//         grouped[key].push(r);
//       }

//       // Apply filters
//       const statusValue = statusFilter.querySelector("select").value;
//       const typeValue = typeFilter.querySelector("select").value;
//       const reasonValue = reasonFilter.querySelector("select").value;

//       const allKeys = Object.keys(grouped);
//       const filteredKeys = allKeys.filter((key) => {
//         const group = grouped[key];
//         const first = group[0];
//         const matchesStatus = statusValue === "all" || first.status === statusValue;
//         const matchesType = typeValue === "all" || first.targetType === typeValue;
//         const matchesReason = reasonValue === "all" || first.reason === reasonValue;
//         return matchesStatus && matchesType && matchesReason;
//       });

//       listContainer.replaceChildren();
//       if (!filteredKeys.length) {
//         const p = document.createElement("p");
//         p.textContent = "No matching reports found.";
//         listContainer.appendChild(p);
//         updateSummary(grouped);
//         return;
//       }

//       // Render each group as one expandable card
//       filteredKeys.forEach((key) => {
//         const reportGroup = grouped[key];
//         const card = createGroupedCard(reportGroup);
//         listContainer.appendChild(card);
//       });

//       updateSummary(grouped);
//     } catch (err) {
//       console.error("Failed to load reports:", err);
//       listContainer.replaceChildren();
//       const p = document.createElement("p");
//       p.textContent = "Failed to load reports.";
//       listContainer.appendChild(p);
//     }
//   }

//   // Immediately load on init
//   fetchReportedContent();

//   // -----------------------------
//   // 9) Helper: Create a Dropdown Filter
//   // -----------------------------
//   function createDropdown(labelText, options) {
//     const wrapper = document.createElement("div");
//     wrapper.className = "filter-wrapper";

//     const label = document.createElement("label");
//     label.textContent = labelText;
//     label.style.marginRight = "0.5rem";
//     const select = document.createElement("select");
//     select.style.marginRight = "1rem";

//     options.forEach((opt) => {
//       const o = document.createElement("option");
//       o.value = opt;
//       o.textContent = opt;
//       select.appendChild(o);
//     });

//     wrapper.append(label, select);
//     return wrapper;
//   }

//   // -----------------------------
//   // 10) Create a Grouped & Expandable Card
//   // -----------------------------
//   function createGroupedCard(reports) {
//     // Container for the entire card
//     const container = document.createElement("div");
//     container.className = "report-card";

//     // Card header: shows type, date (earliest), count of reports
//     const header = document.createElement("div");
//     header.className = "report-header";

//     // Type & target ID
//     const first = reports[0];
//     const typeSpan = document.createElement("span");
//     typeSpan.textContent = `Type: ${first.targetType}`;
//     typeSpan.className = "report-type";

//     // Show earliest createdAt among grouped reports
//     const sortedByDate = [...reports].sort(
//       (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
//     );
//     const dateSpan = document.createElement("span");
//     dateSpan.textContent = `First Reported: ${new Date(sortedByDate[0].createdAt).toLocaleString()}`;
//     dateSpan.className = "report-date";

//     // Count of reports
//     const countSpan = document.createElement("span");
//     countSpan.textContent = `Reports: ${reports.length}`;
//     countSpan.className = "report-count";

//     // Expand/Collapse Button
//     const toggleBtn = createActionButton("Expand", () => {
//       expandedSection.style.display =
//         expandedSection.style.display === "none" ? "" : "none";
//       toggleBtn.textContent =
//         expandedSection.style.display === "none" ? "Expand" : "Collapse";
//     });

//     // View Button: loads preview of both parent & reported
//     const viewBtn = createActionButton("View", () => {
//       entityPreview.replaceChildren();
//       handleView(first);
//     });

//     header.append(typeSpan, dateSpan, countSpan, toggleBtn, viewBtn);

//     // Expanded section (initially hidden)
//     const expandedSection = document.createElement("div");
//     expandedSection.className = "report-expanded";
//     expandedSection.style.display = "none";

//     // For each individual report in this group, show its details and update controls
//     reports.forEach((report) => {
//       const item = document.createElement("div");
//       item.className = "report-item";

//       // Report details
//       const reasonP = document.createElement("p");
//       reasonP.textContent = `Reason: ${report.reason}`;

//       const notesP = document.createElement("p");
//       notesP.textContent = report.notes
//         ? `User Notes: ${report.notes}`
//         : "User Notes: (none)";

//       const contentIdP = document.createElement("p");
//       contentIdP.textContent = `Reported ID: ${report.targetId}`;

//       const parentP = document.createElement("p");
//       if (report.parentType && report.parentId) {
//         parentP.textContent = `Parent: ${report.parentType} → ${report.parentId}`;
//       } else {
//         parentP.textContent = "Parent: (none)";
//       }

//       const statusP = document.createElement("p");
//       statusP.textContent = `Status: ${report.status}`;

//       const reviewedByP = document.createElement("p");
//       reviewedByP.textContent = report.reviewedBy
//         ? `Reviewed By: ${report.reviewedBy}`
//         : "Reviewed By: (none)";

//       const reviewNotesP = document.createElement("p");
//       reviewNotesP.textContent = report.reviewNotes
//         ? `Moderator Notes: ${report.reviewNotes}`
//         : "Moderator Notes: (none)";

//       const dateP = document.createElement("p");
//       dateP.textContent = `Reported At: ${new Date(report.createdAt).toLocaleString()}`;

//       // Notify reporter placeholder
//       const notifySpan = document.createElement("span");
//       notifySpan.textContent = report.notified
//         ? "Reporter Notified"
//         : "Notification Pending";
//       notifySpan.className = report.notified
//         ? "notified-yes"
//         : "notified-pending";

//       // Update controls (status dropdown, notes input, Save button)
//       const updateWrapper = document.createElement("div");
//       updateWrapper.className = "update-wrapper";

//       const statusSelect = document.createElement("select");
//       ["pending", "reviewed", "resolved", "rejected"].forEach((s) => {
//         const opt = document.createElement("option");
//         opt.value = s;
//         opt.textContent = s;
//         if (report.status === s) opt.selected = true;
//         statusSelect.appendChild(opt);
//       });

//       const reviewTextarea = document.createElement("textarea");
//       reviewTextarea.rows = 2;
//       reviewTextarea.placeholder = "Moderator notes…";
//       reviewTextarea.value = report.reviewNotes || "";

//       const saveBtn = createActionButton("Save", async () => {
//         const newStatus = statusSelect.value;
//         const newNotes = reviewTextarea.value.trim();

//         const confirmed = confirm(
//           `Update report status to "${newStatus}"?`
//         );
//         if (!confirmed) return;

//         // Save previous payload for undo
//         const prevPayload = {
//           status: report.status,
//           reviewedBy: report.reviewedBy || "",
//           reviewNotes: report.reviewNotes || "",
//         };
//         lastAction = {
//           reportId: report.id,
//           prevPayload,
//         };
//         undoBtn.disabled = false;

//         try {
//           await apiFetch(`/report/${report.id}`, "PUT", {
//             status: newStatus,
//             reviewedBy: "admin", // Replace with actual admin ID if available
//             reviewNotes: newNotes,
//           });
//           alert("Report updated.");
//           fetchReportedContent();
//         } catch (err) {
//           console.error("Failed to update report:", err);
//           alert("Failed to update report.");
//         }
//       });

//       updateWrapper.append(statusSelect, reviewTextarea, saveBtn);

//       // Append all elements to this item
//       item.append(
//         reasonP,
//         notesP,
//         contentIdP,
//         parentP,
//         statusP,
//         reviewedByP,
//         reviewNotesP,
//         dateP,
//         notifySpan,
//         updateWrapper
//       );

//       expandedSection.appendChild(item);
//     });

//     container.append(header, expandedSection);
//     return container;
//   }

//   // -----------------------------
//   // 11) Handle Viewing Parent & Child Entities
//   // -----------------------------
//   function handleView(report) {
//     // Load Parent first (if exists), then Child
//     if (report.parentType && report.parentId) {
//       loadReportedEntity(report.parentType, report.parentId, "Parent");
//     }
//     loadReportedEntity(report.targetType, report.targetId, "Reported");
//   }

//   async function loadReportedEntity(type, id, label) {
//     const section = document.createElement("div");
//     section.className = "entity-section";
//     section.textContent = `${label} (${type}) loading…`;
//     entityPreview.appendChild(section);

//     let endpoint;
//     switch (type) {
//       case "post":
//         endpoint = `/feed/post/${id}`;
//         break;
//       case "place":
//         endpoint = `/place/${id}`;
//         break;
//       case "comment":
//         endpoint = `/comments/${id}`;
//         break;
//       case "event":
//         endpoint = `/events/event/${id}`;
//         break;
//       default:
//         section.textContent = `${label}: Unknown content type`;
//         return;
//     }

//     try {
//       const entity = await apiFetch(endpoint);
//       section.replaceChildren();

//       const title = document.createElement("h4");
//       title.textContent = `${label}: ${type.toUpperCase()} Preview`;

//       const pre = document.createElement("pre");
//       pre.textContent = JSON.stringify(entity, null, 2);

//       section.append(title, pre);
//     } catch (err) {
//       console.error(`Failed to load ${label}:`, err);
//       section.textContent = `${label}: Failed to load content.`;
//     }
//   }

//   // -----------------------------
//   // 12) Update Summary Metrics
//   // -----------------------------
//   function updateSummary(grouped) {
//     // grouped: { "post:123": [report1, report2], "comment:456": [report3], … }
//     const keys = Object.keys(grouped);
//     const total = keys.length;
//     const statusCounts = { pending: 0, reviewed: 0, resolved: 0, rejected: 0 };

//     keys.forEach((key) => {
//       const group = grouped[key];
//       const firstStatus = group[0].status;
//       if (statusCounts[firstStatus] !== undefined) {
//         statusCounts[firstStatus]++;
//       }
//     });

//     summaryContainer.replaceChildren();
//     const summaryText = document.createElement("div");
//     summaryText.innerHTML = `
//       <strong>Total Entities Reported:</strong> ${total} &nbsp;|
//       <strong>Pending:</strong> ${statusCounts.pending} &nbsp;|
//       <strong>Reviewed:</strong> ${statusCounts.reviewed} &nbsp;|
//       <strong>Resolved:</strong> ${statusCounts.resolved} &nbsp;|
//       <strong>Rejected:</strong> ${statusCounts.rejected}
//     `;
//     summaryContainer.appendChild(summaryText);
//   }

//   // -----------------------------
//   // 13) Utility: Create Action Button
//   // -----------------------------
//   function createActionButton(label, handler) {
//     const btn = document.createElement("button");
//     btn.textContent = label;
//     btn.className = "admin-btn";
//     btn.style.margin = "0 0.5rem";
//     btn.addEventListener("click", handler);
//     return btn;
//   }
// }

// // import { apiFetch } from "../../api/api.js";

// // export function displayAdmin(contentContainer, isLoggedIn) {
// //   contentContainer.replaceChildren();

// //   if (!isLoggedIn) {
// //     const msg = document.createElement('p');
// //     msg.textContent = 'Admin access only. Please log in.';
// //     contentContainer.appendChild(msg);
// //     return;
// //   }

// //   const title = document.createElement('h2');
// //   title.textContent = 'Reported Content';

// //   const wrapper = document.createElement('div');
// //   wrapper.className = 'admin-wrapper'; // Use CSS flexbox for layout

// //   const listContainer = document.createElement('div');
// //   listContainer.className = 'admin-reported-list';

// //   const entityPreview = document.createElement('div');
// //   entityPreview.className = 'admin-entity-preview';
// //   entityPreview.textContent = 'Select a report to preview its content.';

// //   wrapper.append(listContainer, entityPreview);
// //   contentContainer.append(title, wrapper);

// //   fetchReportedContent();

// //   async function fetchReportedContent() {
// //     listContainer.textContent = 'Loading reports...';

// //     try {
// //       const reports = await apiFetch('/admin/reports');
// //       listContainer.replaceChildren();

// //       if (!reports.length) {
// //         const p = document.createElement('p');
// //         p.textContent = 'No reports found.';
// //         listContainer.appendChild(p);
// //         return;
// //       }

// //       reports.forEach(report => {
// //         const card = createReportCard(report);
// //         listContainer.appendChild(card);
// //       });
// //     } catch (err) {
// //       const p = document.createElement('p');
// //       p.textContent = 'Failed to load reports.';
// //       listContainer.appendChild(p);
// //     }
// //   }

// //   function createReportCard(report) {
// //     const card = document.createElement('div');
// //     card.className = 'report-card';

// //     const header = document.createElement('div');
// //     header.className = 'report-header';

// //     const typeSpan = document.createElement('span');
// //     typeSpan.textContent = `Type: ${report.targetType}`;
// //     typeSpan.className = 'report-type';

// //     const dateSpan = document.createElement('span');
// //     dateSpan.textContent = new Date(report.createdAt).toLocaleString();
// //     dateSpan.className = 'report-date';

// //     header.append(typeSpan, dateSpan);

// //     const body = document.createElement('div');
// //     body.className = 'report-body';

// //     const reason = document.createElement('p');
// //     reason.textContent = `Reason: ${report.reason}`;

// //     const notes = document.createElement('p');
// //     notes.textContent = report.notes ? `User Notes: ${report.notes}` : '';

// //     const contentId = document.createElement('p');
// //     contentId.textContent = `Reported ID: ${report.targetId}`;

// //     const parentInfo = document.createElement('p');
// //     if (report.parentType && report.parentId) {
// //       parentInfo.textContent = `Parent: ${report.parentType} → ${report.parentId}`;
// //     } else {
// //       parentInfo.textContent = `Parent: none`;
// //     }


// //     const statusP = document.createElement('p');
// //     statusP.textContent = `Status: ${report.status}`;

// //     const reviewedByP = document.createElement('p');
// //     reviewedByP.textContent = report.reviewedBy ? `Reviewed By: ${report.reviewedBy}` : 'Not reviewed yet';

// //     const reviewNotesP = document.createElement('p');
// //     reviewNotesP.textContent = report.reviewNotes ? `Moderator Notes: ${report.reviewNotes}` : '';

// //     body.append(reason, notes, contentId, parentInfo, statusP, reviewedByP, reviewNotesP);

// //     const actions = document.createElement('div');
// //     actions.className = 'report-actions';

// //     const viewBtn = createActionButton('View', () => handleView(report));

// //     const statusSelect = document.createElement('select');
// //     ['pending', 'reviewed', 'resolved', 'rejected'].forEach(status => {
// //       const opt = document.createElement('option');
// //       opt.value = status;
// //       opt.textContent = status;
// //       if (report.status === status) opt.selected = true;
// //       statusSelect.appendChild(opt);
// //     });

// //     const notesInput = document.createElement('textarea');
// //     notesInput.placeholder = 'Add moderation notes...';
// //     notesInput.rows = 2;
// //     notesInput.value = report.reviewNotes || '';

// //     const saveBtn = createActionButton('Save', () => {
// //       handleUpdate(report.id, statusSelect.value, notesInput.value);
// //     });

// //     actions.append(viewBtn, statusSelect, notesInput, saveBtn);
// //     card.append(header, body, actions);
// //     return card;
// //   }

// //   function createActionButton(label, handler) {
// //     const btn = document.createElement('button');
// //     btn.textContent = label;
// //     btn.className = 'admin-btn';
// //     btn.addEventListener('click', handler);
// //     return btn;
// //   }

// //   // function handleView(report) {
// //   //   loadReportedEntity(report.targetType, report.targetId, 'Reported');

// //   //   if (report.parentType && report.parentId) {
// //   //     loadReportedEntity(report.parentType, report.parentId, 'Parent');
// //   //   }
// //   // }


// //   function handleView(report) {
// //     loadReportedEntity(report.targetType, report.targetId, report.parentType, report.parentId);
// //   }


// //   async function handleUpdate(reportId, status, reviewNotes) {
// //     const confirmed = confirm(`Update report status to "${status}"?`);
// //     if (!confirmed) return;

// //     try {
// //       await apiFetch(`/report/${reportId}`, 'PUT', {
// //         status,
// //         reviewedBy: 'admin', // Replace with actual admin ID if needed
// //         reviewNotes
// //       });
// //       alert('Report updated.');
// //       fetchReportedContent();
// //     } catch {
// //       alert('Failed to update report.');
// //     }
// //   }

// //   async function loadReportedEntity(type, id, entityType, entityId) {
// //     entityPreview.textContent = 'Loading content...';
// //     let endpoint;

// //     switch (type) {
// //       case 'post':
// //         endpoint = `/feed/post/${id}`;
// //         break;
// //       case 'place':
// //         endpoint = `/place/${id}`;
// //         break;
// //       case 'comment':
// //         endpoint = `/comments/${id}`;
// //         break;
// //       case 'event':
// //         endpoint = `/events/event/${id}`;
// //         break;
// //       default:
// //         entityPreview.textContent = 'Unknown content type.';
// //         return;
// //     }

// //     try {
// //       const entity = await apiFetch(endpoint);
// //       renderEntityPreview(type, entity);
// //     } catch {
// //       entityPreview.textContent = 'Failed to load content.';
// //     }
// //   }

// //   function renderEntityPreview(type, entity) {
// //     entityPreview.replaceChildren();

// //     const title = document.createElement('h3');
// //     title.textContent = `${type.toUpperCase()} Preview`;

// //     const pre = document.createElement('pre');
// //     pre.textContent = JSON.stringify(entity, null, 2); // raw fallback

// //     entityPreview.append(title, pre);
// //   }
// // }


// // // import { apiFetch } from "../../api/api.js";

// // // export function displayAdmin(contentContainer, isLoggedIn) {
// // //   contentContainer.replaceChildren();

// // //   if (!isLoggedIn) {
// // //     const msg = document.createElement('p');
// // //     msg.textContent = 'Admin access only. Please log in.';
// // //     contentContainer.appendChild(msg);
// // //     return;
// // //   }

// // //   const title = document.createElement('h2');
// // //   title.textContent = 'Reported Content';

// // //   const wrapper = document.createElement('div');
// // //   wrapper.className = 'admin-wrapper'; // Use CSS flexbox for layout

// // //   const listContainer = document.createElement('div');
// // //   listContainer.className = 'admin-reported-list';

// // //   const entityPreview = document.createElement('div');
// // //   entityPreview.className = 'admin-entity-preview';
// // //   entityPreview.textContent = 'Select a report to preview its content.';

// // //   wrapper.append(listContainer, entityPreview);
// // //   contentContainer.append(title, wrapper);

// // //   fetchReportedContent();

// // //   async function fetchReportedContent() {
// // //     listContainer.textContent = 'Loading reports...';

// // //     try {
// // //       const reports = await apiFetch('/admin/reports');
// // //       listContainer.replaceChildren();

// // //       if (!reports.length) {
// // //         const p = document.createElement('p');
// // //         p.textContent = 'No reports found.';
// // //         listContainer.appendChild(p);
// // //         return;
// // //       }

// // //       reports.forEach(report => {
// // //         const card = createReportCard(report);
// // //         listContainer.appendChild(card);
// // //       });
// // //     } catch (err) {
// // //       const p = document.createElement('p');
// // //       p.textContent = 'Failed to load reports.';
// // //       listContainer.appendChild(p);
// // //     }
// // //   }

// // //   function createReportCard(report) {
// // //     const card = document.createElement('div');
// // //     card.className = 'report-card';

// // //     const header = document.createElement('div');
// // //     header.className = 'report-header';

// // //     const typeSpan = document.createElement('span');
// // //     typeSpan.textContent = `Type: ${report.targetType}`;
// // //     typeSpan.className = 'report-type';

// // //     const dateSpan = document.createElement('span');
// // //     dateSpan.textContent = new Date(report.createdAt).toLocaleString();
// // //     dateSpan.className = 'report-date';

// // //     header.append(typeSpan, dateSpan);

// // //     const body = document.createElement('div');
// // //     body.className = 'report-body';

// // //     const reason = document.createElement('p');
// // //     reason.textContent = `Reason: ${report.reason}`;

// // //     const notes = document.createElement('p');
// // //     notes.textContent = report.notes ? `User Notes: ${report.notes}` : '';

// // //     const contentId = document.createElement('p');
// // //     contentId.textContent = `Reported ID: ${report.targetId}`;

// // //     const statusP = document.createElement('p');
// // //     statusP.textContent = `Status: ${report.status}`;

// // //     const reviewedByP = document.createElement('p');
// // //     reviewedByP.textContent = report.reviewedBy ? `Reviewed By: ${report.reviewedBy}` : 'Not reviewed yet';

// // //     const reviewNotesP = document.createElement('p');
// // //     reviewNotesP.textContent = report.reviewNotes ? `Moderator Notes: ${report.reviewNotes}` : '';

// // //     body.append(reason, notes, contentId, statusP, reviewedByP, reviewNotesP);

// // //     const actions = document.createElement('div');
// // //     actions.className = 'report-actions';

// // //     const viewBtn = createActionButton('View', () => handleView(report));

// // //     const statusSelect = document.createElement('select');
// // //     ['pending', 'reviewed', 'resolved'].forEach(status => {
// // //       const opt = document.createElement('option');
// // //       opt.value = status;
// // //       opt.textContent = status;
// // //       if (report.status === status) opt.selected = true;
// // //       statusSelect.appendChild(opt);
// // //     });

// // //     const notesInput = document.createElement('textarea');
// // //     notesInput.placeholder = 'Add moderation notes...';
// // //     notesInput.rows = 2;
// // //     notesInput.value = report.reviewNotes || '';

// // //     const saveBtn = createActionButton('Save', () => {
// // //       handleUpdate(report.id, statusSelect.value, notesInput.value);
// // //     });

// // //     actions.append(viewBtn, statusSelect, notesInput, saveBtn);
// // //     card.append(header, body, actions);
// // //     return card;
// // //   }

// // //   function createActionButton(label, handler) {
// // //     const btn = document.createElement('button');
// // //     btn.textContent = label;
// // //     btn.className = 'admin-btn';
// // //     btn.addEventListener('click', handler);
// // //     return btn;
// // //   }

// // //   function handleView(report) {
// // //     loadReportedEntity(report.targetType, report.targetId);
// // //   }

// // //   async function handleUpdate(reportId, status, reviewNotes) {
// // //     const confirmed = confirm(`Update report status to "${status}"?`);
// // //     if (!confirmed) return;

// // //     try {
// // //       await apiFetch(`/report/${reportId}`, 'PUT', {
// // //         status,
// // //         reviewedBy: 'admin', // Replace with actual admin ID if needed
// // //         reviewNotes
// // //       });
// // //       alert('Report updated.');
// // //       fetchReportedContent();
// // //     } catch {
// // //       alert('Failed to update report.');
// // //     }
// // //   }

// // //   async function loadReportedEntity(type, id) {
// // //     entityPreview.textContent = 'Loading content...';
// // //     let endpoint;

// // //     switch (type) {
// // //       case 'post':
// // //         endpoint = `/feed/post/${id}`;
// // //         break;
// // //       case 'place':
// // //         endpoint = `/place/${id}`;
// // //         break;
// // //       case 'comment':
// // //         endpoint = `/comments/${id}`;
// // //         break;
// // //       case 'event':
// // //         endpoint = `/events/event/${id}`;
// // //         break;
// // //       default:
// // //         entityPreview.textContent = 'Unknown content type.';
// // //         return;
// // //     }

// // //     try {
// // //       const entity = await apiFetch(endpoint);
// // //       renderEntityPreview(type, entity);
// // //     } catch {
// // //       entityPreview.textContent = 'Failed to load content.';
// // //     }
// // //   }

// // //   function renderEntityPreview(type, entity) {
// // //     entityPreview.replaceChildren();

// // //     const title = document.createElement('h3');
// // //     title.textContent = `${type.toUpperCase()} Preview`;

// // //     const pre = document.createElement('pre');
// // //     pre.textContent = JSON.stringify(entity, null, 2); // raw fallback

// // //     entityPreview.append(title, pre);
// // //   }
// // // }


// // // // import { apiFetch } from "../../api/api.js";

// // // // export function displayAdmin(contentContainer, isLoggedIn) {
// // // //   contentContainer.replaceChildren();

// // // //   if (!isLoggedIn) {
// // // //     const msg = document.createElement('p');
// // // //     msg.textContent = 'Admin access only. Please log in.';
// // // //     contentContainer.appendChild(msg);
// // // //     return;
// // // //   }

// // // //   const title = document.createElement('h2');
// // // //   title.textContent = 'Reported Content';

// // // //   const listContainer = document.createElement('div');
// // // //   listContainer.className = 'admin-reported-list';

// // // //   contentContainer.append(title, listContainer);

// // // //   fetchReportedContent();

// // // //   async function fetchReportedContent() {
// // // //     listContainer.textContent = 'Loading reports...';

// // // //     try {
// // // //       const reports = await apiFetch('/admin/reports');
// // // //       listContainer.replaceChildren();

// // // //       if (!reports.length) {
// // // //         const p = document.createElement('p');
// // // //         p.textContent = 'No reports found.';
// // // //         listContainer.appendChild(p);
// // // //         return;
// // // //       }

// // // //       reports.forEach(report => {
// // // //         const card = createReportCard(report);
// // // //         listContainer.appendChild(card);
// // // //       });
// // // //     } catch (err) {
// // // //       const p = document.createElement('p');
// // // //       p.textContent = 'Failed to load reports.';
// // // //       listContainer.appendChild(p);
// // // //     }
// // // //   }

// // // //   function createReportCard(report) {
// // // //     const card = document.createElement('div');
// // // //     card.className = 'report-card';

// // // //     const header = document.createElement('div');
// // // //     header.className = 'report-header';

// // // //     const typeSpan = document.createElement('span');
// // // //     typeSpan.textContent = `Type: ${report.targetType}`;
// // // //     typeSpan.className = 'report-type';

// // // //     const dateSpan = document.createElement('span');
// // // //     dateSpan.textContent = new Date(report.createdAt).toLocaleString();
// // // //     dateSpan.className = 'report-date';

// // // //     header.append(typeSpan, dateSpan);

// // // //     const body = document.createElement('div');
// // // //     body.className = 'report-body';

// // // //     const reason = document.createElement('p');
// // // //     reason.textContent = `Reason: ${report.reason}`;

// // // //     const notes = document.createElement('p');
// // // //     notes.textContent = report.notes ? `User Notes: ${report.notes}` : '';

// // // //     const contentId = document.createElement('p');
// // // //     contentId.textContent = `Reported ID: ${report.targetId}`;

// // // //     const statusP = document.createElement('p');
// // // //     statusP.textContent = `Status: ${report.status}`;

// // // //     const reviewedByP = document.createElement('p');
// // // //     reviewedByP.textContent = report.reviewedBy ? `Reviewed By: ${report.reviewedBy}` : 'Not reviewed yet';

// // // //     const reviewNotesP = document.createElement('p');
// // // //     reviewNotesP.textContent = report.reviewNotes ? `Moderator Notes: ${report.reviewNotes}` : '';

// // // //     body.append(reason, notes, contentId, statusP, reviewedByP, reviewNotesP);

// // // //     const actions = document.createElement('div');
// // // //     actions.className = 'report-actions';

// // // //     const viewBtn = createActionButton('View', () => handleView(report));

// // // //     // Status selector
// // // //     const statusSelect = document.createElement('select');
// // // //     ['pending', 'reviewed', 'resolved'].forEach(status => {
// // // //       const opt = document.createElement('option');
// // // //       opt.value = status;
// // // //       opt.textContent = status;
// // // //       if (report.status === status) opt.selected = true;
// // // //       statusSelect.appendChild(opt);
// // // //     });

// // // //     // Review notes
// // // //     const notesInput = document.createElement('textarea');
// // // //     notesInput.placeholder = 'Add moderation notes...';
// // // //     notesInput.rows = 2;
// // // //     notesInput.value = report.reviewNotes || '';

// // // //     // Save button
// // // //     const saveBtn = createActionButton('Save', () => {
// // // //       handleUpdate(report.id, statusSelect.value, notesInput.value);
// // // //     });

// // // //     actions.append(viewBtn, statusSelect, notesInput, saveBtn);
// // // //     card.append(header, body, actions);
// // // //     return card;
// // // //   }

// // // //   function createActionButton(label, handler) {
// // // //     const btn = document.createElement('button');
// // // //     btn.textContent = label;
// // // //     btn.className = 'admin-btn';
// // // //     btn.addEventListener('click', handler);
// // // //     return btn;
// // // //   }

// // // //   function handleView(report) {
// // // //     alert(`Navigate to view ${report.targetType} with ID: ${report.targetId}`);
// // // //     // Implement real redirection or modal if needed
// // // //   }

// // // //   async function handleUpdate(reportId, status, reviewNotes) {
// // // //     const confirmed = confirm(`Update report status to "${status}"?`);
// // // //     if (!confirmed) return;

// // // //     try {
// // // //       await apiFetch(`/report/${reportId}`, 'PUT', {
// // // //         status,
// // // //         reviewedBy: 'admin', // Replace with actual admin ID if available
// // // //         reviewNotes
// // // //       });
// // // //       alert('Report updated.');
// // // //       fetchReportedContent();
// // // //     } catch {
// // // //       alert('Failed to update report.');
// // // //     }
// // // //   }
// // // // }
