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


// import "../../../css/ui/Modal.css";
// import { createElement } from "../../components/createElement.js";

// let openModals = 0;
// let bodyStyleEl = null; // Shared style element to prevent body scroll

// function addBodyOverflowHidden() {
//   if (!bodyStyleEl) {
//     bodyStyleEl = createElement("style", { id: "modal-body-style" }, [
//       document.createTextNode("body { overflow: hidden; }")
//     ]);
//     document.head.appendChild(bodyStyleEl);
//   }
// }

// export function removeBodyOverflowHidden() {
//   if (openModals === 0 && bodyStyleEl) {
//     bodyStyleEl.remove();
//     bodyStyleEl = null;
//   }
// }

// function createModalHeader(title, onClose) {
//   const heading = createElement("h3", {
//     id: `modal-title-${openModals}`
//   }, [document.createTextNode(title)]);

//   const closeButton = createElement("button", {
//     class: "modal-close",
//     "aria-label": "Close"
//   }, [document.createTextNode("×")]);

//   closeButton.addEventListener("click", onClose);

//   const header = createElement("div", { class: "modal-header" }, [
//     heading,
//     closeButton
//   ]);

//   return { header, titleId: heading.id };
// }

// function createModalBody(content) {
//   const contentNode = typeof content === "function" ? content() : content;

//   const children = [];
//   if (contentNode instanceof HTMLElement) {
//     children.push(contentNode);
//   } else if (contentNode != null) {
//     children.push(document.createTextNode(contentNode.toString()));
//   }

//   const body = createElement("div", {
//     class: "modal-body",
//     id: `modal-desc-${openModals}`
//   }, children);

//   return { body, descId: body.id };
// }

// function createModalFooter(actions) {
//   if (typeof actions !== "function") return null;

//   const content = actions();
//   const children = content instanceof HTMLElement ? [content] : [];

//   return createElement("div", { class: "modal-footer" }, children);
// }

// const Modal = ({
//   title,
//   content,
//   onClose,
//   size = "medium",
//   closeOnOverlayClick = true,
//   autofocusSelector = null,
//   returnDataOnClose = false,
//   onConfirm = null,
//   actions = null,
//   onOpen = null,
//   force = false
// }) => {
//   const overlay = createElement("div", { class: "modal-overlay" });
//   const dialog = createElement("div", {
//     class: "modal-dialog",
//     tabindex: "-1",
//     role: "dialog"
//   });

//   const modal = createElement("div", {
//     class: `modal modal--${size}`,
//     style: `z-index: ${1000 + openModals * 10};`
//   }, [overlay, dialog]);

//   addBodyOverflowHidden();
//   const previouslyFocused = document.activeElement;
//   openModals++;

//   const wrappedOnClose = (data) => {
//     if (force) return;
//     cleanup();
//     if (returnDataOnClose) onClose?.(data);
//     else onClose?.();
//   };

//   if (closeOnOverlayClick && !force) {
//     overlay.addEventListener("click", () => wrappedOnClose());
//   }

//   const { header, titleId } = createModalHeader(title, () => wrappedOnClose());
//   const { body, descId } = createModalBody(content);
//   const footer = createModalFooter(actions);

//   dialog.setAttribute("aria-modal", "true");
//   dialog.setAttribute("aria-labelledby", titleId);
//   dialog.setAttribute("aria-describedby", descId);

//   dialog.appendChild(header);
//   dialog.appendChild(body);
//   if (footer) dialog.appendChild(footer);

//   const focusableSelectors =
//     "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

//   const trapFocus = (e) => {
//     if (force && e.key === "Escape") return;
//     const focusableEls = dialog.querySelectorAll(focusableSelectors);
//     if (!focusableEls.length) return;

//     const firstEl = focusableEls[0];
//     const lastEl = focusableEls[focusableEls.length - 1];

//     if (e.key === "Tab") {
//       if (e.shiftKey && document.activeElement === firstEl) {
//         e.preventDefault();
//         lastEl.focus();
//       } else if (!e.shiftKey && document.activeElement === lastEl) {
//         e.preventDefault();
//         firstEl.focus();
//       }
//     } else if (e.key === "Escape" && !force) {
//       wrappedOnClose();
//     } else if (e.key === "Enter" && onConfirm) {
//       e.preventDefault();
//       onConfirm();
//     }
//   };

