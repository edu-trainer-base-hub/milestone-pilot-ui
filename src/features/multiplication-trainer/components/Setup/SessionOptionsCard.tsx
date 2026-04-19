import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { LabeledField } from "@/components/ui/labeled-field";

interface SessionOptionsCardProps {
  includeMul: boolean;
  includeDiv: boolean;
  timerMinutes: number;
  maxExercises: number;
  onMulChange: (val: boolean) => void;
  onDivChange: (val: boolean) => void;
  onTimerChange: (val: number) => void;
  onMaxExercisesChange: (val: number) => void;
  labels: {
    mul: string;
    div: string;
    timer: string;
    maxExercises: string;
  };
}

export function SessionOptionsCard({
  includeMul,
  includeDiv,
  timerMinutes,
  maxExercises,
  onMulChange,
  onDivChange,
  onTimerChange,
  onMaxExercisesChange,
  labels,
}: SessionOptionsCardProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6 grid gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center gap-2">
            <Checkbox id="mul-check" checked={includeMul} onCheckedChange={(v) => onMulChange(Boolean(v))} />
            <Label htmlFor="mul-check">{labels.mul}</Label>
          </div>
          <div className="inline-flex items-center gap-2">
            <Checkbox id="div-check" checked={includeDiv} onCheckedChange={(v) => onDivChange(Boolean(v))} />
            <Label htmlFor="div-check">{labels.div}</Label>
          </div>
        </div>

        <LabeledField label={labels.timer} htmlFor="timer-min">
          <NumericInput
            id="timer-min"
            value={timerMinutes}
            onChange={onTimerChange}
            min={0}
            fallbackValue={0}
            showInfinityWhenZero
            className="rounded-xl"
          />
        </LabeledField>

        <LabeledField label={labels.maxExercises} htmlFor="max-ex">
          <NumericInput
            id="max-ex"
            value={maxExercises}
            onChange={onMaxExercisesChange}
            min={0}
            fallbackValue={0}
            showInfinityWhenZero
            className="rounded-xl"
          />
        </LabeledField>
      </CardContent>
    </Card>
  );
}
