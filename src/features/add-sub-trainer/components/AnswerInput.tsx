import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AnswerInput({
  onSubmit,
  placeholder,
  ariaLabel,
  taskId,
  disabled,
  tr,
}: {
  onSubmit: (val: string) => void;
  placeholder: string;
  ariaLabel?: string;
  taskId: number;
  disabled: boolean;
  tr: any;
}) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVal("");
    if (!disabled) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [taskId, disabled]);

  const handleSubmit = () => {
    if (val.trim() !== "") {
      onSubmit(val.trim());
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <>
      <Input
        ref={inputRef}
        type="number"
        inputMode="numeric"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        className="text-lg w-40"
      />
      <Button onClick={handleSubmit} disabled={disabled}>
        {tr("play.submit")}
      </Button>
    </>
  );
}
