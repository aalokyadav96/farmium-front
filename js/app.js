import { loadContent } from "./routes/index.js";
import { setState } from "./state/state.js";
import { detectLanguage, loadTranslations } from "./i18n/i18n.js";

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker.register("/service-worker.js")
//       .then((reg) => console.log("🔌 Service worker registered:", reg.scope))
//       .catch((err) => console.error("❌ Service worker registration failed:", err));
//   });
// }

async function init() {
  try {
    const lang = detectLanguage();
    await loadTranslations(lang);
    await loadContent(window.location.pathname);

    window.addEventListener("popstate", async () => {
      if (!document.hidden) {
        await loadContent(window.location.pathname);
      }
    });

    window.addEventListener("pageshow", async (event) => {
      if (event.persisted) {
        console.log("Restored from bfcache");
        const token = sessionStorage.getItem("token") || localStorage.getItem("token") || null;
        setState("token", token);
        await loadContent(window.location.pathname);
      }
    });

    window.addEventListener("pagehide", (event) => {
      if (event.persisted) {
        console.log("Page *may* be cached by bfcache.");
      } else {
        console.log("Page will unload normally.");
      }
    });

  } catch (error) {
    console.error("App init failed:", error);
  }
}

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installBtn = document.getElementById("install-pwa");
  if (installBtn) {
    installBtn.style.display = "block";
    installBtn.addEventListener("click", () => {
      installBtn.style.display = "none";
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === "accepted") {
          console.log("PWA installed");
        }
        deferredPrompt = null;
      });
    }, { once: true });
  }
});

init();

// // import "./bootloader.js";
// import { loadContent } from "./routes/index.js";
// import { setState } from "./state/state.js";
// import { detectLanguage, loadTranslations } from "./i18n/i18n.js";

// // const ENABLE_REFLOW_MONITOR = location.hostname === "localhost"; // or use: import.meta.env.DEV (if using bundler)

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker.register("/service-worker.js")
//       .then((reg) => console.log("🔌 Service worker registered:", reg.scope))
//       .catch((err) => console.error("❌ Service worker registration failed:", err));
//   });
// }
// async function init() {
//   try {
//     const lang = detectLanguage();
//     await loadTranslations(lang);

//     await loadContent(window.location.pathname);

//     // if (ENABLE_REFLOW_MONITOR) {
//     //   initReflowMonitor(); // Start after first render
//     // }

//     window.addEventListener("popstate", async () => {
//       if (!document.hidden) {
//         await loadContent(window.location.pathname);
//       }
//     });

//     window.addEventListener("pageshow", async (event) => {
//       if (event.persisted) {
//         console.log("Restored from bfcache");
//         const token = sessionStorage.getItem("token") || localStorage.getItem("token") || null;
//         setState("token", token);
//         await loadContent(window.location.pathname);
//       }
//     });

//     window.addEventListener("pagehide", (event) => {
//       if (event.persisted) {
//         console.log("Page *may* be cached by bfcache.");
//       } else {
//         console.log("Page will unload normally.");
//       }
//     });

//   } catch (error) {
//     console.error("App init failed:", error);
//   }
// }

// let deferredPrompt;

// window.addEventListener("beforeinstallprompt", (e) => {
//   e.preventDefault();
//   deferredPrompt = e;

//   // Show custom install button or UI
//   const installBtn = document.getElementById("install-pwa");
//   if (installBtn) installBtn.style.display = "block";

//   installBtn.addEventListener("click", () => {
//     deferredPrompt.prompt();
//     deferredPrompt.userChoice.then((choice) => {
//       if (choice.outcome === "accepted") {
//         console.log("PWA installed");
//       }
//       deferredPrompt = null;
//     });
//   });
// });

// // function initReflowMonitor(target = document.getElementById("content")) {
// //   const observeMutations = (el) => {
// //     const mo = new MutationObserver((mutations) => {
// //       console.log("🧠 DOM mutation detected", mutations);
// //     });
// //     mo.observe(el, { attributes: true, childList: true, subtree: true });
// //   };

// //   const watchElementLayout = (el) => {
// //     const ro = new ResizeObserver(entries => {
// //       for (const entry of entries) {
// //         console.warn("📐 Layout changed:", entry.target);
// //       }
// //     });
// //     ro.observe(el);
// //   };

// //   const perfObserver = new PerformanceObserver((list) => {
// //     list.getEntries().forEach(entry => {
// //       if (entry.entryType === "paint") {
// //         console.info("🎨 Paint event:", entry.name, entry.startTime);
// //       }
// //     });
// //   });

// //   try {
// //     perfObserver.observe({ type: "paint", buffered: true });
// //   } catch (e) {
// //     console.warn("PerformanceObserver not supported:", e);
// //   }

// //   if (target) {
// //     observeMutations(target);
// //     watchElementLayout(target);
// //     console.log("✅ Reflow monitor initialized on:", target);
// //   } else {
// //     console.warn("❌ Reflow monitor target not found");
// //   }
// // }

// init();
