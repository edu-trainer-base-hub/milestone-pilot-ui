import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface BidHistoryPaginationProps {
  page: number;
  size: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}

export function BidHistoryPagination({ page, size, totalElements, onPageChange }: BidHistoryPaginationProps) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  if (totalElements <= size) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <div className="text-sm text-muted-foreground">
        {t("bids.pagination", { current: page + 1, total: totalPages, defaultValue: "Page {{current}} of {{total}}" })}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          {t("common.previous", "Previous")}
        </Button>
        <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>
          {t("common.next", "Next")}
        </Button>
      </div>
    </div>
  );
}
