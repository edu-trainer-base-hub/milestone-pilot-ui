import React from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ParseHistoryFilters } from "../model/types";
import { EmailParseSource, EmailParseStatus } from "../model/types";

const ALL = "ALL";

interface ParseHistoryFiltersBarProps {
  filters: ParseHistoryFilters;
  onChange: (filters: ParseHistoryFilters) => void;
  hasSelectedEmail: boolean;
  onlySelected: boolean;
  onOnlySelectedChange: (onlySelected: boolean) => void;
}

export const ParseHistoryFiltersBar: React.FC<ParseHistoryFiltersBarProps> = ({
  filters,
  onChange,
  hasSelectedEmail,
  onlySelected,
  onOnlySelectedChange,
}) => {
  const { t } = useTranslation();

  const update = (patch: Partial<ParseHistoryFilters>) => onChange({ ...filters, ...patch });

  const hasAnyFilter =
    Boolean(
      filters.status ||
        filters.source ||
        filters.emailFrom ||
        filters.emailSubject ||
        filters.createdAfter ||
        filters.createdBefore
    ) || onlySelected;

  const clearAll = () => {
    onChange({});
    onOnlySelectedChange(false);
  };

  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="space-y-1">
          <Label>{t("emailParsingLab.history.filters.status")}</Label>
          <Select
            value={filters.status ?? ALL}
            onValueChange={(value) => update({ status: value === ALL ? undefined : (value as EmailParseStatus) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("emailParsingLab.history.filters.all")}</SelectItem>
              {Object.values(EmailParseStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`emailParsingLab.status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>{t("emailParsingLab.history.filters.source")}</Label>
          <Select
            value={filters.source ?? ALL}
            onValueChange={(value) => update({ source: value === ALL ? undefined : (value as EmailParseSource) })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("emailParsingLab.history.filters.all")}</SelectItem>
              {Object.values(EmailParseSource).map((source) => (
                <SelectItem key={source} value={source}>
                  {t(`emailParsingLab.source.${source}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="history-filter-from">{t("emailParsingLab.history.filters.from")}</Label>
          <Input
            id="history-filter-from"
            value={filters.emailFrom ?? ""}
            onChange={(e) => update({ emailFrom: e.target.value || undefined })}
            placeholder="billing@vendor.com"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="history-filter-subject">{t("emailParsingLab.history.filters.subject")}</Label>
          <Input
            id="history-filter-subject"
            value={filters.emailSubject ?? ""}
            onChange={(e) => update({ emailSubject: e.target.value || undefined })}
            placeholder={t("emailParsingLab.search.subjectPlaceholder")}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="history-filter-after">{t("emailParsingLab.history.filters.createdAfter")}</Label>
          <Input
            id="history-filter-after"
            type="date"
            value={filters.createdAfter?.slice(0, 10) ?? ""}
            onChange={(e) =>
              update({ createdAfter: e.target.value ? new Date(e.target.value).toISOString() : undefined })
            }
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="history-filter-before">{t("emailParsingLab.history.filters.createdBefore")}</Label>
          <Input
            id="history-filter-before"
            type="date"
            value={filters.createdBefore?.slice(0, 10) ?? ""}
            onChange={(e) =>
              update({ createdBefore: e.target.value ? new Date(e.target.value).toISOString() : undefined })
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="history-only-selected"
            checked={onlySelected}
            onCheckedChange={onOnlySelectedChange}
            disabled={!hasSelectedEmail}
          />
          <Label htmlFor="history-only-selected" className={!hasSelectedEmail ? "text-muted-foreground" : ""}>
            {t("emailParsingLab.history.filters.onlySelected")}
          </Label>
          {!hasSelectedEmail && (
            <span className="text-xs text-muted-foreground">
              {t("emailParsingLab.history.filters.onlySelectedHint")}
            </span>
          )}
        </div>
        {hasAnyFilter && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="mr-1 h-4 w-4" />
            {t("emailParsingLab.history.filters.clear")}
          </Button>
        )}
      </div>
    </div>
  );
};
