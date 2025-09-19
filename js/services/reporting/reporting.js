// reporting.js

import { getState } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { createElement } from "../../components/createElement.js";
import Modal from "../../components/ui/Modal.mjs";
import Notify from "../../components/ui/Notify.mjs";

const REPORT_REASONS = [
  { value: "", label: "Select a reason…" },
  { value: "Spam", label: "Spam" },
  { value: "Harassment", label: "Harassment" },
  { value: "Inappropriate", label: "Inappropriate" },
  { value: "Other", label: "Other" }
];

export function reportPost(targetId, targetType, parentType = "", parentId = "") {
  if (!getState("user")) {
    alert("You must be logged in to report content.");
    return;
  }
  const userId = getState("user");
  const storageKey = `reported:${userId}:${targetType}:${targetId}`;
  if (localStorage.getItem(storageKey)) {
    alert("You have already reported this item.");
    return;
  }

  const content = createElement("div", { class: "vflex" }, []);

  const reasonLabel = createElement("label", { for: "report-reason" }, ["Reason:"]);
  const reasonSelect = createElement("select", { id: "report-reason" },
    REPORT_REASONS.map(opt =>
      createElement("option", { value: opt.value }, [opt.label])
    )
  );

  const notesLabel = createElement("label", { for: "report-notes" }, ["Notes (optional):"]);
  const notesTextarea = createElement("textarea", {
    id: "report-notes",
    rows: "4",
    placeholder: "Add any details (optional)…"
  }, []);

  const messageP = createElement("p", {
    id: "report-message",
    style: "color: red; margin-top: 0.5rem; font-size: 0.9rem;"
  }, []);

  const submitBtn = createElement("button", { type: "button", style: "margin-right: 0.5rem;" }, ["Submit"]);
  const cancelBtn = createElement("button", { type: "button" }, ["Cancel"]);

  content.append(
    reasonLabel,
    reasonSelect,
    notesLabel,
    notesTextarea,
    messageP,
    submitBtn,
    cancelBtn
  );

  let modalEl = Modal({
    title: "Report Content",
    content,
    onClose: () => {
      modalEl.remove();
      document.body.style.overflow = "";
    }
  });

  if (!modalEl.isConnected) document.body.appendChild(modalEl);

  cancelBtn.addEventListener("click", () => {
    modalEl.remove();
    document.body.style.overflow = "";
  });

  submitBtn.addEventListener("click", async () => {
    const chosenReason = reasonSelect.value;
    const notes = notesTextarea.value.trim();

    if (!chosenReason) {
      messageP.textContent = "Please select a reason before submitting.";
      return;
    }
    messageP.textContent = "";
    submitBtn.disabled = true;
    cancelBtn.disabled = true;

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
      const response = await apiFetch("/report", "POST", reportData);

      if (response && response.reportId) {
        modalEl.remove();
        localStorage.setItem(storageKey, "true");
        Notify("Thanks. We'll review this shortly.", { type: "success", duration: 3000, dismissible: true });
        document.body.style.overflow = "";
      } else {
        const errMsg = (response && (response.error || response.message)) || "Failed to submit report. Please try again.";
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

/**
 * appealContent:
 * - Allows a user to submit an appeal for a removed/soft-deleted entity.
 * - Shows a modal with a required explanation textarea.
 * - POSTs to /appeals and shows a notification on success.
 *
 * @param {string} targetId
 * @param {string} targetType
 */
export function appealContent(targetId, targetType) {
  if (!getState("user")) {
    alert("You must be logged in to submit an appeal.");
    return;
  }
  const userId = getState("user");

  const content = createElement("div", { class: "vflex" }, []);

  const infoP = createElement("p", {}, ["You're appealing the removal of the selected content. Provide a brief explanation below."]);
  const reasonLabel = createElement("label", { for: "appeal-reason" }, ["Appeal explanation (required):"]);
  const reasonTextarea = createElement("textarea", {
    id: "appeal-reason",
    rows: "5",
    placeholder: "Explain why this content should be restored…"
  }, []);

  const messageP = createElement("p", { style: "color: red; margin-top:0.5rem; font-size:0.9rem;" }, []);

  const submitBtn = createElement("button", { type: "button", style: "margin-right:0.5rem;" }, ["Submit Appeal"]);
  const cancelBtn = createElement("button", { type: "button" }, ["Cancel"]);

  content.append(infoP, reasonLabel, reasonTextarea, messageP, submitBtn, cancelBtn);

  let modalEl = Modal({
    title: "Submit Appeal",
    content,
    onClose: () => {
      modalEl.remove();
      document.body.style.overflow = "";
    }
  });

  if (!modalEl.isConnected) document.body.appendChild(modalEl);

  cancelBtn.addEventListener("click", () => {
    modalEl.remove();
    document.body.style.overflow = "";
  });

  submitBtn.addEventListener("click", async () => {
    const reason = reasonTextarea.value.trim();
    if (!reason) {
      messageP.textContent = "Please provide an explanation for your appeal.";
      return;
    }
    messageP.textContent = "";
    submitBtn.disabled = true;
    cancelBtn.disabled = true;

    const appealData = {
      userId,
      targetType,
      targetId,
      reason
    };

    try {
      const res = await apiFetch("/appeals", "POST", appealData);
      if (res && res.appealId) {
        modalEl.remove();
        Notify("Appeal submitted. A moderator will review it.", { type: "success", duration: 4000, dismissible: true });
        document.body.style.overflow = "";
      } else {
        const errMsg = (res && (res.error || res.message)) || "Failed to submit appeal. Please try again.";
        messageP.textContent = errMsg;
        submitBtn.disabled = false;
        cancelBtn.disabled = false;
      }
    } catch (err) {
      console.error("Network error submitting appeal:", err);
      messageP.textContent = "Network error. Please try again.";
      submitBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  });
}

// // reporting.js

// import { getState } from "../../state/state.js";
// import { apiFetch } from "../../api/api.js";
// import { createElement } from "../../components/createElement.js";
// import Modal from "../../components/ui/Modal.mjs";
// import Notify from "../../components/ui/Notify.mjs";

// // Predefined reasons for reporting
// const REPORT_REASONS = [
//   { value: "", label: "Select a reason…" },
//   { value: "Spam", label: "Spam" },
//   { value: "Harassment", label: "Harassment" },
//   { value: "Inappropriate", label: "Inappropriate" },
//   { value: "Other", label: "Other" }
// ];

// /**
//  * reportPost:
//  *   - Checks if user is logged in.
//  *   - Prevents duplicate reports (same user → same target).
//  *   - Opens a modal with:
//  *       • a <select> for “reason” (required)
//  *       • an optional <textarea> for notes
//  *       • “Submit” + “Cancel” buttons
//  *   - On “Submit”, validates and POSTS to /report.
//  *   - On success: stores a flag in localStorage and shows a Snackbar.
//  *   - On failure: displays an inline error message in the modal.
//  *
//  * @param {string} targetId    – ID of the item being reported (e.g. post ID or comment ID)
//  * @param {string} targetType  – A string (e.g. "post" or "comment")
//  */
// export function reportPost(targetId, targetType, parentType = "", parentId = "") {
//   // 1) Ensure user is logged in
//   if (!getState("user")) {
//     alert("You must be logged in to report content.");
//     return;
//   }
//   const userId = getState("user");

//   // 2) Prevent duplicate reporting (client‐side deduplication)
//   const storageKey = `reported:${userId}:${targetType}:${targetId}`;
//   if (localStorage.getItem(storageKey)) {
//     alert("You have already reported this item.");
//     return;
//   }

//   // 3) Build modal content (vanilla JS)
//   const content = createElement("div", { class: "vflex" }, []);

//   // 3.1) Reason label + dropdown
//   const reasonLabel = createElement("label", { for: "report-reason" }, ["Reason:"]);
//   const reasonSelect = createElement("select", { id: "report-reason" },
//     REPORT_REASONS.map(opt =>
//       createElement("option", { value: opt.value }, [opt.label])
//     )
//   );

//   // 3.2) Notes label + textarea
//   const notesLabel = createElement("label", { for: "report-notes" }, ["Notes (optional):"]);
//   const notesTextarea = createElement("textarea", {
//     id: "report-notes",
//     rows: "4",
//     placeholder: "Add any details (optional)…"
//   }, []);

//   // 3.3) Inline error/message paragraph
//   const messageP = createElement("p", {
//     id: "report-message",
//     style: "color: red; margin-top: 0.5rem; font-size: 0.9rem;"
//   }, []);

//   // 3.4) Submit + Cancel buttons
//   const submitBtn = createElement("button", { type: "button", style: "margin-right: 0.5rem;" }, ["Submit"]);
//   const cancelBtn = createElement("button", { type: "button" }, ["Cancel"]);

//   // 3.5) Put them all into `content`
//   content.append(
//     reasonLabel,
//     reasonSelect,
//     notesLabel,
//     notesTextarea,
//     messageP,
//     submitBtn,
//     cancelBtn
//   );

//   // 4) Create the modal (but don't append yet)
//   let modalEl;
//   modalEl = Modal({
//     title: "Report Content",
//     content,
//     onClose: () => {
//       // If user clicks the “X” or outside the modal
//       modalEl.remove();
//     }
//   });


//   // 6) Wire up “Cancel” to close the modal
//   cancelBtn.addEventListener("click", () => {
//     modalEl.remove();
//     document.body.style.overflow = '';
//   });

//   // 7) Wire up “Submit”
//   submitBtn.addEventListener("click", async () => {
//     const chosenReason = reasonSelect.value;
//     const notes = notesTextarea.value.trim();

//     // 7.1) Validate that a reason was chosen
//     if (!chosenReason) {
//       messageP.textContent = "Please select a reason before submitting.";
//       return;
//     }
//     messageP.textContent = "";       // clear any previous message
//     submitBtn.disabled = true;       // prevent double‐click
//     cancelBtn.disabled = true;

//     // 7.2) Prepare payload
//     const reportData = {
//       reportedBy: userId,
//       targetId,
//       targetType,
//       parentType,
//       parentId,
//       reason: chosenReason,
//       notes
//     };

//     try {
//       // 7.3) POST to /report
//       const response = await apiFetch("/report", "POST", JSON.stringify(reportData));

//       if (response.reportId) {
//         modalEl.remove();
//         // 7.4) Success: record in localStorage & show Snackbar
//         localStorage.setItem(storageKey, "true");
//         Notify("Thanks. We'll review this shortly.", { type: "success", duration: 3000, dismissible: true });
//         document.body.style.overflow = '';
//       } else {
//         // 7.5) Server returned an error
//         const errorJson = await response.json().catch(() => ({}));
//         const errMsg = errorJson.message || "Failed to submit report. Please try again.";
//         messageP.textContent = errMsg;
//         submitBtn.disabled = false;
//         cancelBtn.disabled = false;
//       }
//     } catch (networkErr) {
//       console.error("Network error submitting report:", networkErr);
//       messageP.textContent = "Network error. Please try again.";
//       submitBtn.disabled = false;
//       cancelBtn.disabled = false;
//     }
//   });
// }
