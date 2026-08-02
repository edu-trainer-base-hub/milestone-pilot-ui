import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { notifier } from "@/services/NotificationService";
import { BidActorLabel } from "@/features/bids/components/BidActorLabel";
import { BidHistoryPagination } from "@/features/bids/components/BidHistoryPagination";
import {
  applyBidUpdateRequest,
  getBidUpdateRequest,
  getBidUpdateRequests,
  rejectBidUpdateRequest,
  resolveBidCorrelation,
} from "../api/bidUpdateRequests";
import type { ChangeResolution, UpdateRequestStatus } from "../model/types";

interface ChangeChoice {
  resolution: ChangeResolution;
  customValue: string;
}

export function BidUpdateRequestsPage() {
  return <BidUpdateRequestsPanel />;
}

interface BidUpdateRequestsPanelProps {
  bidUuid?: string;
  embedded?: boolean;
}

export function BidUpdateRequestsPanel({ bidUuid: lockedBidUuid, embedded = false }: BidUpdateRequestsPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") as UpdateRequestStatus | null) ?? "PENDING";
  const bidUuid = lockedBidUuid ?? params.get("bidUuid") ?? undefined;
  const selectedUuid = params.get("requestUuid");
  const pageParam = embedded ? "reviewPage" : "page";
  const page = Math.max(0, Number(params.get(pageParam) ?? "0") || 0);
  const size = 20;
  const [choices, setChoices] = useState<Record<string, ChangeChoice>>({});

  const listQuery = useQuery({
    queryKey: ["bid-update-requests", status, bidUuid, page],
    queryFn: () => getBidUpdateRequests(status, bidUuid, page, size),
  });
  const detailQuery = useQuery({
    queryKey: ["bid-update-request", selectedUuid],
    queryFn: () => getBidUpdateRequest(selectedUuid as string),
    enabled: !!selectedUuid,
  });
  const request = detailQuery.data;

  useEffect(() => {
    if (!request) return;
    setChoices(
      Object.fromEntries(
        request.changes
          .filter((change) => !change.resolution)
          .map((change) => [change.uuid, { resolution: "KEEP_CURRENT" as ChangeResolution, customValue: "" }])
      )
    );
  }, [request]);

  const refetchOnConflict = (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      notifier.warning(t("bidUpdates.notifications.stale"));
      void detailQuery.refetch();
    } else {
      notifier.error(t("bidUpdates.notifications.error"));
    }
  };
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["bid-update-requests"] });
    void queryClient.invalidateQueries({ queryKey: ["bid-update-request", selectedUuid] });
    void queryClient.invalidateQueries({ queryKey: ["bids"] });
  };
  const applyMutation = useMutation({
    mutationFn: () =>
      applyBidUpdateRequest((request as NonNullable<typeof request>).uuid, {
        version: (request as NonNullable<typeof request>).version,
        changes: (request as NonNullable<typeof request>).changes
          .filter((change) => !change.resolution)
          .map((change) => ({
            changeUuid: change.uuid,
            resolution: choices[change.uuid]?.resolution ?? "KEEP_CURRENT",
            customValue:
              choices[change.uuid]?.resolution === "USE_CUSTOM"
                ? parseCustom(choices[change.uuid]?.customValue ?? "")
                : null,
          })),
      }),
    onSuccess: () => {
      notifier.success(t("bidUpdates.notifications.applied"));
      refresh();
    },
    onError: refetchOnConflict,
  });
  const rejectMutation = useMutation({
    mutationFn: () => rejectBidUpdateRequest((request as NonNullable<typeof request>).uuid, request?.version ?? 0),
    onSuccess: () => {
      notifier.success(t("bidUpdates.notifications.rejected"));
      refresh();
    },
    onError: refetchOnConflict,
  });
  const correlationMutation = useMutation({
    mutationFn: (candidate: string) =>
      resolveBidCorrelation((request as NonNullable<typeof request>).uuid, request?.version ?? 0, candidate),
    onSuccess: () => {
      notifier.success(t("bidUpdates.notifications.correlationResolved"));
      refresh();
    },
    onError: refetchOnConflict,
  });

  const setQueryParam = (key: string, value?: string, resetPage = false) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage) next.delete(pageParam);
    setParams(next);
  };
  const unresolved = useMemo(() => request?.changes.filter((change) => !change.resolution) ?? [], [request]);
  const customMissing = unresolved.some(
    (change) => choices[change.uuid]?.resolution === "USE_CUSTOM" && !choices[change.uuid]?.customValue.trim()
  );

  return (
    <div className={embedded ? "space-y-6" : "space-y-6 p-6"}>
      {!embedded && (
        <div>
          <h1 className="text-3xl font-bold">{t("bidUpdates.title")}</h1>
          <p className="text-muted-foreground">{t("bidUpdates.subtitle")}</p>
        </div>
      )}
      <div className="flex gap-3">
        <Select value={status} onValueChange={(value) => setQueryParam("status", value, true)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["PENDING", "APPLIED", "REJECTED", "SUPERSEDED"] as UpdateRequestStatus[]).map((value) => (
              <SelectItem key={value} value={value}>
                {t(`bidUpdates.status.${value}`)}
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,1.4fr)]">
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("bidUpdates.type")}</TableHead>
                <TableHead>{t("bidUpdates.statusLabel")}</TableHead>
                <TableHead>{t("bidUpdates.correlation")}</TableHead>
                <TableHead>{t("bidUpdates.requestedBy", "Requested by")}</TableHead>
                <TableHead>{t("bidUpdates.created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.data?.items.map((item) => (
                <TableRow
                  key={item.uuid}
                  className="cursor-pointer"
                  data-state={selectedUuid === item.uuid ? "selected" : undefined}
                  onClick={() => setQueryParam("requestUuid", item.uuid)}
                >
                  <TableCell>
                    <Badge variant="outline">{t(`bidUpdates.requestType.${item.requestType}`)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t(`bidUpdates.status.${item.status}`)}</Badge>
                  </TableCell>
                  <TableCell>{t(`bidUpdates.correlationResult.${item.correlationResult}`)}</TableCell>
                  <TableCell>
                    <BidActorLabel actor={item.createdBy} />
                  </TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {listQuery.data && (
            <div className="p-3">
              <BidHistoryPagination
                page={listQuery.data.page}
                size={listQuery.data.size}
                totalElements={listQuery.data.totalElements}
                onPageChange={(nextPage) => setQueryParam(pageParam, String(nextPage))}
              />
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{request ? t("bidUpdates.reviewTitle") : t("bidUpdates.select")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {request && (
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">{t(`bidUpdates.status.${request.status}`)}</Badge>
                <span className="text-sm text-muted-foreground">
                  {t("bidUpdates.requestedBy", "Requested by")}: <BidActorLabel actor={request.createdBy} compact />
                </span>
                {request.resolvedBy && (
                  <span className="text-sm text-muted-foreground">
                    {t("bidUpdates.resolvedBy", "Resolved by")}: <BidActorLabel actor={request.resolvedBy} compact />
                  </span>
                )}
              </div>
            )}
            {request?.status === "SUPERSEDED" && (
              <div className="rounded border p-3 text-sm text-muted-foreground">
                {t("bidUpdates.supersededNotice", {
                  runUuid: request.supersededByParsingRunUuid ?? "—",
                })}
              </div>
            )}
            {request?.requestType === "CORRELATION" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t("bidUpdates.chooseCandidate")}</p>
                {request.candidateBidUuids.map((candidate) => (
                  <Button
                    key={candidate}
                    variant="outline"
                    className="w-full justify-start"
                    disabled={request.status !== "PENDING" || correlationMutation.isPending}
                    onClick={() => correlationMutation.mutate(candidate)}
                  >
                    {candidate}
                  </Button>
                ))}
                <pre className="overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(request.correlationExplanation, null, 2)}
                </pre>
              </div>
            )}
            {request?.requestType === "FIELD_CHANGES" &&
              request.changes.map((change) => (
                <div key={change.uuid} className="space-y-3 rounded-md border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{t(`bids.fields.${change.fieldName}`, change.fieldName)}</div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {t(`bidUpdates.conflict.${change.conflictType}`, change.conflictType)}
                      </Badge>
                      {change.confidence != null && (
                        <Badge variant="outline">{Math.round(change.confidence * 100)}%</Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ValueBox label={t("bidUpdates.current")} value={change.currentValue} />
                    <ValueBox label={t("bidUpdates.proposed")} value={change.proposedValue} />
                  </div>
                  {request.status === "PENDING" && !change.resolution ? (
                    <>
                      <Select
                        value={choices[change.uuid]?.resolution ?? "KEEP_CURRENT"}
                        onValueChange={(value) =>
                          setChoices({
                            ...choices,
                            [change.uuid]: {
                              resolution: value as ChangeResolution,
                              customValue: choices[change.uuid]?.customValue ?? "",
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["ACCEPT_PROPOSED", "KEEP_CURRENT", "USE_CUSTOM"] as ChangeResolution[])
                            .filter((value) => value !== "ACCEPT_PROPOSED" || change.acceptProposedAllowed)
                            .map((value) => (
                              <SelectItem key={value} value={value}>
                                {t(`bidUpdates.resolution.${value}`)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {!change.acceptProposedAllowed && (
                        <p className="text-sm text-muted-foreground">{t("bidUpdates.directAcceptUnavailable")}</p>
                      )}
                      {choices[change.uuid]?.resolution === "USE_CUSTOM" && (
                        <div className="space-y-1">
                          <Label>{t("bidUpdates.customValue")}</Label>
                          <Input
                            value={choices[change.uuid]?.customValue ?? ""}
                            onChange={(event) =>
                              setChoices({
                                ...choices,
                                [change.uuid]: { ...choices[change.uuid], customValue: event.target.value },
                              })
                            }
                          />
                        </div>
                      )}
                    </>
                  ) : change.resolution ? (
                    <Badge>{t(`bidUpdates.resolution.${change.resolution}`)}</Badge>
                  ) : null}
                  {change.sourceExcerpt && (
                    <blockquote className="border-l-2 pl-3 text-sm text-muted-foreground">
                      {change.sourceExcerpt}
                    </blockquote>
                  )}
                </div>
              ))}
            {request?.status === "PENDING" && request.requestType === "FIELD_CHANGES" && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
                  {t("bidUpdates.reject")}
                </Button>
                <Button disabled={applyMutation.isPending || customMissing} onClick={() => applyMutation.mutate()}>
                  {t("bidUpdates.apply")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ValueBox({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded bg-muted p-3">
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(value, null, 2) ?? "—"}</pre>
    </div>
  );
}

function parseCustom(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