//   dialog.addEventListener("keydown", trapFocus);
//   modal.classList.add("modal--fade-in");

//   const modalContainer = document.getElementById("modalcon");
//   if (!modalContainer) throw new Error('No element with id "modalcon" found');
//   modalContainer.appendChild(modal);

//   if (onOpen) onOpen();

//   if (autofocusSelector) {
//     dialog.querySelector(autofocusSelector)?.focus();
//   } else {
//     dialog.focus();
//   }

//   function cleanup() {
//     dialog.removeEventListener("keydown", trapFocus);
//     modal.classList.remove("modal--fade-in");
//     modal.classList.add("modal--fade-out");

//     let removed = false;
//     const onRemoved = () => {
//       if (removed) return;
//       removed = true;

//       ["animationend", "transitionend"].forEach((evt) => {
//         modal.removeEventListener(evt, onRemoved);
//         dialog.removeEventListener(evt, onRemoved);
//       });

//       modal.remove();
//       openModals = Math.max(0, openModals - 1);
//       removeBodyOverflowHidden();
//       previouslyFocused?.focus?.();
//     };

//     ["animationend", "transitionend"].forEach((evt) => {
//       modal.addEventListener(evt, onRemoved, { once: true });
//       dialog.addEventListener(evt, onRemoved, { once: true });
//     });

//     const maxMS = Math.max(getMaxDurationMS(modal), getMaxDurationMS(dialog));
//     setTimeout(onRemoved, maxMS + 50);
//   }

//   function getMaxDurationMS(el) {
//     const cs = window.getComputedStyle(el);
//     const toMS = (v) => {
//       const s = (v || "").trim();
//       if (!s) return 0;
//       if (s.endsWith("ms")) return parseFloat(s) || 0;
//       if (s.endsWith("s")) return (parseFloat(s) || 0) * 1000;
//       return (parseFloat(s) || 0) * 1000;
//     };

//     const maxSum = (durStr, delayStr) => {
//       const durs = (durStr || "0s").split(",").map(toMS);
//       const delays = (delayStr || "0s").split(",").map(toMS);
//       const len = Math.max(durs.length, delays.length);
//       let max = 0;
//       for (let i = 0; i < len; i++) {
//         const d = durs[i] ?? durs[durs.length - 1] ?? 0;
//         const l = delays[i] ?? delays[delays.length - 1] ?? 0;
//         if (d + l > max) max = d + l;
//       }
//       return max;
//     };

//     return Math.max(
//       maxSum(cs.animationDuration, cs.animationDelay),
//       maxSum(cs.transitionDuration, cs.transitionDelay)
//     );
//   }

//   if (returnDataOnClose) {
//     let resolvePromise;
//     const closed = new Promise((resolve) => {
//       resolvePromise = resolve;
//     });

//     const wrappedClose = (data) => {
//       wrappedOnClose(data);
//       resolvePromise(data);
//     };

//     return { modal, close: wrappedClose, closed };
//   }

//   return modal;
// };

// export default Modal;

// // import "../../../css/ui/Modal.css";

// // let openModals = 0;
// // let bodyStyleEl = null; // Shared style element to prevent body scroll

// // function addBodyOverflowHidden() {
// //   if (!bodyStyleEl) {
// //     bodyStyleEl = document.createElement('style');
// //     bodyStyleEl.id = 'modal-body-style';
// //     bodyStyleEl.textContent = `body { overflow: hidden; }`;
// //     document.head.appendChild(bodyStyleEl);
// //   }
// // }

// // function removeBodyOverflowHidden() {
// //   if (openModals === 0 && bodyStyleEl) {
// //     bodyStyleEl.remove();
// //     bodyStyleEl = null;
// //   }
// // }

// // function createModalHeader(title, onClose) {
// //   const header = document.createElement('div');
// //   header.className = 'modal-header';

