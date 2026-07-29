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
import { getBidParsingRun, getBidParsingRuns, retryBidParsingRun } from "../api/bidParsing";

export function BidParsingRunsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(params.get("runUuid"));
  const executionStatus = params.get("executionStatus") ?? undefined;
  const bidUuid = params.get("bidUuid") ?? undefined;
  const runsQuery = useQuery({
    queryKey: ["bid-parsing-runs", executionStatus, bidUuid],
    queryFn: () => getBidParsingRuns(0, 100, { executionStatus, bidUuid }),
  });
  const detailQuery = useQuery({
    queryKey: ["bid-parsing-run", selectedUuid],
    queryFn: () => getBidParsingRun(selectedUuid as string),
    enabled: !!selectedUuid,
  });
  const retryMutation = useMutation({
    mutationFn: (uuid: string) => retryBidParsingRun(uuid),
    onSuccess: (result) => {
      notifier.success(t("bidParsing.notifications.retried"));
      setSelectedUuid(result.parsingRunUuid);
      void queryClient.invalidateQueries({ queryKey: ["bid-parsing-runs"] });
    },
    onError: () => notifier.error(t("bidParsing.notifications.error")),
  });

  const setFilter = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === "ALL") next.delete("executionStatus");
    else next.set("executionStatus", value);
    setParams(next);
  };
  const select = (uuid: string) => {
    setSelectedUuid(uuid);
    const next = new URLSearchParams(params);
    next.set("runUuid", uuid);
    setParams(next);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">{t("bidParsing.title")}</h1>
        <p className="text-muted-foreground">{t("bidParsing.subtitle")}</p>
      </div>
      <div className="flex gap-3">
        <Select value={executionStatus ?? "ALL"} onValueChange={setFilter}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("bidParsing.allStatuses")}</SelectItem>
            {["COMPLETED", "NOT_A_BID", "PROVIDER_FAILED", "SCHEMA_VALIDATION_FAILED", "VALIDATION_FAILED"].map(
              (status) => (
                <SelectItem key={status} value={status}>
                  {t(`bidParsing.status.${status}`)}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        {bidUuid && (
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
                <TableHead>{t("bidParsing.created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runsQuery.data?.items.map((run) => (
                <TableRow key={run.uuid} className="cursor-pointer" onClick={() => select(run.uuid)}>
                  <TableCell>
                    <Badge variant="outline">{t(`bidParsing.status.${run.executionStatus}`)}</Badge>
                  </TableCell>
                  <TableCell>{run.messageType ? t(`bidParsing.messageType.${run.messageType}`) : "—"}</TableCell>
                  <TableCell>{run.aiModel ?? "—"}</TableCell>
                  <TableCell>{new Date(run.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                <pre className="max-h-[520px] overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(detailQuery.data.normalizedResult, null, 2)}
                </pre>
                {detailQuery.data.executionStatus !== "PROCESSING" && (
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
