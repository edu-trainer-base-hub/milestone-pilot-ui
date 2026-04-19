import { useCapabilityAccess } from "../hooks/useCapabilityAccess";
import type { TrainerCapabilities } from "../services/auth/trainer-capabilities";

interface CapabilityGateProps {
  capability: keyof TrainerCapabilities;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on the user's capability tier.
 */
export function CapabilityGate({ capability, children, fallback = null }: CapabilityGateProps) {
  const { capabilities } = useCapabilityAccess();

  if (capabilities[capability]) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
