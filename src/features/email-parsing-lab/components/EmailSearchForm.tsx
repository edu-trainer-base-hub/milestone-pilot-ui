import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SearchEmailsRequest } from "../model/types";
import { EmailContentMode } from "../model/types";

interface EmailSearchFormProps {
  loading: boolean;
  disabled: boolean;
  onSearch: (request: SearchEmailsRequest) => void;
}

export const EmailSearchForm: React.FC<EmailSearchFormProps> = ({ loading, disabled, onSearch }) => {
  const { t } = useTranslation();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [query, setQuery] = useState("");
  const [after, setAfter] = useState("");
  const [before, setBefore] = useState("");
  const [maxResults, setMaxResults] = useState("10");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const request: SearchEmailsRequest = {
      unreadOnly,
      from: from.trim() || undefined,
      subject: subject.trim() || undefined,
      query: query.trim() || undefined,
      after: after ? new Date(after).toISOString() : undefined,
      before: before ? new Date(before).toISOString() : undefined,
      maxResults: Number(maxResults) || 10,
      contentMode: EmailContentMode.PLAIN_TEXT_PREFERRED,
      includeAttachments: true,
    };
    onSearch(request);
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-md p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search-from">{t("emailParsingLab.search.from")}</Label>
          <Input
            id="search-from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="billing@vendor.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="search-subject">{t("emailParsingLab.search.subject")}</Label>
          <Input
            id="search-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("emailParsingLab.search.subjectPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="search-query">{t("emailParsingLab.search.query")}</Label>
          <Input
            id="search-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="has:attachment"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="search-after">{t("emailParsingLab.search.after")}</Label>
          <Input id="search-after" type="date" value={after} onChange={(e) => setAfter(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="search-before">{t("emailParsingLab.search.before")}</Label>
          <Input id="search-before" type="date" value={before} onChange={(e) => setBefore(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="search-max">{t("emailParsingLab.search.maxResults")}</Label>
          <Input
            id="search-max"
            type="number"
            min={1}
            max={100}
            value={maxResults}
            onChange={(e) => setMaxResults(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch id="search-unread" checked={unreadOnly} onCheckedChange={setUnreadOnly} />
          <Label htmlFor="search-unread">{t("emailParsingLab.search.unreadOnly")}</Label>
        </div>
        <Button type="submit" disabled={disabled || loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          {t("emailParsingLab.search.submit")}
        </Button>
      </div>
    </form>
  );
};
