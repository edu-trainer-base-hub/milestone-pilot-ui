import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBidSourceEmail, getBidSourceEmails } from "../api/bids";
import { BidActorLabel } from "./BidActorLabel";
import { BidHistoryPagination } from "./BidHistoryPagination";

export function BidEvidencePanel({ bidUuid }: { bidUuid: string }) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const size = 20;
  const selectedUuid = params.get("sourceEmailUuid");
  const listQuery = useQuery({
    queryKey: ["bid-source-emails", bidUuid, page],
    queryFn: () => getBidSourceEmails(bidUuid, page, size),
  });
  const detailQuery = useQuery({
    queryKey: ["bid-source-email", bidUuid, selectedUuid],
    queryFn: () => getBidSourceEmail(bidUuid, selectedUuid as string),
    enabled: !!selectedUuid,
  });
  const select = (uuid: string) => {
    const next = new URLSearchParams(params);
    next.set("sourceEmailUuid", uuid);
    setParams(next);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(380px,1fr)]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>{t("bids.sections.evidence")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-auto">
          {listQuery.isLoading && <div className="text-muted-foreground">{t("common.loading", "Loading…")}</div>}
          {listQuery.isError && <div className="text-destructive">{t("bids.evidenceLoadError")}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("bids.evidenceSubject")}</TableHead>
                <TableHead>{t("bids.evidenceSender")}</TableHead>
                <TableHead>{t("bids.evidenceAttachments")}</TableHead>
                <TableHead>{t("bids.evidenceReceived")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.data?.items.map((email) => (
                <TableRow
                  key={email.uuid}
                  className="cursor-pointer"
                  data-state={selectedUuid === email.uuid ? "selected" : undefined}
                  onClick={() => select(email.uuid)}
                >
                  <TableCell>
                    <div className="font-medium">{email.subject ?? t("bids.untitledEmail")}</div>
                    <Badge variant="outline">{email.processingOutcome}</Badge>
                  </TableCell>
                  <TableCell>{email.sender ?? "—"}</TableCell>
                  <TableCell>{email.attachmentCount}</TableCell>
                  <TableCell>{email.receivedAt ? new Date(email.receivedAt).toLocaleString() : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!listQuery.isLoading && !listQuery.data?.items.length && (
            <div className="text-muted-foreground">{t("bids.noEvidence")}</div>
          )}
          {listQuery.data && (
            <BidHistoryPagination
              page={listQuery.data.page}
              size={listQuery.data.size}
              totalElements={listQuery.data.totalElements}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>
            {detailQuery.data ? (detailQuery.data.subject ?? t("bids.untitledEmail")) : t("bids.selectEvidence")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {detailQuery.isLoading && <div className="text-muted-foreground">{t("common.loading", "Loading…")}</div>}
          {detailQuery.data && (
            <>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{t("bids.evidenceSender")}</dt>
                  <dd>{detailQuery.data.sender ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("bids.evidenceReceived")}</dt>
                  <dd>{detailQuery.data.receivedAt ? new Date(detailQuery.data.receivedAt).toLocaleString() : "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("bids.evidenceProcessedBy")}</dt>
                  <dd>
                    <BidActorLabel actor={detailQuery.data.createdBy} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("bids.evidenceOutcome")}</dt>
                  <dd>{detailQuery.data.processingOutcome}</dd>
                </div>
              </dl>
              <div className="space-y-3">
                {detailQuery.data.attachments.map((attachment) => (
                  <details key={attachment.uuid} className="rounded-md border p-3">
                    <summary className="cursor-pointer">
                      <span className="font-medium">{attachment.filename ?? t("bids.attachment")}</span>
                      <Badge variant="outline" className="ml-2">
                        {attachment.extractionStatus}
                      </Badge>
                    </summary>
                    <div className="mt-3 text-xs text-muted-foreground">
                      {attachment.mimeType ?? "—"} · {attachment.sizeBytes ?? "—"} bytes
                    </div>
                    {attachment.extractedText && (
                      <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
                        {attachment.extractedText}
                      </pre>
                    )}
                    {(attachment.skipReason || attachment.errorMessage) && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        {attachment.skipReason ?? attachment.errorMessage}
                      </div>
                    )}
                  </details>
                ))}
                {!detailQuery.data.attachments.length && (
                  <div className="text-muted-foreground">{t("bids.noAttachments")}</div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
