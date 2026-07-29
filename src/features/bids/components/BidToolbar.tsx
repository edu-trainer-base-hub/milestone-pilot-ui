import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BidFilterPanel } from "./BidFilterPanel";
import { BidStatus } from "../model/types";

const SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "projectName",
  "bidDueAt",
  "status",
  "priority",
  "issuerCompanyName",
  "division",
  "bidSubmittedDate",
  "distanceMinMiles",
  "opportunitySource",
  "estimateValueCents",
];

interface BidToolbarProps {
  searchParams: URLSearchParams;
  search: string;
  onSearchChange: (value: string) => void;
  status: BidStatus | null;
  sort: string;
  direction: "ASC" | "DESC";
  onFilterChange: (key: string, value?: string) => void;
  onApplyParams: (params: URLSearchParams) => void;
}

export function BidToolbar({
  searchParams,
  search,
  onSearchChange,
  status,
  sort,
  direction,
  onFilterChange,
  onApplyParams,
}: BidToolbarProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full min-w-48 sm:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("bids.search")}
        />
      </div>
      <Select value={status ?? "ALL"} onValueChange={(value) => onFilterChange("status", value)}>
        <SelectTrigger className="w-44">
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
      <BidFilterPanel key={searchParams.toString()} params={searchParams} onApply={onApplyParams} />
      <div className="flex-1" />
      <Select value={sort} onValueChange={(value) => onFilterChange("sort", value)}>
        <SelectTrigger className="w-48" aria-label={t("bids.sortBy")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_FIELDS.map((field) => (
            <SelectItem key={field} value={field}>
              {t(`bids.fields.${field}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        aria-label={t(`bids.${direction === "ASC" ? "ascending" : "descending"}`)}
        title={t(`bids.${direction === "ASC" ? "ascending" : "descending"}`)}
        onClick={() => onFilterChange("direction", direction === "ASC" ? "DESC" : "ASC")}
      >
        {direction === "ASC" ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
      </Button>
    </div>
  );
}
