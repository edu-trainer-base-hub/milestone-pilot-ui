import { useEffect, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUsersByTenant } from "@/features/tenant-users/api/tenantUsers";
import { canReadTenantUsers } from "@/features/tenant-users/model/access-policy";
import { BidDetailsView } from "../components/BidDetailsView";
import { BidEditForm } from "../components/BidEditForm";
import { getBid, getBidAudit, getBidSourceEmails, getBidTimeline, transitionBid, updateBid } from "../api/bids";
import { canUpdateBids, canViewBidAudit } from "../model/access-policy";
import { bidToEditDraft, buildBidUpdateInput, hasBidUpdates, type BidEditDraft } from "../model/bid-edit";
import type { Bid, BidStatus as BidStatusValue, UpdateBidInput } from "../model/types";

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

export function BidDetailPage() {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const { bidUuid = "" } = useParams();
  const queryClient = useQueryClient();
  const canUpdate = canUpdateBids(principal?.authorities);
  const canReadUsers = canReadTenantUsers(principal?.authorities);
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
  const tenantUsersQuery = useQuery({
    queryKey: ["tenantUsers", principal?.activeTenantUuid],
    queryFn: () => getUsersByTenant(principal?.activeTenantUuid as string),
    enabled: !!principal?.activeTenantUuid && canReadUsers,
  });
  const [draft, setDraft] = useState<BidEditDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nextStatus, setNextStatus] = useState<BidStatusValue | "">("");

  useEffect(() => {
    if (bidQuery.data && !isEditing) setDraft(bidToEditDraft(bidQuery.data));
  }, [bidQuery.data, isEditing]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["bid", bidUuid] });
    void queryClient.invalidateQueries({ queryKey: ["bid-timeline", bidUuid] });
    void queryClient.invalidateQueries({ queryKey: ["bid-audit", bidUuid] });
    void queryClient.invalidateQueries({ queryKey: ["bids"] });
  };
  const handleConflict = (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      setIsEditing(false);
      notifier.warning(t("bids.notifications.stale"));
      refresh();
    } else {
      notifier.error(t("bids.notifications.updateError"));
    }
  };
  const updateMutation = useMutation({
    mutationFn: (input: UpdateBidInput) => updateBid(bidUuid, input),
    onSuccess: (updatedBid) => {
      queryClient.setQueryData(["bid", bidUuid], updatedBid);
      setDraft(bidToEditDraft(updatedBid));
      setIsEditing(false);
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
  const updateInput = buildBidUpdateInput(bid, draft);
  const hasChanges = hasBidUpdates(updateInput);
  const beginEditing = () => {
    setDraft(bidToEditDraft(bid));
    setIsEditing(true);
  };
  const cancelEditing = () => {
    setDraft(bidToEditDraft(bid));
    setIsEditing(false);
  };

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
        {isEditing ? (
          <>
            <Button variant="outline" disabled={updateMutation.isPending} onClick={cancelEditing}>
              <X className="mr-2 size-4" />
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              form="bid-edit-form"
              disabled={updateMutation.isPending || !draft.projectName.trim() || !hasChanges}
            >
              <Save className="mr-2 size-4" />
              {updateMutation.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </>
        ) : (
          canUpdate && (
            <Button onClick={beginEditing}>
              <Pencil className="mr-2 size-4" />
              {t("common.edit")}
            </Button>
          )
        )}
      </div>

      {isEditing ? (
        <BidEditForm
          draft={draft}
          tenantUsers={tenantUsersQuery.data ?? []}
          onChange={setDraft}
          onSubmit={() => updateMutation.mutate(updateInput)}
        />
      ) : (
        <BidDetailsView bid={bid} tenantUsers={tenantUsersQuery.data ?? []} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("bids.sections.lifecycle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Badge variant="outline">{t(`bids.status.${bid.status}`)}</Badge>
          {!isEditing && canUpdate && (transitions[bid.status]?.length ?? 0) > 0 && (
            <>
              <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as BidStatusValue)}>
                <SelectTrigger className="w-64">
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
                disabled={!nextStatus || transitionMutation.isPending}
                onClick={() => nextStatus && transitionMutation.mutate(nextStatus)}
              >
                {t("bids.applyTransition")}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

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
