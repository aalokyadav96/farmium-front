// import { detectLanguage, applyTranslations } from "./i18n.js";
import { loadContent } from "./routes/index.js";

async function init() {
  // const lang = detectLanguage();
  // await applyTranslations(lang); // Apply translations on startup
  // await applyTranslations("hi");
  loadContent(window.location.pathname);

  // Handle browser navigation (back/forward buttons)
  window.addEventListener("popstate", () => {
    if (!document.hidden) {
      loadContent(window.location.pathname);
    }
  });

  // // Handle bfcache restores efficiently
  // document.addEventListener("visibilitychange", () => {
  //     if (document.visibilityState === "visible") {
  //         console.log("Page restored from bfcache, refreshing state");
  //         state.token = sessionStorage.getItem("token") || localStorage.getItem("token") || null;
  //     }
  // });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      console.log('This page was restored from the bfcache.');
    } else {
      console.log('This page was loaded normally.');
    }
  });

  window.addEventListener('pagehide', (event) => {
    if (event.persisted) {
      console.log('This page *might* be entering the bfcache.');
    } else {
      console.log('This page will unload normally and be discarded.');
    }
  });
}

// // if ("serviceWorker" in navigator && "PushManager" in window) {
// //   navigator.serviceWorker.register("/service-worker.js").then(async registration => {
// //     console.log("Service Worker registered:", registration);

// //     // Ask for notification permission
// //     const permission = await Notification.requestPermission();
// //     if (permission === "granted") {
// //       console.log("Notification permission granted.");
// //     } else {
// //       console.warn("Notification permission denied.");
// //     }
// //   }).catch(err => console.error("Service Worker registration failed:", err));
// // } else {
// //   console.warn("Push messaging is not supported.");
// // }
// if ("serviceWorker" in navigator) {
//   navigator.serviceWorker.getRegistrations().then(registrations => {
//     for (let registration of registrations) {
//       registration.unregister().then(() => {
//         console.log("Service Worker unregistered");
//       });
//     }
//   });
// }

init();
