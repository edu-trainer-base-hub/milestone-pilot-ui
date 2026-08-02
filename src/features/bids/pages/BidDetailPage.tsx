import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { Authority, useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUsersByTenant } from "@/features/tenant-users/api/tenantUsers";
import { canReadTenantUsers } from "@/features/tenant-users/model/access-policy";
import { BidUpdateRequestsPanel } from "@/features/bid-update-requests/pages/BidUpdateRequestsPage";
import { BidAuditPanel } from "../components/BidAuditPanel";
import { BidDetailsView } from "../components/BidDetailsView";
import { BidEditForm } from "../components/BidEditForm";
import { BidEvidencePanel } from "../components/BidEvidencePanel";
import { BidTimelinePanel } from "../components/BidTimelinePanel";
import { getBid, transitionBid, updateBid } from "../api/bids";
import { canUpdateBids } from "../model/access-policy";
import { bidToEditDraft, buildBidUpdateInput, hasBidUpdates, type BidEditDraft } from "../model/bid-edit";
import type { Bid, BidStatus as BidStatusValue, UpdateBidInput } from "../model/types";
import { BidParsingRunsPanel } from "./BidParsingRunsPage";

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

type BidTab = "details" | "timeline" | "reviews" | "parsing" | "evidence" | "audit";

export function BidDetailPage() {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const { bidUuid = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const canUpdate = canUpdateBids(principal?.authorities);
  const canReadUsers = canReadTenantUsers(principal?.authorities);
  const canReview = Boolean(principal?.authorities?.includes(Authority.TENANT_BIDS_REVIEW_UPDATES));
  const canViewParsing = Boolean(principal?.authorities?.includes(Authority.TENANT_BIDS_VIEW_PARSING));
  const canViewAudit = Boolean(principal?.authorities?.includes(Authority.TENANT_BIDS_VIEW_AUDIT));
  const allowedTabs = useMemo<BidTab[]>(
    () => [
      "details",
      "timeline",
      ...(canReview ? (["reviews"] as BidTab[]) : []),
      ...(canViewParsing ? (["parsing"] as BidTab[]) : []),
      "evidence",
      ...(canViewAudit ? (["audit"] as BidTab[]) : []),
    ],
    [canReview, canViewAudit, canViewParsing]
  );
  const requestedTab = searchParams.get("tab") as BidTab | null;
  const activeTab = requestedTab && allowedTabs.includes(requestedTab) ? requestedTab : "details";
  const bidQuery = useQuery({ queryKey: ["bid", bidUuid], queryFn: () => getBid(bidUuid), enabled: !!bidUuid });
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

  useEffect(() => {
    if (!requestedTab || allowedTabs.includes(requestedTab)) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", "details");
    setSearchParams(next, { replace: true });
  }, [allowedTabs, requestedTab, searchParams, setSearchParams]);

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
  const assignee = tenantUsersQuery.data?.find((user) => user.uuid === bid.assignedToUserUuid);
  const beginEditing = () => {
    setDraft(bidToEditDraft(bid));
    setIsEditing(true);
  };
  const cancelEditing = () => {
    setDraft(bidToEditDraft(bid));
    setIsEditing(false);
  };
  const changeTab = (value: string) => {
    if (isEditing) return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start gap-3">
        <Button variant="outline" size="icon" asChild>
          <Link to="/tenant/bids" aria-label={t("bids.backToBids", "Back to bids")}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words text-2xl font-bold sm:text-3xl">{bid.projectName}</h1>
            <Badge variant="outline">{t(`bids.status.${bid.status}`)}</Badge>
            <Badge variant="outline">{t(`bids.priority.${bid.priority}`)}</Badge>
            {bid.requiresReview && <Badge>{t("bids.review.REVIEW_REQUIRED")}</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{bid.issuerCompanyName ?? t("bids.noIssuer")}</span>
            {bid.bidDueAt && (
              <span>
                {t("bids.fields.bidDueAt")}: {new Date(bid.bidDueAt).toLocaleString()}
              </span>
            )}
            {bid.assignedToUserUuid && (
              <span>
                {t("bids.fields.assignedToUser")}:{" "}
                {assignee ? `${assignee.firstName} ${assignee.lastName}` : bid.assignedToUserUuid}
              </span>
            )}
          </div>
        </div>
        {activeTab === "details" &&
          (isEditing ? (
            <div className="flex gap-2">
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
            </div>
          ) : canUpdate ? (
            <Button onClick={beginEditing}>
              <Pencil className="mr-2 size-4" />
              {t("common.edit")}
            </Button>
          ) : null)}
      </header>

      <Tabs value={activeTab} onValueChange={changeTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList aria-label={t("bids.workspaceTabs", "Bid workspace sections")} className="min-w-max">
            {allowedTabs.map((tab) => (
              <TabsTrigger key={tab} value={tab} disabled={isEditing && tab !== "details"}>
                {t(`bids.tabs.${tab}`, tab)}
                {tab === "reviews" && bid.requiresReview && <span className="size-2 rounded-full bg-destructive" />}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="details" className="space-y-6">
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
        </TabsContent>
        <TabsContent value="timeline">
          <BidTimelinePanel bidUuid={bidUuid} />
        </TabsContent>
        {canReview && (
          <TabsContent value="reviews">
            <BidUpdateRequestsPanel bidUuid={bidUuid} embedded />
          </TabsContent>
        )}
        {canViewParsing && (
          <TabsContent value="parsing">
            <BidParsingRunsPanel bidUuid={bidUuid} embedded />
          </TabsContent>
        )}
        <TabsContent value="evidence">
          <BidEvidencePanel bidUuid={bidUuid} />
        </TabsContent>
        {canViewAudit && (
          <TabsContent value="audit">
            <BidAuditPanel bidUuid={bidUuid} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
