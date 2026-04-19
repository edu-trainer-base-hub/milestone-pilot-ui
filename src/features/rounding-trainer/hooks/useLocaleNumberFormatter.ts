import React from "react";
import { useTranslation } from "react-i18next";

export function useLocaleNumberFormatter() {
  const { i18n } = useTranslation();

  const formatter = React.useMemo(() => new Intl.NumberFormat(i18n.language || undefined), [i18n.language]);

  return React.useCallback(
    (value: number): string => {
      return formatter.format(value);
    },
    [formatter]
  );
}
