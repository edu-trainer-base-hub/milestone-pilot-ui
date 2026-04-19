import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LabeledField } from "@/components/ui/labeled-field";
import { NumericInput } from "@/components/ui/numeric-input";
import type { PlayMode, ProblemMode } from "../../model/trainer.types";

export function OperationsCard({ controller }: { controller: any }) {
  const { t } = useTranslation();
  const tr = (key: string, vars?: Record<string, unknown>) => t(`addSubT.${key}`, vars);

  const { config } = controller.state;
  const { updateConfig } = controller.actions;

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 grid gap-4">
        <LabeledField label={tr("setup.operations")!} htmlFor="op-add">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                id="op-add"
                checked={config.includeAdd}
                onCheckedChange={(v) => updateConfig({ includeAdd: Boolean(v) })}
                aria-label={tr("aria.add")}
              />
              {tr("setup.addition")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                id="op-sub"
                checked={config.includeSub}
                onCheckedChange={(v) => updateConfig({ includeSub: Boolean(v) })}
                aria-label={tr("aria.sub")}
              />
              {tr("setup.subtraction")}
            </label>
            {!controller.canStart && <p className="text-xs text-destructive">{tr("setup.oneRequired")}</p>}
          </div>
        </LabeledField>

        <LabeledField label={tr("setup.range")!} htmlFor="min-input">
          <div className="grid grid-cols-2 gap-2">
            <NumericInput
              id="min-input"
              value={config.minVal}
              onChange={(val) => updateConfig({ minVal: val })}
              allowNegative={true}
              aria-label={tr("setup.min") || undefined}
              className="rounded-xl"
            />
            <NumericInput
              id="max-input"
              value={config.maxVal}
              onChange={(val) => updateConfig({ maxVal: val })}
              allowNegative={true}
              aria-label={tr("setup.max") || undefined}
              className="rounded-xl"
            />
          </div>
        </LabeledField>

        <LabeledField label={tr("setup.answerMode")!} htmlFor="play-mode">
          <Select value={config.playMode} onValueChange={(v) => updateConfig({ playMode: v as PlayMode })}>
            <SelectTrigger id="play-mode" className="rounded-xl w-full h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quiz">{tr("mode.quiz")}</SelectItem>
              <SelectItem value="input">{tr("mode.input")}</SelectItem>
            </SelectContent>
          </Select>
        </LabeledField>

        <LabeledField label={tr("setup.mode")!} htmlFor="problem-mode">
          <Select value={config.problemMode} onValueChange={(v: ProblemMode) => updateConfig({ problemMode: v })}>
            <SelectTrigger id="problem-mode" className="rounded-xl w-full h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="result">{tr("mode.result")}</SelectItem>
              <SelectItem value="missing">{tr("mode.missing")}</SelectItem>
            </SelectContent>
          </Select>
        </LabeledField>
      </CardContent>
    </Card>
  );
}