// //   const heading = document.createElement('h3');
// //   heading.textContent = title;
// //   heading.id = `modal-title-${openModals}`;
// //   header.appendChild(heading);

// //   const closeButton = document.createElement('button');
// //   closeButton.className = 'modal-close';
// //   closeButton.textContent = '×';
// //   closeButton.setAttribute('aria-label', 'Close');
// //   closeButton.addEventListener('click', onClose);
// //   header.appendChild(closeButton);

// //   return { header, titleId: heading.id };
// // }

// // function createModalBody(content) {
// //   const body = document.createElement('div');
// //   body.className = 'modal-body';

// //   const contentNode = typeof content === 'function' ? content() : content;
// //   if (contentNode instanceof HTMLElement) {
// //     body.appendChild(contentNode);
// //   } else {
// //     body.textContent = contentNode?.toString() || '';
// //   }

// //   body.id = `modal-desc-${openModals}`;
// //   return { body, descId: body.id };
// // }

// // function createModalFooter(actions) {
// //   if (typeof actions !== 'function') return null;

// //   const footer = document.createElement('div');
// //   footer.className = 'modal-footer';

// //   const content = actions();
// //   if (content instanceof HTMLElement) {
// //     footer.appendChild(content);
// //   }
// //   return footer;
// // }

// // const Modal = ({
// //   title,
// //   content,
// //   onClose,
// //   size = 'medium',
// //   closeOnOverlayClick = true,
// //   autofocusSelector = null,
// //   returnDataOnClose = false,
// //   onConfirm = null,
// //   actions = null,
// //   onOpen = null,
// //   force = false
// // }) => {
// //   const modal = document.createElement('div');
// //   modal.className = `modal modal--${size}`;
// //   modal.style.zIndex = 1000 + openModals * 10;

// //   const overlay = document.createElement('div');
// //   overlay.className = 'modal-overlay';

// //   const dialog = document.createElement('div');
// //   dialog.className = 'modal-dialog';
// //   dialog.setAttribute('tabindex', '-1');
// //   dialog.setAttribute('role', 'dialog');

// //   // Disable body scroll if first modal
// //   addBodyOverflowHidden();

// //   const previouslyFocused = document.activeElement; // Save focused element for this modal
// //   openModals++;

// //   const wrappedOnClose = (data) => {
// //     if (force) return;
// //     cleanup();
// //     if (returnDataOnClose) onClose?.(data);
// //     else onClose?.();
// //   };

// //   if (closeOnOverlayClick && !force) {
// //     overlay.addEventListener('click', () => wrappedOnClose());
// //   }

// //   const { header, titleId } = createModalHeader(title, () => wrappedOnClose());
// //   const { body, descId } = createModalBody(content);
// //   const footer = createModalFooter(actions);

// //   dialog.setAttribute('aria-modal', 'true');
// //   dialog.setAttribute('aria-labelledby', titleId);
// //   dialog.setAttribute('aria-describedby', descId);

// //   dialog.appendChild(header);
// //   dialog.appendChild(body);
// //   if (footer) dialog.appendChild(footer);

// //   modal.appendChild(overlay);
// //   modal.appendChild(dialog);

// //   const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// //   const trapFocus = (e) => {
// //     if (force && e.key === 'Escape') return;
// //     const focusableEls = dialog.querySelectorAll(focusableSelectors);
// //     if (!focusableEls.length) return;

// //     const firstEl = focusableEls[0];
// //     const lastEl = focusableEls[focusableEls.length - 1];

// //     if (e.key === 'Tab') {
// //       if (e.shiftKey && document.activeElement === firstEl) {
// //         e.preventDefault();
// //         lastEl.focus();
// //       } else if (!e.shiftKey && document.activeElement === lastEl) {
// //         e.preventDefault();
// //         firstEl.focus();
// //       }
// //     } else if (e.key === 'Escape' && !force) {
// //       wrappedOnClose();
// //     } else if (e.key === 'Enter' && onConfirm) {
// //       e.preventDefault();
// //       onConfirm();
// //     }
// //   };

// //   dialog.addEventListener('keydown', trapFocus);
// //   modal.classList.add('modal--fade-in');

