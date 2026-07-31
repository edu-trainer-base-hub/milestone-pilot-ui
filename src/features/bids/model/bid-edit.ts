import type { Bid, BidPriority, ClearableBidField, UpdateBidInput } from "./types";

export interface BidEditDraft {
  projectName: string;
  priority: BidPriority;
  projectDescription: string;
  bidPackage: string;
  scopeSummary: string;
  trades: string;
  projectNumber: string;
  solicitationNumber: string;
  bidPackageNumber: string;
  externalPlatform: string;
  externalOpportunityId: string;
  siteName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string;
  fullAddress: string;
  bidDueAt: string;
  rfiDeadlineAt: string;
  preBidMeetingAt: string;
  anticipatedStartDate: string;
  anticipatedCompletionDate: string;
  issuerCompanyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  submissionMethod: string;
  submissionEmail: string;
  submissionUrl: string;
  submissionInstructions: string;
  assignedToUserUuid: string;
  managerNotes: string;
  autoUpdateEnabled: boolean;
  requiresReview: boolean;
}

type NullableStringField = Exclude<
  ClearableBidField,
  "trades" | "bidDueAt" | "rfiDeadlineAt" | "preBidMeetingAt" | "anticipatedStartDate" | "anticipatedCompletionDate"
>;

const nullableStringFields: NullableStringField[] = [
  "projectDescription",
  "bidPackage",
  "scopeSummary",
  "projectNumber",
  "solicitationNumber",
  "bidPackageNumber",
  "externalPlatform",
  "externalOpportunityId",
  "siteName",
  "addressLine1",
  "addressLine2",
  "city",
  "stateProvince",
  "postalCode",
  "countryCode",
  "fullAddress",
  "issuerCompanyName",
  "primaryContactName",
  "primaryContactEmail",
  "primaryContactPhone",
  "submissionMethod",
  "submissionEmail",
  "submissionUrl",
  "submissionInstructions",
  "assignedToUserUuid",
  "managerNotes",
];

const instantFields = ["bidDueAt", "rfiDeadlineAt", "preBidMeetingAt"] as const;
const localDateFields = ["anticipatedStartDate", "anticipatedCompletionDate"] as const;

export function bidToEditDraft(bid: Bid): BidEditDraft {
  return {
    projectName: bid.projectName,
    priority: bid.priority,
    projectDescription: bid.projectDescription ?? "",
    bidPackage: bid.bidPackage ?? "",
    scopeSummary: bid.scopeSummary ?? "",
    trades: bid.trades.join(", "),
    projectNumber: bid.projectNumber ?? "",
    solicitationNumber: bid.solicitationNumber ?? "",
    bidPackageNumber: bid.bidPackageNumber ?? "",
    externalPlatform: bid.externalPlatform ?? "",
    externalOpportunityId: bid.externalOpportunityId ?? "",
    siteName: bid.siteName ?? "",
    addressLine1: bid.addressLine1 ?? "",
    addressLine2: bid.addressLine2 ?? "",
    city: bid.city ?? "",
    stateProvince: bid.stateProvince ?? "",
    postalCode: bid.postalCode ?? "",
    countryCode: bid.countryCode ?? "",
    fullAddress: bid.fullAddress ?? "",
    bidDueAt: toLocalDateTime(bid.bidDueAt),
    rfiDeadlineAt: toLocalDateTime(bid.rfiDeadlineAt),
    preBidMeetingAt: toLocalDateTime(bid.preBidMeetingAt),
    anticipatedStartDate: bid.anticipatedStartDate ?? "",
    anticipatedCompletionDate: bid.anticipatedCompletionDate ?? "",
    issuerCompanyName: bid.issuerCompanyName ?? "",
    primaryContactName: bid.primaryContactName ?? "",
    primaryContactEmail: bid.primaryContactEmail ?? "",
    primaryContactPhone: bid.primaryContactPhone ?? "",
    submissionMethod: bid.submissionMethod ?? "",
    submissionEmail: bid.submissionEmail ?? "",
    submissionUrl: bid.submissionUrl ?? "",
    submissionInstructions: bid.submissionInstructions ?? "",
    assignedToUserUuid: bid.assignedToUserUuid ?? "",
    managerNotes: bid.managerNotes ?? "",
    autoUpdateEnabled: bid.autoUpdateEnabled,
    requiresReview: bid.requiresReview,
  };
}

export function buildBidUpdateInput(bid: Bid, draft: BidEditDraft): UpdateBidInput {
  const update: UpdateBidInput = { version: bid.version };
  const clearFields: ClearableBidField[] = [];
  const projectName = draft.projectName.trim();

  if (projectName !== bid.projectName) update.projectName = projectName;
  if (draft.priority !== bid.priority) update.priority = draft.priority;

  for (const field of nullableStringFields) {
    const normalized = normalizeString(field, draft[field]);
    const current = normalizeString(field, bid[field]);
    if (normalized === current) continue;
    if (!normalized) clearFields.push(field);
    else update[field] = normalized;
  }

  const trades = normalizeTrades(draft.trades);
  if (!sameArray(trades, bid.trades)) {
    if (trades.length) update.trades = trades;
    else clearFields.push("trades");
  }

  for (const field of instantFields) {
    const value = draft[field] ? new Date(draft[field]).toISOString() : "";
    const current = bid[field] ?? "";
    if (sameInstant(value, current)) continue;
    if (value) update[field] = value;
    else clearFields.push(field);
  }

  for (const field of localDateFields) {
    const value = draft[field];
    const current = bid[field] ?? "";
    if (value === current) continue;
    if (value) update[field] = value;
    else clearFields.push(field);
  }

  if (draft.autoUpdateEnabled !== bid.autoUpdateEnabled) update.autoUpdateEnabled = draft.autoUpdateEnabled;
  if (draft.requiresReview !== bid.requiresReview) update.requiresReview = draft.requiresReview;
  if (clearFields.length) update.clearFields = clearFields;
  return update;
}

export function hasBidUpdates(input: UpdateBidInput): boolean {
  return Object.keys(input).some((key) => key !== "version");
}

function toLocalDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function normalizeString(field: NullableStringField, value: string | null): string {
  const normalized = value?.trim() ?? "";
  return field === "countryCode" ? normalized.toUpperCase() : normalized;
}

function normalizeTrades(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((trade) => trade.trim())
        .filter(Boolean)
    ),
  ];
}

function sameArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameInstant(left: string, right: string): boolean {
  if (!left || !right) return left === right;
  return new Date(left).getTime() === new Date(right).getTime();
}
