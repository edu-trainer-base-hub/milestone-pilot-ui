import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createBid, getBidDashboard, getBids } from "../api/bids";
import { canCreateBids } from "../model/access-policy";
import { BidPriority, BidStatus, type CreateBidInput } from "../model/types";

const PAGE_SIZE = 20;

export function BidsPage() {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<CreateBidInput>({ projectName: "", priority: BidPriority.NORMAL });
  const page = Number(searchParams.get("page") ?? "0");
  const status = searchParams.get("status") as BidStatus | null;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (search.trim()) next.set("search", search.trim());
      else next.delete("search");
      next.set("page", "0");
      setSearchParams(next, { replace: true });
    }, 350);
    return () => window.clearTimeout(timeout);
    // searchParams changes are intentionally driven from this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filters = {
    search: searchParams.get("search") || undefined,
    statuses: status ? [status] : undefined,
    page,
    size: PAGE_SIZE,
    sort: searchParams.get("sort") ?? "createdAt",
    direction: (searchParams.get("direction") ?? "DESC") as "ASC" | "DESC",
  };
  const bidsQuery = useQuery({ queryKey: ["bids", filters], queryFn: () => getBids(filters) });
  const dashboardQuery = useQuery({ queryKey: ["bid-dashboard"], queryFn: getBidDashboard });
  const createMutation = useMutation({
    mutationFn: createBid,
    onSuccess: (bid) => {
      notifier.success(t("bids.notifications.created"));
      setCreateOpen(false);
      setDraft({ projectName: "", priority: BidPriority.NORMAL });
      void queryClient.invalidateQueries({ queryKey: ["bids"] });
      void queryClient.invalidateQueries({ queryKey: ["bid-dashboard"] });
      window.location.assign(`/tenant/bids/${bid.uuid}`);
    },
    onError: () => notifier.error(t("bids.notifications.createError")),
  });

  const setFilter = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "ALL") next.set(key, value);
    else next.delete(key);
    next.set("page", "0");
    setSearchParams(next);
  };
  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const dashboard = dashboardQuery.data;
  const cards = dashboard
    ? [
        ["open", dashboard.open],
        ["dueSoon", dashboard.dueSoon],
        ["overdue", dashboard.overdue],
        ["pendingReview", dashboard.pendingReview],
        ["submitted", dashboard.submitted],
        ["awarded", dashboard.awarded],
        ["parsingFailures", dashboard.recentParsingFailures],
      ]
    : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("bids.title")}</h1>
          <p className="text-muted-foreground">{t("bids.subtitle")}</p>
        </div>
        <div className="flex-1" />
        {canCreateBids(principal?.authorities) && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                {t("bids.create")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("bids.create")}</DialogTitle>
                <DialogDescription>{t("bids.createDescription")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="bid-project-name">{t("bids.fields.projectName")}</Label>
                  <Input
                    id="bid-project-name"
                    value={draft.projectName}
                    onChange={(event) => setDraft({ ...draft, projectName: event.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bid-issuer">{t("bids.fields.issuer")}</Label>
                  <Input
                    id="bid-issuer"
                    value={draft.issuerCompanyName ?? ""}
                    onChange={(event) => setDraft({ ...draft, issuerCompanyName: event.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!draft.projectName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate(draft)}
                >
                  {t("common.create", "Create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {cards.map(([key, value]) => (
          <Card key={String(key)} className="gap-2 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm text-muted-foreground">{t(`bids.dashboard.${key}`)}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 text-2xl font-bold">{value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-sm"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("bids.search")}
        />
        <Select value={status ?? "ALL"} onValueChange={(value) => setFilter("status", value)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("bids.filters.allStatuses")}</SelectItem>
            {Object.values(BidStatus).map((value) => (
              <SelectItem key={value} value={value}>
                {t(`bids.status.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("bids.fields.projectName")}</TableHead>
              <TableHead>{t("bids.fields.status")}</TableHead>
              <TableHead>{t("bids.fields.priority")}</TableHead>
              <TableHead>{t("bids.fields.issuer")}</TableHead>
              <TableHead>{t("bids.fields.deadline")}</TableHead>
              <TableHead>{t("bids.fields.review")}</TableHead>
              <TableHead>{t("bids.fields.updated")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bidsQuery.data?.items.map((bid) => (
              <TableRow key={bid.uuid}>
                <TableCell>
                  <Link className="font-medium hover:underline" to={`/tenant/bids/${bid.uuid}`}>
                    {bid.projectName}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{t(`bids.status.${bid.status}`)}</Badge>
                </TableCell>
                <TableCell>{t(`bids.priority.${bid.priority}`)}</TableCell>
                <TableCell>{bid.issuerCompanyName ?? "—"}</TableCell>
                <TableCell>{bid.bidDueAt ? new Date(bid.bidDueAt).toLocaleString() : "—"}</TableCell>
                <TableCell>{t(`bids.review.${bid.reviewStatus}`)}</TableCell>
                <TableCell>{new Date(bid.updatedAt ?? bid.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!bidsQuery.isLoading && !bidsQuery.data?.items.length && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {t("bids.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="icon" disabled={page <= 0} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground">{page + 1}</span>
        <Button
          variant="outline"
          size="icon"
          disabled={(page + 1) * PAGE_SIZE >= (bidsQuery.data?.totalElements ?? 0)}
          onClick={() => setPage(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
