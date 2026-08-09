import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBidAudit, getBidAuditDetail } from "../api/bids";
import type { BidActor, BidAuditFilters } from "../model/types";
import { BidActorLabel } from "./BidActorLabel";
import { BidHistoryPagination } from "./BidHistoryPagination";

const sourceTables = ["bids", "bid_update_requests", "bid_update_request_changes", "bid_field_sources"];
const operations = ["INSERT", "UPDATE", "DELETE"];
const actorTypes: BidActor["type"][] = ["USER", "SYSTEM", "UNKNOWN"];
const fieldScopedAuditTables = new Set(["bid_update_request_changes", "bid_field_sources"]);
const technicalAuditFields = new Set([
  "id",
  "uuid",
  "bid_id",
  "version",
  "created_at",
  "updated_at",
  "created_by_actor_type",
  "created_by_user_uuid",
  "updated_by_actor_type",
  "updated_by_user_uuid",
]);

export function BidAuditPanel({ bidUuid }: { bidUuid: string }) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const sourceTable = params.get("auditEntity") ?? "ALL";
  const operation = params.get("auditOperation") ?? "ALL";
  const actorType = params.get("auditActorType") ?? "ALL";
  const actorUserUuid = params.get("auditActorUuid") ?? "";
  const changedFrom = params.get("auditFrom") ?? "";
  const changedTo = params.get("auditTo") ?? "";
  const page = Math.max(0, Number(params.get("auditPage") ?? "0") || 0);
  const selectedId = Number(params.get("auditId") ?? "") || null;
  const size = 20;
  const filters: BidAuditFilters = {
    sourceTable: sourceTable === "ALL" ? undefined : sourceTable,
    operation: operation === "ALL" ? undefined : operation,
    actorType: actorType === "ALL" ? undefined : (actorType as BidActor["type"]),
    actorUserUuid: actorUserUuid || undefined,
    changedFrom: toInstant(changedFrom),
    changedTo: toInstant(changedTo),
    page,
    size,
  };
  const listQuery = useQuery({
    queryKey: ["bid-audit", bidUuid, filters],
    queryFn: () => getBidAudit(bidUuid, filters),
  });
  const detailQuery = useQuery({
    queryKey: ["bid-audit-detail", bidUuid, selectedId],
    queryFn: () => getBidAuditDetail(bidUuid, selectedId as number),
    enabled: selectedId != null,
  });
  const detailRelatedFieldName = detailQuery.data
    ? relatedFieldName(detailQuery.data.sourceTable, detailQuery.data.oldRow, detailQuery.data.newRow)
    : null;

  const setParam = (key: string, value: string | undefined, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage) next.delete("auditPage");
    setParams(next);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("bids.sections.audit")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Filter label={t("bids.audit.entity")}>
            <Select
              value={sourceTable}
              onValueChange={(value) => setParam("auditEntity", value === "ALL" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("common.all", "All")}</SelectItem>
                {sourceTables.map((value) => (
                  <SelectItem key={value} value={value}>
                    {entityLabel(value, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Filter>
          <Filter label={t("bids.audit.operation")}>
            <Select
              value={operation}
              onValueChange={(value) => setParam("auditOperation", value === "ALL" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("common.all", "All")}</SelectItem>
                {operations.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`bids.audit.operations.${value}`, value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Filter>
          <Filter label={t("bids.audit.actorType")}>
            <Select
              value={actorType}
              onValueChange={(value) => setParam("auditActorType", value === "ALL" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("common.all", "All")}</SelectItem>
                {actorTypes.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`bids.actor.${value}`, value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Filter>
          <Filter label={t("bids.audit.from")}>
            <Input
              type="datetime-local"
              value={changedFrom}
              onChange={(event) => setParam("auditFrom", event.target.value)}
            />
          </Filter>
          <Filter label={t("bids.audit.to")}>
            <Input
              type="datetime-local"
              value={changedTo}
              onChange={(event) => setParam("auditTo", event.target.value)}
            />
          </Filter>
          <Filter label={t("bids.audit.actorUuid")}>
            <Input
              value={actorUserUuid}
              placeholder={t("bids.audit.actorUuidPlaceholder")}
              onChange={(event) => setParam("auditActorUuid", event.target.value)}
            />
          </Filter>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,1.2fr)]">
        <Card className="min-w-0">
          <CardContent className="space-y-3 overflow-x-auto pt-6">
            {listQuery.isLoading && <div className="text-muted-foreground">{t("common.loading", "Loading…")}</div>}
            {listQuery.isError && <div className="text-destructive">{t("bids.audit.loadError")}</div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("bids.audit.change")}</TableHead>
                  <TableHead>{t("bids.audit.actor")}</TableHead>
                  <TableHead>{t("bids.audit.changedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.data?.items.map((audit) => (
                  <TableRow
                    key={audit.id}
                    className="cursor-pointer"
                    data-state={selectedId === audit.id ? "selected" : undefined}
                    onClick={() => setParam("auditId", String(audit.id), false)}
                  >
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {t(`bids.audit.operations.${audit.operation}`, audit.operation)}
                        </Badge>
                        <span className="font-medium">
                          {audit.relatedFieldName
                            ? fieldLabel(audit.relatedFieldName, t)
                            : entityLabel(audit.sourceTable, t)}
                        </span>
                      </div>
                      {audit.relatedFieldName && (
                        <div className="mt-1 text-xs text-muted-foreground">{entityLabel(audit.sourceTable, t)}</div>
                      )}
                      {!audit.relatedFieldName && audit.operation === "UPDATE" && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {changedFieldsSummary(audit.changedFields, t)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <BidActorLabel actor={audit.actor} />
                    </TableCell>
                    <TableCell>{new Date(audit.changedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!listQuery.isLoading && !listQuery.data?.items.length && (
              <div className="text-muted-foreground">{t("bids.audit.empty")}</div>
            )}
            {listQuery.data && (
              <BidHistoryPagination
                page={listQuery.data.page}
                size={listQuery.data.size}
                totalElements={listQuery.data.totalElements}
                onPageChange={(nextPage) => setParam("auditPage", String(nextPage), false)}
              />
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>{detailQuery.data ? t("bids.audit.detail") : t("bids.audit.select")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {detailQuery.isLoading && <div className="text-muted-foreground">{t("common.loading", "Loading…")}</div>}
            {detailQuery.data && (
              <>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge>{t(`bids.audit.operations.${detailQuery.data.operation}`, detailQuery.data.operation)}</Badge>
                  <span className={detailRelatedFieldName ? "font-medium" : undefined}>
                    {detailRelatedFieldName
                      ? fieldLabel(detailRelatedFieldName, t)
                      : entityLabel(detailQuery.data.sourceTable, t)}
                  </span>
                  {detailRelatedFieldName && (
                    <span className="text-muted-foreground">· {entityLabel(detailQuery.data.sourceTable, t)}</span>
                  )}
                  <span className="text-muted-foreground">
                    · {new Date(detailQuery.data.changedAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm">
                  <BidActorLabel actor={detailQuery.data.actor} />
                </div>
                <div className="space-y-3">
                  {detailQuery.data.changedFields.map((field) => (
                    <div key={field} className="rounded-md border p-3">
                      <div className="mb-2 text-sm font-medium">{fieldLabel(field, t)}</div>
                      <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                        <Value value={detailQuery.data.oldRow?.[field]} t={t} />
                        <ArrowRight className="mx-auto size-4 text-muted-foreground" aria-hidden="true" />
                        <Value value={detailQuery.data.newRow?.[field]} t={t} />
                      </div>
                    </div>
                  ))}
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">{t("bids.audit.raw")}</Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{t("bids.audit.rawTitle")}</DialogTitle>
                      <DialogDescription>{t("bids.audit.rawDescription")}</DialogDescription>
                    </DialogHeader>
                    <pre className="overflow-auto rounded bg-muted p-3 text-xs">
                      {JSON.stringify(
                        {
                          changedFields: detailQuery.data.changedFields,
                          old: detailQuery.data.oldRow,
                          new: detailQuery.data.newRow,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Value({ value, t }: { value: unknown; t: ReturnType<typeof useTranslation>["t"] }) {
  return <div className="min-h-10 overflow-auto rounded bg-muted p-2 text-sm break-words">{formatValue(value, t)}</div>;
}

function formatValue(value: unknown, t: ReturnType<typeof useTranslation>["t"]): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return t(`common.boolean.${value ? "yes" : "no"}`);
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString();
  }
  return String(value);
}

function toInstant(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function fieldLabel(field: string, t: ReturnType<typeof useTranslation>["t"]): string {
  const camelCase = field.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return t(`bids.fields.${camelCase}`, humanize(field));
}

function entityLabel(sourceTable: string, t: ReturnType<typeof useTranslation>["t"]): string {
  return t(`bids.audit.entities.${sourceTable}`, humanize(sourceTable));
}

function changedFieldsSummary(fields: string[], t: ReturnType<typeof useTranslation>["t"]): string {
  const businessFields = fields.filter((field) => !technicalAuditFields.has(field));
  const displayFields = businessFields.length > 0 ? businessFields : fields;
  const visibleFields = displayFields.slice(0, 3).map((field) => fieldLabel(field, t));
  const remaining = displayFields.length - visibleFields.length;
  return remaining > 0
    ? `${visibleFields.join(", ")} ${t("bids.audit.moreFields", { count: remaining })}`
    : visibleFields.join(", ");
}

function relatedFieldName(
  sourceTable: string,
  oldRow: Record<string, unknown> | null,
  newRow: Record<string, unknown> | null
): string | null {
  if (!fieldScopedAuditTables.has(sourceTable)) return null;
  const fieldName = newRow?.field_name ?? oldRow?.field_name;
  return typeof fieldName === "string" && fieldName.length > 0 ? fieldName : null;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
