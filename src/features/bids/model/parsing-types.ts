import type { BidActor } from "./types";

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
  requestedBy: BidActor;
}

export interface BidParsingRunSummary {
  uuid: string;
  sourceEmailUuid: string;
  retryOfRunUuid: string | null;
  executionStatus: string;
  parsingOutcome: string | null;
  messageType: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  inputTruncated: boolean;
  createdAt: string;
  completedAt: string | null;
  requestedBy: BidActor;
}

export interface BidParsingRunPage {
  items: BidParsingRunSummary[];
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
