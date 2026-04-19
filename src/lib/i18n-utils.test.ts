import { getLocale5 } from "./i18n-utils";

// Mock i18n instance
const mockI18n = (lang: string, resolved?: string) =>
  ({
    language: lang,
    resolvedLanguage: resolved,
  }) as any;

console.log("Testing getLocale5:");

const testCases = [
  { lang: "en", resolved: "en", expected: "en-US" },
  { lang: "en-US", resolved: "en", expected: "en-US" },
  { lang: "uk", resolved: "uk", expected: "uk-UA" },
  { lang: "uk-UA", resolved: "uk", expected: "uk-UA" },
  { lang: "ru", resolved: "ru", expected: "ru-RU" },
  { lang: "ru-RU", resolved: "ru", expected: "ru-RU" },
  { lang: "fr", resolved: "en", expected: "en-US" }, // Fallback
];

testCases.forEach(({ lang, resolved, expected }) => {
  const result = getLocale5(mockI18n(lang, resolved));
  const status = result === expected ? "PASS" : "FAIL";
  console.log(`[${status}] lang: ${lang}, resolved: ${resolved} => ${result} (expected: ${expected})`);
  if (status === "FAIL") process.exit(1);
});

console.log("All tests passed!");
