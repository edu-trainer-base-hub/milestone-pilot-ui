import { useCapabilityAccess } from "../hooks/useCapabilityAccess";

interface UpgradeSuggestionSlotProps {
  featureName: string;
}

/**
 * Slot component – renders nothing until an upgrade CTA is designed.
 */
export function UpgradeSuggestionSlot({ featureName: _featureName }: UpgradeSuggestionSlotProps) {
  const { tier } = useCapabilityAccess();

  if (tier === "authenticated_paid") return null;

  // Placeholder for future logic e.g. "Upgrade to unlock {featureName}"
  return null;
}
