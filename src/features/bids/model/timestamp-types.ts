export interface TimestampNormalization {
  rawValue: string | null;
  sourceText: string | null;
  sourceTimezone: string | null;
  timezoneUsed: string | null;
  resolvedValue: string | null;
  assumptions: string[];
  unresolvedReasons: string[];
}

export interface BidTimestampNormalization {
  tenantTimezone: string | null;
  fields: Record<string, TimestampNormalization>;
}

export interface BidFieldAlert {
  fieldName: string;
  updateRequestUuid: string;
  changeUuid: string;
  provisionallyApplied: boolean;
  timestampNormalization: TimestampNormalization;
}
