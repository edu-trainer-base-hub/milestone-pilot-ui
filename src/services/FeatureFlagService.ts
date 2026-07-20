import { get } from "@/services/ApiService";

/**
 * Per-tenant feature flags delivered by the backend (`GET /api/v1/feature-flags`).
 * Backend enforcement is the security boundary — these values only drive UI visibility.
 */
export const FeatureFlag = {
  EMAIL_PARSING_LAB: "EMAIL_PARSING_LAB",
  EMAIL_PARSING_LAB_SCHEDULER: "EMAIL_PARSING_LAB_SCHEDULER",
} as const;

export type FeatureFlag = (typeof FeatureFlag)[keyof typeof FeatureFlag];

export interface FeatureFlagsResponse {
  flags: Partial<Record<FeatureFlag, boolean>>;
}

export const getFeatureFlags = (): Promise<FeatureFlagsResponse> => get<FeatureFlagsResponse>("/api/v1/feature-flags");
