import "../../../css/ui/Modal.css";

let openModals = 0;

function createModalHeader(title, onClose) {
  const header = document.createElement('div');
  header.className = 'modal-header';

  const heading = document.createElement('h3');
  heading.textContent = title;
  heading.id = `modal-title-${openModals}`;
  header.appendChild(heading);

  const closeButton = document.createElement('button');
  closeButton.className = 'modal-close';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.addEventListener('click', onClose);
  header.appendChild(closeButton);

  return { header, titleId: heading.id };
}

function createModalBody(content) {
  const body = document.createElement('div');
  body.className = 'modal-body';

  const contentNode = typeof content === 'function' ? content() : content;
  if (contentNode instanceof HTMLElement) {
    body.appendChild(contentNode);
  } else {
    body.textContent = contentNode?.toString() || '';
  }

  body.id = `modal-desc-${openModals}`;
  return { body, descId: body.id };
}

function createModalFooter(actions) {
  if (typeof actions !== 'function') return null;

  const footer = document.createElement('div');
  footer.className = 'modal-footer';

  const content = actions();
  if (content instanceof HTMLElement) {
    footer.appendChild(content);
  }
  return footer;
}

const Modal = ({
  title,
  content,
  onClose,
  size = 'medium',
  closeOnOverlayClick = true,
  autofocusSelector = null,
  returnDataOnClose = false,
  onConfirm = null,
  actions = null,
  onOpen = null,
  force = false
}) => {
  const modal = document.createElement('div');
  modal.className = `modal modal--${size}`;
  modal.style.zIndex = 1000 + openModals * 10;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';
  dialog.setAttribute('tabindex', '-1');
  dialog.setAttribute('role', 'dialog');

  const wrappedOnClose = (data) => {
    if (force) return;
    cleanup();
    if (returnDataOnClose) onClose?.(data);
    else onClose?.();
  };

  if (closeOnOverlayClick && !force) {
    overlay.addEventListener('click', () => wrappedOnClose());
  }

  const { header, titleId } = createModalHeader(title, () => wrappedOnClose());
  const { body, descId } = createModalBody(content);
  const footer = createModalFooter(actions);

  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.setAttribute('aria-describedby', descId);

  dialog.appendChild(header);
  dialog.appendChild(body);
  if (footer) dialog.appendChild(footer);

  modal.appendChild(overlay);
  modal.appendChild(dialog);

  const previouslyFocused = document.activeElement;

  openModals++;
  if (openModals === 1) {
    document.body.style.overflow = 'hidden';
  }

  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const trapFocus = (e) => {
    if (force && e.key === 'Escape') return;
    const focusableEls = dialog.querySelectorAll(focusableSelectors);
    if (!focusableEls.length) return;

    const firstEl = focusableEls[0];
    const lastEl = focusableEls[focusableEls.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    } else if (e.key === 'Escape' && !force) {
      wrappedOnClose();
    } else if (e.key === 'Enter' && onConfirm) {
      e.preventDefault();
      onConfirm();
    }
  };

  dialog.addEventListener('keydown', trapFocus);

  modal.classList.add('modal--fade-in');
  document.getElementById('app').appendChild(modal);

  if (onOpen) onOpen();

  if (autofocusSelector) {
    const el = dialog.querySelector(autofocusSelector);
    el?.focus();
  } else {
    dialog.focus();
  }

  function cleanup() {
    dialog.removeEventListener('keydown', trapFocus);
    modal.classList.remove('modal--fade-in');
    modal.classList.add('modal--fade-out');

    modal.addEventListener('animationend', () => {
      modal.remove();
    });

    openModals = Math.max(0, openModals - 1);
    if (openModals === 0) {
      document.body.style.overflow = '';
    }

    previouslyFocused?.focus?.();
  }

  if (returnDataOnClose) {
    let resolvePromise;
    const closed = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const wrappedClose = (data) => {
      wrappedOnClose(data);
      resolvePromise(data);
    };

    return {
      modal,
      close: wrappedClose,
      closed,
    };
  }

  return modal;
};

export default Modal;


/*
// You can now use actions for buttons like:
actions: () => {
  const btn = document.createElement('button');
  btn.textContent = "Go to Cart";
  btn.onclick = () => {
    modal.close();
    navigate("/cart");
  };
  return btn;
}

*/


// import "../../../css/ui/Modal.css";

// let openModals = 0; // Track open modals for scroll lock and stacking

