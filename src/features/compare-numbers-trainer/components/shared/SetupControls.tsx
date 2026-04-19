import React from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ModeKey } from "../../model/trainer.types";

interface TypeCardProps {
  id: string;
  value: ModeKey;
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (checked: boolean) => void;
  children: React.ReactNode;
  showAvailabilityError: boolean;
  availabilityText: string | null;
}

export function TypeCard({
  id,
  value,
  title,
  description,
  enabled,
  onEnabledChange,
  children,
  showAvailabilityError,
  availabilityText,
}: TypeCardProps) {
  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur"
    >
      <AccordionTrigger className="px-3 py-3 text-left text-sm font-medium hover:no-underline data-[state=open]:bg-muted/40 sm:px-5 sm:py-4 sm:text-base">
        <div className="flex w-full items-center gap-3">
          <Checkbox
            id={`${id}-toggle`}
            checked={enabled}
            onCheckedChange={(checked) => onEnabledChange(Boolean(checked))}
            aria-label={title}
            className="shrink-0"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          />
          <div className="flex-1 text-left">
            <div className="text-sm font-semibold leading-tight sm:text-base">{title}</div>
            <p className="text-xs leading-snug text-muted-foreground sm:text-sm">{description}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-4 sm:px-5">
        <fieldset disabled={!enabled} className={cn("space-y-3 pt-3 sm:space-y-5 sm:pt-4", !enabled && "opacity-60")}>
          {children}
        </fieldset>
        {showAvailabilityError && availabilityText && (
          <p className="pt-3 text-xs font-medium text-destructive">{availabilityText}</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

interface LabeledFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

export function LabeledField({ label, htmlFor, children }: LabeledFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

interface GapFieldsProps {
  idPrefix: string;
  minValue: number;
  maxValue: number | null;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number | null) => void;
  labelMin: string;
  labelMax: string;
  disabled?: boolean;
}

export function GapFields({
  idPrefix,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  labelMin,
  labelMax,
  disabled = false,
}: GapFieldsProps) {
  const minId = `${idPrefix}-gap-min`;
  const maxId = `${idPrefix}-gap-max`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <LabeledField label={labelMin} htmlFor={minId}>
        <Input
          id={minId}
          type="number"
          min={0}
          step="0.1"
          value={minValue}
          disabled={disabled}
          onChange={(event) => {
            const value = Number(event.target.value);
            onMinChange(Number.isFinite(value) ? Math.max(0, value) : 0);
          }}
        />
      </LabeledField>
      <LabeledField label={labelMax} htmlFor={maxId}>
        <Input
          id={maxId}
          type="number"
          min={0}
          step="0.1"
          value={maxValue ?? ""}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.value === "") {
              onMaxChange(null);
              return;
            }
            const value = Number(event.target.value);
            onMaxChange(Number.isFinite(value) ? Math.max(0, value) : null);
          }}
          placeholder="∞"
        />
      </LabeledField>
    </div>
  );
}

interface WeightFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}

export function WeightField({ value, onChange, label, disabled = false }: WeightFieldProps) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full"
        />
        <Input
          type="number"
          min={0}
          max={100}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            const numeric = Number(event.target.value);
            onChange(Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : value);
          }}
          className="w-20"
        />
      </div>
    </div>
  );
}

interface ToggleRowProps {
  id: string;
  label: string | null;
  description: string | null;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm sm:px-3 sm:py-2.5">
      <div className="flex-1">
        <div className="font-medium leading-tight">{label}</div>
        {description && <p className="text-xs text-muted-foreground leading-snug">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={(value) => onChange(Boolean(value))} />
    </div>
  );
}
