import React, { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { notifier } from "@/services/NotificationService";
import { getEmailConnectors } from "@/features/tenant-email-connectors/api/emailConnectors";
import { EmailConnectorStatus } from "@/features/tenant-email-connectors/model/types";
import { getAiModels, getParseResults, parseEmail, searchEmails } from "../api/emailParsingLab";
import { canParseEmails, canViewEmailParsingLab } from "../model/access-policy";
import type {
  EmailMessageResponse,
  EmailParseResultResponse,
  ParseEmailRequest,
  ParseHistoryFilters,
  SearchEmailsRequest,
} from "../model/types";
import { EmailSearchForm } from "../components/EmailSearchForm";
import { EmailResultsTable } from "../components/EmailResultsTable";
import { EmailDetailPanel } from "../components/EmailDetailPanel";
import { ParsePanel } from "../components/ParsePanel";
import { ParseHistoryFiltersBar } from "../components/ParseHistoryFiltersBar";
import { ParseHistoryTable } from "../components/ParseHistoryTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Authority } from "@/contexts/AuthContext";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { FeatureFlag } from "@/services/FeatureFlagService";
import { processBidEmail } from "@/features/bids/api/bidParsing";
import type { BidEmailProcessingResult } from "@/features/bids/model/parsing-types";

const HISTORY_PAGE_SIZE = 10;
// Fallback while the /ai-models query (which also carries the configured prompt/schema
// length limits) is still loading, so the fields aren't briefly unbounded.
const DEFAULT_MAX_PROMPT_CHARS = 20_000;
const DEFAULT_MAX_SCHEMA_CHARS = 20_000;

/**
 * Gmail paging is token-based (no absolute page numbers): `tokenStack[i]` is the pageToken
 * that fetched page i (page 0 = null), so Prev re-fetches with an earlier token while Next
 * follows the latest `nextPageToken`. `baseRequest` is the frozen snapshot of the last
 * submitted search — form edits only apply on the next submit, which resets the walk.
 */
interface EmailSearchState {
  baseRequest: SearchEmailsRequest;
  tokenStack: (string | null)[];
  pageIndex: number;
  nextPageToken: string | null;
  resultSizeEstimate: number | null;
}

interface SearchVariables {
  request: SearchEmailsRequest;
  pageIndex: number;
  token: string | null;
}

export const EmailParsingLabPage: React.FC = () => {
  const { t } = useTranslation();
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const { isFeatureEnabled } = useFeatureFlags();

  const tenantId = principal?.activeTenantUuid ?? null;
  const authorities = principal?.authorities ?? [];
  const canView = canViewEmailParsingLab(authorities);
  const canParse = canParseEmails(authorities);
  const canProcessBid =
    authorities.includes(Authority.TENANT_BIDS_PROCESS_EMAIL) && isFeatureEnabled(FeatureFlag.BID_MANAGEMENT);

  const [connectorUuid, setConnectorUuid] = useState<string | null>(null);
  const [messages, setMessages] = useState<EmailMessageResponse[]>([]);
  const [searchState, setSearchState] = useState<EmailSearchState | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessageResponse | null>(null);
  const [displayedResult, setDisplayedResult] = useState<EmailParseResultResponse | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyFilters, setHistoryFilters] = useState<ParseHistoryFilters>({});
  const [onlySelected, setOnlySelected] = useState(false);
  const [bidProcessingResult, setBidProcessingResult] = useState<BidEmailProcessingResult | null>(null);

  const { data: connectors = [] } = useQuery({
    queryKey: ["emailConnectors", tenantId],
    queryFn: getEmailConnectors,
    enabled: !!tenantId && canView,
  });

  const activeConnectors = connectors.filter((connector) => connector.status === EmailConnectorStatus.ACTIVE);

  // Preselect the tenant default connector once connectors arrive.
  useEffect(() => {
    if (!connectorUuid && activeConnectors.length > 0) {
      const defaultConnector = activeConnectors.find((connector) => connector.default) ?? activeConnectors[0];
      setConnectorUuid(defaultConnector.uuid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConnectors]);

  // "Only selected email" narrows the history to the message picked in the search table
  // and follows the selection as it changes.
  const effectiveFilters: ParseHistoryFilters =
    onlySelected && selectedMessage
      ? { ...historyFilters, providerMessageId: selectedMessage.providerMessageId }
      : historyFilters;

  const historyQueryKey = ["email-parse-results", tenantId, connectorUuid, historyPage, effectiveFilters];

  const {
    data: history,
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useQuery({
    queryKey: historyQueryKey,
    queryFn: () => getParseResults(connectorUuid as string, historyPage, HISTORY_PAGE_SIZE, effectiveFilters),
    enabled: !!tenantId && !!connectorUuid && canView,
    placeholderData: keepPreviousData,
  });

  const { data: aiModels } = useQuery({
    queryKey: ["email-parsing-lab-ai-models", tenantId, connectorUuid],
    queryFn: () => getAiModels(connectorUuid as string),
    enabled: !!tenantId && !!connectorUuid && canParse,
  });

  const handleFiltersChange = (filters: ParseHistoryFilters) => {
    setHistoryFilters(filters);
    setHistoryPage(0);
  };

  const handleOnlySelectedChange = (value: boolean) => {
    setOnlySelected(value);
    setHistoryPage(0);
  };

  const searchMutation = useMutation({
    mutationFn: ({ request, token }: SearchVariables) =>
      searchEmails(connectorUuid as string, { ...request, pageToken: token ?? undefined }),
    onSuccess: (response, { request, pageIndex, token }) => {
      // Every page change replaces the list, so the previous selection (and the parse
      // result belonging to it) would be stale — clear both.
      setMessages(response.messages);
      setSelectedMessage(null);
      setDisplayedResult(null);
      setSearchState((prev) => ({
        baseRequest: request,
        tokenStack: [...(prev?.tokenStack ?? []).slice(0, pageIndex), token],
        pageIndex,
        nextPageToken: response.nextPageToken,
        resultSizeEstimate: response.resultSizeEstimate,
      }));
    },
    onError: () => {
      notifier.error(t("emailParsingLab.notifications.searchError"));
    },
  });

  const handleSearch = (request: SearchEmailsRequest) => {
    searchMutation.mutate({ request, pageIndex: 0, token: null });
  };

  const handleNextEmailPage = () => {
    if (!searchState?.nextPageToken || searchMutation.isPending) return;
    searchMutation.mutate({
      request: searchState.baseRequest,
      pageIndex: searchState.pageIndex + 1,
      token: searchState.nextPageToken,
    });
  };

  const handlePrevEmailPage = () => {
    if (!searchState || searchState.pageIndex <= 0 || searchMutation.isPending) return;
    searchMutation.mutate({
      request: searchState.baseRequest,
      pageIndex: searchState.pageIndex - 1,
      token: searchState.tokenStack[searchState.pageIndex - 1],
    });
  };

  const handleSelectMessage = (message: EmailMessageResponse) => {
    setSelectedMessage(message);
    // A parse result shown for another email would be misleading next to the new selection.
    if (displayedResult && displayedResult.providerMessageId !== message.providerMessageId) {
      setDisplayedResult(null);
    }
  };

  const parseMutation = useMutation({
    mutationFn: (request: ParseEmailRequest) =>
      parseEmail(connectorUuid as string, (selectedMessage as EmailMessageResponse).providerMessageId, request),
    onSuccess: (result) => {
      setDisplayedResult(result);
      if (result.status === "FAILED") {
        notifier.error(t("emailParsingLab.notifications.parseFailed"));
      } else {
        notifier.success(t("emailParsingLab.notifications.parseSuccess"));
      }
      void queryClient.invalidateQueries({ queryKey: ["email-parse-results"] });
    },
    onError: () => {
      notifier.error(t("emailParsingLab.notifications.parseError"));
    },
  });

  const processBidMutation = useMutation({
    mutationFn: () =>
      processBidEmail(
        connectorUuid as string,
        (selectedMessage as EmailMessageResponse).providerMessageId,
        "AUTO_SAFE"
      ),
    onSuccess: (result) => {
      setBidProcessingResult(result);
      notifier.success(t(`emailParsingLab.bidProcessing.notifications.${result.decision}`, result.decision));
      void queryClient.invalidateQueries({ queryKey: ["bids"] });
      void queryClient.invalidateQueries({ queryKey: ["bid-update-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["bid-parsing-runs"] });
    },
    onError: () => notifier.error(t("emailParsingLab.bidProcessing.notifications.error")),
  });

  const handleConnectorChange = (uuid: string) => {
    setConnectorUuid(uuid);
    setMessages([]);
    setSearchState(null);
    setSelectedMessage(null);
    setDisplayedResult(null);
    setBidProcessingResult(null);
    setHistoryPage(0);
    setOnlySelected(false);
  };

  if (!tenantId) {
    return <div className="p-6 text-center text-destructive">{t("pages.workspaceMemberships.noActiveWorkspace")}</div>;
  }

  if (!canView) {
    return <div className="p-6 text-center text-destructive">{t("emailParsingLab.loadError")}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold">{t("emailParsingLab.title")}</h1>
          <p className="text-muted-foreground">{t("emailParsingLab.subtitle")}</p>
        </div>
        <div className="flex-1" />
        <div className="w-72 space-y-1">
          <Label>{t("emailParsingLab.connector")}</Label>
          <Select value={connectorUuid ?? undefined} onValueChange={handleConnectorChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("emailParsingLab.connectorPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {activeConnectors.map((connector) => (
                <SelectItem key={connector.uuid} value={connector.uuid}>
                  {connector.emailAddress}
                  {connector.default ? " ★" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeConnectors.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">{t("emailParsingLab.noConnectors")}</div>
      ) : (
        <>
          <EmailSearchForm loading={searchMutation.isPending} disabled={!connectorUuid} onSearch={handleSearch} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-4">
              <EmailResultsTable
                messages={messages}
                loading={searchMutation.isPending}
                hasSearched={searchState !== null}
                pageIndex={searchState?.pageIndex ?? 0}
                resultSizeEstimate={searchState?.resultSizeEstimate ?? null}
                hasPrevPage={(searchState?.pageIndex ?? 0) > 0}
                hasNextPage={!!searchState?.nextPageToken}
                onPrevPage={handlePrevEmailPage}
                onNextPage={handleNextEmailPage}
                selectedMessageId={selectedMessage?.providerMessageId ?? null}
                onSelect={handleSelectMessage}
              />
              {selectedMessage && <EmailDetailPanel message={selectedMessage} />}
              {selectedMessage && canProcessBid && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("emailParsingLab.bidProcessing.title")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button disabled={processBidMutation.isPending} onClick={() => processBidMutation.mutate()}>
                      {processBidMutation.isPending
                        ? t("emailParsingLab.bidProcessing.processing")
                        : t("emailParsingLab.bidProcessing.action")}
                    </Button>
                    {bidProcessingResult && (
                      <div className="space-y-2 rounded-md border p-3 text-sm">
                        <div className="font-medium">
                          {t(
                            `emailParsingLab.bidProcessing.outcomes.${bidProcessingResult.decision}`,
                            bidProcessingResult.decision
                          )}
                        </div>
                        {bidProcessingResult.duplicate && (
                          <div className="text-muted-foreground">{t("emailParsingLab.bidProcessing.duplicate")}</div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {bidProcessingResult.bidUuid && (
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/tenant/bids/${bidProcessingResult.bidUuid}`}>
                                {t("emailParsingLab.bidProcessing.viewBid")}
                              </Link>
                            </Button>
                          )}
                          {bidProcessingResult.updateRequestUuid && (
                            <Button size="sm" variant="outline" asChild>
                              <Link
                                to={`/tenant/bid-update-requests?requestUuid=${bidProcessingResult.updateRequestUuid}`}
                              >
                                {t("emailParsingLab.bidProcessing.viewReview")}
                              </Link>
                            </Button>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/tenant/bid-parsing-runs?runUuid=${bidProcessingResult.parsingRunUuid}`}>
                              {t("emailParsingLab.bidProcessing.viewRun")}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <ParsePanel
              canParse={canParse}
              parsing={parseMutation.isPending}
              hasSelectedEmail={!!selectedMessage}
              selectedMessageId={selectedMessage?.providerMessageId ?? null}
              aiModels={aiModels?.models ?? []}
              defaultAiModel={aiModels?.defaultModel ?? null}
              maxSystemPromptChars={aiModels?.maxSystemPromptChars ?? DEFAULT_MAX_PROMPT_CHARS}
              maxSchemaChars={aiModels?.maxSchemaChars ?? DEFAULT_MAX_SCHEMA_CHARS}
              result={displayedResult}
              onParse={(request) => parseMutation.mutate(request)}
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{t("emailParsingLab.history.title")}</h2>
            <ParseHistoryFiltersBar
              filters={historyFilters}
              onChange={handleFiltersChange}
              hasSelectedEmail={!!selectedMessage}
              onlySelected={onlySelected}
              onOnlySelectedChange={handleOnlySelectedChange}
            />
            <ParseHistoryTable
              page={history}
              loading={historyLoading}
              fetching={historyFetching}
              selectedResultUuid={displayedResult?.uuid ?? null}
              onSelect={setDisplayedResult}
              onPageChange={setHistoryPage}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default EmailParsingLabPage;
