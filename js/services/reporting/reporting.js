// reporting.js

import { state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import Modal from "../../components/ui/Modal.mjs";
import Snackbar from "../../components/ui/Snackbar.mjs";

// Predefined reasons for reporting
const REPORT_REASONS = [
  { value: "", label: "Select a reason…" },
  { value: "Spam", label: "Spam" },
  { value: "Harassment", label: "Harassment" },
  { value: "Inappropriate", label: "Inappropriate" },
  { value: "Other", label: "Other" }
];

/**
 * reportPost:
 *   - Checks if user is logged in.
 *   - Prevents duplicate reports (same user → same target).
 *   - Opens a modal with:
 *       • a <select> for “reason” (required)
 *       • an optional <textarea> for notes
 *       • “Submit” + “Cancel” buttons
 *   - On “Submit”, validates and POSTS to /report.
 *   - On success: stores a flag in localStorage and shows a Snackbar.
 *   - On failure: displays an inline error message in the modal.
 *
 * @param {string} targetId    – ID of the item being reported (e.g. post ID or comment ID)
 * @param {string} targetType  – A string (e.g. "post" or "comment")
 */
export function reportPost(targetId, targetType, parentType="", parentId="") {
  // 1) Ensure user is logged in
  if (!state.user) {
    alert("You must be logged in to report content.");
    return;
  }
  const userId = state.user;

  // 2) Prevent duplicate reporting (client‐side deduplication)
  const storageKey = `reported:${userId}:${targetType}:${targetId}`;
  if (localStorage.getItem(storageKey)) {
    alert("You have already reported this item.");
    return;
  }

  // 3) Build modal content (vanilla JS)
  const content = createElement("div", {class:"vflex"}, []);

  // 3.1) Reason label + dropdown
  const reasonLabel = createElement("label", { for: "report-reason" }, ["Reason:"]);
  const reasonSelect = createElement("select", { id: "report-reason" },
    REPORT_REASONS.map(opt =>
      createElement("option", { value: opt.value }, [opt.label])
    )
  );

  // 3.2) Notes label + textarea
  const notesLabel = createElement("label", { for: "report-notes" }, ["Notes (optional):"]);
  const notesTextarea = createElement("textarea", {
    id: "report-notes",
    rows: "4",
    placeholder: "Add any details (optional)…"
  }, []);

  // 3.3) Inline error/message paragraph
  const messageP = createElement("p", {
    id: "report-message",
    style: "color: red; margin-top: 0.5rem; font-size: 0.9rem;"
  }, []);

  // 3.4) Submit + Cancel buttons
  const submitBtn = createElement("button", { type: "button", style: "margin-right: 0.5rem;" }, ["Submit"]);
  const cancelBtn = createElement("button", { type: "button" }, ["Cancel"]);

  // 3.5) Put them all into `content`
  content.append(
    reasonLabel,
    reasonSelect,
    notesLabel,
    notesTextarea,
    messageP,
    submitBtn,
    cancelBtn
  );

  // 4) Create the modal (but don't append yet)
  let modalEl;
  modalEl = Modal({
    title: "Report Content",
    content,
    onClose: () => {
      // If user clicks the “X” or outside the modal
      modalEl.remove();
    }
  });

  // 5) Append modal into <body>
  // document.body.appendChild(modalEl);

  // 6) Wire up “Cancel” to close the modal
  cancelBtn.addEventListener("click", () => {
    modalEl.remove();
    document.body.style.overflow = '';
  });

  // 7) Wire up “Submit”
  submitBtn.addEventListener("click", async () => {
    const chosenReason = reasonSelect.value;
    const notes = notesTextarea.value.trim();

    // 7.1) Validate that a reason was chosen
    if (!chosenReason) {
      messageP.textContent = "Please select a reason before submitting.";
      return;
    }
    messageP.textContent = "";       // clear any previous message
    submitBtn.disabled = true;       // prevent double‐click
    cancelBtn.disabled = true;

    // 7.2) Prepare payload
    const reportData = {
      reportedBy: userId,
      targetId,
      targetType,
      parentType,
      parentId,
      reason: chosenReason,
      notes
    };

    try {
      // 7.3) POST to /report
      const response = await apiFetch("/report", "POST", JSON.stringify(reportData));

      if (response.reportId) {
        modalEl.remove();
        // 7.4) Success: record in localStorage & show Snackbar
        localStorage.setItem(storageKey, "true");
        Snackbar("Thanks. We'll review this shortly.", 3000);
        document.body.style.overflow = '';
      } else {
        // 7.5) Server returned an error
        const errorJson = await response.json().catch(() => ({}));
        const errMsg = errorJson.message || "Failed to submit report. Please try again.";
        messageP.textContent = errMsg;
        submitBtn.disabled = false;
        cancelBtn.disabled = false;
      }
    } catch (networkErr) {
      console.error("Network error submitting report:", networkErr);
      messageP.textContent = "Network error. Please try again.";
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });
}

// export function reportPost(postid) {
//   // For now, just log or show a simple alert
//   alert(`Reported post ID: ${postid}`);

//   // Optionally send to backend
//   /*
//   fetch("/api/report", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ postid })
//   }).then(res => {
//       if (res.ok) alert("Post reported.");
//       else alert("Failed to report post.");
//   });
//   */
// }


// // Function to submit a report
// async function submitReport(reportData) {
//     const response = await fetch('/report', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(reportData)
//     });

//     const result = await response.json();
//     console.log(result.message);
// }

// // // Example usage
// // const reportExample = {
// //     reportedBy: "user123",
// //     targetId: "comment987",
// //     targetType: "comment",
// //     reason: "Hate speech",
// //     notes: "Contains offensive language"
// // };

// // submitReport(reportExample);


// /*

// API Endpoints
// 1. Submit a Report
// Method: POST

// URL: /report

// Payload:

// json
// {
//   "reportedBy": "user123",
//   "targetId": "post567",
//   "targetType": "post",
//   "reason": "Spam",
//   "notes": "Contains repeated ads"
// }
// Response:

// json
// {
//   "message": "Report submitted"
// }
// 2. Get All Reports (for moderation)
// Method: GET

// URL: /reports

// Response:

// json
// [
//   {
//     "id": "abcd123",
//     "reportedBy": "user123",
//     "targetId": "post567",
//     "targetType": "post",
//     "reason": "Spam",
//     "status": "pending",
//     "createdAt": "2025-05-04T16:55:00Z"
//   }
// ]
// 3. Update Report Status
// Method: PUT

// URL: /report/:id

// Payload:

// json
// {
//   "status": "resolved",
//   "notes": "User warned, post removed"
// }
// Response:

// json
// {
//   "message": "Report updated"
// }
// */