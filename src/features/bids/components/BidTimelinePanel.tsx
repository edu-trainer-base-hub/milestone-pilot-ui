import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBidTimeline } from "../api/bids";
import { BidActorLabel } from "./BidActorLabel";
import { BidHistoryPagination } from "./BidHistoryPagination";

export function BidTimelinePanel({ bidUuid }: { bidUuid: string }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const size = 20;
  const query = useQuery({
    queryKey: ["bid-timeline", bidUuid, page],
    queryFn: () => getBidTimeline(bidUuid, { page, size }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("bids.sections.timeline")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isLoading && <div className="text-muted-foreground">{t("common.loading", "Loading…")}</div>}
        {query.isError && (
          <div className="text-destructive">{t("bids.historyLoadError", "History could not be loaded.")}</div>
        )}
        {query.data?.items.map((activity) => (
          <article key={activity.uuid} className="space-y-2 border-l-2 pl-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-medium">{activity.summary}</div>
              <Badge variant="outline">{t(`bids.activity.${activity.activityType}`, activity.activityType)}</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(activity.occurredAt).toLocaleString()} · <BidActorLabel actor={activity.actor} compact />
            </div>
            <div className="flex flex-wrap gap-2">
              {activity.updateRequestUuid && (
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link to={`?tab=reviews&requestUuid=${activity.updateRequestUuid}`}>{t("bids.openReview")}</Link>
                </Button>
              )}
              {activity.parsingRunUuid && (
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link to={`?tab=parsing&runUuid=${activity.parsingRunUuid}`}>{t("bids.openParsingRun")}</Link>
                </Button>
              )}
              {activity.sourceEmailUuid && (
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link to={`?tab=evidence&sourceEmailUuid=${activity.sourceEmailUuid}`}>{t("bids.openEvidence")}</Link>
                </Button>
              )}
            </div>
          </article>
        ))}
        {!query.isLoading && !query.data?.items.length && (
          <div className="text-muted-foreground">{t("bids.noTimeline")}</div>
        )}
        {query.data && (
          <BidHistoryPagination
            page={query.data.page}
            size={query.data.size}
            totalElements={query.data.totalElements}
            onPageChange={setPage}
          />
        )}
      </CardContent>
    </Card>
  );
}
