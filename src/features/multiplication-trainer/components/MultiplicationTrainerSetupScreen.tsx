import React from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { RangeSettingsCard } from "./Setup/RangeSettingsCard";
import { SessionOptionsCard } from "./Setup/SessionOptionsCard";
import type { Mode } from "../model/trainer.types";

interface MultiplicationTrainerSetupScreenProps {
  minVal: number;
  maxVal: number;
  mode: Mode;
  includeMul: boolean;
  includeDiv: boolean;
  timerMinutes: number;
  maxExercises: number;
  onMinChange: (val: number) => void;
  onMaxChange: (val: number) => void;
  onModeChange: (val: Mode) => void;
  onMulChange: (val: boolean) => void;
  onDivChange: (val: boolean) => void;
  onTimerChange: (val: number) => void;
  onMaxExercisesChange: (val: number) => void;
  onStartClick: () => void;
  labels: {
    introText: React.ReactNode;
    min: string;
    max: string;
    mode: string;
    modeQuiz: string;
    modeInput: string;
    mul: string;
    div: string;
    timer: string;
    maxExercises: string;
    start: string;
    menu: string;
    note: string;
    ariaBackToMenu: string;
  };
  isInteractable: boolean;
}

export function MultiplicationTrainerSetupScreen({
  minVal,
  maxVal,
  mode,
  includeMul,
  includeDiv,
  timerMinutes,
  maxExercises,
  onMinChange,
  onMaxChange,
  onModeChange,
  onMulChange,
  onDivChange,
  onTimerChange,
  onMaxExercisesChange,
  onStartClick,
  labels,
  isInteractable,
}: MultiplicationTrainerSetupScreenProps) {
  return (
    <div className="bg-muted/50 backdrop-blur rounded-2xl shadow-lg p-5 sm:p-8 max-w-4xl mx-auto w-full">
      <p className="text-muted-foreground mb-4">{labels.introText}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <RangeSettingsCard
          minVal={minVal}
          maxVal={maxVal}
          mode={mode}
          onMinChange={onMinChange}
          onMaxChange={onMaxChange}
          onModeChange={onModeChange}
          labels={{
            min: labels.min,
            max: labels.max,
            mode: labels.mode,
            modeQuiz: labels.modeQuiz,
            modeInput: labels.modeInput,
          }}
        />

        <SessionOptionsCard
          includeMul={includeMul}
          includeDiv={includeDiv}
          timerMinutes={timerMinutes}
          maxExercises={maxExercises}
          onMulChange={onMulChange}
          onDivChange={onDivChange}
          onTimerChange={onTimerChange}
          onMaxExercisesChange={onMaxExercisesChange}
          labels={{
            mul: labels.mul,
            div: labels.div,
            timer: labels.timer,
            maxExercises: labels.maxExercises,
          }}
        />
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-2">
        <Button onClick={onStartClick} className="w-full sm:w-auto" disabled={!isInteractable}>
          {labels.start}
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link to="/" aria-label={labels.ariaBackToMenu}>
            {labels.menu}
          </Link>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-3">{labels.note}</p>
    </div>
  );
}
