import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AnswerInputProps {
  value: string;
  disabled: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function AnswerInput({ value, disabled, inputRef, onChange, onSubmit, onKeyDown }: AnswerInputProps) {
  const { t } = useTranslation();

  return (
    <>
      <Input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        placeholder={t("roundT.input.placeholder")}
        aria-label={t("roundT.input.placeholder")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className="w-48 text-center text-2xl sm:text-3xl rounded-xl"
      />
      <Button onClick={onSubmit} disabled={disabled} className="text-lg">
        {t("roundT.input.submit")}
      </Button>
    </>
  );
}
