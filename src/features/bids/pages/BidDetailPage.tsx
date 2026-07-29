import { useEffect, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBid, getBidAudit, getBidSourceEmails, getBidTimeline, transitionBid, updateBid } from "../api/bids";
import { canUpdateBids, canViewBidAudit } from "../model/access-policy";
import { BidPriority, type Bid, type BidStatus as BidStatusValue } from "../model/types";

const transitions: Partial<Record<BidStatusValue, BidStatusValue[]>> = {
  NEW: ["QUALIFYING", "PURSUING", "NOT_PURSUING", "CANCELLED", "ARCHIVED"],
  QUALIFYING: ["PURSUING", "NOT_PURSUING", "CANCELLED"],
  PURSUING: ["PREPARING", "NOT_PURSUING", "CANCELLED"],
  PREPARING: ["READY_TO_SUBMIT", "NOT_PURSUING", "CANCELLED"],
  READY_TO_SUBMIT: ["SUBMITTED", "PREPARING", "CANCELLED"],
  SUBMITTED: ["AWARDED", "LOST", "CANCELLED"],
  AWARDED: ["ARCHIVED"],
  LOST: ["ARCHIVED"],
  EXPIRED: ["ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
};

interface EditDraft {
  projectName: string;
  priority: Bid["priority"];
  issuerCompanyName: string;
  bidDueAt: string;
  scopeSummary: string;
  managerNotes: string;
}

const toLocalDateTime = (value: string | null) => (value ? value.slice(0, 16) : "");

export function BidDetailPage() {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const { bidUuid = "" } = useParams();
  const queryClient = useQueryClient();
  const bidQuery = useQuery({ queryKey: ["bid", bidUuid], queryFn: () => getBid(bidUuid), enabled: !!bidUuid });
  const timelineQuery = useQuery({
    queryKey: ["bid-timeline", bidUuid],
    queryFn: () => getBidTimeline(bidUuid),
    enabled: !!bidUuid,
  });
  const auditQuery = useQuery({
    queryKey: ["bid-audit", bidUuid],
    queryFn: () => getBidAudit(bidUuid),
    enabled: !!bidUuid && canViewBidAudit(principal?.authorities),
  });
  const sourceEmailsQuery = useQuery({
    queryKey: ["bid-source-emails", bidUuid],
    queryFn: () => getBidSourceEmails(bidUuid),
    enabled: !!bidUuid,
  });
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [nextStatus, setNextStatus] = useState<BidStatusValue | "">("");

  useEffect(() => {
    if (bidQuery.data) {
      setDraft({
        projectName: bidQuery.data.projectName,
        priority: bidQuery.data.priority,
        issuerCompanyName: bidQuery.data.issuerCompanyName ?? "",
        bidDueAt: toLocalDateTime(bidQuery.data.bidDueAt),
        scopeSummary: bidQuery.data.scopeSummary ?? "",
        managerNotes: bidQuery.data.managerNotes ?? "",
      });
    }
  }, [bidQuery.data]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["bid", bidUuid] });
    void queryClient.invalidateQueries({ queryKey: ["bid-timeline", bidUuid] });
    void queryClient.invalidateQueries({ queryKey: ["bid-audit", bidUuid] });
    void queryClient.invalidateQueries({ queryKey: ["bids"] });
  };
  const handleConflict = (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      notifier.warning(t("bids.notifications.stale"));
      refresh();
    } else {
      notifier.error(t("bids.notifications.updateError"));
    }
  };
  const updateMutation = useMutation({
    mutationFn: () =>
      updateBid(bidUuid, {
        version: (bidQuery.data as Bid).version,
        projectName: (draft as EditDraft).projectName,
        priority: (draft as EditDraft).priority,
        issuerCompanyName: (draft as EditDraft).issuerCompanyName,
        bidDueAt: (draft as EditDraft).bidDueAt ? new Date((draft as EditDraft).bidDueAt).toISOString() : undefined,
        scopeSummary: (draft as EditDraft).scopeSummary,
        managerNotes: (draft as EditDraft).managerNotes,
      }),
    onSuccess: () => {
      notifier.success(t("bids.notifications.updated"));
      refresh();
    },
    onError: handleConflict,
  });
  const transitionMutation = useMutation({
    mutationFn: (status: BidStatusValue) => transitionBid(bidUuid, (bidQuery.data as Bid).version, status),
    onSuccess: () => {
      setNextStatus("");
      notifier.success(t("bids.notifications.transitioned"));
      refresh();
    },
    onError: handleConflict,
  });

  const bid = bidQuery.data;
  if (bidQuery.isLoading) return <div className="p-6">{t("common.loading", "Loading…")}</div>;
  if (!bid || !draft) return <div className="p-6 text-destructive">{t("bids.notFound")}</div>;
  const sourceByField = new Map(bid.fieldSources.map((source) => [source.fieldName, source]));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link to="/tenant/bids">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{bid.projectName}</h1>
            <Badge variant="outline">{t(`bids.status.${bid.status}`)}</Badge>
            {bid.requiresReview && <Badge>{t("bids.review.REVIEW_REQUIRED")}</Badge>}
          </div>
          <p className="text-muted-foreground">{bid.issuerCompanyName ?? t("bids.noIssuer")}</p>
        </div>
        <div className="flex-1" />
        <Button variant="outline" asChild>
          <Link to={`/tenant/bid-update-requests?bidUuid=${bid.uuid}`}>{t("bids.reviewRequests")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/tenant/bid-parsing-runs?bidUuid=${bid.uuid}`}>{t("bids.parsingHistory")}</Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("bids.sections.overview")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <EditableField
              label={t("bids.fields.projectName")}
              value={draft.projectName}
              provenance={sourceByField.get("projectName")?.sourceType}
              disabled={!canUpdateBids(principal?.authorities)}
              onChange={(value) => setDraft({ ...draft, projectName: value })}
            />
            <div className="space-y-1">
              <Label>{t("bids.fields.priority")}</Label>
              <Select
                disabled={!canUpdateBids(principal?.authorities)}
                value={draft.priority}
                onValueChange={(value) => setDraft({ ...draft, priority: value as Bid["priority"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(BidPriority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {t(`bids.priority.${priority}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <EditableField
              label={t("bids.fields.issuer")}
              value={draft.issuerCompanyName}
              provenance={sourceByField.get("issuerCompanyName")?.sourceType}
              disabled={!canUpdateBids(principal?.authorities)}
              onChange={(value) => setDraft({ ...draft, issuerCompanyName: value })}
            />
            <EditableField
              label={t("bids.fields.deadline")}
              type="datetime-local"
              value={draft.bidDueAt}
              provenance={sourceByField.get("bidDueAt")?.sourceType}
              disabled={!canUpdateBids(principal?.authorities)}
              onChange={(value) => setDraft({ ...draft, bidDueAt: value })}
            />
            <div className="space-y-1 md:col-span-2">
              <Label>{t("bids.fields.scope")}</Label>
              <textarea
                className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                disabled={!canUpdateBids(principal?.authorities)}
                value={draft.scopeSummary}
                onChange={(event) => setDraft({ ...draft, scopeSummary: event.target.value })}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>{t("bids.fields.managerNotes")}</Label>
              <textarea
                className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                disabled={!canUpdateBids(principal?.authorities)}
                value={draft.managerNotes}
                onChange={(event) => setDraft({ ...draft, managerNotes: event.target.value })}
              />
            </div>
            {canUpdateBids(principal?.authorities) && (
              <div className="md:col-span-2">
                <Button
                  disabled={updateMutation.isPending || !draft.projectName.trim()}
                  onClick={() => updateMutation.mutate()}
                >
                  <Save className="mr-2 size-4" />
                  {t("common.save", "Save")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("bids.sections.lifecycle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">{t(`bids.status.${bid.status}`)}</div>
            {canUpdateBids(principal?.authorities) && (transitions[bid.status]?.length ?? 0) > 0 && (
              <>
                <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as BidStatusValue)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("bids.selectTransition")} />
                  </SelectTrigger>
                  <SelectContent>
                    {transitions[bid.status]?.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`bids.status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  disabled={!nextStatus || transitionMutation.isPending}
                  onClick={() => nextStatus && transitionMutation.mutate(nextStatus)}
                >
                  {t("bids.applyTransition")}
                </Button>
              </>
            )}
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">{t("bids.fields.projectNumber")}</dt>
                <dd>{bid.projectNumber ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("bids.fields.solicitation")}</dt>
                <dd>{bid.solicitationNumber ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("bids.fields.submission")}</dt>
                <dd>{bid.submissionEmail ?? bid.submissionUrl ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("bids.sections.timeline")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {timelineQuery.data?.map((activity) => (
            <div key={activity.uuid} className="border-l-2 pl-4">
              <div className="font-medium">{activity.summary}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(activity.occurredAt).toLocaleString()} · {t(`bids.actor.${activity.actorType}`)}
              </div>
            </div>
          ))}
          {!timelineQuery.data?.length && <div className="text-muted-foreground">{t("bids.noTimeline")}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("bids.sections.evidence")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sourceEmailsQuery.data?.map((email) => (
            <details key={email.uuid} className="rounded-md border p-4">
              <summary className="cursor-pointer">
                <span className="font-medium">{email.subject ?? t("bids.untitledEmail")}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {email.sender ?? "—"} · {email.receivedAt ? new Date(email.receivedAt).toLocaleString() : "—"}
                </span>
              </summary>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {t(`emailParsingLab.bidProcessing.outcomes.${email.processingOutcome}`)}
                  </Badge>
                  {email.bodyContentTruncated && <Badge variant="outline">{t("bidParsing.truncated")}</Badge>}
                </div>
                {email.attachments.map((attachment) => (
                  <div key={attachment.uuid} className="rounded bg-muted p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{attachment.filename ?? t("bids.attachment")}</span>
                      <Badge variant="outline">{t(`bids.extraction.${attachment.extractionStatus}`)}</Badge>
                    </div>
                    {attachment.extractedText && (
                      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs">
                        {attachment.extractedText}
                      </pre>
                    )}
                    {(attachment.skipReason || attachment.errorMessage) && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {attachment.skipReason
                          ? t(`bids.skipReason.${attachment.skipReason}`, attachment.skipReason)
                          : attachment.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          ))}
          {!sourceEmailsQuery.data?.length && <div className="text-muted-foreground">{t("bids.noEvidence")}</div>}
        </CardContent>
      </Card>

      {canViewBidAudit(principal?.authorities) && (
        <Card>
          <CardHeader>
            <CardTitle>{t("bids.sections.audit")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditQuery.data?.map((audit) => (
              <details key={audit.id} className="rounded-md border p-3">
                <summary className="cursor-pointer font-medium">
                  {audit.operation} {audit.sourceTable} · {new Date(audit.changedAt).toLocaleString()}
                </summary>
                <pre className="mt-3 overflow-auto rounded bg-muted p-3 text-xs">
                  {JSON.stringify(
                    { changedFields: audit.changedFields, old: audit.oldRow, new: audit.newRow },
                    null,
                    2
                  )}
                </pre>
                <div className="mt-2 text-xs text-muted-foreground">
                  {audit.applicationActorType} · {audit.databaseUser}
                </div>
              </details>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EditableField({
  label,
  value,
  type = "text",
  provenance,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  provenance?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {provenance && (
          <Badge variant="outline" className="text-[10px]">
            {t(`bids.sourceType.${provenance}`)}
          </Badge>
        )}
      </div>
      <Input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
