import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { DecimalTypeConfig, FractionTypeConfig, IntegerTypeConfig } from "@/lib/compare-numbers/generator";
import type { CompareNumbersSetupState, HistoryOrder, TypeAvailabilityMap } from "../model/trainer.types";
import { PRECISION_OPTIONS } from "../model/trainer.constants";
import { normalizeOptionalLimit, parseOptionalLimitFromInput } from "../lib/config-sanitizers";
import { NotificationBanner } from "./shared/NotificationBanner";
import { GapFields, LabeledField, ToggleRow, TypeCard, WeightField } from "./shared/SetupControls";
import { LoginSuggestionSlot } from "../slots/LoginSuggestionSlot";
import { UpgradeSuggestionSlot } from "../slots/UpgradeSuggestionSlot";

interface CompareNumbersSetupScreenProps {
  setup: CompareNumbersSetupState;
  typeAvailableMap: TypeAvailabilityMap;
  canStart: boolean;
  canUseCoreFeature: boolean;
  onOpenModeChange: (value: string | undefined) => void;
  onNonNegativeConfigChange: (update: Partial<IntegerTypeConfig>) => void;
  onSignedConfigChange: (update: Partial<IntegerTypeConfig>) => void;
  onDecimalConfigChange: (update: Partial<DecimalTypeConfig>) => void;
  onFractionConfigChange: (update: Partial<FractionTypeConfig>) => void;
  onEqualRatioChange: (value: number) => void;
  onHistoryOrderChange: (value: HistoryOrder) => void;
  onTimerMinutesChange: (value: number | null) => void;
  onMaxExercisesChange: (value: number | null) => void;
  onEnableSoundChange: (value: boolean) => void;
  onEnableVibrationChange: (value: boolean) => void;
  onStartSession: () => void;
}

