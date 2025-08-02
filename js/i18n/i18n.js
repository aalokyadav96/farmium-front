// let translations = {};
// let currentLang = "en";

// const SUPPORTED_LANGS = ["en", "jp"];

// export function detectLanguage() {
//   return detectBrowserLanguage();
//   // const saved = localStorage.getItem("lang");
//   // if (saved) return saved;
//   // return navigator.language.startsWith("ja") ? "jp" : "en";
// }

// /**
//  * Detect browser language, fallback to "en"
//  */
// function detectBrowserLanguage() {
//   const lang = navigator.language.toLowerCase();
//   if (lang.startsWith("ja")) return "jp";
//   return "en";
// }

// /**
//  * Loads and activates the given language
//  */
// export async function setLanguage(lang) {
//   if (!SUPPORTED_LANGS.includes(lang)) lang = "en";

//   try {
//     // const module = await import(`./static/i18n/${lang}.json`, { assert: { type: "json" } });
//     const module = await fetch(`/static/i18n/${lang}.json`);
//     translations = module.default || module;
//     currentLang = lang;
//     localStorage.setItem("lang", lang);
//   } catch (err) {
//     console.error(`Failed to load language "${lang}"`, err);
//     translations = {};
//     currentLang = "en";
//   }
// }

// /**
//  * Use saved or detected language
//  */
// export async function loadTranslations() {
//   const savedLang = localStorage.getItem("lang");
//   const lang = savedLang || detectBrowserLanguage();
//   await setLanguage(lang);
// }

// /**
//  * Translate a string with optional interpolation and pluralization
//  */
// export function t(key, vars = {}, fallback = "") {
//   const count = vars.count;
//   let template = translations[key];

//   if (typeof count === "number") {
//     const pluralKey = `${key}.${count === 1 ? "one" : "other"}`;
//     template = translations[pluralKey] || template;
//   }

//   if (!template) template = fallback || key;

//   return template.replace(/\{(\w+)\}/g, (_, k) =>
//     Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : `{${k}}`
//   );
// }

// export function getCurrentLanguage() {
//   return currentLang;
// }

import { setState, getState } from "../state/state.js";

let translations = {};
let currentLang = "en";

export async function setLanguage(lang) {
  try {
    // const module = await import(`./lang/${lang}.json`, { assert: { type: "json" } });
    const module = await fetch(`/static/i18n/${lang}.json`);
    translations = module.default || module;
    currentLang = lang;
    localStorage.setItem("lang", lang);
  } catch (err) {
    console.error(`Failed to load language "${lang}"`, err);
    translations = {};
  }
}

export function detectLanguage() {
  const saved = localStorage.getItem("lang");
  if (saved) return saved;
  return navigator.language.startsWith("ja") ? "jp" : "en";
}

/**
 * Translate key with optional variables and fallback
 * Supports:
 * - fallback key if missing
 * - pluralization (key.one / key.other)
 * - {var} interpolation
 */
export function t(key, vars = {}, fallback = "") {
  const count = vars.count;
  let template = translations[key];

  // Pluralization: prefer "key.one" or "key.other"
  if (typeof count === "number") {
    const pluralKey = `${key}.${count === 1 ? "one" : "other"}`;
    template = translations[pluralKey] || template;
  }

  if (!template) template = fallback || key;

  // Interpolation
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : `{${k}}`
  );
}

export function getCurrentLanguage() {
  return currentLang;
}

/**
 * Load and store translations into memory.
 */
export async function loadTranslations(lang = "en") {
  try {
    const res = await fetch(`/static/i18n/${lang}.json`);
    translations = await res.json();
    currentLang = lang;
    localStorage.setItem("lang", lang);
    setState("lang", lang);
  } catch (err) {
    console.error("Failed to load translations for", lang, err);
    translations = {}; // fallback to empty
  }
}

// // import { setState, getState } from "../state/state.js";

// // let translations = {};
// // let currentLang = "en";

// // /**
// //  * Detect preferred language from localStorage or browser settings.
// //  */
// // function detectLanguage() {
// //   const stored = localStorage.getItem("lang");
// //   if (stored) return stored;

// //   const browserLang = navigator.language?.split("-")[0];
// //   return browserLang === "jp" ? "jp" : "en";
// // }

// // /**
// //  * Load and store translations into memory.
// //  */
// // async function loadTranslations(lang = "en") {
// //   try {
// //     const res = await fetch(`/static/i18n/${lang}.json`);
// //     translations = await res.json();
// //     currentLang = lang;
// //     localStorage.setItem("lang", lang);
// //     setState("lang", lang);
// //   } catch (err) {
// //     console.error("Failed to load translations for", lang, err);
// //     translations = {}; // fallback to empty
// //   }
// // }

// // /**
// //  * Translate a key. Returns the key itself if not found.
// //  */
// // function t(key) {
// //   return translations[key] || key;
// // }

// // /**
// //  * Set the current language and update translations in memory.
// //  * Note: No reload here. Let the caller decide how to re-render.
// //  */
// // async function setLanguage(lang) {
// //   await loadTranslations(lang);
// // }

// // export {
// //   detectLanguage,
// //   loadTranslations,
// //   setLanguage,
// //   t,
// //   currentLang
// // };

// // // import { apiFetch } from "../api/api.js";
// // // import { setState, getState } from "../state/state.js";

// // // let translations = {};
// // // let currentLang = "en";

// // // /**
// // //  * Detect preferred language
// // //  */
// // // // function detectLanguage() {
// // // //   const stored = localStorage.getItem("lang") || "en";
// // // //   if (stored) return stored;

// // // //   const browserLang = navigator.language?.split("-")[0];
// // // //   return browserLang === "es" ? "es" : "en";
// // // // }
// // // function detectLanguage() {
// // //   const stored = localStorage.getItem("lang");
// // //   if (stored) return stored;

// // //   const browserLang = navigator.language?.split("-")[0];
// // //   return browserLang === "jp" ? "jp" : "en";
// // // }

// // // /**
// // //  * Load translation file
// // //  */
// // // async function loadTranslations(lang = "en") {
// // //   const res = await fetch(`/static/i18n/${lang}.json`);
// // //   translations = await res.json();
// // //   currentLang = lang;
// // //   localStorage.setItem("lang", lang);
// // //   setState("lang", lang);
// // // }

// // // /**
// // //  * Translate a key
// // //  */
// // // function t(key) {
// // //   return translations[key] || key;
// // // }

// // // /**
// // //  * Manually switch language
// // //  */
// // // async function setLanguage(lang) {
// // //   await loadTranslations(lang);
// // //   // Optionally trigger full re-render
// // //   location.reload();
// // // }

// // // export {
// // //   detectLanguage,
// // //   loadTranslations,
// // //   setLanguage,
// // //   t
// // // };


// // // /*
// // // import { t } from "../../i18n/i18n.js";

// // // const title = createElement("h1", {}, [t("artist.overview")]);


// // // */

// // // /*

// // // 5. Optional: Add a Language Switcher

// // // Example in your header:

// // // function createLanguageSelector() {
// // //   return createElement("select", {
// // //     onchange: async (e) => {
// // //       await setLanguage(e.target.value);
// // //     }
// // //   }, [
// // //     createElement("option", { value: "en" }, ["English"]),
// // //     createElement("option", { value: "es" }, ["Español"]),
// // //   ]);
// // // }

// // // Then add it inside your createHeader(isLoggedIn):

// // // header.appendChild(createLanguageSelector());


// // // */