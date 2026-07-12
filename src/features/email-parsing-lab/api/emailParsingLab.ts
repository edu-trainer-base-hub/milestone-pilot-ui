import { get, post } from "@/services/ApiService";
import type {
  AiModelsResponse,
  EmailParseResultPageResponse,
  EmailParseResultResponse,
  EmailSearchResponse,
  ParseEmailRequest,
  ParseHistoryFilters,
  SearchEmailsRequest,
} from "../model/types";

// Email search belongs to the Gmail connector feature; only parsing lives under the lab root.
const CONNECTORS_BASE_URL = "/api/v1/tenant/integrations/email-connectors";
const PARSING_LAB_BASE_URL = "/api/v1/tenant/email-parsing-lab/connectors";

export const searchEmails = (connectorUuid: string, request: SearchEmailsRequest): Promise<EmailSearchResponse> =>
  post<EmailSearchResponse>(`${CONNECTORS_BASE_URL}/${connectorUuid}/emails/search`, request);

export const parseEmail = (
  connectorUuid: string,
  messageId: string,
  request: ParseEmailRequest
): Promise<EmailParseResultResponse> =>
  post<EmailParseResultResponse>(
    `${PARSING_LAB_BASE_URL}/${connectorUuid}/emails/${encodeURIComponent(messageId)}/parse`,
    request
  );

export const getParseResults = (
  connectorUuid: string,
  page: number,
  size: number,
  filters?: ParseHistoryFilters
): Promise<EmailParseResultPageResponse> =>
  get<EmailParseResultPageResponse>(`${PARSING_LAB_BASE_URL}/${connectorUuid}/results`, {
    params: { page, size, ...filters },
  });

export const getParseResult = (connectorUuid: string, resultUuid: string): Promise<EmailParseResultResponse> =>
  get<EmailParseResultResponse>(`${PARSING_LAB_BASE_URL}/${connectorUuid}/results/${resultUuid}`);

export const getAiModels = (connectorUuid: string): Promise<AiModelsResponse> =>
  get<AiModelsResponse>(`${PARSING_LAB_BASE_URL}/${connectorUuid}/ai-models`);
