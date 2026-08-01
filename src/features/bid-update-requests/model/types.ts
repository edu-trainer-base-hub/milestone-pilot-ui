export type UpdateRequestStatus = "PENDING" | "APPLIED" | "REJECTED" | "SUPERSEDED";
export type CorrelationResult = "NO_MATCH" | "EXACT_MATCH" | "HIGH_CONFIDENCE_MATCH" | "AMBIGUOUS_MATCH";
export type ChangeResolution = "ACCEPT_PROPOSED" | "KEEP_CURRENT" | "USE_CUSTOM";

export interface BidUpdateChange {
  uuid: string;
  version: number;
  fieldName: string;
  currentValue: unknown;
  proposedValue: unknown;
  acceptProposedAllowed: boolean;
  confidence: number | null;
  conflictType: string;
  resolution: ChangeResolution | null;
  customValue: unknown;
  sourceExcerpt: string | null;
  resolvedAt: string | null;
}

export interface BidUpdateRequest {
  uuid: string;
  version: number;
  bidUuid: string | null;
  sourceEmailUuid: string;
  parsingRunUuid: string;
  supersededByParsingRunUuid: string | null;
  requestType: "FIELD_CHANGES" | "CORRELATION";
  status: UpdateRequestStatus;
  correlationResult: CorrelationResult;
  candidateBidUuids: string[];
  correlationExplanation: Record<string, unknown>;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  changes: BidUpdateChange[];
}

export interface BidUpdateRequestPage {
  items: BidUpdateRequest[];
  page: number;
  size: number;
  totalElements: number;
}

export interface ApplyUpdateInput {
  version: number;
  changes: {
    changeUuid: string;
    resolution: ChangeResolution;
    customValue: unknown;
  }[];
}
