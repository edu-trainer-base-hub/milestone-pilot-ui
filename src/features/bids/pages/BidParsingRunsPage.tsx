import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notifier } from "@/services/NotificationService";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { BidActorLabel } from "../components/BidActorLabel";
import { BidHistoryPagination } from "../components/BidHistoryPagination";
import { getBidParsingRun, getBidParsingRuns, retryBidParsingRun } from "../api/bidParsing";
import type { BidEmailProcessingResult } from "../model/parsing-types";

export function BidParsingRunsPage() {
  return <BidParsingRunsPanel />;
}

interface BidParsingRunsPanelProps {
  bidUuid?: string;
  embedded?: boolean;
}

export function BidParsingRunsPanel({ bidUuid: lockedBidUuid, embedded = false }: BidParsingRunsPanelProps) {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(params.get("runUuid"));
  const [retryResult, setRetryResult] = useState<BidEmailProcessingResult | null>(null);
  const executionStatus = params.get("executionStatus") ?? undefined;
  const outcome = params.get("outcome") ?? undefined;
  const bidUuid = lockedBidUuid ?? params.get("bidUuid") ?? undefined;
  const pageParam = embedded ? "parsingPage" : "page";
  const page = Math.max(0, Number(params.get(pageParam) ?? "0") || 0);
  const size = 20;
  const canRetry = Boolean(principal?.authorities?.includes(Authority.TENANT_BIDS_PROCESS_EMAIL));
  const runsQuery = useQuery({
    queryKey: ["bid-parsing-runs", executionStatus, outcome, bidUuid, page],
    queryFn: () => getBidParsingRuns(page, size, { executionStatus, outcome, bidUuid }),
  });
  const detailQuery = useQuery({
    queryKey: ["bid-parsing-run", selectedUuid],
    queryFn: () => getBidParsingRun(selectedUuid as string),
    enabled: !!selectedUuid,
  });
  const retryMutation = useMutation({
    mutationFn: (uuid: string) => retryBidParsingRun(uuid),
    onSuccess: (result) => {
      const hasChanges = !!result.updateRequestUuid;
      const noDifferences =
        result.executionStatus === "COMPLETED" &&
        result.parsingOutcome === "BID_IDENTIFIED" &&
        !result.updateRequestUuid;
      notifier.success(
        t(
          hasChanges
            ? "bidParsing.notifications.retriedWithChanges"
            : noDifferences
              ? "bidParsing.notifications.retriedNoChanges"
              : "bidParsing.notifications.retried"
        )
      );
      setRetryResult(result);
      setSelectedUuid(result.parsingRunUuid);
      const next = new URLSearchParams(params);
      next.set("runUuid", result.parsingRunUuid);
      setParams(next);
      void queryClient.invalidateQueries({ queryKey: ["bid-parsing-runs"] });
      void queryClient.invalidateQueries({ queryKey: ["bid-parsing-run", result.parsingRunUuid] });
    },
    onError: () => notifier.error(t("bidParsing.notifications.error")),
  });

  const setFilter = (key: "executionStatus" | "outcome", value: string) => {
    const next = new URLSearchParams(params);
    if (value === "ALL") next.delete(key);
    else next.set(key, value);
    next.delete(pageParam);
    setParams(next);
  };
  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(params);
    next.set(pageParam, String(nextPage));
    setParams(next);
  };
  const select = (uuid: string) => {
    setRetryResult(null);
    setSelectedUuid(uuid);
    const next = new URLSearchParams(params);
    next.set("runUuid", uuid);
    setParams(next);
  };

  return (
    <div className={embedded ? "space-y-6" : "space-y-6 p-6"}>
      {!embedded && (
        <div>
          <h1 className="text-3xl font-bold">{t("bidParsing.title")}</h1>
          <p className="text-muted-foreground">{t("bidParsing.subtitle")}</p>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Select value={executionStatus ?? "ALL"} onValueChange={(value) => setFilter("executionStatus", value)}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("bidParsing.allStatuses")}</SelectItem>
            {[
              "PROCESSING",
              "COMPLETED",
              "NOT_A_BID",
              "SOURCE_RETRIEVAL_FAILED",
              "PROVIDER_FAILED",
              "SCHEMA_VALIDATION_FAILED",
              "VALIDATION_FAILED",
            ].map((status) => (
              <SelectItem key={status} value={status}>
                {t(`bidParsing.status.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={outcome ?? "ALL"} onValueChange={(value) => setFilter("outcome", value)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("bidParsing.allOutcomes")}</SelectItem>
            {["BID_IDENTIFIED", "NOT_A_BID", "FAILED"].map((value) => (
              <SelectItem key={value} value={value}>
                {t(`bidParsing.outcome.${value}`, value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {bidUuid && !embedded && (
          <Button variant="outline" asChild>
            <Link to={`/tenant/bids/${bidUuid}`}>{t("bids.backToBid")}</Link>
          </Button>
        )}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,1fr)]">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("bidParsing.statusLabel")}</TableHead>
                <TableHead>{t("bidParsing.type")}</TableHead>
                <TableHead>{t("bidParsing.model")}</TableHead>
                <TableHead>{t("bidParsing.requestedBy", "Requested by")}</TableHead>
                <TableHead>{t("bidParsing.created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runsQuery.data?.items.map((run) => (
                <TableRow
                  key={run.uuid}
                  className="cursor-pointer"
                  data-state={selectedUuid === run.uuid ? "selected" : undefined}
                  onClick={() => select(run.uuid)}
                >
                  <TableCell>
                    <Badge variant="outline">{t(`bidParsing.status.${run.executionStatus}`)}</Badge>
                  </TableCell>
                  <TableCell>{run.messageType ? t(`bidParsing.messageType.${run.messageType}`) : "—"}</TableCell>
                  <TableCell>{run.aiModel ?? "—"}</TableCell>
                  <TableCell>
                    <BidActorLabel actor={run.requestedBy} />
                  </TableCell>
                  <TableCell>{new Date(run.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {runsQuery.data && (
            <div className="p-3">
              <BidHistoryPagination
                page={runsQuery.data.page}
                size={runsQuery.data.size}
                totalElements={runsQuery.data.totalElements}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{detailQuery.data ? t("bidParsing.detail") : t("bidParsing.select")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detailQuery.data && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge>{t(`bidParsing.status.${detailQuery.data.executionStatus}`)}</Badge>
                  {detailQuery.data.inputTruncated && <Badge variant="outline">{t("bidParsing.truncated")}</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("bidParsing.requestedBy", "Requested by")}:{" "}
                  <BidActorLabel actor={detailQuery.data.requestedBy} compact />
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">{t("bidParsing.provider")}</dt>
                    <dd>{detailQuery.data.aiProvider ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("bidParsing.model")}</dt>
                    <dd>{detailQuery.data.aiModel ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("bidParsing.duration")}</dt>
                    <dd>{detailQuery.data.durationMs ?? "—"} ms</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("bidParsing.attachments")}</dt>
                    <dd>
                      {detailQuery.data.attachmentsProcessed} / {detailQuery.data.attachmentsSkipped}
                    </dd>
                  </div>
                </dl>
                {detailQuery.data.errorMessage && (
                  <div className="rounded border border-destructive p-3 text-sm text-destructive">
                    {detailQuery.data.errorMessage}
                  </div>
                )}
                {detailQuery.data.warnings.map((warning) => (
                  <div key={warning} className="rounded border p-2 text-sm">
                    {warning}
                  </div>
                ))}
                {retryResult?.parsingRunUuid === detailQuery.data.uuid &&
                  retryResult.executionStatus === "COMPLETED" &&
                  retryResult.parsingOutcome === "BID_IDENTIFIED" && (
                    <div className="space-y-3 rounded border p-3 text-sm">
                      <p>
                        {t(
                          retryResult.updateRequestUuid
                            ? "bidParsing.retryResult.changes"
                            : "bidParsing.retryResult.noDifferences"
                        )}
                      </p>
                      {retryResult.updateRequestUuid && (
                        <Button asChild>
                          <Link to={`/tenant/bid-update-requests?requestUuid=${retryResult.updateRequestUuid}`}>
                            {t("bidParsing.reviewChanges")}
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                <pre className="max-h-[520px] overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(detailQuery.data.normalizedResult, null, 2)}
                </pre>
                {canRetry && detailQuery.data.executionStatus !== "PROCESSING" && (
                  <Button
                    variant="outline"
                    disabled={retryMutation.isPending}
                    onClick={() => retryMutation.mutate(detailQuery.data.uuid)}
                  >
                    {t("bidParsing.retry")}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
