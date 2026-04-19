import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type NotificationVariant = "success" | "error" | "info" | "warning" | "muted";

export interface NotificationPayload {
  message: React.ReactNode;
  variant: NotificationVariant;
}

const NOTIFICATION_STYLES: Record<NotificationVariant, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  info: "border-primary/30 bg-primary/10 text-primary",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  muted: "border-muted-foreground/30 bg-muted/50 text-muted-foreground",
};

type AlertProps = React.ComponentProps<typeof Alert>;

interface NotificationBannerProps extends Omit<AlertProps, "variant"> {
  variant?: NotificationVariant;
  children: React.ReactNode;
}

export function NotificationBanner({ variant = "info", children, className, ...alertProps }: NotificationBannerProps) {
  return (
    <Alert
      {...alertProps}
      className={cn(
        "flex flex-col items-center justify-center px-4 py-3 text-center",
        NOTIFICATION_STYLES[variant],
        className
      )}
    >
      <AlertDescription className="text-sm font-medium">{children}</AlertDescription>
    </Alert>
  );
}
