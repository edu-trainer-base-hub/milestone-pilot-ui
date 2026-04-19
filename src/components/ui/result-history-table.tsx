import type { Key, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ResultHistoryColumnRole = "example" | "answer" | "result" | "aux";

export interface ResultHistoryColumn<Row> {
  id: string;
  header: ReactNode;
  role?: ResultHistoryColumnRole;
  headerClassName?: string;
  cellClassName?: string;
  renderCell: (row: Row, index: number) => ReactNode;
}

export interface ResultHistoryHeader {
  title: ReactNode;
  summary?: ReactNode;
  className?: string;
  titleClassName?: string;
  summaryClassName?: string;
}

interface ResultHistoryTableProps<Row> {
  rows: readonly Row[];
  columns: readonly ResultHistoryColumn<Row>[];
  emptyText: ReactNode;
  getRowKey?: (row: Row, index: number) => Key;
  getRowClassName?: (row: Row, index: number) => string | undefined;
  className?: string;
  scrollAreaClassName?: string;
  headerClassName?: string;
  tableClassName?: string;
  emptyCellClassName?: string;
  header?: ResultHistoryHeader;
}

const DEFAULT_HEADER_CLASS_BY_ROLE: Record<ResultHistoryColumnRole, string> = {
  example: "w-[24%] px-4 text-center",
  answer: "w-[14%] px-4 text-center",
  result: "w-[62%] px-4 text-center",
  aux: "px-4 text-center",
};

const DEFAULT_CELL_CLASS_BY_ROLE: Record<ResultHistoryColumnRole, string> = {
  example: "px-4 py-2 text-center whitespace-nowrap",
  answer: "px-4 py-2 text-center",
  result: "px-4 py-2 align-top",
  aux: "px-4 py-2",
};

export function ResultHistoryTable<Row>({
  rows,
  columns,
  emptyText,
  getRowKey,
  getRowClassName,
  className,
  scrollAreaClassName,
  headerClassName,
  tableClassName,
  emptyCellClassName,
  header,
}: ResultHistoryTableProps<Row>) {
  return (
    <div className={cn("trainer-history-table flex h-full min-h-0 flex-col overflow-hidden rounded-xl border", className)}>
      {header && (
        <div className={cn("flex items-center justify-between border-b bg-muted px-4 py-3", header.className)}>
          <div className={cn("text-base font-semibold", header.titleClassName)}>{header.title}</div>
          {header.summary ? (
            <span className={cn("text-xs text-muted-foreground", header.summaryClassName)}>{header.summary}</span>
          ) : null}
        </div>
      )}

      <div className={cn("min-h-0 flex-1 overflow-auto", scrollAreaClassName)}>
        <Table className={tableClassName}>
          <TableHeader className={cn("sticky top-0 bg-muted", headerClassName)}>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(DEFAULT_HEADER_CLASS_BY_ROLE[column.role ?? "aux"], column.headerClassName)}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(columns.length, 1)}
                  className={cn("px-4 py-3 text-muted-foreground", emptyCellClassName)}
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={getRowKey ? getRowKey(row, index) : index}
                  className={cn("border-t", getRowClassName?.(row, index))}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(DEFAULT_CELL_CLASS_BY_ROLE[column.role ?? "aux"], column.cellClassName)}
                    >
                      {column.renderCell(row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
