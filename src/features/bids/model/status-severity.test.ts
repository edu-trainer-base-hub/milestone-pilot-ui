import { describe, expect, it } from "vitest";
import { bidSignalSeverity, type BidSignalKind } from "./status-severity";

describe("bid signal severity", () => {
  it.each<[BidSignalKind, string, string]>([
    ["parsing", "PROCESSING", "info"],
    ["parsing", "COMPLETED", "success"],
    ["parsing", "NOT_A_BID", "outline"],
    ["parsing", "CONTENT_UNCLASSIFIABLE", "destructive"],
    ["parsing", "SOURCE_RETRIEVAL_FAILED", "destructive"],
    ["parsing", "PROVIDER_FAILED", "destructive"],
    ["parsing", "SCHEMA_VALIDATION_FAILED", "destructive"],
    ["parsing", "VALIDATION_FAILED", "destructive"],
    ["review", "PENDING", "warning"],
    ["review", "APPLIED", "success"],
    ["review", "REJECTED", "outline"],
    ["review", "SUPERSEDED", "outline"],
    ["processing", "REGISTERED", "info"],
    ["processing", "PARSED", "success"],
    ["processing", "BID_CREATED", "success"],
    ["processing", "EXACT_MATCH", "success"],
    ["processing", "SAFE_UPDATES_APPLIED", "success"],
    ["processing", "REVIEW_REQUESTED", "warning"],
    ["processing", "AMBIGUOUS_MATCH", "warning"],
    ["processing", "FAILED", "destructive"],
    ["processing", "NOT_A_BID", "outline"],
    ["attachment", "EXTRACTED", "success"],
    ["attachment", "IMAGE_ATTACHED", "success"],
    ["attachment", "UNSUPPORTED", "warning"],
    ["attachment", "TOO_LARGE", "warning"],
    ["attachment", "EMPTY", "warning"],
    ["attachment", "SKIPPED_LIMIT", "warning"],
    ["attachment", "FAILED", "destructive"],
    ["parsing", "FUTURE_STATUS", "outline"],
  ])("maps %s %s to %s", (kind, value, severity) => {
    expect(bidSignalSeverity(kind, value)).toBe(severity);
  });
});
