export type CapabilityTier = "guest" | "authenticated_free" | "authenticated_paid";

/**
 * Very basic registry for UI visibility toggles.
 * Future auth logic can hydrate real rules here.
 */
export interface TrainerCapabilities {
  canSaveHistoryBackend: boolean;
  canViewAdvancedStats: boolean;
  canSelectPremiumModes: boolean;
  canUseUnlimitedTime: boolean;
}

export const CAPABILITIES_MAP: Record<CapabilityTier, TrainerCapabilities> = {
  guest: {
    canSaveHistoryBackend: false,
    canViewAdvancedStats: false,
    canSelectPremiumModes: false,
    canUseUnlimitedTime: true, // currently free
  },
  authenticated_free: {
    canSaveHistoryBackend: true,
    canViewAdvancedStats: false,
    canSelectPremiumModes: false,
    canUseUnlimitedTime: true,
  },
  authenticated_paid: {
    canSaveHistoryBackend: true,
    canViewAdvancedStats: true,
    canSelectPremiumModes: true,
    canUseUnlimitedTime: true,
  },
};
