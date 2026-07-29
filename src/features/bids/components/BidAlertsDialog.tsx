import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { BidFieldAlert } from "../model/timestamp-types";
import { TimestampDetails } from "./TimestampDetails";

export function BidAlertsDialog({ alerts, fieldLabel }: { alerts: BidFieldAlert[]; fieldLabel?: string }) {
  const { t } = useTranslation();
  const alertsByField = new Map<string, BidFieldAlert[]>();
  for (const alert of alerts) {
    const fieldAlerts = alertsByField.get(alert.fieldName) ?? [];
    fieldAlerts.push(alert);
    alertsByField.set(alert.fieldName, fieldAlerts);
  }
  const title = fieldLabel
    ? t("bids.review.fieldWarnings", { field: fieldLabel })
    : t("bids.review.timestampWarnings", { count: alertsByField.size });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={title}
          title={title}
          className="size-7 border border-yellow-300 bg-yellow-100 text-yellow-900 hover:bg-yellow-200 hover:text-yellow-950 dark:border-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-200 dark:hover:bg-yellow-900 dark:hover:text-yellow-100"
        >
          <AlertTriangle aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("bids.review.timestampWarningsDescription")}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto pr-1 whitespace-normal">
          {Array.from(alertsByField, ([fieldName, alerts]) => (
            <section key={fieldName}>
              <h3 className="text-sm font-medium">{t(`bids.fields.${fieldName}`, fieldName)}</h3>
              {alerts.map((alert) => (
                <TimestampDetails
                  key={alert.changeUuid}
                  normalization={alert.timestampNormalization}
                  updateRequestUuid={alert.updateRequestUuid}
                  provisionallyApplied={alert.provisionallyApplied}
                />
              ))}
            </section>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t("bids.review.closeWarnings")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
