export const BidStatus = {
  NEW: "NEW",
  QUALIFYING: "QUALIFYING",
  PURSUING: "PURSUING",
  NOT_PURSUING: "NOT_PURSUING",
  PREPARING: "PREPARING",
  READY_TO_SUBMIT: "READY_TO_SUBMIT",
  SUBMITTED: "SUBMITTED",
  AWARDED: "AWARDED",
  LOST: "LOST",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  ARCHIVED: "ARCHIVED",
} as const;
export type BidStatus = (typeof BidStatus)[keyof typeof BidStatus];

export const BidPriority = { LOW: "LOW", NORMAL: "NORMAL", HIGH: "HIGH", URGENT: "URGENT" } as const;
export type BidPriority = (typeof BidPriority)[keyof typeof BidPriority];

export type BidReviewStatus = "NONE" | "REVIEW_REQUIRED" | "IN_REVIEW";

export interface BidActor {
  type: "USER" | "SYSTEM" | "UNKNOWN";
  userUuid: string | null;
  displayName: string | null;
  email: string | null;
}

export interface BidFieldSource {
  fieldName: string;
  sourceType: "EMAIL_PARSE" | "MANAGER_EDIT" | "REVIEW_ACCEPTED";
  sourceEmailUuid: string | null;
  parsingRunUuid: string | null;
  updateRequestUuid: string | null;
  acceptedByUserUuid: string | null;
  manuallyOverridden: boolean;
  acceptedAt: string;
  acceptedBy: BidActor | null;
}

export interface Bid {
  uuid: string;
  version: number;
  status: BidStatus;
  priority: BidPriority;
  reviewStatus: BidReviewStatus;
  projectName: string;
  projectDescription: string | null;
  bidPackage: string | null;
  scopeSummary: string | null;
  trades: string[];
  projectNumber: string | null;
  solicitationNumber: string | null;
  bidPackageNumber: string | null;
  externalPlatform: string | null;
  externalOpportunityId: string | null;
  siteName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  countryCode: string | null;
  fullAddress: string | null;
  bidDueAt: string | null;
  rfiDeadlineAt: string | null;
  preBidMeetingAt: string | null;
  anticipatedStartDate: string | null;
  anticipatedCompletionDate: string | null;
  issuerCompanyName: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  submissionMethod: string | null;
  submissionEmail: string | null;
  submissionUrl: string | null;
  submissionInstructions: string | null;
  assignedToUserUuid: string | null;
  managerNotes: string | null;
  autoUpdateEnabled: boolean;
  requiresReview: boolean;
  lastSourceEmailUuid: string | null;
  lastEmailReceivedAt: string | null;
  lastAutoUpdatedAt: string | null;
  awardedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  fieldSources: BidFieldSource[];
}

export interface BidPage {
  items: Bid[];
  page: number;
  size: number;
  totalElements: number;
}

export interface BidDashboard {
  open: number;
  dueSoon: number;
  overdue: number;
  pendingReview: number;
  submitted: number;
  awarded: number;
  recentParsingFailures: number;
}

export interface BidFilters {
  search?: string;
  statuses?: BidStatus[];
  priorities?: BidPriority[];
  reviewStatuses?: BidReviewStatus[];
  requiresReview?: boolean;
  overdue?: boolean;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
}

export interface CreateBidInput {
  projectName: string;
  priority?: BidPriority;
  issuerCompanyName?: string;
  bidDueAt?: string;
  scopeSummary?: string;
}

export type ClearableBidField =
  | "projectDescription"
  | "bidPackage"
  | "scopeSummary"
  | "trades"
  | "projectNumber"
  | "solicitationNumber"
  | "bidPackageNumber"
  | "externalPlatform"
  | "externalOpportunityId"
  | "siteName"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "stateProvince"
  | "postalCode"
  | "countryCode"
  | "fullAddress"
  | "bidDueAt"
  | "rfiDeadlineAt"
  | "preBidMeetingAt"
  | "anticipatedStartDate"
  | "anticipatedCompletionDate"
  | "issuerCompanyName"
  | "primaryContactName"
  | "primaryContactEmail"
  | "primaryContactPhone"
  | "submissionMethod"
  | "submissionEmail"
  | "submissionUrl"
  | "submissionInstructions"
  | "assignedToUserUuid"
  | "managerNotes";

