export type BidSignalSeverity = "warning" | "info" | "success" | "destructive" | "outline";
export type BidSignalKind = "parsing" | "review" | "processing" | "attachment";

const severities: Record<BidSignalKind, Record<string, BidSignalSeverity>> = {
  parsing: {
    PROCESSING: "info",
    COMPLETED: "success",
    SOURCE_RETRIEVAL_FAILED: "destructive",
    PROVIDER_FAILED: "destructive",
    SCHEMA_VALIDATION_FAILED: "destructive",
    VALIDATION_FAILED: "destructive",
    CONTENT_UNCLASSIFIABLE: "destructive",
  },
  review: { PENDING: "warning", APPLIED: "success" },
  processing: {
    REGISTERED: "info",
    PARSED: "success",
    BID_CREATED: "success",
    EXACT_MATCH: "success",
    SAFE_UPDATES_APPLIED: "success",
    REVIEW_REQUESTED: "warning",
    AMBIGUOUS_MATCH: "warning",
    FAILED: "destructive",
  },
  attachment: {
    EXTRACTED: "success",
    IMAGE_ATTACHED: "success",
    UNSUPPORTED: "warning",
    TOO_LARGE: "warning",
    EMPTY: "warning",
    SKIPPED_LIMIT: "warning",
    FAILED: "destructive",
  },
};

export function bidSignalSeverity(kind: BidSignalKind, value: string): BidSignalSeverity {
  return Object.prototype.hasOwnProperty.call(severities[kind], value) ? severities[kind][value] : "outline";
}
