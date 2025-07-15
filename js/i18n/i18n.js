import { apiFetch } from "../api/api.js";
import { setState, getState } from "../state/state.js";

let translations = {};
let currentLang = "en";

/**
 * Detect preferred language
 */
function detectLanguage() {
  const stored = localStorage.getItem("lang") || "en";
  if (stored) return stored;

  const browserLang = navigator.language?.split("-")[0];
  return browserLang === "es" ? "es" : "en";
}

/**
 * Load translation file
 */
async function loadTranslations(lang = "en") {
  const res = await fetch(`/static/i18n/${lang}.json`);
  translations = await res.json();
  currentLang = lang;
  localStorage.setItem("lang", lang);
  setState("lang", lang);
}

/**
 * Translate a key
 */
function t(key) {
  return translations[key] || key;
}

/**
 * Manually switch language
 */
async function setLanguage(lang) {
  await loadTranslations(lang);
  // Optionally trigger full re-render
  location.reload();
}

export {
  detectLanguage,
  loadTranslations,
  setLanguage,
  t
};


/*
import { t } from "../../i18n/i18n.js";

const title = createElement("h1", {}, [t("artist.overview")]);


*/

/*

5. Optional: Add a Language Switcher

Example in your header:

function createLanguageSelector() {
  return createElement("select", {
    onchange: async (e) => {
      await setLanguage(e.target.value);
    }
  }, [
    createElement("option", { value: "en" }, ["English"]),
    createElement("option", { value: "es" }, ["Español"]),
  ]);
}

Then add it inside your createHeader(isLoggedIn):

header.appendChild(createLanguageSelector());


*/