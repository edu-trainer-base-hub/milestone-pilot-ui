export type UserAccessLevel = "guest" | "authenticated_free" | "authenticated_paid";

export interface RoundingTrainerCapabilities {
  canUseCoreFeature: boolean;
  canSaveProgress: boolean;
  canSyncAcrossDevices: boolean;
  canUseAdvancedModes: boolean;
  canViewAdvancedStats: boolean;
  canReceivePersonalizedSuggestions: boolean;
  canAccessPremiumContent: boolean;
  shouldShowLoginSuggestion: boolean;
  shouldShowUpgradeSuggestion: boolean;
}

export const CAPABILITIES_BY_ACCESS: Record<UserAccessLevel, RoundingTrainerCapabilities> = {
  guest: {
    canUseCoreFeature: true,
    canSaveProgress: false,
    canSyncAcrossDevices: false,
    canUseAdvancedModes: false,
    canViewAdvancedStats: false,
    canReceivePersonalizedSuggestions: false,
    canAccessPremiumContent: false,
    shouldShowLoginSuggestion: true,
    shouldShowUpgradeSuggestion: false,
  },
  authenticated_free: {
    canUseCoreFeature: true,
    canSaveProgress: true,
    canSyncAcrossDevices: false,
    canUseAdvancedModes: false,
    canViewAdvancedStats: false,
    canReceivePersonalizedSuggestions: true,
    canAccessPremiumContent: false,
    shouldShowLoginSuggestion: false,
    shouldShowUpgradeSuggestion: true,
  },
  authenticated_paid: {
    canUseCoreFeature: true,
    canSaveProgress: true,
    canSyncAcrossDevices: true,
    canUseAdvancedModes: true,
    canViewAdvancedStats: true,
    canReceivePersonalizedSuggestions: true,
    canAccessPremiumContent: true,
    shouldShowLoginSuggestion: false,
    shouldShowUpgradeSuggestion: false,
  },
};
