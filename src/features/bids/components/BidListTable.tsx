import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Bid } from "../model/types";
import { formatMoney } from "../model/money";
import { BidReviewBadges } from "./BidReviewBadges";
import { RelatedLinks } from "./RelatedLinks";

const defaultColumns = [
  "projectName",
  "status",
  "priority",
  "issuer",
  "deadline",
  "review",
  "updated",
  "tags",
  "projectManager",
  "estimator",
  "opportunitySource",
  "estimateValue",
];
const allColumns = [
  ...defaultColumns,
  "assignedUsers",
  "division",
  "bidSubmittedDate",
  "distanceMiles",
  "relatedLinks",
];
function readColumns(key: string): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (Array.isArray(saved))
      return [
        ...new Set([
          "projectName",
          ...saved.filter((value) => typeof value === "string" && allColumns.includes(value)),
        ]),
      ];
  } catch {
    /* Use defaults when browser storage is unavailable. */
  }
  return defaultColumns;
}

export function BidListTable({
  bids,
  loading,
  preferencesKey,
}: {
  bids: Bid[];
  loading: boolean;
  preferencesKey: string;
}) {
  const { t, i18n } = useTranslation();
  const [visible, setVisible] = useState(() => readColumns(preferencesKey));
  const columns = allColumns.filter((column) => visible.includes(column));
  const toggle = (column: string, checked: boolean) => {
    const next = checked ? [...visible, column] : visible.filter((value) => value !== column);
    setVisible(next);
    try {
      localStorage.setItem(preferencesKey, JSON.stringify(next));
    } catch {
      /* Preferences remain usable for this session. */
    }
  };
  const userLabel = (user: Bid["projectManager"]) =>
    user ? `${user.displayName}${user.active ? "" : ` (${t("bids.form.inactive")})`}` : null;
  const cells = (bid: Bid): Record<string, ReactNode> => ({
    projectName: (
      <Link className="font-medium hover:underline" to={`/tenant/bids/${bid.uuid}`}>
        {bid.projectName}
      </Link>
    ),
    status: <Badge variant="outline">{t(`bids.status.${bid.status}`)}</Badge>,
    priority: t(`bids.priority.${bid.priority}`),
    issuer: bid.issuerCompanyName,
    deadline: bid.bidDueAt ? new Date(bid.bidDueAt).toLocaleString() : null,
    review: <BidReviewBadges bid={bid} compact />,
    updated: new Date(bid.updatedAt ?? bid.createdAt).toLocaleString(),
    tags: !bid.tags.length ? null : (
      <div className="flex flex-wrap gap-1">
        {bid.tags.map((tag) => (
          <Badge key={tag.uuid} variant="secondary">
            {tag.name}
          </Badge>
        ))}
      </div>
    ),
    projectManager: userLabel(bid.projectManager),
    estimator: userLabel(bid.estimator),
    assignedUsers: bid.assignedUsers.map(userLabel).join(", "),
    division: bid.division,
    bidSubmittedDate: bid.bidSubmittedDate ? new Date(`${bid.bidSubmittedDate}T00:00:00`).toLocaleDateString() : null,
    distanceMiles: bid.distanceMiles
      ? `${bid.distanceMiles.min}–${bid.distanceMiles.max} ${t("bids.fields.miles")}`
      : null,
    opportunitySource: bid.opportunitySource,
    estimateValue: formatMoney(bid.estimateValueCents, i18n.resolvedLanguage ?? i18n.language),
    relatedLinks: (
      <div className="max-w-xs truncate">
        <RelatedLinks value={bid.relatedLinks} />
      </div>
    ),
  });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">{t("bids.columns")}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
            {allColumns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column}
                checked={visible.includes(column)}
                disabled={column === "projectName"}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(checked) => toggle(column, checked)}
              >
                {t(`bids.fields.${column}`)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="whitespace-nowrap">
                  {t(`bids.fields.${column}`)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {bids.map((bid) => {
              const values = cells(bid);
              return (
                <TableRow key={bid.uuid}>
                  {columns.map((column) => (
                    <TableCell key={column}>{values[column] || "—"}</TableCell>
                  ))}
                </TableRow>
              );
            })}
            {!loading && !bids.length && (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                  {t("bids.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
