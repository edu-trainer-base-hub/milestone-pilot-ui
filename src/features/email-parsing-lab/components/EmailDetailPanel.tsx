import React from "react";
import { useTranslation } from "react-i18next";
import { Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EmailMessageResponse } from "../model/types";

interface EmailDetailPanelProps {
  message: EmailMessageResponse;
}

export const EmailDetailPanel: React.FC<EmailDetailPanelProps> = ({ message }) => {
  const { t } = useTranslation();

  return (
    <div className="border rounded-md p-4 space-y-3">
      <div>
        <h3 className="font-semibold">{message.subject}</h3>
        <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
          <div>
            {t("emailParsingLab.emails.from")}: {message.from}
          </div>
          {message.to && (
            <div>
              {t("emailParsingLab.emails.to")}: {message.to}
            </div>
          )}
          {message.dateHeader && (
            <div>
              {t("emailParsingLab.emails.date")}: {message.dateHeader}
            </div>
          )}
        </div>
      </div>

      {message.attachments && message.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.attachments.map((attachment) => (
            <Badge key={attachment.partId} variant={attachment.skipped ? "destructive" : "secondary"}>
              <Paperclip className="h-3 w-3 mr-1" />
              {attachment.filename}
              {attachment.skipped && attachment.skipReason ? ` (${attachment.skipReason})` : ""}
            </Badge>
          ))}
        </div>
      )}

      <div>
        <div className="text-sm font-medium mb-1">{t("emailParsingLab.detail.body")}</div>
        <div className="text-sm whitespace-pre-wrap max-h-64 overflow-y-auto border rounded-md p-3 bg-muted/30">
          {message.content || message.snippet || t("emailParsingLab.detail.emptyBody")}
          {message.contentTruncated && (
            <div className="text-xs text-muted-foreground mt-2">{t("emailParsingLab.detail.truncated")}</div>
          )}
        </div>
      </div>
    </div>
  );
};
