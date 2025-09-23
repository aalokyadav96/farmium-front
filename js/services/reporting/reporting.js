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