// //   const modalContainer = document.getElementById('modalcon');
// //   if (!modalContainer) throw new Error('No element with id "modalcon" found');
// //   modalContainer.appendChild(modal);

// //   if (onOpen) onOpen();

// //   if (autofocusSelector) {
// //     const el = dialog.querySelector(autofocusSelector);
// //     el?.focus();
// //   } else {
// //     dialog.focus();
// //   }

// //   // function cleanup() {
// //   //   dialog.removeEventListener('keydown', trapFocus);
// //   //   modal.classList.remove('modal--fade-in');
// //   //   modal.classList.add('modal--fade-out');

// //   //   modal.addEventListener('animationend', () => {
// //   //     modal.remove();
// //   //   });

// //   //   openModals = Math.max(0, openModals - 1);

// //   //   // Only remove body overflow when last modal is closed
// //   //   removeBodyOverflowHidden();

// //   //   // Restore focus only for this modal
// //   //   previouslyFocused?.focus?.();
// //   // }

// //   function cleanup() {
// //     dialog.removeEventListener('keydown', trapFocus);
// //     modal.classList.remove('modal--fade-in');
// //     modal.classList.add('modal--fade-out');
  
// //     let removed = false;
  
// //     const onRemoved = () => {
// //       if (removed) return;
// //       removed = true;
  
// //       // Detach listeners just in case
// //       ['animationend', 'transitionend'].forEach(evt => {
// //         modal.removeEventListener(evt, onRemoved);
// //         dialog.removeEventListener(evt, onRemoved);
// //       });
  
// //       if (modal.parentNode) modal.parentNode.removeChild(modal);
  
// //       openModals = Math.max(0, openModals - 1);
// //       removeBodyOverflowHidden();
// //       previouslyFocused?.focus?.();
// //     };
  
// //     // Listen on BOTH modal and dialog (transitionend doesn't bubble)
// //     ['animationend', 'transitionend'].forEach(evt => {
// //       modal.addEventListener(evt, onRemoved, { once: true });
// //       dialog.addEventListener(evt, onRemoved, { once: true });
// //     });
  
// //     // Fallback: compute the longest anim/transition and force-remove after it
// //     const maxMS = Math.max(getMaxDurationMS(modal), getMaxDurationMS(dialog));
// //     setTimeout(onRemoved, maxMS + 50); // small buffer
// //   }
  
// //   // Helper to compute the max total duration (duration + delay) in ms
// //   function getMaxDurationMS(el) {
// //     const cs = window.getComputedStyle(el);
  
// //     const toMS = (v) => {
// //       const s = (v || '').trim();
// //       if (!s) return 0;
// //       if (s.endsWith('ms')) return parseFloat(s) || 0;
// //       if (s.endsWith('s')) return (parseFloat(s) || 0) * 1000;
// //       return (parseFloat(s) || 0) * 1000;
// //     };
  
// //     const maxSum = (durStr, delayStr) => {
// //       const durs = (durStr || '0s').split(',').map(toMS);
// //       const delays = (delayStr || '0s').split(',').map(toMS);
// //       const len = Math.max(durs.length, delays.length);
// //       let max = 0;
// //       for (let i = 0; i < len; i++) {
// //         const d = durs[i] ?? durs[durs.length - 1] ?? 0;
// //         const l = delays[i] ?? delays[delays.length - 1] ?? 0;
// //         if (d + l > max) max = d + l;
// //       }
// //       return max;
// //     };
  
// //     const anim = maxSum(cs.animationDuration, cs.animationDelay);
// //     const trans = maxSum(cs.transitionDuration, cs.transitionDelay);
// //     return Math.max(anim, trans);
// //   }
  
  

// //   if (returnDataOnClose) {
// //     let resolvePromise;
// //     const closed = new Promise((resolve) => {
// //       resolvePromise = resolve;
// //     });

// //     const wrappedClose = (data) => {
// //       wrappedOnClose(data);
// //       resolvePromise(data);
// //     };

// //     return {
// //       modal,
// //       close: wrappedClose,
// //       closed,
// //     };
// //   }

// //   return modal;
// // };

// // export default Modal;
