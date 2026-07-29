import type { ReactNode } from "react";
import { AlertTriangle, CircleCheck, CircleX, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { bidSignalSeverity, type BidSignalKind } from "../model/status-severity";

export function BidSignalBadge({
  kind,
  value,
  children,
}: {
  kind: BidSignalKind;
  value: string;
  children?: ReactNode;
}) {
  const variant = bidSignalSeverity(kind, value);
  const Icon = { warning: AlertTriangle, info: Info, success: CircleCheck, destructive: CircleX, outline: null }[
    variant
  ];
  return (
    <Badge variant={variant}>
      {Icon && <Icon aria-hidden="true" />}
      {children ?? value}
    </Badge>
  );
}
