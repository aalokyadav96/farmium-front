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
