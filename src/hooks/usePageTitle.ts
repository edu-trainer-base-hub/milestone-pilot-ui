import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Custom hook to update the browser tab title using i18n translation keys.
 * @param titleKey The translation key to use for the title. Defaults to "menu.title".
 */
export function usePageTitle(titleKey: string = "app.tab.title") {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const translatedTitle = t(titleKey);
    if (translatedTitle && translatedTitle !== titleKey) {
      document.title = translatedTitle;
    }
  }, [t, titleKey, i18n.language]);
}
