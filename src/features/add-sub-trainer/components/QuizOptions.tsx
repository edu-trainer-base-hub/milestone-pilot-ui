import { useMemo } from "react";
import { QuizKeyboardPad } from "@/components/ui/quiz-keyboard-pad";
import { generateOptions } from "../lib/quiz-options";

export function QuizOptions({
  correctAnswer,
  disabled,
  onSelect,
}: {
  correctAnswer: number;
  disabled: boolean;
  onSelect: (val: number) => void;
}) {
  const options = useMemo(() => generateOptions(correctAnswer), [correctAnswer]);

  return (
    <QuizKeyboardPad
      taskId={correctAnswer}
      disabled={disabled}
      onSelect={onSelect}
      options={options.map((option, index) => ({
        key: `${correctAnswer}-${index}`,
        value: option,
      }))}
    />
  );
}
