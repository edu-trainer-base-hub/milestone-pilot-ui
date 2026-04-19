import React from "react";
import type { CompareNumbersCapabilities, UserAccessLevel } from "../services/auth/trainer-capabilities";
import { CAPABILITIES_BY_ACCESS } from "../services/auth/trainer-capabilities";

export function useCompareNumbersCapabilities() {
  // TODO: read from shared auth context when compare-numbers uses real account state.
  const accessLevel = React.useMemo<UserAccessLevel>(() => "guest", []);

  const capabilities = React.useMemo<CompareNumbersCapabilities>(() => {
    return CAPABILITIES_BY_ACCESS[accessLevel];
  }, [accessLevel]);

  return {
    accessLevel,
    capabilities,
  };
}
