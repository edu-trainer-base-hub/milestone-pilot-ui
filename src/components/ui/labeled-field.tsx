import React from "react";
import { Label } from "@/components/ui/label";

export function LabeledField({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={htmlFor}>{label}:</Label>
            {children}
        </div>
    );
}
