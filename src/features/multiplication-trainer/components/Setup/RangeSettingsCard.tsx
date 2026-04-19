import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LabeledField } from "@/components/ui/labeled-field";
import type { Mode } from "../../model/trainer.types";

interface RangeSettingsCardProps {
  minVal: number;
  maxVal: number;
  mode: Mode;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
  onModeChange: (val: Mode) => void;
  labels: {
    min: string;
    max: string;
    mode: string;
    modeQuiz: string;
    modeInput: string;
  };
}

export function RangeSettingsCard({
  minVal,
  maxVal,
  mode,
  onMinChange,
  onMaxChange,
  onModeChange,
  labels,
}: RangeSettingsCardProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6 grid gap-4">
        <LabeledField label={labels.min} htmlFor="min-select">
          <Select value={String(minVal)} onValueChange={(val) => onMinChange(parseInt(val, 10))}>
            <SelectTrigger id="min-select" className="rounded-xl w-full h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </LabeledField>

        <LabeledField label={labels.max} htmlFor="max-select">
          <Select value={String(maxVal)} onValueChange={(val) => onMaxChange(parseInt(val, 10))}>
            <SelectTrigger id="max-select" className="rounded-xl w-full h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => i + 2).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </LabeledField>

        <LabeledField label={labels.mode} htmlFor="mode-select">
          <Select value={mode} onValueChange={(val) => onModeChange(val as Mode)}>
            <SelectTrigger id="mode-select" className="rounded-xl w-full h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quiz">{labels.modeQuiz}</SelectItem>
              <SelectItem value="input">{labels.modeInput}</SelectItem>
            </SelectContent>
          </Select>
        </LabeledField>
      </CardContent>
    </Card>
  );
}
