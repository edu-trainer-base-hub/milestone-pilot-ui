import React from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";

const SUPPORTED_LANGUAGES: readonly string[] = ["en", "uk", "ru"];

const LanguageSelectorBase: React.FC = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Select defaultValue={i18n.resolvedLanguage || i18n.language} onValueChange={(v) => changeLanguage(v)}>
      <SelectTrigger>
        <SelectValue defaultValue={i18n.language} placeholder="select lang" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {SUPPORTED_LANGUAGES.map((lng) => (
            <SelectItem key={lng} value={lng}>
              {t(`lang.code.${lng}`)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default LanguageSelectorBase;
