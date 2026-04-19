import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LabeledField } from "@/components/ui/labeled-field";
import { NumericInput } from "@/components/ui/numeric-input";

export function SessionOptionsCard({ controller }: { controller: any }) {
  const { t } = useTranslation();
  const tr = (key: string, vars?: Record<string, unknown>) => t(`addSubT.${key}`, vars);

  const { config } = controller.state;
  const { updateConfig } = controller.actions;

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 grid gap-4">
        <LabeledField label={tr("setup.timer")!} htmlFor="timer-min">
          <NumericInput
            id="timer-min"
            value={config.timerMinutes}
            onChange={(val) => updateConfig({ timerMinutes: val })}
            showInfinityWhenZero={true}
            allowNegative={false}
            aria-label={tr("aria.timer") || undefined}
            className="rounded-xl"
          />
          <p className="text-xs text-muted-foreground">{tr("setup.timerHint")}</p>
        </LabeledField>

        <LabeledField label={tr("setup.maxExercises")!} htmlFor="max-ex">
          <NumericInput
            id="max-ex"
            value={config.maxExercises}
            onChange={(val) => updateConfig({ maxExercises: val })}
            showInfinityWhenZero={true}
            allowNegative={false}
            aria-label={tr("aria.maxExercises") || undefined}
            className="rounded-xl"
          />
          <p className="text-xs text-muted-foreground">{tr("setup.maxExercisesHint")}</p>
        </LabeledField>

        <LabeledField label={tr("setup.sounds")!} htmlFor="sounds-toggle">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              id="sounds-toggle"
              checked={config.enableSounds}
              onCheckedChange={(v) => updateConfig({ enableSounds: Boolean(v) })}
              aria-label={tr("aria.sounds")}
            />
            {tr("setup.soundsHint")}
          </label>
        </LabeledField>
      </CardContent>
    </Card>
  );
}