export function CompareNumbersSetupScreen({
  setup,
  typeAvailableMap,
  canStart,
  canUseCoreFeature,
  onOpenModeChange,
  onNonNegativeConfigChange,
  onSignedConfigChange,
  onDecimalConfigChange,
  onFractionConfigChange,
  onEqualRatioChange,
  onHistoryOrderChange,
  onTimerMinutesChange,
  onMaxExercisesChange,
  onEnableSoundChange,
  onEnableVibrationChange,
  onStartSession,
}: CompareNumbersSetupScreenProps) {
  const { t } = useTranslation();
  const tr = (key: string, options?: Record<string, unknown>) => t(`cmpNmbrGm.${key}`, options);

  const setupLocked = !canUseCoreFeature;

  return (
    <div className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 max-w-6xl mx-auto w-full sm:mt-6 overflow-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-semibold">{tr("setup.title")}</h2>
        {!canStart && <span className="text-sm font-medium text-destructive">{tr("errors.unavailable")}</span>}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{tr("setup.intro")}</p>

      <Accordion
        type="single"
        collapsible
        value={setup.openMode}
        onValueChange={onOpenModeChange}
        className="mt-6 space-y-3"
      >
        <TypeCard
          id="non-negative"
          value="nonNegative"
          title={tr("types.nonNegative.title")}
          description={tr("types.nonNegative.desc")}
          enabled={setup.nonNegativeConfig.enabled}
          onEnabledChange={(checked) => {
            onNonNegativeConfigChange({ enabled: checked });
          }}
          showAvailabilityError={setup.nonNegativeConfig.enabled && !typeAvailableMap.nonNegativeInt}
          availabilityText={tr("types.messages.unavailable")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledField label={tr("ranges.min")} htmlFor="non-negative-min">
              <Input
                id="non-negative-min"
                type="number"
                min={0}
                value={setup.nonNegativeConfig.min}
                disabled={!setup.nonNegativeConfig.enabled || setupLocked}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const min = Number.isFinite(value) ? Math.max(0, value) : 0;
                  onNonNegativeConfigChange({
                    min,
                    max: Math.max(min, setup.nonNegativeConfig.max),
                  });
                }}
              />
            </LabeledField>
            <LabeledField label={tr("ranges.max")} htmlFor="non-negative-max">
              <Input
                id="non-negative-max"
                type="number"
                min={0}
                value={setup.nonNegativeConfig.max}
                disabled={!setup.nonNegativeConfig.enabled || setupLocked}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const max = Number.isFinite(value) ? Math.max(0, value) : setup.nonNegativeConfig.min;
                  onNonNegativeConfigChange({
                    max: Math.max(setup.nonNegativeConfig.min, max),
                  });
                }}
              />
            </LabeledField>
          </div>
          <GapFields
            idPrefix="non-negative"
            minValue={setup.nonNegativeConfig.gap.min}
            maxValue={setup.nonNegativeConfig.gap.max}
            onMinChange={(value) =>
              onNonNegativeConfigChange({
                gap: { ...setup.nonNegativeConfig.gap, min: value },
              })
            }
            onMaxChange={(value) =>
              onNonNegativeConfigChange({
                gap: { ...setup.nonNegativeConfig.gap, max: value },
              })
            }
            labelMin={tr("gap.min")}
            labelMax={tr("gap.max")}
            disabled={!setup.nonNegativeConfig.enabled || setupLocked}
          />
          <WeightField
            value={setup.nonNegativeConfig.weight}
            onChange={(value) => onNonNegativeConfigChange({ weight: value })}
            label={tr("weights.label")}
            disabled={!setup.nonNegativeConfig.enabled || setupLocked}
          />
        </TypeCard>

        <TypeCard
          id="signed"
          value="signed"
          title={tr("types.signed.title")}
          description={tr("types.signed.desc")}
          enabled={setup.signedConfig.enabled}
          onEnabledChange={(checked) => {
            onSignedConfigChange({ enabled: checked });
          }}
          showAvailabilityError={setup.signedConfig.enabled && !typeAvailableMap.signedInt}
          availabilityText={tr("types.messages.unavailable")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledField label={tr("ranges.min")} htmlFor="signed-min">
              <Input
                id="signed-min"
                type="number"
                value={setup.signedConfig.min}
                disabled={!setup.signedConfig.enabled || setupLocked}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const min = Number.isFinite(value) ? value : setup.signedConfig.min;
                  onSignedConfigChange({
                    min,
                    max: Math.max(min, setup.signedConfig.max),
                  });
                }}
              />
            </LabeledField>
            <LabeledField label={tr("ranges.max")} htmlFor="signed-max">
              <Input
                id="signed-max"
                type="number"
                value={setup.signedConfig.max}
                disabled={!setup.signedConfig.enabled || setupLocked}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const max = Number.isFinite(value) ? value : setup.signedConfig.max;
                  onSignedConfigChange({
                    max: Math.max(setup.signedConfig.min, max),
                  });
                }}
              />
            </LabeledField>
          </div>
          <GapFields
            idPrefix="signed"
            minValue={setup.signedConfig.gap.min}
            maxValue={setup.signedConfig.gap.max}
            onMinChange={(value) =>
              onSignedConfigChange({
                gap: { ...setup.signedConfig.gap, min: value },
              })
            }
            onMaxChange={(value) =>
              onSignedConfigChange({
                gap: { ...setup.signedConfig.gap, max: value },
              })
            }
            labelMin={tr("gap.min")}
            labelMax={tr("gap.max")}
            disabled={!setup.signedConfig.enabled || setupLocked}
          />
          <WeightField
            value={setup.signedConfig.weight}
            onChange={(value) => onSignedConfigChange({ weight: value })}
            label={tr("weights.label")}
            disabled={!setup.signedConfig.enabled || setupLocked}
          />
        </TypeCard>

        <TypeCard
          id="decimal"
          value="decimal"
          title={tr("types.decimal.title")}
          description={tr("types.decimal.desc")}
          enabled={setup.decimalConfig.enabled}
          onEnabledChange={(checked) => {
            onDecimalConfigChange({ enabled: checked });
          }}
          showAvailabilityError={setup.decimalConfig.enabled && !typeAvailableMap.decimal}
          availabilityText={tr("types.messages.decimalRange")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledField label={tr("ranges.min")} htmlFor="decimal-min">
              <Input
                id="decimal-min"
                type="number"
                step="0.1"
                value={setup.decimalConfig.min}
                disabled={!setup.decimalConfig.enabled || setupLocked}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const min = Number.isFinite(value) ? value : setup.decimalConfig.min;
                  onDecimalConfigChange({
                    min,
                    max: Math.max(min, setup.decimalConfig.max),
                  });
                }}
              />
            </LabeledField>
            <LabeledField label={tr("ranges.max")} htmlFor="decimal-max">
              <Input
                id="decimal-max"
                type="number"
                step="0.1"
                value={setup.decimalConfig.max}
                disabled={!setup.decimalConfig.enabled || setupLocked}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const max = Number.isFinite(value) ? value : setup.decimalConfig.max;
                  onDecimalConfigChange({
                    max: Math.max(setup.decimalConfig.min, max),
                  });
                }}
              />
            </LabeledField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledField label={tr("precision.mode")} htmlFor="decimal-mode">
              <Select
                value={setup.decimalConfig.precisionMode}
                onValueChange={(value) =>
                  onDecimalConfigChange({
                    precisionMode: value as DecimalTypeConfig["precisionMode"],
                  })
                }
                disabled={!setup.decimalConfig.enabled || setupLocked}
              >
                <SelectTrigger id="decimal-mode" disabled={!setup.decimalConfig.enabled || setupLocked}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">{tr("precision.exact")}</SelectItem>
                  <SelectItem value="upTo">{tr("precision.upTo")}</SelectItem>
                </SelectContent>
              </Select>
            </LabeledField>

            <LabeledField
              label={
                setup.decimalConfig.precisionMode === "exact" ? tr("precision.exactValue") : tr("precision.maxValue")
              }
              htmlFor="decimal-precision"
            >
              <Select
                value={String(
                  setup.decimalConfig.precisionMode === "exact"
                    ? setup.decimalConfig.precision
                    : setup.decimalConfig.maxPrecision
                )}
                onValueChange={(value) => {
                  const numeric = Number(value);
                  if (!Number.isFinite(numeric)) return;
                  if (setup.decimalConfig.precisionMode === "exact") {
                    onDecimalConfigChange({ precision: numeric });
                  } else {
                    onDecimalConfigChange({ maxPrecision: numeric });
                  }
                }}
                disabled={!setup.decimalConfig.enabled || setupLocked}
              >
                <SelectTrigger id="decimal-precision" disabled={!setup.decimalConfig.enabled || setupLocked}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRECISION_OPTIONS.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {tr("precision.option", { count: value })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledField>
          </div>

          <GapFields
            idPrefix="decimal"
            minValue={setup.decimalConfig.gap.min}
            maxValue={setup.decimalConfig.gap.max}
            onMinChange={(value) =>
              onDecimalConfigChange({
                gap: { ...setup.decimalConfig.gap, min: value },
              })
            }
            onMaxChange={(value) =>
              onDecimalConfigChange({
                gap: { ...setup.decimalConfig.gap, max: value },
              })
            }
            labelMin={tr("gap.min")}
            labelMax={tr("gap.max")}
            disabled={!setup.decimalConfig.enabled || setupLocked}
          />
          <WeightField
            value={setup.decimalConfig.weight}
            onChange={(value) => onDecimalConfigChange({ weight: value })}
            label={tr("weights.label")}
            disabled={!setup.decimalConfig.enabled || setupLocked}
          />
        </TypeCard>

        <TypeCard
          id="fraction"
          value="fraction"
          title={tr("types.fraction.title")}
          description={tr("types.fraction.desc")}
          enabled={setup.fractionConfig.enabled}
          onEnabledChange={(checked) => {
            onFractionConfigChange({ enabled: checked });
          }}
          showAvailabilityError={setup.fractionConfig.enabled && !typeAvailableMap.fraction}
          availabilityText={tr("types.messages.unavailable")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledField label={tr("fractions.mode")} htmlFor="fraction-mode">
              <Select
                value={setup.fractionConfig.preset}
                onValueChange={(value) =>
                  onFractionConfigChange({
                    preset: value as FractionTypeConfig["preset"],
                  })
                }
                disabled={!setup.fractionConfig.enabled || setupLocked}
              >
                <SelectTrigger id="fraction-mode" disabled={!setup.fractionConfig.enabled || setupLocked}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preset12">{tr("fractions.preset12")}</SelectItem>
                  <SelectItem value="preset20">{tr("fractions.preset20")}</SelectItem>
                  <SelectItem value="custom">{tr("fractions.custom")}</SelectItem>
                </SelectContent>
              </Select>
            </LabeledField>

            <LabeledField label={tr("fractions.numerator")} htmlFor="fraction-num-min">
              <Input
                id="fraction-num-min"
                type="number"
                min={1}
                value={setup.fractionConfig.numeratorMin}
                disabled={!setup.fractionConfig.enabled || setup.fractionConfig.preset !== "custom" || setupLocked}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const min = Number.isFinite(value) ? Math.max(1, value) : setup.fractionConfig.numeratorMin;
                  onFractionConfigChange({
                    numeratorMin: min,
                    numeratorMax: Math.max(min, setup.fractionConfig.numeratorMax),
                  });
                }}
              />
            </LabeledField>

            <LabeledField label={tr("fractions.numeratorMax")} htmlFor="fraction-num-max">
              <Input
                id="fraction-num-max"
                type="number"
                min={1}
                value={setup.fractionConfig.numeratorMax}
                disabled={!setup.fractionConfig.enabled || setup.fractionConfig.preset !== "custom" || setupLocked}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const max = Number.isFinite(value) ? Math.max(1, value) : setup.fractionConfig.numeratorMax;
                  onFractionConfigChange({
                    numeratorMax: Math.max(setup.fractionConfig.numeratorMin, max),
                  });
                }}
              />
            </LabeledField>

            <LabeledField label={tr("fractions.denominator")} htmlFor="fraction-den-min">
              <Input
                id="fraction-den-min"
                type="number"
                min={1}
                value={setup.fractionConfig.denominatorMin}
                disabled={!setup.fractionConfig.enabled || setup.fractionConfig.preset !== "custom" || setupLocked}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const min = Number.isFinite(value) ? Math.max(1, value) : setup.fractionConfig.denominatorMin;
                  onFractionConfigChange({
                    denominatorMin: min,
                    denominatorMax: Math.max(min, setup.fractionConfig.denominatorMax),
                  });
                }}
              />
            </LabeledField>

            <LabeledField label={tr("fractions.denominatorMax")} htmlFor="fraction-den-max">
              <Input
                id="fraction-den-max"
                type="number"
                min={1}
                value={setup.fractionConfig.denominatorMax}
                disabled={!setup.fractionConfig.enabled || setup.fractionConfig.preset !== "custom" || setupLocked}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const max = Number.isFinite(value) ? Math.max(1, value) : setup.fractionConfig.denominatorMax;
                  onFractionConfigChange({
                    denominatorMax: Math.max(setup.fractionConfig.denominatorMin, max),
                  });
                }}
              />
            </LabeledField>
          </div>

          <GapFields
            idPrefix="fraction"
            minValue={setup.fractionConfig.gap.min}
            maxValue={setup.fractionConfig.gap.max}
            onMinChange={(value) =>
              onFractionConfigChange({
                gap: { ...setup.fractionConfig.gap, min: value },
              })
            }
            onMaxChange={(value) =>
              onFractionConfigChange({
                gap: { ...setup.fractionConfig.gap, max: value },
              })
            }
            labelMin={tr("gap.min")}
            labelMax={tr("gap.max")}
            disabled={!setup.fractionConfig.enabled || setupLocked}
          />
          <WeightField
            value={setup.fractionConfig.weight}
            onChange={(value) => onFractionConfigChange({ weight: value })}
            label={tr("weights.label")}
            disabled={!setup.fractionConfig.enabled || setupLocked}
          />
        </TypeCard>
      </Accordion>

      <Separator className="my-6" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-3">
          <Label htmlFor="equal-ratio">{tr("equal.label")}</Label>
          <div className="flex items-center gap-4">
            <input
              id="equal-ratio"
              type="range"
              min={0}
              max={50}
              value={setup.equalRatio}
              onChange={(event) => onEqualRatioChange(Number(event.target.value))}
              className="w-full"
              disabled={setupLocked}
            />
            <span className="w-14 text-right text-sm font-medium">{setup.equalRatio}%</span>
          </div>
          <p className="text-xs text-muted-foreground">{tr("equal.hint")}</p>
        </div>

        <div className="grid gap-3">
          <Label>{tr("history.order.label")}</Label>
          <Select
            value={setup.historyOrder}
            onValueChange={(value) => onHistoryOrderChange(value as HistoryOrder)}
            disabled={setupLocked}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">{tr("history.order.oldest")}</SelectItem>
              <SelectItem value="desc">{tr("history.order.newest")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{tr("history.order.hint")}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <LabeledField label={tr("session.timer")} htmlFor="timer-min">
          <Input
            id="timer-min"
            type="number"
            min={0}
            value={setup.timerMinutes ?? ""}
            placeholder="∞"
            onChange={(event) => onTimerMinutesChange(parseOptionalLimitFromInput(event.target.value))}
            onBlur={() => onTimerMinutesChange(normalizeOptionalLimit(setup.timerMinutes))}
            disabled={setupLocked}
          />
          <p className="text-xs text-muted-foreground">{tr("session.timerHint")}</p>
        </LabeledField>
        <LabeledField label={tr("session.maxExercises")} htmlFor="max-exercises">
          <Input
            id="max-exercises"
            type="number"
            min={0}
            value={setup.maxExercises ?? ""}
            placeholder="∞"
            onChange={(event) => onMaxExercisesChange(parseOptionalLimitFromInput(event.target.value))}
            onBlur={() => onMaxExercisesChange(normalizeOptionalLimit(setup.maxExercises))}
            disabled={setupLocked}
          />
          <p className="text-xs text-muted-foreground">{tr("session.maxExercisesHint")}</p>
        </LabeledField>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ToggleRow
          id="feedback-sound"
          label={tr("feedback.sound")}
          description={tr("feedback.soundDesc")}
          checked={setup.enableSound}
          onChange={onEnableSoundChange}
        />
        <ToggleRow
          id="feedback-vibration"
          label={tr("feedback.vibration")}
          description={tr("feedback.vibrationDesc")}
          checked={setup.enableVibration}
          onChange={onEnableVibrationChange}
        />
      </div>

      <NotificationBanner variant="muted" className="mt-6">
        {tr("telemetry.note")}
      </NotificationBanner>

      <LoginSuggestionSlot placement="compare_numbers_setup_footer" />
      <UpgradeSuggestionSlot placement="compare_numbers_setup_footer" />

      <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
        <Button onClick={() => onStartSession()} disabled={!canStart || setupLocked} className="w-full sm:w-auto">
          {tr("setup.start")}
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link to="/">{tr("actions.toMenu")}</Link>
        </Button>
      </div>
    </div>
  );
}
