import { AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { Bid } from "../model/types";
import { BidAlertsDialog } from "./BidAlertsDialog";

interface BidReviewBadgesProps {
  bid: Pick<Bid, "requiresReview" | "reviewStatus" | "fieldAlerts">;
  compact?: boolean;
}

export function BidReviewBadges({ bid, compact = false }: BidReviewBadgesProps) {
  const { t } = useTranslation();
  const inReview = bid.reviewStatus === "IN_REVIEW";
  const requiresReview = bid.requiresReview || bid.reviewStatus === "REVIEW_REQUIRED";
  const fieldCount = new Set(bid.fieldAlerts?.map((alert) => alert.fieldName) ?? []).size;
  return (
    <div className={compact ? "flex flex-nowrap items-center gap-2" : "flex flex-wrap items-center gap-2"}>
      {inReview ? (
        <Badge variant="info">
          <Info aria-hidden="true" />
          {t("bids.review.IN_REVIEW")}
        </Badge>
      ) : requiresReview ? (
        <Badge variant="warning">
          <AlertTriangle aria-hidden="true" />
          {t("bids.review.REVIEW_REQUIRED")}
        </Badge>
      ) : null}
      {fieldCount > 0 &&
        (compact ? (
          <BidAlertsDialog alerts={bid.fieldAlerts ?? []} />
        ) : (
          <Badge variant="warning">
            <AlertTriangle aria-hidden="true" />
            {t("bids.review.timestampWarnings", { count: fieldCount })}
          </Badge>
        ))}
      {!inReview && !requiresReview && fieldCount === 0 && <Badge variant="outline">{t("bids.review.NONE")}</Badge>}
    </div>
  );
}
