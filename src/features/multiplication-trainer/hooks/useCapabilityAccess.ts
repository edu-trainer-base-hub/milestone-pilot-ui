import React from "react";
import type { CapabilityTier, TrainerCapabilities } from "../services/auth/trainer-capabilities";
import { CAPABILITIES_MAP } from "../services/auth/trainer-capabilities";

export function useCapabilityAccess() {
  // In a real app, this would read from an AuthContext or global store.
  // We default to `guest` to preserve the current free flow safely.
  const tier = React.useMemo<CapabilityTier>(() => "guest", []);

  const capabilities: TrainerCapabilities = React.useMemo(() => {
    return CAPABILITIES_MAP[tier];
  }, [tier]);

  return {
    tier,
    capabilities,
  };
}
