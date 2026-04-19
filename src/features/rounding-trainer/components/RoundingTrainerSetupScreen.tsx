import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabeledField } from "@/components/ui/labeled-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DIGITS_CHOICES } from "../model/trainer.constants";
import type { ConfigUpdate, Mode, SessionConfig } from "../model/trainer.types";
import { LoginSuggestionSlot } from "../slots/LoginSuggestionSlot";
import { UpgradeSuggestionSlot } from "../slots/UpgradeSuggestionSlot";

interface RoundingTrainerSetupScreenProps {
  config: SessionConfig;
  canUseCoreFeature: boolean;
  onConfigChange: (update: ConfigUpdate) => void;
  onStart: () => void;
}

export function RoundingTrainerSetupScreen({
  config,
  canUseCoreFeature,
  onConfigChange,
  onStart,
}: RoundingTrainerSetupScreenProps) {
  const { t } = useTranslation();
  const setupLocked = !canUseCoreFeature;

  return (
    <div className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg pb-5 sm:p-8 max-w-5xl mx-auto w-full">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="grid gap-6">
            <LabeledField label={t("roundT.setup.mode")} htmlFor="rounding-mode-select">
              <Select
                value={config.mode}
                onValueChange={(value) => onConfigChange({ mode: value as Mode })}
                disabled={setupLocked}
              >
                <SelectTrigger id="rounding-mode-select" className="rounded-xl w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">{t("roundT.mode.quiz")}</SelectItem>
                  <SelectItem value="input">{t("roundT.mode.input")}</SelectItem>
                </SelectContent>
              </Select>
            </LabeledField>

            <LabeledField label={t("roundT.setup.timer")} htmlFor="timer-minutes">
              <Input
                id="timer-minutes"
                type="number"
                min={0}
                value={config.timerMinutes}
                disabled={setupLocked}
                onChange={(event) => {
                  const parsed = parseInt(event.target.value, 10);
                  onConfigChange({ timerMinutes: parsed });
                }}
                onBlur={(event) => {
                  const parsed = parseInt(event.target.value, 10);
                  onConfigChange({ timerMinutes: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 });
                }}
                className="rounded-xl"
              />
            </LabeledField>

            <LabeledField label={t("roundT.setup.maxExercises")} htmlFor="max-exercises">
              <Input
                id="max-exercises"
                type="number"
                min={0}
                value={config.maxExercises}
                disabled={setupLocked}
                onChange={(event) => {
                  const parsed = parseInt(event.target.value, 10);
                  onConfigChange({ maxExercises: parsed });
                }}
                onBlur={(event) => {
                  const parsed = parseInt(event.target.value, 10);
                  onConfigChange({ maxExercises: Number.isFinite(parsed) ? Math.max(0, parsed) : 0 });
                }}
                className="rounded-xl"
              />
            </LabeledField>

            <div className="flex items-center gap-2">
              <Switch
                id="rounding-sounds-switch"
                checked={config.soundsEnabled}
                disabled={setupLocked}
                onCheckedChange={(checked) => onConfigChange({ soundsEnabled: checked })}
              />
              <Label htmlFor="rounding-sounds-switch">{t("roundT.setup.sounds")}</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-6">
            <LabeledField label={t("roundT.setup.numberTypes")} htmlFor="number-type-group">
              <div id="number-type-group" className="flex gap-4">
                <div className="inline-flex items-center gap-2">
                  <Checkbox
                    id="rounding-whole"
                    checked={config.includeWhole}
                    disabled={setupLocked}
                    onCheckedChange={(value) => onConfigChange({ includeWhole: Boolean(value) })}
                  />
                  <Label htmlFor="rounding-whole">{t("roundT.setup.whole")}</Label>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Checkbox
                    id="rounding-decimals"
                    checked={config.includeDecimals}
                    disabled={setupLocked}
                    onCheckedChange={(value) => onConfigChange({ includeDecimals: Boolean(value) })}
                  />
                  <Label htmlFor="rounding-decimals">{t("roundT.setup.decimals")}</Label>
                </div>
              </div>
            </LabeledField>

            <LabeledField label={t("roundT.setup.decimalPlaces")} htmlFor="decimal-places-select">
              <Select
                value={String(config.decimalPlaces)}
                onValueChange={(value) => onConfigChange({ decimalPlaces: parseInt(value, 10) })}
                disabled={!config.includeDecimals || setupLocked}
              >
                <SelectTrigger id="decimal-places-select" className="rounded-xl w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2].map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledField>

            <LabeledField label={t("roundT.setup.signs")} htmlFor="signs-group">
              <div id="signs-group" className="flex gap-4">
                <div className="inline-flex items-center gap-2">
                  <Checkbox
                    id="rounding-positives"
                    checked={config.includePositives}
                    disabled={setupLocked}
                    onCheckedChange={(value) => onConfigChange({ includePositives: Boolean(value) })}
                  />
                  <Label htmlFor="rounding-positives">{t("roundT.setup.positives")}</Label>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Checkbox
                    id="rounding-negatives"
                    checked={config.includeNegatives}
                    disabled={setupLocked}
                    onCheckedChange={(value) => onConfigChange({ includeNegatives: Boolean(value) })}
                  />
                  <Label htmlFor="rounding-negatives">{t("roundT.setup.negatives")}</Label>
                </div>
              </div>
            </LabeledField>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <Card>
          <CardContent className="grid gap-6">
            <LabeledField label={t("roundT.setup.magnitude")} htmlFor="magnitude-mode">
              <div id="magnitude-mode" className="flex gap-2">
                <Button
                  variant={config.magnitudeMode === "digits" ? "default" : "outline"}
                  className="h-8 px-3"
                  disabled={setupLocked}
                  onClick={() => onConfigChange({ magnitudeMode: "digits" })}
                >
                  {t("roundT.setup.digitsMode")}
                </Button>
                <Button
                  variant={config.magnitudeMode === "range" ? "default" : "outline"}
                  className="h-8 px-3"
                  disabled={setupLocked}
                  onClick={() => onConfigChange({ magnitudeMode: "range" })}
                >
                  {t("roundT.setup.rangeMode")}
                </Button>
              </div>
            </LabeledField>

            {config.magnitudeMode === "digits" ? (
              <div className="grid grid-cols-2 gap-4">
                <LabeledField label={t("roundT.setup.minDigits")} htmlFor="min-digits-select">
                  <Select
                    value={String(config.minDigits)}
                    disabled={setupLocked}
                    onValueChange={(value) => onConfigChange({ minDigits: parseInt(value, 10) })}
                  >
                    <SelectTrigger id="min-digits-select" className="rounded-xl w-full h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIGITS_CHOICES.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </LabeledField>

                <LabeledField label={t("roundT.setup.maxDigits")} htmlFor="max-digits-select">
                  <Select
                    value={String(config.maxDigits)}
                    disabled={setupLocked}
                    onValueChange={(value) => onConfigChange({ maxDigits: parseInt(value, 10) })}
                  >
                    <SelectTrigger id="max-digits-select" className="rounded-xl w-full h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIGITS_CHOICES.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </LabeledField>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <LabeledField label={t("roundT.setup.minValue")} htmlFor="min-value-input">
                  <Input
                    id="min-value-input"
                    type="number"
                    value={config.minValue}
                    disabled={setupLocked}
                    onChange={(event) => {
                      const parsed = parseInt(event.target.value || "0", 10) || 0;
                      onConfigChange({ minValue: parsed });
                    }}
                    className="rounded-xl"
                  />
                </LabeledField>

                <LabeledField label={t("roundT.setup.maxValue")} htmlFor="max-value-input">
                  <Input
                    id="max-value-input"
                    type="number"
                    value={config.maxValue}
                    disabled={setupLocked}
                    onChange={(event) => {
                      const parsed = parseInt(event.target.value || "0", 10) || 0;
                      onConfigChange({ maxValue: parsed });
                    }}
                    className="rounded-xl"
                  />
                </LabeledField>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4">
            <LabeledField label={t("roundT.setup.targets")} htmlFor="targets-group">
              <div id="targets-group" className="flex flex-wrap gap-4">
                <div className="inline-flex items-center gap-2">
                  <Checkbox
                    id="target-10"
                    checked={config.targets.tens}
                    disabled={setupLocked}
                    onCheckedChange={(value) => onConfigChange({ targets: { tens: Boolean(value) } })}
                  />
                  <Label htmlFor="target-10">{t("roundT.targets.tens")}</Label>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Checkbox
                    id="target-100"
                    checked={config.targets.hundreds}
                    disabled={setupLocked}
                    onCheckedChange={(value) => onConfigChange({ targets: { hundreds: Boolean(value) } })}
                  />
                  <Label htmlFor="target-100">{t("roundT.targets.hundreds")}</Label>
                </div>
                <div className="inline-flex items-center gap-2">
                  <Checkbox
                    id="target-1000"
                    checked={config.targets.thousands}
                    disabled={setupLocked}
                    onCheckedChange={(value) => onConfigChange({ targets: { thousands: Boolean(value) } })}
                  />
                  <Label htmlFor="target-1000">{t("roundT.targets.thousands")}</Label>
                </div>
              </div>
            </LabeledField>

            <div className="flex flex-col gap-3 mt-2">
              <div className="inline-flex items-center gap-2">
                <Checkbox
                  id="include-tie-case"
                  checked={config.includeTieCase}
                  disabled={setupLocked}
                  onCheckedChange={(value) => onConfigChange({ includeTieCase: Boolean(value) })}
                />
                <Label htmlFor="include-tie-case">{t("roundT.setup.includeTie")}</Label>
              </div>

              <div className="inline-flex items-center gap-2">
                <Checkbox
                  id="show-place-hint"
                  checked={config.showHint}
                  disabled={setupLocked}
                  onCheckedChange={(value) => onConfigChange({ showHint: Boolean(value) })}
                />
                <Label htmlFor="show-place-hint">{t("roundT.setup.showHint")}</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <LoginSuggestionSlot placement="rounding_setup_footer" />
      <UpgradeSuggestionSlot placement="rounding_setup_footer" />

      <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
        <Button onClick={onStart} disabled={setupLocked} className="w-full sm:w-auto">
          {t("roundT.start")}
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link to="/" aria-label={t("roundT.aria.backToMenu")}>
            {t("menu.mainMenuLabel", "Main Menu")}
          </Link>
        </Button>
      </div>

      <p className="text-xs mt-3">{t("roundT.setup.note")}</p>
    </div>
  );
}
