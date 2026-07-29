import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageHeader } from "@/contexts/HeaderContext";
import { Button } from "@/components/ui/button";
import { BidListTable } from "../components/BidListTable";
import { BidSummaryStrip } from "../components/BidSummaryStrip";
import { BidToolbar } from "../components/BidToolbar";
import { CreateBidDialog } from "../components/CreateBidDialog";
import { bidFiltersFromParams } from "../model/bid-filters";
import { getBidDashboard, getBids } from "../api/bids";
import { canCreateBids } from "../model/access-policy";
import type { BidStatus } from "../model/types";

const PAGE_SIZE = 20;

export function BidsPage() {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const page = Number(searchParams.get("page") ?? "0");
  const status = searchParams.get("status") as BidStatus | null;
  const canCreate = canCreateBids(principal?.authorities);

  const headerActions = useMemo(() => (canCreate ? <CreateBidDialog /> : null), [canCreate]);
  usePageHeader({ title: t("bids.title"), description: t("bids.subtitle"), actions: headerActions }, [
    t,
    headerActions,
  ]);

  useEffect(() => {
    if (search.trim() === (searchParams.get("search") ?? "")) return;
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
    ...bidFiltersFromParams(searchParams),
    search: searchParams.get("search") || undefined,
    statuses: status ? [status] : undefined,
    page,
    size: PAGE_SIZE,
    sort: searchParams.get("sort") ?? "createdAt",
    direction: (searchParams.get("direction") ?? "DESC") as "ASC" | "DESC",
  };
  const bidsQuery = useQuery({
    queryKey: ["bids", principal?.activeTenantUuid, filters],
    queryFn: () => getBids(filters),
  });
  const dashboardQuery = useQuery({
    queryKey: ["bid-dashboard", principal?.activeTenantUuid],
    queryFn: getBidDashboard,
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

  return (
    <div className="min-w-0 space-y-3 p-4">
      <BidSummaryStrip summary={dashboardQuery.data} />

      <BidToolbar
        searchParams={searchParams}
        search={search}
        onSearchChange={setSearch}
        status={status}
        sort={filters.sort}
        direction={filters.direction}
        onFilterChange={setFilter}
        onApplyParams={setSearchParams}
      />

      <BidListTable
        key={`${principal?.id}:${principal?.activeTenantUuid}`}
        bids={bidsQuery.data?.items ?? []}
        loading={bidsQuery.isLoading}
        preferencesKey={`bid-columns:${principal?.id}:${principal?.activeTenantUuid}`}
      />

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