// const Modal = ({
//   title,
//   content,
//   onClose,
//   size = 'medium',            // 'small', 'medium', 'large'
//   closeOnOverlayClick = true,
//   autofocusSelector = null,   // CSS selector to autofocus inside modal
//   returnDataOnClose = false,  // If true, onClose can receive data
//   onConfirm = null,           // callback for confirm action (Enter key)
// }) => {
//   const modal = document.createElement('div');
//   modal.className = `modal modal--${size}`;
//   modal.style.zIndex = 1000 + openModals * 10;

//   // Overlay
//   const overlay = document.createElement('div');
//   overlay.className = 'modal-overlay';

//   // If overlay click allowed, attach handler
//   if (closeOnOverlayClick) {
//     overlay.addEventListener('click', wrappedOnClose);
//   }

//   // Dialog
//   const dialog = document.createElement('div');
//   dialog.className = 'modal-dialog';
//   dialog.setAttribute('tabindex', '-1');
//   dialog.setAttribute('role', 'dialog');
//   dialog.setAttribute('aria-modal', 'true');
//   dialog.setAttribute('aria-label', title);

//   // Header
//   const header = document.createElement('div');
//   header.className = 'modal-header';

//   const heading = document.createElement('h3');
//   heading.textContent = title;
//   heading.id = `modal-title-${openModals}`;
//   header.appendChild(heading);

//   // Close Button
//   const closeButton = document.createElement('button');
//   closeButton.className = 'modal-close';
//   closeButton.textContent = '×';
//   closeButton.setAttribute('aria-label', 'Close');
//   closeButton.addEventListener('click', wrappedOnClose);
//   header.appendChild(closeButton);

//   // Body
//   const body = document.createElement('div');
//   body.className = 'modal-body';
//   const contentNode = (typeof content === 'function') ? content() : content;
//   if (contentNode instanceof HTMLElement) {
//     body.appendChild(contentNode);
//   } else {
//     // Fallback: treat as text or node-like string (avoid innerHTML)
//     body.textContent = contentNode?.toString() || '';
//   }
//   body.id = `modal-desc-${openModals}`;

//   // Associate body with dialog for screen readers
//   dialog.setAttribute('aria-describedby', body.id);

//   // Assemble dialog
//   dialog.appendChild(header);
//   dialog.appendChild(body);

//   // Assemble modal
//   modal.appendChild(overlay);
//   modal.appendChild(dialog);

//   // Store element that triggered modal for focus return
//   const previouslyFocused = document.activeElement;

//   // Scroll lock: increase count and apply lock if first modal
//   openModals++;
//   if (openModals === 1) {
//     document.body.style.overflow = 'hidden';
//   }

//   // Focus trap selectors
//   const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

//   // Trap focus inside modal dialog
//   const trapFocus = (e) => {
//     const focusableEls = dialog.querySelectorAll(focusableSelectors);
//     if (!focusableEls.length) return;

//     const firstEl = focusableEls[0];
//     const lastEl = focusableEls[focusableEls.length - 1];

//     if (e.key === 'Tab') {
//       if (e.shiftKey) {
//         if (document.activeElement === firstEl) {
//           e.preventDefault();
//           lastEl.focus();
//         }
//       } else {
//         if (document.activeElement === lastEl) {
//           e.preventDefault();
//           firstEl.focus();
//         }
//       }
//     } else if (e.key === 'Escape') {
//       wrappedOnClose();
//     } else if (e.key === 'Enter' && onConfirm) {
//       e.preventDefault();
//       onConfirm();
//     }
//   };

//   dialog.addEventListener('keydown', trapFocus);

//   // Animation: Add fade-in class
//   modal.classList.add('modal--fade-in');

//   // Append modal to #app
//   document.getElementById('app').appendChild(modal);

//   // Autofocus logic
//   if (autofocusSelector) {
//     const el = dialog.querySelector(autofocusSelector);
//     if (el) el.focus();
//     else dialog.focus();
//   } else {
//     dialog.focus();
//   }

//   // Cleanup function on close
//   function cleanup() {
//     dialog.removeEventListener('keydown', trapFocus);
//     modal.classList.remove('modal--fade-in');
//     modal.classList.add('modal--fade-out');

//     // Wait for fade-out animation to finish before removing modal
//     modal.addEventListener('animationend', () => {
//       if (modal.parentNode) modal.parentNode.removeChild(modal);
//     });

//     // Scroll unlock management
//     openModals = Math.max(0, openModals - 1);
//     if (openModals === 0) {
//       document.body.style.overflow = '';
//     }

//     // Return focus to previously focused element
//     if (previouslyFocused && previouslyFocused.focus) {
//       previouslyFocused.focus();
//     }
//   }

