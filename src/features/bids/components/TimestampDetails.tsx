import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { TimestampNormalization } from "../model/timestamp-types";

interface TimestampDetailsProps {
  normalization: TimestampNormalization;
  updateRequestUuid?: string;
  provisionallyApplied?: boolean;
  inactive?: boolean;
}

export function TimestampDetails({
  normalization,
  updateRequestUuid,
  provisionallyApplied = false,
  inactive = false,
}: TimestampDetailsProps) {
  const { t } = useTranslation();
  const unclear = !inactive && (normalization.assumptions.length > 0 || normalization.unresolvedReasons.length > 0);
  return (
    <Alert variant={unclear ? "warning" : "default"} className="mt-2 min-w-0" role={unclear ? "alert" : "note"}>
      {unclear ? <AlertTriangle className="size-4" /> : <Info className="size-4" />}
      <AlertTitle>{t(unclear ? "bidTimestamps.reviewRequired" : "bidTimestamps.details")}</AlertTitle>
      <AlertDescription className="space-y-2 break-words">
        {provisionallyApplied && !inactive && <p>{t("bidTimestamps.provisional")}</p>}
        <dl className="space-y-1 text-xs">
          <Detail label={t("bidTimestamps.sourceText")} value={normalization.sourceText} />
          <Detail label={t("bidTimestamps.rawValue")} value={normalization.rawValue} />
          <Detail label={t("bidTimestamps.sourceTimezone")} value={normalization.sourceTimezone} />
          <Detail label={t("bidTimestamps.timezoneUsed")} value={normalization.timezoneUsed} />
          <Detail label={t("bidTimestamps.resolvedValue")} value={normalization.resolvedValue} />
        </dl>
        {[...normalization.assumptions, ...normalization.unresolvedReasons].map((reason) => (
          <p key={reason}>{t(`bidTimestamps.reasons.${reason}`, reason)}</p>
        ))}
        {updateRequestUuid && (
          <Link className="font-medium underline" to={`/tenant/bid-update-requests?requestUuid=${updateRequestUuid}`}>
            {t("bidTimestamps.reviewAction")}
          </Link>
        )}
      </AlertDescription>
    </Alert>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return value ? (
    <div>
      <dt className="inline font-medium">{label}: </dt>
      <dd className="inline">{value}</dd>
    </div>
  ) : null;
}
