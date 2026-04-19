import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AnswerInputProps {
  answer: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
  submitLabel: string;
  hintLabel: string;
  ariaLabel?: string;
}

export const AnswerInput = React.forwardRef<HTMLInputElement | null, AnswerInputProps>(
  ({ answer, onChange, onSubmit, disabled, placeholder, submitLabel, hintLabel, ariaLabel }, ref) => {
    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const val = e.target.value;
      // Allow only digits or an empty string
      if (val !== "" && !/^\d+$/.test(val)) return;
      onChange(val);
    }

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-3">
          <Input
            ref={ref}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={placeholder}
            aria-label={ariaLabel}
            value={answer}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            disabled={disabled}
            className="w-40 text-center text-2xl sm:text-3xl rounded-xl"
          />
          <Button onClick={() => onSubmit()} disabled={disabled} className="text-lg">
            {submitLabel}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{hintLabel}</p>
      </div>
    );
  }
);
AnswerInput.displayName = "AnswerInput";
