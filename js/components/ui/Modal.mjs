import "../../../css/ui/Modal.css";
import { createElement } from "../../components/createElement.js";

let openModals = 0;
let bodyStyleEl = null;

function lockBodyScroll() {
  if (!bodyStyleEl) {
    bodyStyleEl = createElement("style", { id: "modal-body-style" }, [
      document.createTextNode("body { overflow: hidden !important; }")
    ]);
    document.head.appendChild(bodyStyleEl);
  }
}

function unlockBodyScroll() {
  if (openModals === 0 && bodyStyleEl) {
    bodyStyleEl.remove();
    bodyStyleEl = null;
  }
}

function makeHeader(title, onClose, uid) {
  const heading = createElement("h3", { id: `modal-title-${uid}` }, [title]);
  const closeBtn = createElement("button", { class: "modal-close", "aria-label": "Close" }, ["×"]);
  closeBtn.addEventListener("click", onClose);
  return { header: createElement("div", { class: "modal-header" }, [heading, closeBtn]), titleId: heading.id };
}

function makeBody(content, uid) {
  const node = typeof content === "function" ? content() : content;
  const children = node instanceof HTMLElement ? [node] : [document.createTextNode(node == null ? "" : String(node))];
  const body = createElement("div", { class: "modal-body", id: `modal-desc-${uid}` }, children);
  return { body, descId: body.id };
}

function simpleDurationMs(el) {
  const cs = window.getComputedStyle(el);
  const toMs = v => {
    if (!v) return 0;
    v = v.split(",")[0].trim();
    if (v.endsWith("ms")) return parseFloat(v) || 0;
    if (v.endsWith("s")) return (parseFloat(v) || 0) * 1000;
    return parseFloat(v) || 0;
  };
  const dur = toMs(cs.animationDuration);
  const delay = toMs(cs.animationDelay);
  const tdur = toMs(cs.transitionDuration);
  const tdelay = toMs(cs.transitionDelay);
  return Math.max(dur + delay, tdur + tdelay, 0);
}

const Modal = ({
  title = "",
  content = "",
  onClose = null,
  size = "medium",
  closeOnOverlayClick = true,
  autofocusSelector = null,
  returnDataOnClose = false,
  onConfirm = null,
  actions = null,
  onOpen = null,
  force = false
} = {}) => {
  const uid = ++openModals;
  const overlay = createElement("div", { class: "modal-overlay" });
  const dialog = createElement("div", { class: "modal-dialog", tabindex: "-1", role: "dialog" });
  const modal = createElement("div", { class: `modal modal--${size}`, style: `z-index:${1000 + uid * 10};` }, [overlay, dialog]);

  // Lock scroll & remember focus
  lockBodyScroll();
  const previouslyFocused = document.activeElement;

  const wrappedOnClose = (data) => {
    if (force) return;
    cleanup();
    if (returnDataOnClose) onClose?.(data);
    else onClose?.();
  };

  if (closeOnOverlayClick && !force) {
    overlay.addEventListener("click", () => wrappedOnClose());
  }

  const { header, titleId } = makeHeader(title, () => wrappedOnClose(), uid);
  const { body, descId } = makeBody(content, uid);

  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", titleId);
  dialog.setAttribute("aria-describedby", descId);

  dialog.appendChild(header);
  dialog.appendChild(body);

  if (typeof actions === "function") {
    const act = actions();
    if (act instanceof HTMLElement) {
      const footer = createElement("div", { class: "modal-footer" }, [act]);
      dialog.appendChild(footer);
    }
  }

  // Focus trap: keep it small and reliable
  const focusableSel = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
  function trap(e) {
    const nodes = Array.from(dialog.querySelectorAll(focusableSel)).filter(n => !n.hasAttribute("disabled"));
    if (!nodes.length) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    } else if (e.key === "Escape" && !force) {
      wrappedOnClose();
    } else if (e.key === "Enter" && onConfirm) {
      e.preventDefault();
      onConfirm();
    }
  }
  dialog.addEventListener("keydown", trap);

  // appear
  modal.classList.add("modal--fade-in");

  const container = document.getElementById("modalcon");
  if (!container) {
    // rollback state if no container found
    dialog.removeEventListener("keydown", trap);
    unlockBodyScroll();
    openModals = Math.max(0, openModals - 1);
    throw new Error('No element with id "modalcon" found');
  }
  container.appendChild(modal);

  if (onOpen) onOpen();

  // autofocus
  setTimeout(() => {
    if (autofocusSelector) dialog.querySelector(autofocusSelector)?.focus();
    else dialog.focus();
  }, 0);

  function cleanup() {
    dialog.removeEventListener("keydown", trap);
    modal.classList.remove("modal--fade-in");
    modal.classList.add("modal--fade-out");

    // find reasonable timeout based on CSS; fallback 300ms
    const ms = Math.max(simpleDurationMs(modal), simpleDurationMs(dialog), 300);
    setTimeout(() => {
      modal.remove();
      openModals = Math.max(0, openModals - 1);
      unlockBodyScroll();
      previouslyFocused?.focus?.();
    }, ms + 40);
  }

  // returnDataOnClose support (promise)
  if (returnDataOnClose) {
    let resolve;
    const closed = new Promise(r => (resolve = r));
    const wrappedClose = (data) => {
      wrappedOnClose(data);
      resolve(data);
    };
    return { modal, close: wrappedClose, closed };
  }

  return modal;
};

export default Modal;

