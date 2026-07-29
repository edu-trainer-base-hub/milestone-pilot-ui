export interface BidParsingRun {
  uuid: string;
  sourceEmailUuid: string;
  retryOfRunUuid: string | null;
  executionStatus: string;
  parsingOutcome: string | null;
  messageType: string | null;
  bidIdentified: boolean | null;
  promptVersion: string;
  schemaVersion: string;
  aiProvider: string | null;
  aiModel: string | null;
  normalizedResult: Record<string, unknown> | null;
  warnings: string[];
  errorCode: string | null;
  errorMessage: string | null;
  attachmentsProcessed: number;
  attachmentsSkipped: number;
  inputTruncated: boolean;
  durationMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface BidParsingRunPage {
  items: BidParsingRun[];
  page: number;
  size: number;
  totalElements: number;
}

export interface BidEmailProcessingResult {
  sourceEmailUuid: string;
  parsingRunUuid: string;
  executionStatus: string;
  parsingOutcome: string | null;
  decision: string;
  bidUuid: string | null;
  updateRequestUuid: string | null;
  duplicate: boolean;
  warnings: string[];
}
