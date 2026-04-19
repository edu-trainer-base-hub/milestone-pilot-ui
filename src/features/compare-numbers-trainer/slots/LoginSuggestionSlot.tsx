import React from "react";
import { useCompareNumbersCapabilities } from "../hooks/useCompareNumbersCapabilities";
import { useCompareNumbersAnalytics } from "../hooks/useCompareNumbersAnalytics";

interface LoginSuggestionSlotProps {
  placement: string;
  children?: React.ReactNode;
}

/**
 * Extension slot.
 * Attach a login CTA panel here when product decides to expose it.
 */
export function LoginSuggestionSlot({ placement, children = null }: LoginSuggestionSlotProps) {
  const { capabilities } = useCompareNumbersCapabilities();
  const analytics = useCompareNumbersAnalytics();
  const shouldRender = capabilities.shouldShowLoginSuggestion && Boolean(children);

  React.useEffect(() => {
    if (!shouldRender) return;
    analytics.trackLoginSuggestionShown(placement);
  }, [analytics, placement, shouldRender]);

  if (!shouldRender) return null;
  return <>{children}</>;
}
