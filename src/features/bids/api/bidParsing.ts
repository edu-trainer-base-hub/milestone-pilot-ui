import { get, post } from "@/services/ApiService";
import type { BidEmailProcessingResult, BidParsingRun, BidParsingRunPage } from "../model/parsing-types";

const RUNS_URL = "/api/v1/tenant/bid-parsing-runs";
const PROCESSING_URL = "/api/v1/tenant/bid-email-processing/connectors";

export const getBidParsingRuns = (
  page: number,
  size: number,
  filters?: Record<string, string | undefined>
): Promise<BidParsingRunPage> => get<BidParsingRunPage>(RUNS_URL, { params: { page, size, ...filters } });
export const getBidParsingRun = (uuid: string): Promise<BidParsingRun> => get<BidParsingRun>(`${RUNS_URL}/${uuid}`);
export const retryBidParsingRun = (uuid: string): Promise<BidEmailProcessingResult> =>
  post<BidEmailProcessingResult>(`${RUNS_URL}/${uuid}/retry`);
export const processBidEmail = (
  connectorUuid: string,
  messageId: string,
  mode: "AUTO_SAFE" | "REVIEW_ONLY" = "AUTO_SAFE"
): Promise<BidEmailProcessingResult> =>
  post<BidEmailProcessingResult>(`${PROCESSING_URL}/${connectorUuid}/emails/${encodeURIComponent(messageId)}/process`, {
    mode,
    forceReparse: false,
    includeAttachments: true,
  });
