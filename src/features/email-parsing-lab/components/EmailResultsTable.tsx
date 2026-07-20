import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { EmailMessageResponse } from "../model/types";

interface EmailResultsTableProps {
  messages: EmailMessageResponse[];
  loading: boolean;
  hasSearched: boolean;
  /** 0-based ordinal of the Prev/Next walk — Gmail has no absolute page numbers. */
  pageIndex: number;
  resultSizeEstimate: number | null;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  selectedMessageId: string | null;
  onSelect: (message: EmailMessageResponse) => void;
}

const SKELETON_ROWS = 5;

const formatDate = (internalDate: number | null, dateHeader: string | null): string => {
  if (internalDate) {
    return new Date(internalDate).toLocaleString();
  }
  return dateHeader ?? "";
};

export const EmailResultsTable: React.FC<EmailResultsTableProps> = ({
  messages,
  loading,
  hasSearched,
  pageIndex,
  resultSizeEstimate,
  hasPrevPage,
  hasNextPage,
  onPrevPage,
  onNextPage,
  selectedMessageId,
  onSelect,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("emailParsingLab.emails.from")}</TableHead>
              <TableHead>{t("emailParsingLab.emails.subject")}</TableHead>
              <TableHead>{t("emailParsingLab.emails.date")}</TableHead>
              <TableHead className="text-right">
                <Paperclip className="h-4 w-4 inline" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-6 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  {hasSearched ? t("emailParsingLab.search.noResults") : t("emailParsingLab.search.notSearchedYet")}
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow
                  key={message.providerMessageId}
                  onClick={() => onSelect(message)}
                  className={cn(
                    "cursor-pointer",
                    selectedMessageId === message.providerMessageId && "bg-muted hover:bg-muted"
                  )}
                >
                  <TableCell className="max-w-[220px] truncate">{message.from}</TableCell>
                  <TableCell className="max-w-[320px]">
                    <div className="truncate font-medium">{message.subject}</div>
                    <div className="truncate text-xs text-muted-foreground">{message.snippet}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(message.internalDate, message.dateHeader)}
                  </TableCell>
                  <TableCell className="text-right">{message.attachments?.length || ""}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {hasSearched && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("emailParsingLab.emails.loadedCount", { count: messages.length })}
            {resultSizeEstimate != null &&
              ` · ${t("emailParsingLab.emails.estimatedTotal", { count: resultSizeEstimate })}`}
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              aria-label={t("emailParsingLab.pagination.previous")}
              disabled={!hasPrevPage || loading}
              onClick={onPrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("emailParsingLab.emails.pageLabel", { page: pageIndex + 1 })}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label={t("emailParsingLab.pagination.next")}
              disabled={!hasNextPage || loading}
              onClick={onNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
