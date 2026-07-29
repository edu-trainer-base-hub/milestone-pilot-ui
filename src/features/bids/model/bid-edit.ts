import { centsToDecimal, parseMoneyToCents } from "./money";
import type {
  Bid,
  BidPriority,
  ClearableBidField,
  UpdateBidInput,
  CreateBidInput,
  BidTag,
  BidUserSummary,
  OpportunitySource,
} from "./types";

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
  tags: BidTag[];
  projectManager: BidUserSummary | null;
  estimator: BidUserSummary | null;
  assignedUsers: BidUserSummary[];
  division: string;
  bidSubmittedDate: string;
  distanceMinMiles: string;
  distanceMaxMiles: string;
  opportunitySource: OpportunitySource | "";
  estimateValue: string;
  relatedLinks: string;
  managerNotes: string;
  autoUpdateEnabled: boolean;
  requiresReview: boolean;
}

type NullableStringField = Exclude<
  ClearableBidField,
  | "trades"
  | "bidDueAt"
  | "rfiDeadlineAt"
  | "preBidMeetingAt"
  | "anticipatedStartDate"
  | "anticipatedCompletionDate"
  | "tagUuids"
  | "assignedUserUuids"
  | "projectManagerUserUuid"
  | "estimatorUserUuid"
  | "bidSubmittedDate"
  | "distanceMiles"
  | "opportunitySource"
  | "estimateValueCents"
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
  "division",
  "relatedLinks",
  "managerNotes",
];

const instantFields = ["bidDueAt", "rfiDeadlineAt", "preBidMeetingAt"] as const;
const localDateFields = ["anticipatedStartDate", "anticipatedCompletionDate", "bidSubmittedDate"] as const;

export function bidToEditDraft(bid: Partial<Bid>): BidEditDraft {
  return {
    projectName: bid.projectName ?? "",
    priority: bid.priority ?? "NORMAL",
    projectDescription: bid.projectDescription ?? "",
    bidPackage: bid.bidPackage ?? "",
    scopeSummary: bid.scopeSummary ?? "",
    trades: (bid.trades ?? []).join(", "),
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
    tags: bid.tags ?? [],
    projectManager: bid.projectManager ?? null,
    estimator: bid.estimator ?? null,
    assignedUsers: bid.assignedUsers ?? [],
    division: bid.division ?? "",
    bidSubmittedDate: bid.bidSubmittedDate ?? "",
    distanceMinMiles: bid.distanceMiles?.min.toString() ?? "",
    distanceMaxMiles: bid.distanceMiles?.max.toString() ?? "",
    opportunitySource: bid.opportunitySource ?? "",
    estimateValue: centsToDecimal(bid.estimateValueCents),
    relatedLinks: bid.relatedLinks ?? "",
    managerNotes: bid.managerNotes ?? "",
    autoUpdateEnabled: bid.autoUpdateEnabled ?? true,
    requiresReview: bid.requiresReview ?? false,
  };
}

export function buildBidUpdateInput(bid: Bid, draft: BidEditDraft, locale = "en"): UpdateBidInput {
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

  if (!sameIds(draft.tags, bid.tags)) update.tagUuids = draft.tags.map((tag) => tag.uuid);
  if (!sameIds(draft.assignedUsers, bid.assignedUsers))
    update.assignedUserUuids = draft.assignedUsers.map((user) => user.uuid);
  for (const [field, current, selected] of [
    ["projectManagerUserUuid", bid.projectManager, draft.projectManager],
    ["estimatorUserUuid", bid.estimator, draft.estimator],
  ] as const) {
    if (current?.uuid === selected?.uuid) continue;
    if (selected) update[field] = selected.uuid;
    else clearFields.push(field);
  }
  if (draft.opportunitySource !== (bid.opportunitySource ?? "")) {
    if (draft.opportunitySource) update.opportunitySource = draft.opportunitySource;
    else clearFields.push("opportunitySource");
  }
  const distance = draftDistance(draft);
  if (distance !== undefined && JSON.stringify(distance) !== JSON.stringify(bid.distanceMiles)) {
    if (distance) update.distanceMiles = distance;
    else clearFields.push("distanceMiles");
  }
  try {
    const cents = parseMoneyToCents(draft.estimateValue, locale);
    if (cents !== bid.estimateValueCents) {
      if (cents !== null) update.estimateValueCents = cents;
      else clearFields.push("estimateValueCents");
    }
  } catch {
    /* Invalid drafts are blocked by form validation. */
  }
  if (draft.autoUpdateEnabled !== bid.autoUpdateEnabled) update.autoUpdateEnabled = draft.autoUpdateEnabled;
  if (draft.requiresReview !== bid.requiresReview) update.requiresReview = draft.requiresReview;
  if (clearFields.length) update.clearFields = clearFields;
  return update;
}

export function hasBidUpdates(input: UpdateBidInput): boolean {
  return Object.keys(input).some((key) => key !== "version");
}

function toLocalDateTime(value: string | null | undefined): string {
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

function sameIds(left: { uuid: string }[], right: { uuid: string }[]): boolean {
  return sameArray(left.map((item) => item.uuid).sort(), right.map((item) => item.uuid).sort());
}

function draftDistance(draft: BidEditDraft) {
  if (!draft.distanceMinMiles.trim() && !draft.distanceMaxMiles.trim()) return null;
  const valid = (value: string) => /^\d{1,8}([.,]\d{1,2})?$/.test(value.trim());
  if (!valid(draft.distanceMinMiles) || !valid(draft.distanceMaxMiles)) return undefined;
  const min = Number(draft.distanceMinMiles.replace(",", "."));
  const max = Number(draft.distanceMaxMiles.replace(",", "."));
  return min <= max ? { min, max } : undefined;
}

export function bidDraftErrors(draft: BidEditDraft, locale = "en"): string[] {
  const errors: string[] = [];
  if (draftDistance(draft) === undefined) errors.push("invalidDistance");
  try {
    parseMoneyToCents(draft.estimateValue, locale);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "invalidMoney");
  }
  return errors;
}

export function buildBidCreateInput(draft: BidEditDraft, locale = "en"): CreateBidInput {
  const input: CreateBidInput = { projectName: draft.projectName.trim(), priority: draft.priority };
  for (const field of nullableStringFields) {
    const value = normalizeString(field, draft[field]);
    if (value) input[field] = value;
  }
  input.trades = normalizeTrades(draft.trades);
  for (const field of instantFields) if (draft[field]) input[field] = new Date(draft[field]).toISOString();
  for (const field of localDateFields) if (draft[field]) input[field] = draft[field];
  input.tagUuids = draft.tags.map((tag) => tag.uuid);
  input.assignedUserUuids = draft.assignedUsers.map((user) => user.uuid);
  if (draft.projectManager) input.projectManagerUserUuid = draft.projectManager.uuid;
  if (draft.estimator) input.estimatorUserUuid = draft.estimator.uuid;
  if (draft.opportunitySource) input.opportunitySource = draft.opportunitySource;
  const distance = draftDistance(draft);
  if (distance) input.distanceMiles = distance;
  const cents = parseMoneyToCents(draft.estimateValue, locale);
  if (cents !== null) input.estimateValueCents = cents;
  input.autoUpdateEnabled = draft.autoUpdateEnabled;
  return input;
}
