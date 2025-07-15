import { loadContent } from "./routes/index.js";
import { setState } from "./state/state.js";
import { detectLanguage, loadTranslations } from "./i18n/i18n.js";

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

init();