export interface UpdateBidInput {
  version: number;
  projectName?: string;
  priority?: BidPriority;
  projectDescription?: string;
  bidPackage?: string;
  scopeSummary?: string;
  trades?: string[];
  projectNumber?: string;
  solicitationNumber?: string;
  bidPackageNumber?: string;
  externalPlatform?: string;
  externalOpportunityId?: string;
  siteName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  countryCode?: string;
  fullAddress?: string;
  bidDueAt?: string;
  rfiDeadlineAt?: string;
  preBidMeetingAt?: string;
  anticipatedStartDate?: string;
  anticipatedCompletionDate?: string;
  issuerCompanyName?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  submissionMethod?: string;
  submissionEmail?: string;
  submissionUrl?: string;
  submissionInstructions?: string;
  assignedToUserUuid?: string;
  managerNotes?: string;
  autoUpdateEnabled?: boolean;
  requiresReview?: boolean;
  clearFields?: ClearableBidField[];
}

export interface BidActivity {
  uuid: string;
  activityType: string;
  summary: string;
  details: Record<string, unknown>;
  sourceEmailUuid: string | null;
  parsingRunUuid: string | null;
  updateRequestUuid: string | null;
  actorType: string;
  actorUserUuid: string | null;
  occurredAt: string;
  actor: BidActor;
}

export interface BidActivityPage {
  items: BidActivity[];
  page: number;
  size: number;
  totalElements: number;
}

export interface BidActivityFilters {
  activityType?: string;
  occurredFrom?: string;
  occurredTo?: string;
  page?: number;
  size?: number;
}

export interface BidAudit {
  id: number;
  sourceTable: string;
  operation: string;
  changedFields: string[];
  oldRow: Record<string, unknown> | null;
  newRow: Record<string, unknown> | null;
  applicationActorType: string;
  applicationActorUuid: string | null;
  databaseUser: string;
  transactionId: number | null;
  changedAt: string;
  actor: BidActor;
}

export interface BidAuditSummary {
  id: number;
  sourceTable: string;
  rowId: number;
  rowUuid: string | null;
  operation: string;
  changedFields: string[];
  databaseUser: string;
  transactionId: number | null;
  changedAt: string;
  actor: BidActor;
}

export interface BidAuditPage {
  items: BidAuditSummary[];
  page: number;
  size: number;
  totalElements: number;
}

export interface BidAuditFilters {
  sourceTable?: string;
  operation?: string;
  actorType?: BidActor["type"];
  actorUserUuid?: string;
  changedFrom?: string;
  changedTo?: string;
  page?: number;
  size?: number;
}

export interface BidSourceAttachment {
  uuid: string;
  filename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  extractionStatus: string;
  extractedText: string | null;
  textTruncated: boolean;
  skipReason: string | null;
  errorMessage: string | null;
}

export interface BidSourceEmail {
  uuid: string;
  connectorUuid: string;
  providerMessageId: string;
  providerThreadId: string | null;
  sender: string | null;
  replyTo: string | null;
  subject: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  bodySha256: string | null;
  bodyContentTruncated: boolean;
  processingOutcome: string;
  attachments: BidSourceAttachment[];
  createdBy: BidActor;
}

export interface BidSourceEmailSummary {
  uuid: string;
  sender: string | null;
  subject: string | null;
  receivedAt: string | null;
  bodyContentTruncated: boolean;
  processingOutcome: string;
  attachmentCount: number;
  createdBy: BidActor;
}

export interface BidSourceEmailPage {
  items: BidSourceEmailSummary[];
  page: number;
  size: number;
  totalElements: number;
}
