import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { EmailParseResultPageResponse, EmailParseResultResponse } from "../model/types";
import { EmailParseStatus } from "../model/types";

const SKELETON_ROWS = 5;

interface ParseHistoryTableProps {
  page: EmailParseResultPageResponse | undefined;
  /** Initial load — no data to show yet, render skeleton rows. */
  loading: boolean;
  /** Background refetch (page flip, filters) — previous rows stay visible but dimmed. */
  fetching: boolean;
  selectedResultUuid: string | null;
  onSelect: (result: EmailParseResultResponse) => void;
  onPageChange: (page: number) => void;
}

const statusVariant = (status: EmailParseStatus): "default" | "secondary" | "destructive" => {
  if (status === EmailParseStatus.FAILED) return "destructive";
  if (status === EmailParseStatus.COMPLETED) return "default";
  return "secondary";
};

export const ParseHistoryTable: React.FC<ParseHistoryTableProps> = ({
  page,
  loading,
  fetching,
  selectedResultUuid,
  onSelect,
  onPageChange,
}) => {
  const { t } = useTranslation();
  const results = page?.results ?? [];
  const totalPages = page ? Math.ceil(page.totalElements / page.size) : 0;
  const currentPage = page?.page ?? 0;
  const rangeFrom = results.length > 0 ? currentPage * (page?.size ?? 0) + 1 : 0;
  const rangeTo = currentPage * (page?.size ?? 0) + results.length;

  return (
    <div className="space-y-2">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("emailParsingLab.emails.subject")}</TableHead>
              <TableHead>{t("emailParsingLab.emails.from")}</TableHead>
              <TableHead>{t("emailParsingLab.result.status")}</TableHead>
              <TableHead>{t("emailParsingLab.result.source")}</TableHead>
              <TableHead>{t("emailParsingLab.result.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(fetching && !loading && "opacity-60")}>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 5 }, (_, cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  {t("emailParsingLab.history.empty")}
                </TableCell>
              </TableRow>
            ) : (
              results.map((result) => (
                <TableRow
                  key={result.uuid}
                  onClick={() => onSelect(result)}
                  className={cn("cursor-pointer", selectedResultUuid === result.uuid && "bg-muted hover:bg-muted")}
                >
                  <TableCell className="max-w-[280px] truncate">{result.subject}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{result.from}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(result.status)}>{t(`emailParsingLab.status.${result.status}`)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t(`emailParsingLab.source.${result.source}`)}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(result.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {t("emailParsingLab.history.showingRange", {
            from: rangeFrom,
            to: rangeTo,
            total: page?.totalElements ?? 0,
          })}
        </span>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("emailParsingLab.pagination.previous")}
            disabled={currentPage <= 0 || fetching}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage + 1} / {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("emailParsingLab.pagination.next")}
            disabled={currentPage >= totalPages - 1 || fetching}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
