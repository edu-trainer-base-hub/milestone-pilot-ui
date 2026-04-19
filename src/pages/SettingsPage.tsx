import React, { useEffect, useState } from "react";
import { ModeToggle } from "@/components/theme/mode-toggle.tsx";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Loader2 } from "lucide-react";
import SettingsApiClient, { type Locale5, type UpdateSettingsResponse } from "@/services/SettingsApiClient.ts";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { notifier } from "@/services/NotificationService.ts";
import { Separator } from "@/components/ui/separator.tsx";
import { extractErrorCode } from "@/services/ApiService.ts";
import LanguageSelector from "@/components/lang/LanguageSelector.tsx";

const LOCALES: readonly { value: Locale5; label: string }[] = [
  { value: "en-US", label: "English (en-US)" },
  { value: "uk-UA", label: "Українська (uk-UA)" },
  { value: "ru-RU", label: "Русский (ru-RU)" },
];

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [currentSettings, setCurrentSettings] = useState<UpdateSettingsResponse | null>(null);
  const [locale, setLocale] = useState<Locale5 | "">("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const settingsFromServer: UpdateSettingsResponse = await SettingsApiClient.getSettings();
        if (!mounted) return;
        setCurrentSettings(settingsFromServer);
        const exact = LOCALES.find((l) => l.value === settingsFromServer.locale)?.value;
        if (exact) {
          setLocale(exact);
        }
      } catch (error: unknown) {
        const errorCode = extractErrorCode(error);
        const messageKey = errorCode ? `errors.codes.${errorCode}` : "pages.settings.notifications.fetchFail";
        const message = t(messageKey, {
          defaultValue: t("errors.codes.UNKNOWN"),
        });
        notifier.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async () => {
    if (!locale) return;
    setSaving(true);
    try {
      const updatedSettings: UpdateSettingsResponse = await SettingsApiClient.updateSettings({ locale: locale });
      setCurrentSettings(updatedSettings);
      const exact = LOCALES.find((l) => l.value === updatedSettings.locale)?.value;
      if (exact) {
        setLocale(exact);
      }
      notifier.success(t("pages.settings.notifications.saveSuccess"));
    } catch (error: unknown) {
      const errorCode = extractErrorCode(error);
      const messageKey = errorCode ? `errors.codes.${errorCode}` : "pages.settings.notifications.updateFail";
      const message = t(messageKey, {
        defaultValue: t("errors.codes.UNKNOWN"),
      });
      notifier.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background py-0 px-0 sm:py-8 sm:px-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{t("pages.settings.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4">
              <div className="flex-1">
                <Label htmlFor="settings-theme-mode">{t("pages.settings.themeMode.label")}:</Label>
                <div id="settings-theme-mode" className="w-50">
                  <ModeToggle showText triggerClassName="w-full" dropdownClassName="w-50" />
                </div>
              </div>
              <div className="flex-1 mt-4 sm:mt-0">
                <Label htmlFor="settings-locale-toggle">
                  {t("pages.settings.localeToggle.label", {
                    defaultValue: t("pages.settings.webLanguage.label"),
                  })}
                  :
                </Label>
                <div id="settings-locale-toggle" className="w-50">
                  <LanguageSelector className="w-full" />
                </div>
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <Label htmlFor="settings-language">{t("pages.settings.telegramLanguage.label")}:</Label>
            <div id="settings-language" className="w-50">
              <Select value={locale} onValueChange={(v) => setLocale(v as Locale5)}>
                <SelectTrigger className="w-full" disabled={loading}>
                  {locale ? (
                    <span data-slot="select-value">{LOCALES.find((l) => l.value === locale)?.label ?? locale}</span>
                  ) : currentSettings?.locale ? (
                    <span data-slot="select-value">{currentSettings.locale}</span>
                  ) : (
                    <SelectValue placeholder={"Select language"} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {LOCALES.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" className="w-full sm:w-1/2" onClick={onSave} disabled={loading || saving || !locale}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? t("common.saving", "Saving…") : t("common.save", "Save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
