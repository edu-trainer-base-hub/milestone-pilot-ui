import React from "react";
import type { RoundingTrainerCapabilities, UserAccessLevel } from "../services/auth/trainer-capabilities";
import { CAPABILITIES_BY_ACCESS } from "../services/auth/trainer-capabilities";

export function useRoundingTrainerCapabilities() {
  // TODO: connect to shared auth context when profile tiers are available here.
  const accessLevel = React.useMemo<UserAccessLevel>(() => "guest", []);

  const capabilities = React.useMemo<RoundingTrainerCapabilities>(() => {
    return CAPABILITIES_BY_ACCESS[accessLevel];
  }, [accessLevel]);

  return {
    accessLevel,
    capabilities,
  };
}
