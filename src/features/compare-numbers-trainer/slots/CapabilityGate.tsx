import React from "react";
import type { CompareNumbersCapabilities } from "../services/auth/trainer-capabilities";
import { useCompareNumbersCapabilities } from "../hooks/useCompareNumbersCapabilities";

interface CapabilityGateProps {
  capability: keyof CompareNumbersCapabilities;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CapabilityGate({ capability, children, fallback = null }: CapabilityGateProps) {
  const { capabilities } = useCompareNumbersCapabilities();

  if (capabilities[capability]) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