//   // Wrapper to handle optional return data on close
//   function wrappedOnClose(data) {
//     cleanup();
//     if (returnDataOnClose) {
//       onClose(data);
//     } else {
//       onClose();
//     }
//   }

//   // Return an object with modal element and a way to close programmatically + optional return data promise
//   if (returnDataOnClose) {
//     // Create a Promise that resolves on close with optional data
//     let resolvePromise;
//     const closePromise = new Promise((resolve) => {
//       resolvePromise = resolve;
//     });

//     const wrappedClose = (data) => {
//       wrappedOnClose(data);
//       resolvePromise(data);
//     };

//     // Override close handlers to use wrappedClose
//     closeButton.onclick = () => wrappedClose();
//     overlay.onclick = closeOnOverlayClick ? () => wrappedClose() : null;

//     return {
//       modal,
//       close: wrappedClose,
//       closed: closePromise,
//     };
//   }

//   return modal;
// };

// export default Modal;

// /******Usage Example******* */

// // // Current style unchanged:
// // const modal = Modal({
// //   title: "Add Ticket",
// //   content: form,
// //   onClose: () => modal.remove()
// // });

// // // With data return and async close:
// // const { modal, close, closed } = Modal({
// //   title: "Confirm Action",
// //   content: confirmContent,
// //   onClose: (result) => console.log('Closed with:', result),
// //   returnDataOnClose: true,
// //   onConfirm: () => close(true) // example confirm closes modal with data
// // });

// // // Await user response if needed
// // closed.then(data => console.log('Modal closed with:', data));

// /********Usage Example end********* */

// // import "../../../css/ui/Modal.css";

// // const Modal = ({ title, content, onClose }) => {
// //   const modal = document.createElement('div');
// //   modal.className = 'modal';

// //   const overlay = document.createElement('div');
// //   overlay.className = 'modal-overlay';
// //   overlay.addEventListener('click', onClose);

// //   const dialog = document.createElement('div');
// //   dialog.className = 'modal-dialog';
// //   dialog.setAttribute('tabindex', '-1');
// //   dialog.setAttribute('role', 'dialog');
// //   dialog.setAttribute('aria-modal', 'true');
// //   dialog.setAttribute('aria-label', title);

// //   const header = document.createElement('div');
// //   header.className = 'modal-header';

// //   const heading = document.createElement('h3');
// //   heading.textContent = title;
// //   header.appendChild(heading);

// //   const closeButton = document.createElement('button');
// //   closeButton.className = 'modal-close';
// //   closeButton.textContent = '×';
// //   closeButton.setAttribute('aria-label', 'Close');
// //   closeButton.addEventListener('click', onClose);
// //   header.appendChild(closeButton);

// //   const body = document.createElement('div');
// //   body.className = 'modal-body';
// //   body.appendChild(content);

// //   dialog.appendChild(header);
// //   dialog.appendChild(body);

// //   modal.appendChild(overlay);
// //   modal.appendChild(dialog);

// //   // Prevent background scroll
// //   // document.body.style.overflow = 'hidden';

// //   // Focus trap support
// //   const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
// //   const trapFocus = (e) => {
// //     const focusableEls = dialog.querySelectorAll(focusableSelectors);
// //     const firstEl = focusableEls[0];
// //     const lastEl = focusableEls[focusableEls.length - 1];

// //     if (e.key === 'Tab') {
// //       if (e.shiftKey) {
// //         // Shift + Tab
// //         if (document.activeElement === firstEl) {
// //           e.preventDefault();
// //           lastEl.focus();
// //         }
// //       } else {
// //         // Tab
// //         if (document.activeElement === lastEl) {
// //           e.preventDefault();
// //           firstEl.focus();
// //         }
// //       }
// //     } else if (e.key === 'Escape') {
// //       onClose(); // Optional: close on ESC
// //     }
// //   };

// //   dialog.addEventListener('keydown', trapFocus);

// //   document.getElementById('app').appendChild(modal);

// //   // Autofocus the dialog
// //   dialog.focus();

// //   // Cleanup helper
// //   const cleanup = () => {
// //     document.body.style.overflow = '';
// //     dialog.removeEventListener('keydown', trapFocus);
// //   };

// //   // Attach cleanup on close
// //   const wrappedOnClose = () => {
// //     cleanup();
// //     onClose();
// //   };

// //   // Replace original listeners with wrapped version
// //   overlay.removeEventListener('click', onClose);
// //   overlay.addEventListener('click', wrappedOnClose);

// //   closeButton.removeEventListener('click', onClose);
// //   closeButton.addEventListener('click', wrappedOnClose);

// //   return modal;
// // };

// // export default Modal;
