import type { i18n } from "i18next";
import type { Locale5 } from "@/services/SettingsApiClient";

/**
 * Maps the current i18n language to a 5-character Locale5 string.
 * Uses resolvedLanguage to handle regional tags (e.g., 'uk-UA' -> 'uk').
 */
export function getLocale5(i18nInstance: i18n): Locale5 {
  const lang = i18nInstance.resolvedLanguage || i18nInstance.language || "en";
  if (lang.startsWith("uk")) return "uk-UA";
  if (lang.startsWith("ru")) return "ru-RU";
  return "en-US";
}
