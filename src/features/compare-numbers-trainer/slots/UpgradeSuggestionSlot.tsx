import React from "react";
import { useCompareNumbersCapabilities } from "../hooks/useCompareNumbersCapabilities";
import { useCompareNumbersAnalytics } from "../hooks/useCompareNumbersAnalytics";

interface UpgradeSuggestionSlotProps {
  placement: string;
  children?: React.ReactNode;
}

/**
 * Extension slot.
 * Attach an upgrade CTA panel here when premium gates are enabled.
 */
export function UpgradeSuggestionSlot({ placement, children = null }: UpgradeSuggestionSlotProps) {
  const { capabilities } = useCompareNumbersCapabilities();
  const analytics = useCompareNumbersAnalytics();
  const shouldRender = capabilities.shouldShowUpgradeSuggestion && Boolean(children);

  React.useEffect(() => {
    if (!shouldRender) return;
    analytics.trackUpgradeSuggestionShown(placement);
  }, [analytics, placement, shouldRender]);

  if (!shouldRender) return null;
  return <>{children}</>;
}
