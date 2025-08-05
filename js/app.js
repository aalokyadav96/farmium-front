import { loadContent } from "./routes/index.js";
import { setState } from "./state/state.js";
import { detectLanguage, loadTranslations } from "./i18n/i18n.js";

// --- Register Service Worker ---
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker.register("/service-worker.js")
//       .then((reg) => console.log("🔌 Service worker registered:", reg.scope))
//       .catch((err) => console.error("❌ Service worker registration failed:", err));
//   });
// }

// --- Environment Profiling ---
(async function profileEnvironment() {
  const measurePerformance = async () => {
    const t0 = performance.now();
    for (let i = 0; i < 100000; i++) Math.sqrt(i);
    const t1 = performance.now();
    return Math.max(100 - (t1 - t0), 0);
  };

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const environment = {
    deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    browser: isSafari ? "safari" :
      navigator.userAgent.includes("Firefox") ? "firefox" :
      navigator.userAgent.includes("Chrome") ? "chrome" : "unknown",
    networkSpeed: navigator.connection?.effectiveType || "unknown",
    theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    online: navigator.onLine,
    performanceScore: await measurePerformance()
  };

  console.log("🌐 Environment profile:", environment);
  window.__env = environment;

  // Send telemetry
  navigator.sendBeacon?.("http://localhost:3000/api/v1/telemetry/env", JSON.stringify({
    event: "env-profile",
    ts: Date.now(),
    environment
  }));

  // Set UI tier if not already stored
  let uiTier = localStorage.getItem("ui-tier-v1");
  if (!uiTier) {
    if (environment.deviceType === "mobile" || environment.networkSpeed.includes("2g")) {
      uiTier = "light";
    } else if (environment.performanceScore < 50) {
      uiTier = "medium";
    } else {
      uiTier = "full";
    }
    localStorage.setItem("ui-tier-v1", uiTier);
  }
})();

// --- Offline Banner ---
function showOfflineBanner() {
  if (document.getElementById("offline-banner")) return;
  const banner = document.createElement("div");
  banner.id = "offline-banner";
  Object.assign(banner.style, {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    background: "#b00020",
    color: "#fff",
    textAlign: "center",
    padding: "0.5rem",
    zIndex: "9999",
    fontSize: "0.9rem"
  });
  banner.textContent = "📴 You're offline. Some features may not work.";
  document.body.appendChild(banner);
}

function removeOfflineBanner() {
  const banner = document.getElementById("offline-banner");
  if (banner) banner.remove();
}

window.addEventListener("offline", showOfflineBanner);
window.addEventListener("online", removeOfflineBanner);

// --- App Init ---
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

    if (!navigator.onLine) {
      showOfflineBanner();
      console.warn("📴 Offline mode: degraded functionality expected.");
    }
  } catch (error) {
    console.error("App init failed:", error);
  }
}

// --- PWA Install Prompt ---
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

// import { loadContent } from "./routes/index.js";
// import { setState } from "./state/state.js";
// import { detectLanguage, loadTranslations } from "./i18n/i18n.js";

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

// let deferredPrompt = null;

// window.addEventListener("beforeinstallprompt", (e) => {
//   e.preventDefault();
//   deferredPrompt = e;

//   const installBtn = document.getElementById("install-pwa");
//   if (installBtn) {
//     installBtn.style.display = "block";
//     installBtn.addEventListener("click", () => {
//       installBtn.style.display = "none";
//       deferredPrompt.prompt();
//       deferredPrompt.userChoice.then((choice) => {
//         if (choice.outcome === "accepted") {
//           console.log("PWA installed");
//         }
//         deferredPrompt = null;
//       });
//     }, { once: true });
//   }
// });

// init();
