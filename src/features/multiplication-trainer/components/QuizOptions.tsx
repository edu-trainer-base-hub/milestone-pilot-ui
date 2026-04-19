import { QuizKeyboardPad } from "@/components/ui/quiz-keyboard-pad";

interface QuizOptionsProps {
  options: number[];
  onSelect: (val: number) => void;
  disabled: boolean;
  getAriaLabel: (opt: number) => string;
  taskId: number;
}

export function QuizOptions({ options, onSelect, disabled, getAriaLabel, taskId }: QuizOptionsProps) {
  return (
    <QuizKeyboardPad
      taskId={taskId}
      disabled={disabled}
      onSelect={onSelect}
      options={options.map((option, index) => ({
        key: `${taskId}-${index}`,
        value: option,
        ariaLabel: getAriaLabel(option),
      }))}
    />
  );
}
