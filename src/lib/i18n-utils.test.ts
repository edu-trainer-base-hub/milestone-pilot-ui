import { getLocale5 } from "./i18n-utils";
import { describe, expect, it } from "vitest";

type LocaleSource = Parameters<typeof getLocale5>[0];

const mockI18n = (lang: string, resolved?: string) =>
  ({
    language: lang,
    resolvedLanguage: resolved,
  }) as unknown as LocaleSource;

describe("getLocale5", () => {
  it.each([
    { lang: "en", resolved: "en", expected: "en-US" },
    { lang: "en-US", resolved: "en", expected: "en-US" },
    { lang: "uk", resolved: "uk", expected: "uk-UA" },
    { lang: "uk-UA", resolved: "uk", expected: "uk-UA" },
    { lang: "ru", resolved: "ru", expected: "ru-RU" },
    { lang: "ru-RU", resolved: "ru", expected: "ru-RU" },
    { lang: "fr", resolved: "en", expected: "en-US" },
  ])("maps $lang with resolved $resolved to $expected", ({ lang, resolved, expected }) => {
    expect(getLocale5(mockI18n(lang, resolved))).toBe(expected);
  });
});
