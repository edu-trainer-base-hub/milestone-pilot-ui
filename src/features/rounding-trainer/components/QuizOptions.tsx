import { QuizKeyboardPad } from "@/components/ui/quiz-keyboard-pad";

interface QuizOptionsProps {
  taskId: number;
  options: number[];
  disabled: boolean;
  formatNumber: (value: number) => string;
  onSelect: (value: number) => void;
}

export function QuizOptions({ taskId, options, disabled, formatNumber, onSelect }: QuizOptionsProps) {
  return (
    <QuizKeyboardPad
      taskId={taskId}
      disabled={disabled}
      onSelect={onSelect}
      options={options.map((option, index) => ({
        key: `${taskId}-${index}`,
        value: option,
        label: formatNumber(option),
        ariaLabel: `${option}`,
      }))}
    />
  );
}
