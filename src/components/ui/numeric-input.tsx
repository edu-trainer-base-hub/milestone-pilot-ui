import React from "react";
import { Input } from "@/components/ui/input";

/**
 * A reusable numeric input wrapper that:
 * - Uses type="text" for cross-browser and mobile keyboard compatibility.
 * - Allows the user to clear "0" and freely type any other digit.
 * - When `showInfinityWhenZero` is true (default: false):
 *     - Displays an empty input with a "∞" placeholder when value is 0.
 *     - This signals the field is "unlimited" and 0 === no limit.
 *     - When the user clears the field and blurs, it returns to value 0 (∞).
 * - On blur, defaults to `fallbackValue` (default: 0) when field is left empty or non-numeric.
 * - Restricts input to digit characters only (and "-" if allowNegative is true).
 */
interface NumericInputProps {
    id?: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    fallbackValue?: number;
    showInfinityWhenZero?: boolean;
    allowNegative?: boolean;
    className?: string;
    disabled?: boolean;
    "aria-label"?: string;
}

/** Converts `value` to the raw string to display in the input field. */
function toRaw(value: number, showInfinityWhenZero: boolean): string {
    if (showInfinityWhenZero && value === 0) return "";
    return String(value);
}

export function NumericInput({
    id,
    value,
    onChange,
    min = 0,
    fallbackValue = 0,
    showInfinityWhenZero = false,
    allowNegative = false,
    className,
    disabled,
    "aria-label": ariaLabel,
}: NumericInputProps) {
    // The raw string shown in the input (so the user can erase "0" and type "5")
    const [raw, setRaw] = React.useState(() => toRaw(value, showInfinityWhenZero));

    // Sync when the controlled `value` prop changes externally (e.g., stateReplaced from teacher)
    React.useEffect(() => {
        const parsed = parseInt(raw, 10);
        const rawAsValue = showInfinityWhenZero && raw === "" ? 0 : parsed;
        if (Number.isNaN(rawAsValue) || rawAsValue !== value) {
            setRaw(toRaw(value, showInfinityWhenZero));
        }
    }, [value]); // intentionally omit `raw` to avoid overriding mid-type

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const inputVal = e.target.value;
        // Allow digits, or empty string, or leading minus if allowNegative
        if (inputVal !== "") {
            if (allowNegative) {
                if (!/^-?\d*$/.test(inputVal)) return;
            } else {
                if (!/^\d+$/.test(inputVal)) return;
            }
        }
        setRaw(inputVal);
        // Update domain state immediately while typing (only on valid number)
        const parsed = parseInt(inputVal, 10);
        if (!Number.isNaN(parsed)) {
            const effectiveMin = allowNegative ? (min === 0 ? -Infinity : min) : min;
            onChange(Math.max(effectiveMin, parsed));
        } else if (inputVal === "" && showInfinityWhenZero) {
            // Empty field in ∞ mode means "unlimited" = 0
            onChange(fallbackValue);
        }
    }

    function handleBlur() {
        const parsed = parseInt(raw, 10);
        const effectiveMin = allowNegative ? (min === 0 ? -Infinity : min) : min;
        const safeValue = Number.isFinite(parsed) ? Math.max(effectiveMin, parsed) : fallbackValue;
        setRaw(toRaw(safeValue, showInfinityWhenZero));
        onChange(safeValue);
    }

    return (
        <Input
            id={id}
            type="text"
            inputMode={allowNegative ? "text" : "numeric"}
            pattern={allowNegative ? undefined : "[0-9]*"}
            value={raw}
            placeholder={showInfinityWhenZero && raw === "" ? "∞" : undefined}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            aria-label={ariaLabel}
            className={className}
        />
    );
}
