import React from "react";
import type { RoundingTrainerCapabilities } from "../services/auth/trainer-capabilities";
import { useRoundingTrainerCapabilities } from "../hooks/useRoundingTrainerCapabilities";

interface CapabilityGateProps {
  capability: keyof RoundingTrainerCapabilities;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CapabilityGate({ capability, children, fallback = null }: CapabilityGateProps) {
  const { capabilities } = useRoundingTrainerCapabilities();

  if (capabilities[capability]) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
